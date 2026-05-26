// ══════════════════════════════════
//   STYLEIN.AI — App Logic
//   Analisis : Gemini 1.5 Flash
//   Hair Swap: LightX API v2
// ══════════════════════════════════

const GEMINI_API_KEY = "AIzaSyDQE7i_2h_IruAOISKjPDq8EC5bNmasFd4";
const LIGHTX_API_KEY = "18fe4a80a534484c9d7abf8196977cfa_bb3824750d0d43aebbbf4307a729c4ba_andoraitools";

// ── STATE ─────────────────────────
const state = {
  photo: null,           // base64
  photoBlob: null,       // File blob asli
  photoMime: 'image/jpeg',
  photoSize: 0,          // ukuran bytes
  analysis: null,
  selectedModel: null,
  selectedColor: 'Warna asli',
  previewRun: false,
  stepInterval: null,
  lightxImageUrl: null,  // URL foto setelah diupload ke LightX
};

// ── KATALOG ───────────────────────
const CATALOG = [
  { id: 'buzz',       name: 'Buzz Cut',      cat: 'pendek', icon: '✂️',  prompt: 'buzz cut, very short hair all around, clean fade' },
  { id: 'crew',       name: 'Crew Cut',       cat: 'pendek', icon: '💈',  prompt: 'crew cut, short sides, slightly longer on top, neat' },
  { id: 'caesar',     name: 'Caesar Cut',     cat: 'pendek', icon: '👑',  prompt: 'caesar cut, short straight fringe, even length all over' },
  { id: 'textured',   name: 'Textured Crop',  cat: 'pendek', icon: '🪨',  prompt: 'textured crop, short messy top, fade sides, modern style' },
  { id: 'ivy',        name: 'Ivy League',     cat: 'pendek', icon: '🍃',  prompt: 'ivy league haircut, side part, short clean preppy style' },
  { id: 'fade',       name: 'Skin Fade',      cat: 'fade',   icon: '🔥',  prompt: 'skin fade haircut, bald fade sides, short on top' },
  { id: 'taper',      name: 'Taper Cut',      cat: 'fade',   icon: '🪒',  prompt: 'taper cut, natural gradient from top to sides, clean finish' },
  { id: 'undercut',   name: 'Undercut',       cat: 'fade',   icon: '⚡',  prompt: 'undercut hairstyle, shaved sides, longer hair on top slicked' },
  { id: 'mohawk',     name: 'Faux Mohawk',    cat: 'fade',   icon: '⚔️',  prompt: 'faux mohawk, fade sides, longer center strip styled up' },
  { id: 'frenchcrop', name: 'French Crop',    cat: 'fade',   icon: '🗼',  prompt: 'french crop haircut, short fringe, skin fade sides, sharp' },
  { id: 'pompadour',  name: 'Pompadour',      cat: 'sedang', icon: '🎩',  prompt: 'pompadour hairstyle, voluminous swept back top, fade sides' },
  { id: 'quiff',      name: 'Quiff',          cat: 'sedang', icon: '🌊',  prompt: 'quiff hairstyle, styled front volume, neat sides' },
  { id: 'slickback',  name: 'Slick Back',     cat: 'sedang', icon: '💎',  prompt: 'slick back hair, combed back with gel, clean sides' },
  { id: 'curly',      name: 'Curly Natural',  cat: 'sedang', icon: '🌀',  prompt: 'natural curly hair, medium length, defined curls' },
  { id: 'wolfcut',    name: 'Wolf Cut',       cat: 'panjang', icon: '🐺', prompt: 'wolf cut, layered shaggy hair, curtain bangs, edgy' },
  { id: 'bun',        name: 'Man Bun',        cat: 'panjang', icon: '🎋', prompt: 'man bun hairstyle, long hair tied up on top' },
];

// ══════════════════════════════════
//   HELPER — GEMINI API
// ══════════════════════════════════
async function callGemini(parts, maxTokens = 500, temp = 0.3) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  for (let attempt = 1; attempt <= 3; attempt++) {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { temperature: temp, maxOutputTokens: maxTokens }
      })
    });
    if (response.ok) {
      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    }
    if (response.status === 429) {
      const wait = attempt * 8000;
      setLoadingMsg(`Server sibuk, mencoba ulang dalam ${wait/1000} detik... (${attempt}/3)`);
      await sleep(wait);
      continue;
    }
    const errData = await response.json().catch(() => ({}));
    throw new Error(`Gemini error ${response.status}: ${JSON.stringify(errData)}`);
  }
  throw new Error('Gemini tidak merespons. Coba lagi dalam 1-2 menit.');
}

// ══════════════════════════════════
//   HELPER — LIGHTX API v2
// ══════════════════════════════════

// Step 1: Minta upload URL dari LightX
async function getLightXUploadUrl(sizeInBytes, mimeType) {
  const response = await fetch('https://api.lightxeditor.com/external/api/v2/uploadImageUrl', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': LIGHTX_API_KEY
    },
    body: JSON.stringify({
      uploadType: 'imageUrl',
      size: sizeInBytes,
      contentType: mimeType
    })
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`LightX upload URL error ${response.status}: ${JSON.stringify(err)}`);
  }
  const data = await response.json();
  return {
    uploadUrl: data.body.uploadImage,   // PUT ke sini
    imageUrl:  data.body.imageUrl       // pakai ini untuk generate
  };
}

// Step 1.1: Upload foto ke S3 via PUT
async function uploadImageToS3(putUrl, blob, mimeType) {
  const response = await fetch(putUrl, {
    method: 'PUT',
    headers: { 'Content-Type': mimeType },
    body: blob
  });
  if (!response.ok) {
    throw new Error(`Upload ke S3 gagal: ${response.status}`);
  }
  return true;
}

// Step 2: Generate hairstyle
async function generateHairstyle(imageUrl, textPrompt) {
  const response = await fetch('https://api.lightxeditor.com/external/api/v2/hairstyle', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': LIGHTX_API_KEY
    },
    body: JSON.stringify({ imageUrl, textPrompt })
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`LightX hairstyle error ${response.status}: ${JSON.stringify(err)}`);
  }
  const data = await response.json();
  return data.body.orderId;
}

// Step 2.1: Poll status sampai active
async function pollOrderStatus(orderId) {
  for (let i = 1; i <= 5; i++) {
    await sleep(3000); // tunggu 3 detik tiap poll
    setLoadingMsg(`Memproses gambar... (${i}/5)`);

    const response = await fetch('https://api.lightxeditor.com/external/api/v2/order-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': LIGHTX_API_KEY
      },
      body: JSON.stringify({ orderId })
    });

    if (!response.ok) continue;

    const data = await response.json();
    const status = data.body?.status;

    if (status === 'active') {
      return data.body.output; // URL gambar hasil
    }
    if (status === 'failed') {
      throw new Error('Generasi gambar gagal di server LightX.');
    }
    // status 'init' = masih proses, lanjut poll
  }
  throw new Error('Timeout: gambar tidak selesai dalam 15 detik.');
}

// ══════════════════════════════════
//   HELPER UMUM
// ══════════════════════════════════
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function setLoadingMsg(msg) {
  document.querySelectorAll('.loading-sub').forEach(el => { el.textContent = msg; });
}

// ══════════════════════════════════
//   NAVIGASI
// ══════════════════════════════════
function goTo(n) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-' + n).classList.add('active');
  for (let i = 1; i <= 4; i++) {
    const dot = document.getElementById('dot-' + i);
    dot.classList.remove('active', 'done');
    if (i < n)  dot.classList.add('done');
    if (i === n) dot.classList.add('active');
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (n === 2) startAnalysis();
  if (n === 3) startPreview();
  if (n === 4) updateSummary();
}

// ══════════════════════════════════
//   SCREEN 1 — UPLOAD
// ══════════════════════════════════
const uploadArea = document.getElementById('upload-area');
const fileInput  = document.getElementById('file-input');
const previewImg = document.getElementById('preview-img');

uploadArea.addEventListener('click', () => fileInput.click());
uploadArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadArea.style.borderColor = 'var(--gold)';
});
uploadArea.addEventListener('dragleave', () => {
  uploadArea.style.borderColor = '';
});
uploadArea.addEventListener('drop', (e) => {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) handleFile(file);
});
fileInput.addEventListener('change', (e) => {
  if (e.target.files[0]) handleFile(e.target.files[0]);
});

function handleFile(file) {
  // Validasi ukuran maks 5MB
  if (file.size > 5 * 1024 * 1024) {
    alert('Ukuran foto maksimal 5MB. Silakan pilih foto lain.');
    return;
  }
  // Validasi ukuran minimal (LightX butuh min 512x512)
  state.photoMime  = file.type || 'image/jpeg';
  state.photoSize  = file.size;
  state.photoBlob  = file; // simpan blob untuk upload ke LightX

  const reader = new FileReader();
  reader.onload = (e) => {
    state.photo = e.target.result.split(',')[1];
    previewImg.src = e.target.result;
    previewImg.hidden = false;
    document.getElementById('upload-inner').style.display = 'none';
    uploadArea.classList.add('filled');
    document.getElementById('btn-to-2').disabled = false;
  };
  reader.readAsDataURL(file);
}

// ══════════════════════════════════
//   SCREEN 2 — ANALISIS GEMINI
// ══════════════════════════════════
let analysisRun = false;

async function startAnalysis() {
  if (analysisRun) return;
  analysisRun = true;

  document.getElementById('loading-analysis').style.display = 'block';
  document.getElementById('analysis-box').style.display     = 'none';
  document.getElementById('model-filters').style.display    = 'none';
  document.getElementById('model-grid').style.display       = 'none';
  document.getElementById('nav-2').style.display            = 'none';

  try {
    const result = await analyzePhoto();
    state.analysis = result;
    renderAnalysis(result);
  } catch (err) {
    console.error('Analisis gagal:', err);
    state.analysis = null;
    document.getElementById('analysis-summary').textContent =
      'Pilih model rambut yang Anda inginkan';
  } finally {
    document.getElementById('loading-analysis').style.display = 'none';
    renderModelGrid('semua');
    document.getElementById('model-filters').style.display = 'flex';
    document.getElementById('model-grid').style.display    = 'grid';
    document.getElementById('nav-2').style.display         = 'flex';
  }
}

async function analyzePhoto() {
  const prompt = `Kamu adalah AI analis rambut profesional untuk barbershop Indonesia.
Analisis foto wajah ini dengan teliti, lalu balas HANYA dengan JSON berikut tanpa markdown, tanpa penjelasan tambahan apapun:
{
  "face_shape": "oval|bulat|persegi|lonjong|hati",
  "hair_type": "lurus|bergelombang|keriting",
  "hair_length": "sangat pendek|pendek|sedang|panjang",
  "recommended_ids": ["id1","id2","id3","id4","id5"],
  "summary": "Kalimat singkat 1 baris rekomendasi untuk wajah ini"
}
Pilih 5 recommended_ids dari daftar ini saja:
buzz, crew, caesar, textured, ivy, fade, taper, undercut, mohawk, frenchcrop, pompadour, quiff, slickback, curly, wolfcut, bun
Sesuaikan dengan bentuk wajah dan panjang rambut saat ini.`;

  const raw = await callGemini([
    { inline_data: { mime_type: state.photoMime, data: state.photo } },
    { text: prompt }
  ], 500, 0.3);

  return JSON.parse(raw.replace(/```json|```/g, '').trim());
}

function renderAnalysis(data) {
  if (!data) return;
  document.getElementById('analysis-box').style.display  = 'block';
  document.getElementById('a-face').textContent          = data.face_shape?.toUpperCase() || '—';
  document.getElementById('a-type').textContent          = data.hair_type   || '—';
  document.getElementById('a-length').textContent        = data.hair_length  || '—';
  if (data.summary) {
    document.getElementById('analysis-summary').textContent = data.summary;
  }
}

function renderModelGrid(filter) {
  const grid = document.getElementById('model-grid');
  grid.innerHTML = '';
  let list = [...CATALOG];

  if (state.analysis?.recommended_ids?.length) {
    const recIds = state.analysis.recommended_ids;
    list.sort((a, b) => {
      const ia = recIds.indexOf(a.id), ib = recIds.indexOf(b.id);
      if (ia === -1 && ib === -1) return 0;
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });
  }

  if (filter !== 'semua') list = list.filter(m => m.cat === filter);

  list.forEach(model => {
    const isRec = state.analysis?.recommended_ids?.includes(model.id);
    const card  = document.createElement('div');
    card.className = 'model-card' + (state.selectedModel?.id === model.id ? ' selected' : '');
    card.innerHTML = `
      <div class="model-icon">${model.icon}</div>
      <div class="model-name">${model.name}</div>
      <div class="model-cat">${isRec ? '⭐ Rekomendasi' : model.cat}</div>
    `;
    card.onclick = () => selectModel(model, card);
    grid.appendChild(card);
  });
}

function selectModel(model, cardEl) {
  state.selectedModel = model;
  document.querySelectorAll('.model-card').forEach(c => c.classList.remove('selected'));
  cardEl.classList.add('selected');
  document.getElementById('btn-to-3').disabled = false;
  state.previewRun = false;
  state.lightxImageUrl = null; // reset supaya upload ulang kalau ganti model
}

function filterModels(cat, btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderModelGrid(cat);
}

// ══════════════════════════════════
//   SCREEN 3 — PREVIEW LIGHTX
// ══════════════════════════════════
async function startPreview() {
  if (state.previewRun) return;
  state.previewRun = true;

  document.getElementById('loading-preview').style.display = 'block';
  document.getElementById('preview-result').style.display  = 'none';
  document.getElementById('preview-error').style.display   = 'none';
  document.getElementById('nav-3').style.display           = 'none';
  document.getElementById('preview-status').textContent    = 'AI sedang bekerja...';

  animateSteps();

  try {
    // Step 1: Upload foto ke LightX (hanya jika belum)
    if (!state.lightxImageUrl) {
      setLoadingMsg('Mengupload foto ke server AI...');
      document.getElementById('pstep-1').querySelector('span:last-child').textContent =
        'Mengupload foto ke server AI...';

      const { uploadUrl, imageUrl } = await getLightXUploadUrl(
        state.photoSize,
        state.photoMime
      );
      await uploadImageToS3(uploadUrl, state.photoBlob, state.photoMime);
      state.lightxImageUrl = imageUrl;
    }

    // Step 2: Generate hairstyle
    setLoadingMsg('AI menerapkan model rambut ke foto Anda...');
    const model      = state.selectedModel;
    const colorHint  = state.selectedColor !== 'Warna asli'
      ? `, ${state.selectedColor} hair color` : '';
    const prompt     = model.prompt + colorHint;

    const orderId = await generateHairstyle(state.lightxImageUrl, prompt);

    // Step 3: Poll sampai selesai
    setLoadingMsg('Memproses gambar... (1/5)');
    const outputUrl = await pollOrderStatus(orderId);

    // Step 4: Ambil deskripsi dari Gemini
    setLoadingMsg('Menyiapkan panduan barber...');
    const desc = await generateModelDescription();

    renderPreview(outputUrl, desc);
    document.getElementById('preview-status').textContent =
      'Selesai! Lihat hasil simulasi rambut Anda.';

  } catch (err) {
    console.error('Preview gagal:', err);
    showPreviewError(err.message);
  }
}

function animateSteps() {
  const steps = ['pstep-1', 'pstep-2', 'pstep-3'];
  steps.forEach(id => {
    document.getElementById(id).classList.remove('active', 'done');
  });
  document.getElementById('pstep-1').classList.add('active');
  let current = 0;
  state.stepInterval = setInterval(() => {
    if (current < steps.length - 1) {
      document.getElementById(steps[current]).classList.remove('active');
      document.getElementById(steps[current]).classList.add('done');
      current++;
      document.getElementById(steps[current]).classList.add('active');
    } else {
      clearInterval(state.stepInterval);
    }
  }, 5000); // 5 detik per step — sesuai proses LightX ~15 detik
}

function showPreviewError(msg) {
  clearInterval(state.stepInterval);
  document.getElementById('loading-preview').style.display = 'none';
  document.getElementById('preview-error').style.display   = 'block';
  document.getElementById('nav-3').style.display           = 'flex';
  document.getElementById('preview-status').textContent    = 'Terjadi kendala.';
  document.getElementById('error-desc').textContent        =
    msg || 'Server sedang padat. Coba lagi dalam 1-2 menit.';
}

function retryPreview() {
  state.previewRun = false;
  startPreview();
}

async function generateModelDescription() {
  const model = state.selectedModel;
  const face  = state.analysis?.face_shape || 'oval';
  try {
    return await callGemini([{
      text: `Kamu adalah barber profesional Indonesia. Tulis panduan singkat untuk model rambut "${model.name}" bagi pelanggan dengan wajah ${face}. Maksimal 2 kalimat natural dan friendly dalam Bahasa Indonesia. Jelaskan mengapa cocok dan berapa minggu sekali perlu dipotong. Tanpa bullet points.`
    }], 200, 0.7);
  } catch {
    return `${model.name} sangat cocok untuk wajah ${face}. Disarankan potong setiap 3–4 minggu agar selalu rapi.`;
  }
}

function renderPreview(outputImageUrl, desc) {
  clearInterval(state.stepInterval);
  const model = state.selectedModel;

  // Isi konten teks dulu (tanpa tampilkan)
  document.getElementById('res-icon').textContent          = model.icon;
  document.getElementById('res-name').textContent          = model.name;
  document.getElementById('overlay-model').textContent     = model.name;
  document.getElementById('result-model-name').textContent = model.name;
  document.getElementById('result-desc').textContent       = desc;
  document.querySelector('.result-badge').textContent      = 'AI GENERATED';

  // Sembunyikan loading, tampilkan result wrapper dulu
  document.getElementById('loading-preview').style.display = 'none';
  document.getElementById('preview-error').style.display   = 'none';
  document.getElementById('preview-result').style.display  = 'block';
  document.getElementById('nav-3').style.display           = 'flex';

  // Tampilkan skeleton loader di area foto
  const imgWrap = document.querySelector('.result-img-wrap');
  imgWrap.classList.add('img-loading');

  // Buat elemen image baru — load di background
  const img = document.getElementById('result-img');
  img.style.opacity = '0';
  img.src = '';

  // Baru tampilkan foto saat benar-benar sudah loaded
  const tempImg = new Image();
  tempImg.onload = () => {
    img.src = outputImageUrl;
    img.style.transition = 'opacity 0.6s ease';
    img.style.opacity = '1';
    imgWrap.classList.remove('img-loading');
  };
  tempImg.onerror = () => {
    imgWrap.classList.remove('img-loading');
    img.style.opacity = '1';
    img.src = 'data:' + state.photoMime + ';base64,' + state.photo;
    document.getElementById('result-desc').textContent =
      desc + '\n\n⚠️ Preview AI tidak tersedia, menampilkan foto asli.';
  };
  tempImg.src = outputImageUrl; // mulai load di background
}

// ── WARNA ─────────────────────────
function pickColor(colorName, el) {
  state.selectedColor = colorName;
  document.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('sum-color').textContent = colorName;
  // Reset preview agar generate ulang dengan warna baru
  state.previewRun = false;
}

// ══════════════════════════════════
//   SCREEN 4 — KIRIM WHATSAPP
// ══════════════════════════════════
function updateSummary() {
  document.getElementById('sum-model').textContent = state.selectedModel?.name || '—';
  document.getElementById('sum-color').textContent = state.selectedColor || 'Warna asli';
}

function sendWhatsApp() {
  const name = document.getElementById('inp-name').value.trim();
  const wa   = document.getElementById('inp-wa').value.trim();
  if (!name) { alert('Mohon isi nama Anda terlebih dahulu.'); return; }
  if (!wa)   { alert('Mohon isi nomor WhatsApp Anda.'); return; }

  const msg =
`✂️ *StyleIn.AI — Hasil Simulasi Rambut*

Halo *${name}*! Berikut hasil sesi StyleIn.AI Anda:

📊 *Analisis Wajah:*
- Bentuk wajah : ${state.analysis?.face_shape  || '-'}
- Jenis rambut : ${state.analysis?.hair_type   || '-'}
- Panjang saat ini: ${state.analysis?.hair_length || '-'}

💈 *Pilihan Gaya:*
- Model rambut : *${state.selectedModel?.name || '-'}*
- Warna cat    : ${state.selectedColor}

📸 Foto simulasi sudah digenerate oleh AI.
Tunjukkan ke barber untuk hasil nyatanya! 💪

_Powered by StyleIn.AI — Smart Barbershop Platform_`;

  const waClean = wa.replace(/[\s\-\(\)]/g, '').replace(/^0/, '62');
  window.open(`https://wa.me/${waClean}?text=${encodeURIComponent(msg)}`, '_blank');
  document.getElementById('send-area').style.display   = 'none';
  document.getElementById('success-box').style.display = 'block';
}

// ══════════════════════════════════
//   RESET
// ══════════════════════════════════
function resetApp() {
  clearInterval(state.stepInterval);
  state.photo          = null;
  state.photoBlob      = null;
  state.photoSize      = 0;
  state.analysis       = null;
  state.selectedModel  = null;
  state.selectedColor  = 'Warna asli';
  state.previewRun     = false;
  state.lightxImageUrl = null;
  analysisRun          = false;

  previewImg.src    = '';
  previewImg.hidden = true;
  document.getElementById('upload-inner').style.display = '';
  uploadArea.classList.remove('filled');
  document.getElementById('btn-to-2').disabled = true;
  fileInput.value = '';
  document.getElementById('send-area').style.display   = '';
  document.getElementById('success-box').style.display = 'none';
  document.getElementById('inp-name').value = '';
  document.getElementById('inp-wa').value   = '';
  goTo(1);
}

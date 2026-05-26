// ══════════════════════════════════
//   STYLEIN.AI — App Logic
//   Semua API key ada di server
//   Tidak ada key di file ini
// ══════════════════════════════════

const state = {
  photo: null,
  photoBlob: null,
  photoMime: 'image/jpeg',
  photoSize: 0,
  analysis: null,
  selectedModel: null,
  selectedColor: 'Warna asli',
  previewRun: false,
  stepInterval: null,
  lightxImageUrl: null,
};

const CATALOG = [
  { id: 'buzz',       name: 'Buzz Cut',      cat: 'pendek', icon: '✂️',  prompt: 'buzz cut, very short hair all around, clean fade' },
  { id: 'crew',       name: 'Crew Cut',       cat: 'pendek', icon: '💈',  prompt: 'crew cut, short sides, slightly longer on top, neat' },
  { id: 'caesar',     name: 'Caesar Cut',     cat: 'pendek', icon: '👑',  prompt: 'caesar cut, short straight fringe, even length' },
  { id: 'textured',   name: 'Textured Crop',  cat: 'pendek', icon: '🪨',  prompt: 'textured crop, short messy top, fade sides, modern' },
  { id: 'ivy',        name: 'Ivy League',     cat: 'pendek', icon: '🍃',  prompt: 'ivy league haircut, side part, short clean preppy' },
  { id: 'fade',       name: 'Skin Fade',      cat: 'fade',   icon: '🔥',  prompt: 'skin fade haircut, bald fade sides, short on top' },
  { id: 'taper',      name: 'Taper Cut',      cat: 'fade',   icon: '🪒',  prompt: 'taper cut, natural gradient, clean finish' },
  { id: 'undercut',   name: 'Undercut',       cat: 'fade',   icon: '⚡',  prompt: 'undercut hairstyle, shaved sides, longer hair on top' },
  { id: 'mohawk',     name: 'Faux Mohawk',    cat: 'fade',   icon: '⚔️',  prompt: 'faux mohawk, fade sides, longer center strip' },
  { id: 'frenchcrop', name: 'French Crop',    cat: 'fade',   icon: '🗼',  prompt: 'french crop, short fringe, skin fade sides' },
  { id: 'pompadour',  name: 'Pompadour',      cat: 'sedang', icon: '🎩',  prompt: 'pompadour hairstyle, voluminous swept back top' },
  { id: 'quiff',      name: 'Quiff',          cat: 'sedang', icon: '🌊',  prompt: 'quiff hairstyle, styled front volume, neat sides' },
  { id: 'slickback',  name: 'Slick Back',     cat: 'sedang', icon: '💎',  prompt: 'slick back hair, combed back with gel, clean sides' },
  { id: 'curly',      name: 'Curly Natural',  cat: 'sedang', icon: '🌀',  prompt: 'natural curly hair, medium length, defined curls' },
  { id: 'wolfcut',    name: 'Wolf Cut',       cat: 'panjang', icon: '🐺', prompt: 'wolf cut, layered shaggy hair, curtain bangs' },
  { id: 'bun',        name: 'Man Bun',        cat: 'panjang', icon: '🎋', prompt: 'man bun, long hair tied up on top' },
];

// ══════════════════════════════════
//   HELPER
// ══════════════════════════════════
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function setLoadingMsg(msg) {
  document.querySelectorAll('.loading-sub').forEach(el => { el.textContent = msg; });
}

async function callAPI(endpoint, body) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`Error ${response.status}: ${JSON.stringify(err)}`);
  }
  return response.json();
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
uploadArea.addEventListener('dragover', (e) => { e.preventDefault(); uploadArea.style.borderColor = 'var(--gold)'; });
uploadArea.addEventListener('dragleave', () => { uploadArea.style.borderColor = ''; });
uploadArea.addEventListener('drop', (e) => {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) handleFile(file);
});
fileInput.addEventListener('change', (e) => {
  if (e.target.files[0]) handleFile(e.target.files[0]);
});

function handleFile(file) {
  if (file.size > 5 * 1024 * 1024) {
    alert('Ukuran foto maksimal 5MB.');
    return;
  }
  state.photoMime = file.type || 'image/jpeg';
  state.photoSize = file.size;
  state.photoBlob = file;

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
//   SCREEN 2 — ANALISIS
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
    // Panggil server kita — bukan Gemini langsung
    const result = await callAPI('/api/analyze', {
      photo: state.photo,
      mimeType: state.photoMime
    });
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

function renderAnalysis(data) {
  if (!data) return;
  document.getElementById('analysis-box').style.display  = 'block';
  document.getElementById('a-face').textContent          = data.face_shape?.toUpperCase() || '—';
  document.getElementById('a-type').textContent          = data.hair_type   || '—';
  document.getElementById('a-length').textContent        = data.hair_length  || '—';
  if (data.summary) document.getElementById('analysis-summary').textContent = data.summary;
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
  state.previewRun     = false;
  state.lightxImageUrl = null;
}

function filterModels(cat, btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderModelGrid(cat);
}

// ══════════════════════════════════
//   SCREEN 3 — PREVIEW
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
    // Step 1: Upload foto ke LightX (via server kita)
    if (!state.lightxImageUrl) {
      setLoadingMsg('Mengupload foto ke server AI...');
      const uploadData = await callAPI('/api/upload-url', {
        size: state.photoSize,
        contentType: state.photoMime
      });

      const { uploadImage, imageUrl } = uploadData.body;

      // PUT langsung ke S3 — ini boleh dari browser
      const putResponse = await fetch(uploadImage, {
        method: 'PUT',
        headers: { 'Content-Type': state.photoMime },
        body: state.photoBlob
      });

      if (!putResponse.ok) throw new Error('Upload foto gagal.');
      state.lightxImageUrl = imageUrl;
    }

    // Step 2: Generate hairstyle (via server kita)
    setLoadingMsg('AI menerapkan model rambut...');
    const model      = state.selectedModel;
    const colorHint  = state.selectedColor !== 'Warna asli'
      ? `, ${state.selectedColor} hair color` : '';
    const prompt     = model.prompt + colorHint;

    const hairstyleData = await callAPI('/api/hairstyle', {
      imageUrl: state.lightxImageUrl,
      textPrompt: prompt
    });

    const orderId = hairstyleData.body?.orderId;
    if (!orderId) throw new Error('Tidak mendapat order ID dari LightX.');

    // Step 3: Poll status
    const outputUrl = await pollOrderStatus(orderId);

    // Step 4: Deskripsi dari Gemini (via server kita)
    setLoadingMsg('Menyiapkan panduan barber...');
    const descData = await callAPI('/api/describe', {
      modelName: model.name,
      faceShape: state.analysis?.face_shape || 'oval'
    });

    renderPreview(outputUrl, descData.description);
    document.getElementById('preview-status').textContent =
      'Selesai! Lihat hasil simulasi rambut Anda.';

  } catch (err) {
    console.error('Preview gagal:', err);
    showPreviewError(err.message);
  }
}

async function pollOrderStatus(orderId) {
  for (let i = 1; i <= 5; i++) {
    await sleep(3000);
    setLoadingMsg(`Memproses gambar... (${i}/5)`);

    const data = await callAPI('/api/order-status', { orderId });
    const status = data.body?.status;

    if (status === 'active') return data.body.output;
    if (status === 'failed') throw new Error('Generasi gambar gagal.');
  }
  throw new Error('Timeout: coba lagi dalam beberapa saat.');
}

function animateSteps() {
  const steps = ['pstep-1', 'pstep-2', 'pstep-3'];
  steps.forEach(id => document.getElementById(id).classList.remove('active', 'done'));
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
  }, 5000);
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

function renderPreview(outputImageUrl, desc) {
  clearInterval(state.stepInterval);
  const model = state.selectedModel;

  document.getElementById('res-icon').textContent          = model.icon;
  document.getElementById('res-name').textContent          = model.name;
  document.getElementById('overlay-model').textContent     = model.name;
  document.getElementById('result-model-name').textContent = model.name;
  document.getElementById('result-desc').textContent       = desc || `${model.name} cocok untuk tampilan modern. Potong setiap 3-4 minggu.`;
  document.querySelector('.result-badge').textContent      = 'AI GENERATED';

  document.getElementById('loading-preview').style.display = 'none';
  document.getElementById('preview-error').style.display   = 'none';
  document.getElementById('preview-result').style.display  = 'block';
  document.getElementById('nav-3').style.display           = 'flex';

  // Loading skeleton sampai foto selesai load
  const imgWrap = document.querySelector('.result-img-wrap');
  imgWrap.classList.add('img-loading');
  const img = document.getElementById('result-img');
  img.style.opacity = '0';
  img.src = '';

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
  };
  tempImg.src = outputImageUrl;
}

// ── WARNA ─────────────────────────
function pickColor(colorName, el) {
  state.selectedColor = colorName;
  document.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('sum-color').textContent = colorName;
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
  if (!name) { alert('Mohon isi nama Anda.'); return; }
  if (!wa)   { alert('Mohon isi nomor WhatsApp.'); return; }

  const msg =
`✂️ *StyleIn.AI — Hasil Simulasi Rambut*

Halo *${name}*! Berikut hasil sesi StyleIn.AI Anda:

📊 *Analisis Wajah:*
- Bentuk wajah    : ${state.analysis?.face_shape  || '-'}
- Jenis rambut    : ${state.analysis?.hair_type   || '-'}
- Panjang saat ini: ${state.analysis?.hair_length || '-'}

💈 *Pilihan Gaya:*
- Model rambut: *${state.selectedModel?.name || '-'}*
- Warna cat   : ${state.selectedColor}

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
  state.photo = null; state.photoBlob = null;
  state.photoSize = 0; state.analysis = null;
  state.selectedModel = null; state.selectedColor = 'Warna asli';
  state.previewRun = false; state.lightxImageUrl = null;
  analysisRun = false;

  previewImg.src = ''; previewImg.hidden = true;
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

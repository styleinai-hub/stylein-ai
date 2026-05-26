// ══════════════════════════════════
//   STYLEIN.AI — App Logic
//   Engine: Gemini 1.5 Flash (Free)
// ══════════════════════════════════

const GEMINI_API_KEY = "AIzaSyDQE7i_2h_IruAOISKjPDq8EC5bNmasFd4";

const state = {
  photo: null,
  photoMime: 'image/jpeg',
  analysis: null,
  selectedModel: null,
  selectedColor: 'Warna asli',
  currentFilter: 'semua',
  previewRun: false,
  stepInterval: null,
};

const CATALOG = [
  { id: 'buzz',       name: 'Buzz Cut',      cat: 'pendek', icon: '✂️',  desc: 'Sangat pendek merata, mudah dirawat' },
  { id: 'crew',       name: 'Crew Cut',       cat: 'pendek', icon: '💈',  desc: 'Pendek di samping, lebih panjang di atas' },
  { id: 'caesar',     name: 'Caesar Cut',     cat: 'pendek', icon: '👑',  desc: 'Poni lurus ke depan, gaya klasik' },
  { id: 'textured',   name: 'Textured Crop',  cat: 'pendek', icon: '🪨',  desc: 'Crop modern dengan tekstur alami' },
  { id: 'ivy',        name: 'Ivy League',     cat: 'pendek', icon: '🍃',  desc: 'Poni ke samping, preppy dan rapi' },
  { id: 'fade',       name: 'Skin Fade',      cat: 'fade',   icon: '🔥',  desc: 'Gradasi tipis dari kulit ke atas' },
  { id: 'taper',      name: 'Taper Cut',      cat: 'fade',   icon: '🪒',  desc: 'Gradasi natural, cocok semua wajah' },
  { id: 'undercut',   name: 'Undercut',       cat: 'fade',   icon: '⚡',  desc: 'Samping dicukur, atas panjang' },
  { id: 'mohawk',     name: 'Faux Mohawk',    cat: 'fade',   icon: '⚔️',  desc: 'Tengah lebih tinggi, samping fade' },
  { id: 'frenchcrop', name: 'French Crop',    cat: 'fade',   icon: '🗼',  desc: 'Poni pendek rata dengan fade bersih' },
  { id: 'pompadour',  name: 'Pompadour',      cat: 'sedang', icon: '🎩',  desc: 'Tinggi di depan, maskulin dan modern' },
  { id: 'quiff',      name: 'Quiff',          cat: 'sedang', icon: '🌊',  desc: 'Volume ke depan dengan karakter kuat' },
  { id: 'slickback',  name: 'Slick Back',     cat: 'sedang', icon: '💎',  desc: 'Rambut disisir ke belakang, elegan' },
  { id: 'curly',      name: 'Curly Natural',  cat: 'sedang', icon: '🌀',  desc: 'Rambut keriting alami dibentuk rapi' },
  { id: 'wolfcut',    name: 'Wolf Cut',       cat: 'panjang', icon: '🐺', desc: 'Layer acak, tampil edgy dan modern' },
  { id: 'bun',        name: 'Man Bun',        cat: 'panjang', icon: '🎋', desc: 'Rambut panjang diikat ke atas' },
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
      setLoadingMsg(`Server sibuk, mencoba ulang dalam ${wait / 1000} detik... (${attempt}/3)`);
      await sleep(wait);
      continue;
    }

    const errData = await response.json().catch(() => ({}));
    throw new Error(`API error ${response.status}: ${JSON.stringify(errData)}`);
  }

  throw new Error('Server terlalu sibuk. Coba lagi dalam 1-2 menit.');
}

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
  state.photoMime = file.type || 'image/jpeg';
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
    const result = await analyzePhoto();
    state.analysis = result;
    renderAnalysis(result);
  } catch (err) {
    console.error('Analisis gagal:', err);
    state.analysis = null;
    document.getElementById('analysis-summary').textContent = 'Pilih model rambut yang Anda inginkan';
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

  const raw   = await callGemini([
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
  state.previewRun = false;
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
    const desc = await generateModelDescription();
    renderPreview(desc);
    document.getElementById('preview-status').textContent = 'Selesai! Pilih warna jika ingin cat rambut.';
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
  }, 3000);
}

function showPreviewError(msg) {
  clearInterval(state.stepInterval);
  document.getElementById('loading-preview').style.display = 'none';
  document.getElementById('preview-error').style.display   = 'block';
  document.getElementById('nav-3').style.display           = 'flex';
  document.getElementById('preview-status').textContent    = 'Terjadi kendala.';
  document.getElementById('error-desc').textContent        = msg || 'Server sedang padat. Coba lagi dalam 1-2 menit.';
}

function retryPreview() {
  state.previewRun = false;
  startPreview();
}

async function generateModelDescription() {
  const model = state.selectedModel;
  const face  = state.analysis?.face_shape || 'oval';
  return await callGemini([{
    text: `Kamu adalah barber profesional Indonesia. Tulis panduan singkat untuk model rambut "${model.name}" bagi pelanggan dengan wajah ${face}. Maksimal 2 kalimat natural dan friendly dalam Bahasa Indonesia. Jelaskan mengapa cocok dan berapa minggu sekali perlu dipotong. Tanpa bullet points.`
  }], 200, 0.7);
}

function renderPreview(desc) {
  clearInterval(state.stepInterval);
  const model = state.selectedModel;
  document.getElementById('result-img').src                = 'data:' + state.photoMime + ';base64,' + state.photo;
  document.getElementById('res-icon').textContent          = model.icon;
  document.getElementById('res-name').textContent          = model.name;
  document.getElementById('overlay-model').textContent     = model.name;
  document.getElementById('result-model-name').textContent = model.name;
  document.getElementById('result-desc').textContent       = desc;
  document.getElementById('loading-preview').style.display = 'none';
  document.getElementById('preview-error').style.display   = 'none';
  document.getElementById('preview-result').style.display  = 'block';
  document.getElementById('nav-3').style.display           = 'flex';
}

// ── WARNA ─────────────────────────
function pickColor(colorName, el) {
  state.selectedColor = colorName;
  document.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('sum-color').textContent = colorName;
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
`✂️ *StyleIn.AI — Hasil Analisis Rambut*

Halo *${name}*! Berikut hasil sesi StyleIn.AI Anda:

📊 *Analisis Wajah:*
- Bentuk wajah: ${state.analysis?.face_shape || '-'}
- Jenis rambut: ${state.analysis?.hair_type  || '-'}
- Panjang saat ini: ${state.analysis?.hair_length || '-'}

💈 *Pilihan Gaya:*
- Model rambut: *${state.selectedModel?.name || '-'}*
- Warna cat: ${state.selectedColor}

Tunjukkan pesan ini ke barber Anda untuk hasil terbaik! 💪

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
  state.photo = null; state.analysis = null;
  state.selectedModel = null; state.selectedColor = 'Warna asli';
  state.previewRun = false; analysisRun = false;

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

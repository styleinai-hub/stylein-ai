// ══════════════════════════════════
//   STYLEIN.AI — App Logic
// ══════════════════════════════════

const GEMINI_API_KEY = "AIzaSyDJfU8EGWh2wHha5iAjytCK1iastu2Vaeo";

// ── STATE ─────────────────────────
const state = {
  photo: null,          // base64 foto user
  photoMime: 'image/jpeg',
  analysis: null,       // hasil analisis AI
  selectedModel: null,  // model rambut dipilih
  selectedColor: 'Warna asli',
  currentFilter: 'semua',
};

// ── KATALOG MODEL RAMBUT ──────────
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
//   NAVIGASI
// ══════════════════════════════════
function goTo(n) {
  // Sembunyikan semua screen
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-' + n).classList.add('active');

  // Update dots
  for (let i = 1; i <= 4; i++) {
    const dot = document.getElementById('dot-' + i);
    dot.classList.remove('active', 'done');
    if (i < n)  dot.classList.add('done');
    if (i === n) dot.classList.add('active');
  }

  // Scroll ke atas
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Aksi khusus per screen
  if (n === 2) startAnalysis();
  if (n === 3) startPreview();
  if (n === 4) updateSummary();
}

// ══════════════════════════════════
//   SCREEN 1 — UPLOAD FOTO
// ══════════════════════════════════
const uploadArea = document.getElementById('upload-area');
const fileInput  = document.getElementById('file-input');
const previewImg = document.getElementById('preview-img');

// Klik area upload → buka file picker
uploadArea.addEventListener('click', () => fileInput.click());

// Drag & drop
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

// File dipilih
fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) handleFile(file);
});

function handleFile(file) {
  state.photoMime = file.type || 'image/jpeg';
  const reader = new FileReader();
  reader.onload = (e) => {
    const dataUrl = e.target.result;
    // Simpan base64 tanpa prefix
    state.photo = dataUrl.split(',')[1];

    // Tampilkan preview
    previewImg.src = dataUrl;
    previewImg.hidden = false;
    document.getElementById('upload-inner').style.display = 'none';
    uploadArea.classList.add('filled');

    // Aktifkan tombol lanjut
    document.getElementById('btn-to-2').disabled = false;
  };
  reader.readAsDataURL(file);
}

// ══════════════════════════════════
//   SCREEN 2 — ANALISIS AI
// ══════════════════════════════════
let analysisRun = false;

async function startAnalysis() {
  // Hanya run sekali (tidak ulang kalau balik ke screen ini)
  if (analysisRun) return;
  analysisRun = true;

  // Tampilkan loading
  document.getElementById('loading-analysis').style.display = 'block';
  document.getElementById('analysis-box').style.display    = 'none';
  document.getElementById('model-filters').style.display   = 'none';
  document.getElementById('model-grid').style.display      = 'none';
  document.getElementById('nav-2').style.display           = 'none';

  try {
    const result = await analyzeWithGemini();
    state.analysis = result;
    renderAnalysis(result);
  } catch (err) {
    console.error('Analisis gagal:', err);
    // Fallback: tampilkan semua model tanpa analisis
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

async function analyzeWithGemini() {
  const prompt = `Kamu adalah AI analis rambut profesional untuk barbershop.
Analisis foto wajah ini dengan teliti, lalu balas HANYA dengan JSON berikut tanpa markdown, tanpa penjelasan:
{
  "face_shape": "oval|bulat|persegi|lonjong|hati",
  "hair_type": "lurus|bergelombang|keriting",
  "hair_length": "sangat pendek|pendek|sedang|panjang",
  "recommended_ids": ["id1","id2","id3","id4","id5"],
  "summary": "Kalimat singkat 1 baris tentang rekomendasi untuk wajah ini"
}
Pilih 5 recommended_ids dari daftar ini saja:
buzz, crew, caesar, textured, ivy, fade, taper, undercut, mohawk, frenchcrop, pompadour, quiff, slickback, curly, wolfcut, bun
Sesuaikan dengan bentuk wajah dan panjang rambut saat ini. Jangan rekomendasikan model yang butuh rambut jauh lebih panjang dari kondisi foto.`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inline_data: { mime_type: state.photoMime, data: state.photo } },
            { text: prompt }
          ]
        }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 500 }
      })
    }
  );

  if (!response.ok) throw new Error('API error: ' + response.status);

  const data = await response.json();
  const raw  = data.candidates[0].content.parts[0].text;
  const clean = raw.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}

function renderAnalysis(data) {
  if (!data) return;

  document.getElementById('analysis-box').style.display = 'block';
  document.getElementById('a-face').textContent   = data.face_shape?.toUpperCase() || '—';
  document.getElementById('a-type').textContent   = data.hair_type   || '—';
  document.getElementById('a-length').textContent = data.hair_length  || '—';

  if (data.summary) {
    document.getElementById('analysis-summary').textContent = data.summary;
  }
}

// ── MODEL GRID ────────────────────
function renderModelGrid(filter) {
  const grid = document.getElementById('model-grid');
  grid.innerHTML = '';

  // Tentukan urutan: rekomendasi AI duluan
  let list = [...CATALOG];
  if (state.analysis?.recommended_ids?.length) {
    const recIds = state.analysis.recommended_ids;
    list.sort((a, b) => {
      const ia = recIds.indexOf(a.id);
      const ib = recIds.indexOf(b.id);
      if (ia === -1 && ib === -1) return 0;
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });
  }

  // Filter kategori
  if (filter !== 'semua') {
    list = list.filter(m => m.cat === filter);
  }

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

  // Reset analisis agar screen 3 generate ulang
  state.previewRun = false;
}

function filterModels(cat, btn) {
  state.currentFilter = cat;
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
  document.getElementById('nav-3').style.display           = 'none';

  try {
    const desc = await generateModelDescription();
    renderPreview(desc);
  } catch (err) {
    console.error('Preview gagal:', err);
    renderPreview(null);
  } finally {
    document.getElementById('loading-preview').style.display = 'none';
    document.getElementById('preview-result').style.display  = 'block';
    document.getElementById('nav-3').style.display           = 'flex';
  }
}

async function generateModelDescription() {
  const model = state.selectedModel;
  const face  = state.analysis?.face_shape || 'oval';

  const prompt = `Kamu adalah barber profesional Indonesia.
Tulis panduan singkat untuk model rambut "${model.name}" bagi pelanggan dengan wajah ${face}.
Maksimal 2 kalimat. Gunakan bahasa Indonesia yang natural dan friendly.
Jelaskan: mengapa cocok untuk wajah ini + berapa minggu sekali perlu dipotong.
Jangan pakai bullet points atau formatting, cukup paragraf singkat.`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 200 }
      })
    }
  );

  const data = await response.json();
  return data.candidates[0].content.parts[0].text.trim();
}

function renderPreview(desc) {
  const model = state.selectedModel;

  // Tampilkan foto user sebagai preview (dengan overlay model)
  const userPhoto = 'data:' + state.photoMime + ';base64,' + state.photo;
  document.getElementById('result-img').src = userPhoto;

  document.getElementById('result-model-name').textContent = model.name;
  document.getElementById('result-desc').textContent = desc ||
    `${model.name} adalah pilihan yang tepat untuk tampilan ${model.desc.toLowerCase()}. ` +
    `Disarankan untuk dipotong setiap 3-4 minggu agar tetap rapi.`;
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
  document.getElementById('sum-model').textContent =
    state.selectedModel?.name || '—';
  document.getElementById('sum-color').textContent =
    state.selectedColor || 'Warna asli';
}

function sendWhatsApp() {
  const name = document.getElementById('inp-name').value.trim();
  const wa   = document.getElementById('inp-wa').value.trim();

  if (!name) { alert('Mohon isi nama Anda terlebih dahulu.'); return; }
  if (!wa)   { alert('Mohon isi nomor WhatsApp Anda.'); return; }

  const face   = state.analysis?.face_shape   || '-';
  const type   = state.analysis?.hair_type    || '-';
  const length = state.analysis?.hair_length  || '-';
  const model  = state.selectedModel?.name    || '-';
  const color  = state.selectedColor;

  const msg =
`✂️ *StyleIn.AI — Hasil Analisis Rambut*

Halo *${name}*! Berikut hasil sesi StyleIn.AI Anda:

📊 *Analisis Wajah:*
- Bentuk wajah: ${face}
- Jenis rambut: ${type}
- Panjang saat ini: ${length}

💈 *Pilihan Gaya:*
- Model rambut: *${model}*
- Warna cat: ${color}

Tunjukkan pesan ini ke barber Anda untuk hasil terbaik! 💪

_Powered by StyleIn.AI — Smart Barbershop Platform_`;

  const waClean = wa.replace(/[\s\-\(\)]/g, '').replace(/^0/, '62');
  const url = `https://wa.me/${waClean}?text=${encodeURIComponent(msg)}`;

  // Buka WhatsApp
  window.open(url, '_blank');

  // Tampilkan success
  document.getElementById('send-area').style.display   = 'none';
  document.getElementById('success-box').style.display = 'block';
}

// ══════════════════════════════════
//   RESET
// ══════════════════════════════════
function resetApp() {
  // Reset state
  state.photo         = null;
  state.analysis      = null;
  state.selectedModel = null;
  state.selectedColor = 'Warna asli';
  state.previewRun    = false;
  analysisRun         = false;

  // Reset UI screen 1
  previewImg.src    = '';
  previewImg.hidden = true;
  document.getElementById('upload-inner').style.display = '';
  uploadArea.classList.remove('filled');
  document.getElementById('btn-to-2').disabled = true;
  fileInput.value = '';

  // Reset screen 4
  document.getElementById('send-area').style.display   = '';
  document.getElementById('success-box').style.display = 'none';
  document.getElementById('inp-name').value = '';
  document.getElementById('inp-wa').value   = '';

  goTo(1);
}
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
  // ── PENDEK ─────────────────────
  {
    id: 'modern-medium', name: 'Modern Medium Natural', cat: 'sedang', icon: '🌿',
    prompt: 'medium length hair with natural volume, side swept fringe, layered',
    img: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?w=400'
  },
  {
    id: 'shaggy-medium', name: 'Shaggy Medium', cat: 'sedang', icon: '🌊',
    prompt: 'medium length shaggy hairstyle, natural waves, jaw length',
    img: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?w=400'
  },
  {
    id: 'quiff-taper', name: 'Quiff Tapered', cat: 'pendek', icon: '⬆️',
    prompt: 'short quiff with tapered sides, height on top, textured',
    img: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?w=400'
  },
  {
    id: 'textured-quiff', name: 'Textured Quiff', cat: 'pendek', icon: '🪨',
    prompt: 'textured quiff with taper fade, modern versatile style',
    img: 'https://images.pexels.com/photos/842980/pexels-photo-842980.jpeg?w=400'
  },
  {
    id: 'short-quiff', name: 'Short Quiff', cat: 'pendek', icon: '✨',
    prompt: 'short quiff hairstyle, shorter sides, styled top',
    img: 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?w=400'
  },
  {
    id: 'wavy-short', name: 'Short Natural Waves', cat: 'pendek', icon: '〰️',
    prompt: 'short hairstyle with natural waves, formal and informal',
    img: 'https://images.pexels.com/photos/1559486/pexels-photo-1559486.jpeg?w=400'
  },
  {
    id: 'slickback-medium', name: 'Slick Back Medium', cat: 'sedang', icon: '💎',
    prompt: 'medium length slicked back hair, swept back textured top, tapered sides',
    img: 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?w=400'
  },
  {
    id: 'clean-short', name: 'Clean Short Classic', cat: 'pendek', icon: '🎯',
    prompt: 'clean timeless short hairstyle, bold side parting, structured finish',
    img: 'https://images.pexels.com/photos/1516680/pexels-photo-1516680.jpeg?w=400'
  },
  {
    id: 'extended-top', name: 'Extended Length Top', cat: 'pendek', icon: '📐',
    prompt: 'short trendy hairstyle, tapered sides, extended length on top',
    img: 'https://images.pexels.com/photos/3768166/pexels-photo-3768166.jpeg?w=400'
  },
  {
    id: 'trendy-short', name: 'Trendy Short', cat: 'pendek', icon: '⚡',
    prompt: 'trendy short hairstyle, very short sides, longer top, low maintenance',
    img: 'https://images.pexels.com/photos/1300402/pexels-photo-1300402.jpeg?w=400'
  },
  // ── FADE ───────────────────────
  {
    id: 'timeless-short', name: 'Timeless Short', cat: 'pendek', icon: '🕐',
    prompt: 'timeless short hairstyle, short sides, slightly longer top',
    img: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?w=400'
  },
  {
    id: 'buzz-sides', name: 'Buzz Sides Long Top', cat: 'fade', icon: '✂️',
    prompt: 'buzz cut sides, longer middle top, clean structured look',
    img: 'https://images.pexels.com/photos/1212984/pexels-photo-1212984.jpeg?w=400'
  },
  {
    id: 'buzz-left', name: 'Buzz Styled Left', cat: 'fade', icon: '👈',
    prompt: 'buzz cut sides, longer top styled to the left, sharp structure',
    img: 'https://images.pexels.com/photos/1040173/pexels-photo-1040173.jpeg?w=400'
  },
  {
    id: 'height-top', name: 'Height Top Fade', cat: 'fade', icon: '🏔️',
    prompt: 'short hair with height on top, shorter sides, elongating face',
    img: 'https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg?w=400'
  },
  {
    id: 'curly-fade', name: 'Curly Fade', cat: 'fade', icon: '🌀',
    prompt: 'natural curls on top, short sides fade, defined curls',
    img: 'https://images.pexels.com/photos/1680175/pexels-photo-1680175.jpeg?w=400'
  },
  {
    id: 'side-part-fade', name: 'Side Part Fade', cat: 'fade', icon: '📏',
    prompt: 'short trendy hairstyle, side part, short sides longer top fade',
    img: 'https://images.pexels.com/photos/2269872/pexels-photo-2269872.jpeg?w=400'
  },
  {
    id: 'waves-fade', name: 'Waves Fade', cat: 'fade', icon: '🌊',
    prompt: 'short sleek hairstyle with waves, height on top, fade sides',
    img: 'https://images.pexels.com/photos/1484801/pexels-photo-1484801.jpeg?w=400'
  },
  {
    id: 'swept-back', name: 'Swept Back Fade', cat: 'fade', icon: '💨',
    prompt: 'short straight hair swept back, voluminous, fade sides',
    img: 'https://images.pexels.com/photos/1681007/pexels-photo-1681007.jpeg?w=400'
  },
  {
    id: 'flamboyant', name: 'Flamboyant Voluminous', cat: 'fade', icon: '🔥',
    prompt: 'voluminous swept back top, high fade sides, bold statement look',
    img: 'https://images.pexels.com/photos/2232981/pexels-photo-2232981.jpeg?w=400'
  },
  {
    id: 'dapper-retro', name: 'Dapper Retro', cat: 'sedang', icon: '🎩',
    prompt: 'dapper hairstyle, coiff swept back, short sides, retro professional',
    img: 'https://images.pexels.com/photos/1722198/pexels-photo-1722198.jpeg?w=400'
  },
  // ── CASUAL ─────────────────────
  {
    id: 'clipper-casual', name: 'Casual Clipper Cut', cat: 'pendek', icon: '✂️',
    prompt: 'casual clipper cut, short sides, textured jagged top',
    img: 'https://images.pexels.com/photos/775358/pexels-photo-775358.jpeg?w=400'
  },
  {
    id: 'tidy-formal', name: 'Tidy Formal Short', cat: 'pendek', icon: '👔',
    prompt: 'formal short tidy hairstyle, close sides, height on top',
    img: 'https://images.pexels.com/photos/1036623/pexels-photo-1036623.jpeg?w=400'
  },
  {
    id: 'curly-natural', name: 'Natural Curls Short', cat: 'pendek', icon: '🌸',
    prompt: 'naturally curly hair cropped short, movement on top, neat edges',
    img: 'https://images.pexels.com/photos/1468379/pexels-photo-1468379.jpeg?w=400'
  },
  {
    id: 'chestnut-smooth', name: 'Smooth Chestnut', cat: 'pendek', icon: '🍂',
    prompt: 'short smooth chestnut brown hair, clipper cut sides, versatile top',
    img: 'https://images.pexels.com/photos/1656684/pexels-photo-1656684.jpeg?w=400'
  },
  {
    id: 'curly-top', name: 'Curly Top Short Sides', cat: 'sedang', icon: '🎪',
    prompt: 'casual short back sides with curly top, natural movement',
    img: 'https://images.pexels.com/photos/1462637/pexels-photo-1462637.jpeg?w=400'
  },
  {
    id: 'undercut-high', name: 'Undercut High Top', cat: 'fade', icon: '⚔️',
    prompt: 'undercut high top hairstyle, clipper cut high sides, swept back',
    img: 'https://images.pexels.com/photos/2896853/pexels-photo-2896853.jpeg?w=400'
  },
  {
    id: 'spiky', name: 'Spiky Casual', cat: 'pendek', icon: '⚡',
    prompt: 'short spiky casual hairstyle, textured jagged layers, wax styled',
    img: 'https://images.pexels.com/photos/1484794/pexels-photo-1484794.jpeg?w=400'
  },
  {
    id: 'wispy-medium', name: 'Wispy Medium', cat: 'sedang', icon: '🍃',
    prompt: 'smooth wispy medium length hair, razor cut layers, side bangs',
    img: 'https://images.pexels.com/photos/1040881/pexels-photo-1040881.jpeg?w=400'
  },
  {
    id: 'sleek-glamorous', name: 'Sleek Glamorous', cat: 'sedang', icon: '💫',
    prompt: 'sleek glamorous mens hairstyle, slicked sides, teased high top',
    img: 'https://images.pexels.com/photos/1300402/pexels-photo-1300402.jpeg?w=400'
  },
  {
    id: 'top-waves', name: 'Top Waves Short', cat: 'pendek', icon: '〰️',
    prompt: 'short male hairstyle with waves on top, styled curls, formal',
    img: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?w=400'
  },
  {
    id: 'smooth-simple', name: 'Smooth Simple', cat: 'pendek', icon: '🎯',
    prompt: 'smooth simple short hairstyle, flat or messy versatile look',
    img: 'https://images.pexels.com/photos/842980/pexels-photo-842980.jpeg?w=400'
  },
  {
    id: 'wispy-red', name: 'Wispy Textured', cat: 'pendek', icon: '🍁',
    prompt: 'short wispy textured hairstyle, jagged edges, natural fall',
    img: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?w=400'
  },
  {
    id: 'light-brown', name: 'Classic Clean Cut', cat: 'pendek', icon: '🪮',
    prompt: 'short classic clean cut, swept over top, tidy all occasions',
    img: 'https://images.pexels.com/photos/1516680/pexels-photo-1516680.jpeg?w=400'
  },
  {
    id: 'textured-bangs', name: 'Textured Bangs', cat: 'pendek', icon: '🎭',
    prompt: 'short funky hairstyle with textured bangs, clipper cut sides',
    img: 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?w=400'
  },
  {
    id: 'wispy-bangs', name: 'Wispy Bangs', cat: 'pendek', icon: '🌬️',
    prompt: 'short wispy hairstyle with bangs, tapered back, pieced out fringe',
    img: 'https://images.pexels.com/photos/1559486/pexels-photo-1559486.jpeg?w=400'
  },
  // ── SEDANG/PANJANG ─────────────
  {
    id: 'tidy-height', name: 'Tidy Height Wavy', cat: 'sedang', icon: '📊',
    prompt: 'tidy brown wavy hairstyle with height, jagged cut top, round face',
    img: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?w=400'
  },
  {
    id: 'spiky-bold', name: 'Spiky Bold', cat: 'pendek', icon: '🗡️',
    prompt: 'audacious spiky hairstyle, razor cut layers, crown texture height',
    img: 'https://images.pexels.com/photos/1300402/pexels-photo-1300402.jpeg?w=400'
  },
  {
    id: 'bangs-layered', name: 'Layered Bangs', cat: 'pendek', icon: '📎',
    prompt: 'short layered hairstyle with bangs, movement texture, long face',
    img: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?w=400'
  },
  {
    id: 'shaggy-bangs', name: 'Shaggy with Bangs', cat: 'sedang', icon: '🧸',
    prompt: 'short shaggy hairstyle with bangs, jagged cut, narrow face',
    img: 'https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg?w=400'
  },
  {
    id: 'tapered-bangs', name: 'Tapered Long Bangs', cat: 'sedang', icon: '🎪',
    prompt: 'tapered hairstyle with long bangs, jagged texture, alternative',
    img: 'https://images.pexels.com/photos/1484801/pexels-photo-1484801.jpeg?w=400'
  },
  {
    id: 'jagged-layers', name: 'Jagged Top Layers', cat: 'pendek', icon: '⚙️',
    prompt: 'clipper cut short sides, jagged top layers, styled high texture',
    img: 'https://images.pexels.com/photos/1212984/pexels-photo-1212984.jpeg?w=400'
  },
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
  <div class="model-img-wrap">
    <img src="${model.img}" alt="${model.name}" loading="lazy"
      onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
    <div class="model-img-fallback" style="display:none">${model.icon}</div>
  </div>
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

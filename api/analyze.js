export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const { photo, mimeType } = req.body;
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const prompt = [
      'Kamu adalah AI analis rambut profesional untuk barbershop Indonesia.',
      'Analisis foto wajah ini dengan teliti.',
      'Balas HANYA dengan JSON berikut tanpa markdown tanpa penjelasan:',
      '{',
      '"face_shape": "oval atau bulat atau persegi atau lonjong atau hati",',
      '"hair_type": "lurus atau bergelombang atau keriting",',
      '"hair_length": "sangat pendek atau pendek atau sedang atau panjang",',
      '"recommended_ids": ["id1","id2","id3","id4","id5"],',
      '"summary": "kalimat singkat rekomendasi untuk wajah ini"',
      '}',
      'Pilih 5 recommended_ids dari: modern-medium, shaggy-medium, quiff-taper, textured-quiff, short-quiff, wavy-short, slickback-medium, clean-short, extended-top, trendy-short, timeless-short, buzz-sides, buzz-left, height-top, curly-fade, side-part-fade, waves-fade, swept-back, flamboyant, dapper-retro, clipper-casual, tidy-formal, curly-natural, chestnut-smooth, curly-top, undercut-high, spiky, wispy-medium, sleek-glamorous, top-waves, smooth-simple, wispy-red, light-brown, textured-bangs, wispy-bangs, tidy-height, spiky-bold, bangs-layered, shaggy-bangs, tapered-bangs, jagged-layers',
      'Sesuaikan dengan bentuk wajah dan panjang rambut saat ini.'
    ].join('\n');

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inline_data: { mime_type: mimeType, data: photo } },
            { text: prompt }
          ]
        }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 500 }
      })
    });

    if (!response.ok) {
      const err = await response.json();
      return res.status(response.status).json({ error: err });
    }

    const data = await response.json();
    const raw = data.candidates[0].content.parts[0].text;
    const clean = raw.replace(/```json|```/g, '').trim();
    return res.status(200).json(JSON.parse(clean));

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

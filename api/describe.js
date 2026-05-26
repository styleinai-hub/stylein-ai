export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const { modelName, faceShape } = req.body;
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const prompt = [
      'Kamu adalah barber profesional Indonesia.',
      'Tulis panduan untuk model rambut ' + modelName + ' bagi pelanggan dengan bentuk wajah ' + faceShape + '.',
      'Tulis tepat 2 kalimat lengkap dalam Bahasa Indonesia yang natural dan friendly.',
      'Kalimat pertama: jelaskan mengapa model ini cocok untuk bentuk wajah tersebut.',
      'Kalimat kedua: berapa minggu sekali perlu dipotong dan tips perawatan singkat.',
      'Jangan gunakan bullet points. Pastikan kedua kalimat selesai dengan tanda titik.'
    ].join(' ');

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 300
        }
      })
    });

    if (!response.ok) {
      const err = await response.json();
      return res.status(response.status).json({ error: err });
    }

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text.trim();
    return res.status(200).json({ description: text });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

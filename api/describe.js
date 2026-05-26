export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const { modelName, faceShape } = req.body;
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: `Kamu adalah barber profesional Indonesia. Tulis panduan singkat untuk model rambut "${modelName}" bagi pelanggan dengan wajah ${faceShape}. Maksimal 2 kalimat natural dan friendly dalam Bahasa Indonesia. Jelaskan mengapa cocok dan berapa minggu sekali perlu dipotong. Tanpa bullet points.` }]
        }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 200 }
      })
    });

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text.trim();
    return res.status(200).json({ description: text });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

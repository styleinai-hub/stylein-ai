export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { size, contentType } = req.body;

    const response = await fetch(
      'https://api.lightxeditor.com/external/api/v2/uploadImageUrl',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.LIGHTX_API_KEY
        },
        body: JSON.stringify({
          uploadType: 'imageUrl',
          size,
          contentType
        })
      }
    );

    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

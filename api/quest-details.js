export default async function handler(req, res) {
  const { code } = req.query;
  
  if (!code) {
    return res.status(400).json({ error: 'Missing query parameter "code"' });
  }

  try {
    const url = `https://ons-api.questdiagnostics.com/test/details/MASTER${encodeURIComponent(code)}`;
    const response = await fetch(url, {
      headers: {
        'x-quest-api-id': 'test-details-v1',
        'Accept': 'application/json',
      },
    });
    const data = await response.json();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch from Quest API' });
  }
}

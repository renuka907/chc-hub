export default async function handler(req, res) {
  const { q, rows = '10', start = '0' } = req.query;
  
  if (!q) {
    return res.status(400).json({ error: 'Missing query parameter "q"' });
  }

  try {
    const url = `https://ons-api.questdiagnostics.com/test/search?q=${encodeURIComponent(q)}&start=${start}&rows=${rows}&cc=MASTER`;
    const response = await fetch(url, {
      headers: {
        'x-quest-api-id': 'tests-search-v1',
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

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { q } = req.query;
  if (!q || q.length < 2) {
    return res.status(400).json({ error: 'Query too short' });
  }

  const term = q.trim();
  const isNPI = /^\d{10}$/.test(term);
  let url = 'https://npiregistry.cms.hhs.gov/api/?version=2.1&limit=10';

  if (isNPI) {
    url += `&number=${term}`;
  } else {
    const parts = term.split(/\s+/);
    if (parts.length >= 2) {
      url += `&first_name=${encodeURIComponent(parts[0])}&last_name=${encodeURIComponent(parts.slice(1).join(' '))}`;
    } else {
      url += `&last_name=${encodeURIComponent(parts[0])}`;
    }
    url += '&enumeration_type=NPI-1';
  }

  try {
    const resp = await fetch(url);
    const json = await resp.json();

    const results = (json.results || []).map(r => {
      const basic = r.basic || {};
      const addr = r.addresses?.find(a => a.address_purpose === 'LOCATION') || r.addresses?.[0] || {};
      const taxonomy = r.taxonomies?.find(t => t.primary) || r.taxonomies?.[0] || {};

      const fullName = basic.organization_name ||
        `${basic.first_name || ''} ${basic.middle_name ? basic.middle_name + ' ' : ''}${basic.last_name || ''}`.trim();

      const address = [
        addr.address_1,
        addr.address_2,
        `${addr.city || ''} ${addr.state || ''} ${addr.postal_code?.slice(0, 5) || ''}`
      ].filter(Boolean).join(', ');

      return {
        npi: r.number,
        full_name: fullName,
        credentials: basic.credential || '',
        specialty: taxonomy.desc || '',
        phone: addr.telephone_number || '',
        fax: addr.fax_number || '',
        address,
      };
    });

    return res.status(200).json({ results });
  } catch (error) {
    console.error('NPI search error:', error);
    return res.status(500).json({ error: 'NPI search failed' });
  }
}

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

function stripTags(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractPreferredRaw(html) {
  const patterns = [
    /<dt[^>]*>\s*(?:<strong[^>]*>)?\s*Preferred\s*Specimen\s*(?:<\/strong>)?\s*<\/dt>\s*<dd[^>]*>\s*([\s\S]*?)<\/dd>/i,
    /<li[^>]*>\s*(?:<strong[^>]*>)?\s*Preferred\s*Specimen\s*(?:<\/strong>)?\s*[:\-]?\s*([^<]+)<\/li>/i,
    /Preferred\s*Specimen[^<:]*[:\-]?\s*(?:<[^>]+>\s*)*([^<\n\r]+)/i,
  ];
  for (const re of patterns) {
    const m = re.exec(html);
    if (m && m[1]) return stripTags(m[1]).trim();
  }
  const idx = html.search(/Preferred\s*Specimen/i);
  if (idx !== -1) {
    const windowText = html.slice(idx, idx + 600);
    const text = stripTags(windowText);
    const after = text.replace(/^[\s\S]*Preferred\s*Specimen\s*[:\-]?\s*/i, '');
    const endIdx = after.search(/[\.!\n]/);
    return (endIdx > 0 ? after.slice(0, endIdx) : after).trim();
  }
  return '';
}

function normalizeTubeType(raw) {
  if (!raw) return '';
  const s = raw.toLowerCase();

  if (/(lithium\s*heparin|\bheparin\b)/i.test(s)) return 'Green-top Lithium Heparin';
  if (/(light\s*blue|\bblue\b).*citrate|citrate.*(light\s*blue|\bblue\b)/i.test(s)) return 'Light Blue-top Sodium Citrate';
  if (/(lavender|purple).*edta|edta.*(lavender|purple)/i.test(s)) return 'Lavender-top EDTA';
  if (/(gray|grey).*fluoride|fluoride.*(gray|grey)|oxalate/i.test(s)) return 'Gray-top Sodium Fluoride';
  if (/pink.*edta|edta.*pink/i.test(s)) return 'Pink-top EDTA';
  if (/yellow.*acd|acd.*yellow/i.test(s)) return 'Yellow-top ACD';
  if (/(gold|yellow).*sst|sst.*(gold|yellow)/i.test(s)) return 'Gold-top SST';
  if (/(red)(?!.*(gray|gold))/i.test(s)) return 'Red-top';
  if (/green/.test(s)) return 'Green-top';

  const fallback = raw.replace(/^[\s:\-]+/, '').trim();
  return fallback ? fallback.charAt(0).toUpperCase() + fallback.slice(1) : '';
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { questUrl } = await req.json();
    if (!questUrl) return Response.json({ error: 'Missing questUrl' }, { status: 400 });

    const res = await fetch(questUrl, { headers: { 'User-Agent': 'CHC Hub Fetcher' } });
    if (!res.ok) {
      return Response.json({ success: false, error: 'Failed to fetch Quest page', status: res.status });
    }
    const html = await res.text();

    const rawPreferred = extractPreferredRaw(html);
    if (!rawPreferred) {
      return Response.json({ success: false, error: 'Preferred Specimen not found on page' });
    }

    const tube_type = normalizeTubeType(rawPreferred);

    return Response.json({ success: true, tube_type, rawPreferred });
  } catch (error) {
    return Response.json({ error: error.message || String(error) }, { status: 500 });
  }
});
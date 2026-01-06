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
    /<li[^>]*>\s*(?:<strong[^>]*>)?\s*Preferred\s*Specimen\s*(?:<\/strong>)?\s*[:\-]?\s*([^<]+)<\/li>/i,
    /Preferred\s*Specimen[^<:]*[:\-]?\s*(?:<[^>]+>\s*)*([^<\n\r]+)</i,
  ];
  for (const re of patterns) {
    const m = re.exec(html);
    if (m && m[1]) return m[1].trim();
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
  const rules = [
    { re: /(lavender|purple).*edta|edta.*(lavender|purple)/i, label: 'Lavender-top EDTA' },
    { re: /(gold|yellow).*sst|sst.*(gold|yellow)/i, label: 'Gold-top SST' },
    { re: /(red)(?!.*(gray|gold)).*(plain|serum)?/i, label: 'Red-top' },
    { re: /(light\s*blue|blue).*citrate|citrate.*(light\s*blue|blue)/i, label: 'Light Blue-top Sodium Citrate' },
    { re: /(green).*heparin|heparin.*(green)|lithium\s*heparin/i, label: 'Green-top Lithium Heparin' },
    { re: /(gray|grey).*fluoride|fluoride.*(gray|grey)|oxalate/i, label: 'Gray-top Sodium Fluoride' },
    { re: /pink.*edta|edta.*pink/i, label: 'Pink-top EDTA' },
    { re: /black/i, label: 'Black-top' },
    { re: /yellow.*acd|acd.*yellow/i, label: 'Yellow-top ACD' },
  ];
  for (const r of rules) {
    if (r.re.test(raw)) return r.label;
    if (r.re.test(s)) return r.label;
  }
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
      return Response.json({ error: 'Failed to fetch Quest page', status: res.status }, { status: 502 });
    }
    const html = await res.text();

    const rawPreferred = extractPreferredRaw(html);
    if (!rawPreferred) {
      return Response.json({ error: 'Preferred Specimen not found on page' }, { status: 422 });
    }

    const tube_type = normalizeTubeType(rawPreferred);

    return Response.json({ success: true, tube_type, rawPreferred });
  } catch (error) {
    return Response.json({ error: error.message || String(error) }, { status: 500 });
  }
});
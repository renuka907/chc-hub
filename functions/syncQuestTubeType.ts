import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

function stripTags(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getMetaContent(html, key, attr = 'name') {
  const re = new RegExp(`<meta[^>]+${attr}=["']${key}["'][^>]+content=["']([^"']+)["']`, 'i');
  const m = re.exec(html);
  return m?.[1] || '';
}

function getTitle(html) {
  const m = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  return m ? stripTags(m[1]) : '';
}

function extractDtDd(html, label) {
  const re = new RegExp(
    `<dt[^>]*>\\s*(?:<strong[^>]*>)?\\s*${label}\\s*(?:<\\/strong>)?\\s*<\\/dt>\\s*<dd[^>]*>\\s*([\\s\\S]*?)<\\/dd>`,
    'i'
  );
  const m = re.exec(html);
  return m?.[1] ? stripTags(m[1]).trim() : '';
}

function extractNear(html, label) {
  const idx = html.search(new RegExp(label, 'i'));
  if (idx !== -1) {
    const windowText = html.slice(idx, idx + 1000);
    const text = stripTags(windowText);
    const after = text.replace(new RegExp(`^[\\s\\S]*${label}\\s*[:\\-]?\\s*`, 'i'), '');
    const endIdx = after.search(/[\.!\n]/);
    return (endIdx > 0 ? after.slice(0, endIdx) : after).trim();
  }
  return '';
}

function extractField(html, label) {
  return (
    extractDtDd(html, label) ||
    (() => {
      const li = new RegExp(`<li[^>]*>\\s*(?:<strong[^>]*>)?\\s*${label}\\s*(?:<\\/strong>)?\\s*[:\\-]?\\s*([^<]+)<\\/li>`, 'i').exec(html);
      return li?.[1] ? stripTags(li[1]).trim() : '';
    })() ||
    extractNear(html, label)
  );
}

function extractPreferredRaw(html) {
  return extractField(html, 'Preferred\\s*Specimen');
}

function normalizeTubeType(raw) {
  if (!raw) return '';
  const s = raw.toLowerCase();
  if (/(lithium\\s*heparin|\\bheparin\\b)/i.test(s)) return 'Green-top Lithium Heparin';
  if (/(light\\s*blue|\\bblue\\b).*citrate|citrate.*(light\\s*blue|\\bblue\\b)/i.test(s)) return 'Light Blue-top Sodium Citrate';
  if (/(lavender|purple).*edta|edta.*(lavender|purple)/i.test(s)) return 'Lavender-top EDTA';
  if (/(gray|grey).*fluoride|fluoride.*(gray|grey)|oxalate/i.test(s)) return 'Gray-top Sodium Fluoride';
  if (/pink.*edta|edta.*pink/i.test(s)) return 'Pink-top EDTA';
  if (/yellow.*acd|acd.*yellow/i.test(s)) return 'Yellow-top ACD';
  if (/(gold|yellow).*sst|sst.*(gold|yellow)/i.test(s)) return 'Gold-top SST';
  if (/(red)(?!.*(gray|gold))/i.test(s)) return 'Red-top';
  if (/green/.test(s)) return 'Green-top';
  const fallback = raw.replace(/^[\\s:\\-]+/, '').trim();
  return fallback ? fallback.charAt(0).toUpperCase() + fallback.slice(1) : '';
}

function extractTestCode(questUrl, html) {
  const fromUrl = /test-detail\/(\d+)/i.exec(questUrl);
  if (fromUrl?.[1]) return fromUrl[1];
  const fromText = /(?:Test\s*Code|Code)\s*[:#]?\s*(\d{3,6})/i.exec(stripTags(html));
  return fromText?.[1] || '';
}

async function fetchWithRetry(url, options = {}, maxRetries = 3, delayMs = 600) {
  let attempt = 0;
  let lastErr = null;
  while (attempt <= maxRetries) {
    try {
      const res = await fetch(url, options);
      if (res.ok) return { res, attempts: attempt + 1 };
      if (res.status === 429 || res.status >= 500) {
        if (attempt === maxRetries) return { res, attempts: attempt + 1 };
        await new Promise(r => setTimeout(r, delayMs * Math.pow(2, attempt)));
        attempt++;
        continue;
      }
      return { res, attempts: attempt + 1 };
    } catch (e) {
      lastErr = e;
      if (attempt === maxRetries) throw e;
      await new Promise(r => setTimeout(r, delayMs * Math.pow(2, attempt)));
      attempt++;
    }
  }
  if (lastErr) throw lastErr;
  throw new Error('Unknown fetch error');
}

function buildDetails(html, questUrl) {
  const rawPreferred = extractPreferredRaw(html);
  const tube_type = normalizeTubeType(rawPreferred);
  const specimen_type = extractField(html, 'Specimen\\s*Type') ||
                        (function () {
                          const val = extractField(html, 'Specimen');
                          return /preferred\s*specimen/i.test(val) ? '' : val;
                        })();
  const collection_instructions = extractField(html, 'Collection\\s*Instructions') || extractField(html, 'Collection');
  const storage_requirements = extractField(html, 'Transport\\s*Temperature') || extractField(html, 'Storage') || extractField(html, 'Stability');
  const volume_required = extractField(html, 'Minimum\\s*Volume') || extractField(html, 'Specimen\\s*Volume') || extractField(html, 'Volume');
  const test_name = getMetaContent(html, 'og:title', 'property') || getTitle(html);
  const test_code = extractTestCode(questUrl, html);
  return {
    tube_type,
    rawPreferred,
    specimen_type,
    collection_instructions,
    storage_requirements,
    volume_required,
    test_name: test_name?.trim(),
    test_code: test_code?.trim()
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const testId = body?.testId;
    if (!testId) return Response.json({ error: 'Missing testId' }, { status: 400 });

    const tests = await base44.entities.LabTestInfo.filter({ id: testId });
    const test = tests?.[0];
    if (!test) return Response.json({ error: 'Test not found' }, { status: 404 });
    if (!test.quest_url) return Response.json({ success: false, error: 'No quest_url on test' });

    const { res, attempts } = await fetchWithRetry(test.quest_url, { headers: { 'User-Agent': 'CHC Hub Fetcher' } }, 3, 600);
    if (!res.ok) {
      return Response.json({ success: false, error: 'Failed to fetch Quest page', status: res.status, attempts });
    }
    const html = await res.text();

    const details = buildDetails(html, test.quest_url);
    const { rawPreferred, tube_type } = details;
    if (!rawPreferred && !tube_type) {
      return Response.json({ success: false, error: 'Preferred Specimen not found on page', attempts, details });
    }

    const patch = {};
    const updated_fields = {};

    function setIfChanged(key, value, overwrite = false) {
      if (!value) return;
      const current = test[key];
      if ((overwrite && value !== current) || (!current && value)) {
        patch[key] = value;
        updated_fields[key] = { from: current || null, to: value };
      }
    }

    setIfChanged('tube_type', details.tube_type || normalizeTubeType(details.rawPreferred), true);
    setIfChanged('specimen_type', details.specimen_type);
    setIfChanged('collection_instructions', details.collection_instructions);
    setIfChanged('storage_requirements', details.storage_requirements);
    setIfChanged('volume_required', details.volume_required);
    if (!test.test_code) setIfChanged('test_code', details.test_code);
    if (!test.test_name) setIfChanged('test_name', details.test_name);

    let updated = false;
    if (Object.keys(patch).length) {
      await base44.entities.LabTestInfo.update(test.id, patch);
      updated = true;
    }

    return Response.json({ success: true, attempts, tube_type, rawPreferred, updated, updated_count: Object.keys(patch).length, updated_fields });
  } catch (error) {
    return Response.json({ error: error.message || String(error) }, { status: 500 });
  }
});
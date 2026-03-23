// Vercel Serverless Function — Peach AI Chat (Gemini + Supabase context)
// Requires SUPABASE_SERVICE_ROLE_KEY and GEMINI_API_KEY env vars

const SUPABASE_URL = 'https://xtalelqzucijanmnpkol.supabase.co';

function detectIntent(message) {
  const msg = message.toLowerCase();
  const intents = [];

  if (/\b(have|stock|inventory|supply|fridge|item|items|quantity|ndc|lot|expire|expir|order|semaglutide|botox|filler|needle|syringe|glove)\b/.test(msg)) {
    intents.push('inventory');
  }
  if (/\b(cost|price|pricing|how much|fee|charge|rate)\b/.test(msg)) {
    intents.push('pricing');
  }
  if (/\b(procedure|how to|steps|protocol|inject|draw|process)\b/.test(msg)) {
    intents.push('procedures');
  }
  if (/\b(aftercare|after care|post.?care|after.?instruction|wound|healing|recovery)\b/.test(msg)) {
    intents.push('aftercare');
  }
  if (/\b(education|learn|info about|information|teach|what is|what are)\b/.test(msg)) {
    intents.push('education');
  }

  if (intents.length === 0) {
    intents.push('inventory', 'pricing');
  }

  return intents;
}

async function supabaseQuery(serviceKey, table, select, filters = {}, limit = 100) {
  let url = `${SUPABASE_URL}/rest/v1/${table}?select=${encodeURIComponent(select)}&limit=${limit}`;
  for (const [key, value] of Object.entries(filters)) {
    url += `&${key}=eq.${encodeURIComponent(value)}`;
  }
  const resp = await fetch(url, {
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
    },
  });
  if (!resp.ok) return [];
  return resp.json();
}

async function searchInventory(serviceKey, message, locationFilter) {
  // Extract key search terms from the message
  const stopWords = new Set(['the','and','any','have','does','our','you','can','check','stock','inventory','supply','how','many','much','what','where','which','some','get','need','order','are','there','this','that','with','for','from','about','into','been','being','were','was','will','would','could','should','their','them','they','his','her','its','has','had','not','but','all','also','just','than','then','when','only','very','your','use','used','find','look','tell','show']);
  
  const words = message.toLowerCase().replace(/[?.,!'"]/g, '').split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w));
  
  const selectCols = 'item_name,quantity,storage_location,location_id,status,expiry_date,low_stock_threshold,item_condition,supplier,unit';
  
  // Try each search word individually, longest first (most specific)
  const searchTerms = words.sort((a, b) => b.length - a.length).slice(0, 4);
  
  let allResults = [];
  
  for (const term of searchTerms) {
    let url = `${SUPABASE_URL}/rest/v1/inventory_items?select=${selectCols}&item_name=ilike.*${term}*&limit=30`;
    if (locationFilter && locationFilter !== 'all') {
      url += `&location_id=eq.${locationFilter}`;
    }
    
    const resp = await fetch(url, {
      headers: { 'apikey': serviceKey, 'Authorization': `Bearer ${serviceKey}` },
    });
    if (resp.ok) {
      const data = await resp.json();
      // Dedupe by item_name + location_id
      for (const item of data) {
        const key = `${item.item_name}|${item.location_id}`;
        if (!allResults.find(r => `${r.item_name}|${r.location_id}` === key)) {
          allResults.push(item);
        }
      }
    }
    // If we found results with the most specific term, that's usually enough
    if (allResults.length > 0 && term.length > 4) break;
  }
  
  if (allResults.length === 0 && searchTerms.length > 0) {
    return [{ item_name: `No items matching "${searchTerms.join(', ')}" found in inventory`, quantity: null }];
  }
  
  return allResults.slice(0, 50);
}

async function fetchContext(serviceKey, intents, locationFilter, message) {
  const context = {};
  const sources = [];

  // Always fetch locations
  context.locations = await supabaseQuery(serviceKey, 'clinic_locations', 'id,name,address');

  if (intents.includes('inventory')) {
    context.inventory = await searchInventory(serviceKey, message, locationFilter);
    sources.push('inventory');
  }

  if (intents.includes('pricing')) {
    context.pricing = await supabaseQuery(serviceKey, 'pricing_items', 'service_name,price,category,description');
    sources.push('pricing');
  }

  if (intents.includes('procedures')) {
    context.procedures = await supabaseQuery(serviceKey, 'procedures', 'name,description,instructions,warnings,estimated_duration', {}, 50);
    sources.push('procedures');
  }

  if (intents.includes('aftercare')) {
    context.aftercare = await supabaseQuery(serviceKey, 'aftercare_instructions', 'title,content,category', {}, 50);
    sources.push('aftercare');
  }

  if (intents.includes('education')) {
    context.education = await supabaseQuery(serviceKey, 'education_topics', 'title,content,category', {}, 50);
    sources.push('education');
  }

  return { context, sources };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (!serviceKey || !geminiKey) {
    return res.status(500).json({ error: 'Missing environment variables', detail: !serviceKey ? 'SUPABASE_SERVICE_ROLE_KEY' : 'GEMINI_API_KEY' });
  }

  const { message, conversationHistory = [], locationFilter } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const intents = detectIntent(message);
    const { context, sources } = await fetchContext(serviceKey, intents, locationFilter, message);

    // Build context string
    let contextStr = '';
    if (context.locations?.length) {
      contextStr += `\n\nClinic Locations:\n${JSON.stringify(context.locations, null, 1)}`;
    }
    if (context.inventory?.length) {
      contextStr += `\n\nInventory Items (${context.inventory.length} items):\n${JSON.stringify(context.inventory, null, 1)}`;
    }
    if (context.pricing?.length) {
      contextStr += `\n\nPricing:\n${JSON.stringify(context.pricing, null, 1)}`;
    }
    if (context.procedures?.length) {
      contextStr += `\n\nProcedures:\n${JSON.stringify(context.procedures, null, 1)}`;
    }
    if (context.aftercare?.length) {
      contextStr += `\n\nAftercare Instructions:\n${JSON.stringify(context.aftercare, null, 1)}`;
    }
    if (context.education?.length) {
      contextStr += `\n\nEducation Topics:\n${JSON.stringify(context.education, null, 1)}`;
    }

    const systemPrompt = `You are Peach 🍑, the friendly and knowledgeable AI assistant for CHC (Contemporary Health Center). You help staff with questions about inventory, pricing, procedures, aftercare instructions, and education topics.

Guidelines:
- Be warm, concise, and professional
- When asked about inventory: mention the item name, location, storage area, quantity, and status. Example: "Yes, we have [item] at [location] in the [storage_location]. Current quantity: [X]."
- When asked about pricing: clearly state the service and price
- When asked about procedures: provide clear step-by-step information
- If you don't have the information in your context, say so honestly and suggest who to ask
- Format responses clearly with bullet points or numbered lists when appropriate
- If a location filter is active, focus responses on that location
- Keep responses concise but helpful

Current database context:${contextStr}`;

    // Build Gemini contents
    const contents = [];
    const recentHistory = conversationHistory.slice(-10);
    for (const msg of recentHistory) {
      contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      });
    }
    contents.push({ role: 'user', parts: [{ text: message }] });

    // Call Gemini
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
        },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Gemini error:', response.status, err);
      return res.status(500).json({ error: 'AI service error', status: response.status });
    }

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not generate a response.';

    return res.status(200).json({ reply, sources });
  } catch (error) {
    console.error('Chat API error:', error);
    return res.status(500).json({ error: 'Internal server error', detail: error.message });
  }
}

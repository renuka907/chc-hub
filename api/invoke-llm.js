// Vercel Serverless Function — AI Content Generation (Gemini)
// Requires GEMINI_API_KEY env var

const GEMINI_MODEL = 'gemini-2.5-flash';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });

  const { prompt, response_json_schema } = req.body;
  if (!prompt) return res.status(400).json({ error: 'prompt is required' });

  try {
    const systemInstruction = `You are a medical content writer for a healthcare clinic. 
Generate accurate, patient-friendly educational content. 
Always respond with valid JSON matching the requested schema.
Do not include any markdown code fences in your response — just raw JSON.`;

    const body = {
      contents: [
        { role: 'user', parts: [{ text: prompt }] }
      ],
      systemInstruction: { parts: [{ text: systemInstruction }] },
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4096,
        responseMimeType: response_json_schema ? 'application/json' : 'text/plain',
      }
    };

    if (response_json_schema) {
      body.generationConfig.responseSchema = response_json_schema;
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini API error:', errText);
      return res.status(500).json({ error: 'AI generation failed', details: errText });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return res.status(500).json({ error: 'No response from AI' });
    }

    // Try to parse as JSON if schema was requested
    if (response_json_schema) {
      try {
        const parsed = JSON.parse(text);
        return res.status(200).json(parsed);
      } catch (e) {
        // Try to extract JSON from the response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[0]);
            return res.status(200).json(parsed);
          } catch (e2) {
            return res.status(200).json({ response: text });
          }
        }
        return res.status(200).json({ response: text });
      }
    }

    return res.status(200).json({ response: text });
  } catch (error) {
    console.error('invoke-llm error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}

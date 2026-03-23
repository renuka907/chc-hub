// Vercel Serverless Function — CRUD for reminders (bypasses RLS)
// Requires SUPABASE_SERVICE_ROLE_KEY env var

export default async function handler(req, res) {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
        return res.status(500).json({ error: 'Service role key not configured' });
    }

    const SUPABASE_URL = 'https://xtalelqzucijanmnpkol.supabase.co';
    const headers = {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
    };

    try {
        if (req.method === 'POST') {
            // Create
            const resp = await fetch(`${SUPABASE_URL}/rest/v1/reminders`, {
                method: 'POST',
                headers: { ...headers, 'Prefer': 'return=representation' },
                body: JSON.stringify(req.body),
            });
            const data = await resp.json();
            if (!resp.ok) return res.status(resp.status).json(data);
            return res.status(201).json(data);
        }

        if (req.method === 'PATCH') {
            // Update
            const { id, ...updates } = req.body;
            if (!id) return res.status(400).json({ error: 'id is required' });
            const resp = await fetch(`${SUPABASE_URL}/rest/v1/reminders?id=eq.${id}`, {
                method: 'PATCH',
                headers: { ...headers, 'Prefer': 'return=representation' },
                body: JSON.stringify(updates),
            });
            const data = await resp.json();
            if (!resp.ok) return res.status(resp.status).json(data);
            return res.status(200).json(data);
        }

        if (req.method === 'DELETE') {
            const { id } = req.body;
            if (!id) return res.status(400).json({ error: 'id is required' });
            const resp = await fetch(`${SUPABASE_URL}/rest/v1/reminders?id=eq.${id}`, {
                method: 'DELETE',
                headers,
            });
            if (!resp.ok) {
                const data = await resp.json().catch(() => ({}));
                return res.status(resp.status).json(data);
            }
            return res.status(200).json({ success: true });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

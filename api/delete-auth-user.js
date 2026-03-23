// Vercel Serverless Function — Delete user from Supabase Auth
// Requires SUPABASE_SERVICE_ROLE_KEY env var in Vercel

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
        return res.status(500).json({ error: 'Service role key not configured' });
    }

    const { userId } = req.body;
    if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
    }

    const SUPABASE_URL = 'https://xtalelqzucijanmnpkol.supabase.co';

    try {
        // Delete from auth.users via Admin API
        const authRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
            method: 'DELETE',
            headers: {
                'apikey': serviceRoleKey,
                'Authorization': `Bearer ${serviceRoleKey}`,
            },
        });

        if (!authRes.ok) {
            const err = await authRes.json().catch(() => ({}));
            return res.status(authRes.status).json({ error: err.message || 'Failed to delete auth user' });
        }

        // Also delete from users table
        const dbRes = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${userId}`, {
            method: 'DELETE',
            headers: {
                'apikey': serviceRoleKey,
                'Authorization': `Bearer ${serviceRoleKey}`,
            },
        });

        return res.status(200).json({ success: true });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

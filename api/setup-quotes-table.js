// One-time setup: creates the patient_quotes table
// Call POST /api/setup-quotes-table to run
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) return res.status(500).json({ error: 'No service role key' });

  const supabase = createClient('https://xtalelqzucijanmnpkol.supabase.co', serviceRoleKey);
  
  // Try to create via raw SQL using the pg-meta endpoint
  const sql = `
    CREATE TABLE IF NOT EXISTS patient_quotes (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      share_code text UNIQUE NOT NULL,
      recipient_email text,
      recipient_phone text,
      recipient_name text,
      items jsonb NOT NULL,
      total numeric,
      message text,
      status text DEFAULT 'active',
      expires_at timestamptz DEFAULT (now() + interval '7 days'),
      created_by text,
      created_at timestamptz DEFAULT now(),
      viewed_at timestamptz
    );
    
    -- Allow anon to read (for public quote view)
    ALTER TABLE patient_quotes ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY IF NOT EXISTS "anon_read_patient_quotes" ON patient_quotes
      FOR SELECT TO anon USING (true);
    
    CREATE POLICY IF NOT EXISTS "service_all_patient_quotes" ON patient_quotes
      FOR ALL TO service_role USING (true);
      
    CREATE POLICY IF NOT EXISTS "authenticated_all_patient_quotes" ON patient_quotes
      FOR ALL TO authenticated USING (true);
  `;

  try {
    const resp = await fetch('https://xtalelqzucijanmnpkol.supabase.co/pg/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({ query: sql }),
    });
    const data = await resp.json();
    return res.status(200).json({ ok: true, data });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

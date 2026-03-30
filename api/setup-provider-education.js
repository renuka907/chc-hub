import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  const supabase = createClient(
    'https://xtalelqzucijanmnpkol.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Check if table exists
  const { error } = await supabase.from('provider_education_files').select('id').limit(1);

  if (error && (error.code === 'PGRST205' || error.code === '42P01')) {
    return res.status(200).json({
      message: 'Table does not exist yet. Run this SQL in Supabase Dashboard > SQL Editor:',
      sql: `
-- Create provider education files table
CREATE TABLE IF NOT EXISTS public.provider_education_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'General',
  file_name TEXT NOT NULL,
  original_name TEXT,
  mime_type TEXT,
  file_size BIGINT,
  uploaded_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.provider_education_files ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "provider_ed_select" ON public.provider_education_files FOR SELECT TO authenticated USING (true);
CREATE POLICY "provider_ed_insert" ON public.provider_education_files FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "provider_ed_delete" ON public.provider_education_files FOR DELETE TO authenticated USING (true);

-- Also create a private storage bucket (do this in Dashboard > Storage > New bucket)
-- Bucket name: provider-education
-- Public: OFF
      `.trim(),
    });
  }

  return res.status(200).json({
    message: 'Table already exists!',
    status: 'ready',
  });
}

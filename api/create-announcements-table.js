import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  const supabase = createClient(
    'https://xtalelqzucijanmnpkol.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Create announcements table
  const { error: e1 } = await supabase.rpc('exec_sql', { query: '' }).catch(() => ({}));
  
  // Use raw SQL via supabase-js admin
  const results = [];

  // Try creating via direct insert to test if table exists, if not we need dashboard
  const { error } = await supabase.from('announcements').select('id').limit(1);
  
  if (error && error.code === 'PGRST205') {
    // Table doesn't exist - return SQL for manual creation
    return res.status(200).json({
      message: 'Table does not exist. Run this SQL in Supabase Dashboard > SQL Editor:',
      sql: `
-- Create announcements table
CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  message text NOT NULL,
  priority text DEFAULT 'normal' CHECK (priority IN ('normal', 'important', 'urgent')),
  is_active boolean DEFAULT true,
  created_by text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create announcement_acknowledgments table
CREATE TABLE IF NOT EXISTS public.announcement_acknowledgments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  announcement_id uuid REFERENCES public.announcements(id) ON DELETE CASCADE,
  user_email text NOT NULL,
  user_name text,
  acknowledged_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_acknowledgments ENABLE ROW LEVEL SECURITY;

-- Policies for announcements
CREATE POLICY "Anyone can read active announcements" ON public.announcements FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert announcements" ON public.announcements FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update announcements" ON public.announcements FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete announcements" ON public.announcements FOR DELETE TO authenticated USING (true);

-- Policies for acknowledgments
CREATE POLICY "Anyone can read acknowledgments" ON public.announcement_acknowledgments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can acknowledge" ON public.announcement_acknowledgments FOR INSERT TO authenticated WITH CHECK (true);
`
    });
  }

  return res.status(200).json({ message: 'Table already exists', data: 'ok' });
}

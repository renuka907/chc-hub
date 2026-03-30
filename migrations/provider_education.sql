-- Provider Education Files table
CREATE TABLE IF NOT EXISTS provider_education_files (
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
ALTER TABLE provider_education_files ENABLE ROW LEVEL SECURITY;

-- Policy: authenticated users can read
CREATE POLICY "Authenticated users can view provider education files"
    ON provider_education_files FOR SELECT
    TO authenticated
    USING (true);

-- Policy: authenticated users can insert
CREATE POLICY "Authenticated users can upload provider education files"
    ON provider_education_files FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Policy: authenticated users can delete
CREATE POLICY "Authenticated users can delete provider education files"
    ON provider_education_files FOR DELETE
    TO authenticated
    USING (true);

-- Create storage bucket (run via Supabase Dashboard > Storage if this doesn't work via SQL)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('provider-education', 'provider-education', false)
-- ON CONFLICT (id) DO NOTHING;

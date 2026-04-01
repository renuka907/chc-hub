-- MA Education Files table
CREATE TABLE IF NOT EXISTS ma_education_files (
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
ALTER TABLE ma_education_files ENABLE ROW LEVEL SECURITY;

-- Policy: authenticated users can read
CREATE POLICY "Authenticated users can view MA education files"
    ON ma_education_files FOR SELECT
    TO authenticated
    USING (true);

-- Policy: authenticated users can insert
CREATE POLICY "Authenticated users can upload MA education files"
    ON ma_education_files FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Policy: authenticated users can delete
CREATE POLICY "Authenticated users can delete MA education files"
    ON ma_education_files FOR DELETE
    TO authenticated
    USING (true);

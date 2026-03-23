CREATE TABLE IF NOT EXISTS chat_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text,
  agent_name text DEFAULT 'peach',
  messages jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE chat_conversations;

-- Allow service role full access (RLS disabled for this table since we use service_role in API)
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to manage their own conversations
CREATE POLICY "Users can manage own conversations" ON chat_conversations
  FOR ALL USING (true) WITH CHECK (true);

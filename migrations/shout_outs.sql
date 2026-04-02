-- Shout-Out Board table
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/xtalelqzucijanmnpkol/sql/new

CREATE TABLE IF NOT EXISTS shout_outs (
    id bigint generated always as identity primary key,
    message text not null,
    author text not null default 'Anonymous',
    created_at timestamptz default now()
);

ALTER TABLE shout_outs ENABLE ROW LEVEL SECURITY;

-- Anyone can read shout-outs
CREATE POLICY "anyone_read_shoutouts" ON shout_outs
    FOR SELECT USING (true);

-- Authenticated users can post shout-outs
CREATE POLICY "anyone_insert_shoutouts" ON shout_outs
    FOR INSERT WITH CHECK (true);

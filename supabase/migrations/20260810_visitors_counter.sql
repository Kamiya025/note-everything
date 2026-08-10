-- Migration: Create visitors counter table and increment function
-- Run this in your Supabase SQL Editor

-- Create visitors table (single-row counter)
CREATE TABLE IF NOT EXISTS visitors (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  count BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert the initial row
INSERT INTO visitors (id, count)
VALUES (1, 0)
ON CONFLICT (id) DO NOTHING;

-- Create atomic increment function
CREATE OR REPLACE FUNCTION increment_visitors()
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_count BIGINT;
BEGIN
  UPDATE visitors
  SET count = count + 1, updated_at = now()
  WHERE id = 1
  RETURNING count INTO new_count;

  IF new_count IS NULL THEN
    INSERT INTO visitors (id, count) VALUES (1, 1)
    ON CONFLICT (id) DO UPDATE SET count = visitors.count + 1
    RETURNING count INTO new_count;
  END IF;

  RETURN new_count;
END;
$$;

-- Enable RLS (but allow public read/execute for the counter)
ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read visitors"
  ON visitors FOR SELECT
  TO anon
  USING (true);

-- Note: increment is handled via SECURITY DEFINER function
-- so anon users can call it safely
GRANT EXECUTE ON FUNCTION increment_visitors() TO anon;

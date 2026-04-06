-- Create summaries table for storing generated weekly summaries
CREATE TABLE IF NOT EXISTS summaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date_from DATE NOT NULL,
  date_to DATE NOT NULL,
  shipped JSONB NOT NULL DEFAULT '[]',
  in_progress JSONB NOT NULL DEFAULT '[]',
  key_decisions JSONB NOT NULL DEFAULT '[]',
  repo_name TEXT,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE summaries ENABLE ROW LEVEL SECURITY;

-- Users can only see their own summaries
CREATE POLICY "Users can view own summaries" ON summaries
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own summaries
CREATE POLICY "Users can insert own summaries" ON summaries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own summaries
CREATE POLICY "Users can delete own summaries" ON summaries
  FOR DELETE USING (auth.uid() = user_id);

-- Users can update their own summaries
CREATE POLICY "Users can update own summaries" ON summaries
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Index for fast lookups by user
CREATE INDEX idx_summaries_user_id ON summaries (user_id, generated_at DESC);

-- Stem separations history and credits tracking
-- Run in Supabase SQL Editor or via supabase db push

-- Add credits column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS credits_remaining integer DEFAULT 3;
ALTER TABLE users ADD COLUMN IF NOT EXISTS credits_reset_at timestamptz DEFAULT now();

-- Create stem_separations table for history
CREATE TABLE IF NOT EXISTS stem_separations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  track_id text NOT NULL,
  youtube_url text NOT NULL,
  video_title text,
  video_author text,
  thumbnail_url text,
  processing_time_seconds numeric,
  stem_urls jsonb,
  status text NOT NULL DEFAULT 'processing',
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Create user_credits table for tracking credits per auth user
CREATE TABLE IF NOT EXISTS user_credits (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  credits_remaining integer NOT NULL DEFAULT 3,
  credits_used integer NOT NULL DEFAULT 0,
  tier text NOT NULL DEFAULT 'free',
  last_reset_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_stem_separations_user ON stem_separations (user_id);
CREATE INDEX IF NOT EXISTS idx_stem_separations_created ON stem_separations (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_credits_user ON user_credits (user_id);

-- Row Level Security (RLS)
ALTER TABLE stem_separations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;

-- Users can only see their own separations
CREATE POLICY "Users can view own separations"
  ON stem_separations FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own separations
CREATE POLICY "Users can insert own separations"
  ON stem_separations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own separations (for status updates)
CREATE POLICY "Users can update own separations"
  ON stem_separations FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can only see their own credits
CREATE POLICY "Users can view own credits"
  ON user_credits FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own credits (for decrementing)
CREATE POLICY "Users can update own credits"
  ON user_credits FOR UPDATE
  USING (auth.uid() = user_id);

-- Function to auto-create credits row on first access
CREATE OR REPLACE FUNCTION ensure_user_credits()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_credits (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create credits when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION ensure_user_credits();

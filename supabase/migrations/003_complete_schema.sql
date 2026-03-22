-- ============================================================================
-- ELEVARE SCRIBE - COMPLETE SCHEMA FIX
-- ============================================================================
-- This migration fixes missing tables and adds all required functionality.
-- Run this in Supabase SQL Editor.
-- ============================================================================

-- ============================================================================
-- 1. PROJECTS TABLE (Missing - required for stem separation history)
-- ============================================================================

CREATE TABLE IF NOT EXISTS projects (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  track_id text,
  original_url text NOT NULL,
  song_title text,
  video_author text,
  thumbnail_url text,
  status text NOT NULL DEFAULT 'processing',
  processing_time_seconds numeric,
  stem_vocals_url text,
  stem_drums_url text,
  stem_bass_url text,
  stem_other_url text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- Indexes for projects
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects (user_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects (status);

-- ============================================================================
-- 2. ADD MISSING COLUMNS TO USERS TABLE (credits system)
-- ============================================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS credits_remaining integer DEFAULT 5;
ALTER TABLE users ADD COLUMN IF NOT EXISTS credits_used integer DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS credits_reset_at timestamptz DEFAULT now();
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_user_id uuid;

-- Index for credit queries
CREATE INDEX IF NOT EXISTS idx_users_credits ON users (credits_remaining);
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users (auth_user_id);

-- ============================================================================
-- 3. ROW LEVEL SECURITY (RLS) - CRITICAL FOR SECURITY
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Projects policies: Users can only access their own projects
DROP POLICY IF EXISTS "Users can view own projects" ON projects;
CREATE POLICY "Users can view own projects" ON projects
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own projects" ON projects;
CREATE POLICY "Users can insert own projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own projects" ON projects;
CREATE POLICY "Users can update own projects" ON projects
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own projects" ON projects;
CREATE POLICY "Users can delete own projects" ON projects
  FOR DELETE USING (auth.uid() = user_id);

-- Users policies: Users can only access their own record
DROP POLICY IF EXISTS "Users can view own record" ON users;
CREATE POLICY "Users can view own record" ON users
  FOR SELECT USING (auth.uid()::text = auth_user_id::text OR auth.email() = email);

DROP POLICY IF EXISTS "Users can update own record" ON users;
CREATE POLICY "Users can update own record" ON users
  FOR UPDATE USING (auth.uid()::text = auth_user_id::text OR auth.email() = email);

-- Service role can do anything (for API routes)
DROP POLICY IF EXISTS "Service role full access projects" ON projects;
CREATE POLICY "Service role full access projects" ON projects
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access users" ON users;
CREATE POLICY "Service role full access users" ON users
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- 4. AUTO-CREATE USER RECORD ON FIRST AUTH
-- ============================================================================

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, tier, auth_user_id, credits_remaining, credits_used)
  VALUES (
    NEW.id,
    NEW.email,
    'free',
    NEW.id,
    5,
    0
  )
  ON CONFLICT (email) DO UPDATE SET
    auth_user_id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create user on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 5. UPDATED_AT TRIGGER FOR PROJECTS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 6. SYNC EXISTING AUTH USERS TO USERS TABLE
-- ============================================================================

-- For any existing auth users who don't have a users record yet
INSERT INTO public.users (id, email, tier, auth_user_id, credits_remaining, credits_used)
SELECT
  au.id,
  au.email,
  'free',
  au.id,
  5,
  0
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.users u WHERE u.email = au.email
)
ON CONFLICT (email) DO UPDATE SET
  auth_user_id = EXCLUDED.auth_user_id;

-- ============================================================================
-- VERIFICATION QUERIES (Run these to confirm setup)
-- ============================================================================
--
-- Check tables exist:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
--
-- Check projects columns:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'projects';
--
-- Check users columns:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users';
--
-- Check RLS policies:
-- SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public';
--
-- ============================================================================

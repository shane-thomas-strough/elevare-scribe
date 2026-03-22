-- ============================================================================
-- ELEVARE SCRIBE - COMPLETE DATABASE SCHEMA
-- Based on PRD v2.0 and Web Design Document v2.0
-- ============================================================================
-- This migration creates all tables required for the MVP.
-- Run this in Supabase SQL Editor.
-- ============================================================================

-- ============================================================================
-- 1. ENUM TYPES
-- ============================================================================

-- User subscription tiers
DO $$ BEGIN
  CREATE TYPE user_tier AS ENUM ('free', 'pro', 'founding', 'enterprise');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Project processing status
DO $$ BEGIN
  CREATE TYPE project_status AS ENUM ('pending', 'processing', 'completed', 'failed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Practice progress levels
DO $$ BEGIN
  CREATE TYPE practice_level AS ENUM ('needs_work', 'getting_there', 'performance_ready');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- 2. USERS TABLE - Complete with all PRD requirements
-- ============================================================================

-- Add missing columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS tier user_tier DEFAULT 'free';
ALTER TABLE users ADD COLUMN IF NOT EXISTS credits_remaining integer DEFAULT 3;  -- PRD: 3 free transcriptions/month
ALTER TABLE users ADD COLUMN IF NOT EXISTS credits_used integer DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS credits_reset_at timestamptz DEFAULT now();
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_user_id uuid;

-- Stripe subscription tracking
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status text;  -- active, canceled, past_due
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_period_end timestamptz;

-- Founding Artist tracking (PRD: $149 one-time, limited to 500 spots)
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_founding_artist boolean DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS founding_artist_position integer;  -- 1-500
ALTER TABLE users ADD COLUMN IF NOT EXISTS founding_artist_purchased_at timestamptz;

-- Profile fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio text;

-- Indexes for users
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users (auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users (stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_tier ON users (tier);

-- ============================================================================
-- 3. PROJECTS TABLE - Stem separation history with full metadata
-- ============================================================================

CREATE TABLE IF NOT EXISTS projects (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,

  -- Source information
  track_id text,                    -- External track ID from Suno/Udio
  original_url text NOT NULL,       -- Suno/Udio share URL or upload path
  source_type text DEFAULT 'url',   -- 'url', 'upload'

  -- Song metadata
  song_title text,
  artist_name text,                 -- Original artist/creator
  video_author text,                -- YouTube channel name if applicable
  thumbnail_url text,
  duration_seconds numeric,
  bpm numeric,
  detected_key text,                -- e.g., 'Am', 'G', 'F#m'
  genre text,

  -- Processing status
  status project_status NOT NULL DEFAULT 'pending',
  error_message text,
  processing_time_seconds numeric,

  -- Stem URLs (stored in Cloudflare R2)
  stem_vocals_url text,
  stem_drums_url text,
  stem_bass_url text,
  stem_guitar_url text,             -- Renamed from stem_other for clarity
  stem_other_url text,              -- Synths, pads, etc.

  -- Transcription outputs
  midi_vocals_url text,
  midi_guitar_url text,
  midi_bass_url text,
  musicxml_url text,                -- Full MusicXML notation

  -- Arrangement settings
  transpose_semitones integer DEFAULT 0,
  simplification_level text DEFAULT 'full',  -- 'full', 'simplified', 'beginner'

  -- Ownership/Copyright (PRD Section 4.5)
  isrc_code text,                   -- International Standard Recording Code
  copyright_certificate_url text,   -- PDF certificate
  blockchain_timestamp text,        -- SHA-256 hash on public ledger
  ascap_bmi_registration_id text,

  -- Marketplace status
  is_published boolean DEFAULT false,
  marketplace_price_cents integer,

  -- Timestamps
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Indexes for projects
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects (user_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects (status);
CREATE INDEX IF NOT EXISTS idx_projects_is_published ON projects (is_published) WHERE is_published = true;

-- ============================================================================
-- 4. MARKETPLACE LISTINGS - Sheet music sales (PRD Section 4.8)
-- ============================================================================

CREATE TABLE IF NOT EXISTS marketplace_listings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL,  -- User who owns the project

  -- Listing details
  title text NOT NULL,
  description text,
  preview_audio_url text,           -- 30-second preview
  preview_sheet_url text,           -- First page preview

  -- Pricing (PRD: $1 to $20)
  price_cents integer NOT NULL CHECK (price_cents >= 100 AND price_cents <= 2000),

  -- Categorization
  genre text,
  instrument_tags text[],           -- ['Acoustic Guitar', 'Piano', 'Ukulele']
  difficulty_level text,            -- 'beginner', 'intermediate', 'advanced'

  -- Stats
  view_count integer DEFAULT 0,
  purchase_count integer DEFAULT 0,

  -- Status
  is_active boolean DEFAULT true,
  featured_at timestamptz,

  -- Timestamps
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_marketplace_seller_id ON marketplace_listings (seller_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_genre ON marketplace_listings (genre);
CREATE INDEX IF NOT EXISTS idx_marketplace_is_active ON marketplace_listings (is_active) WHERE is_active = true;

-- ============================================================================
-- 5. PURCHASES - Track sheet music and stem license sales
-- ============================================================================

CREATE TABLE IF NOT EXISTS purchases (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id uuid NOT NULL REFERENCES marketplace_listings(id),
  buyer_id uuid NOT NULL,
  seller_id uuid NOT NULL,

  -- Purchase details
  purchase_type text NOT NULL,      -- 'sheet_music', 'stem_license'
  price_cents integer NOT NULL,
  platform_fee_cents integer NOT NULL,  -- 15% for sheets, 10% for stems
  seller_revenue_cents integer NOT NULL,

  -- Stripe tracking
  stripe_payment_intent_id text,
  stripe_transfer_id text,          -- For Stripe Connect payout

  -- Delivery
  download_url text,
  download_count integer DEFAULT 0,

  -- Timestamps
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_purchases_buyer_id ON purchases (buyer_id);
CREATE INDEX IF NOT EXISTS idx_purchases_seller_id ON purchases (seller_id);
CREATE INDEX IF NOT EXISTS idx_purchases_listing_id ON purchases (listing_id);

-- ============================================================================
-- 6. BAND SYNC SESSIONS - Gig Mode multi-device (PRD Section 4.7.4)
-- ============================================================================

CREATE TABLE IF NOT EXISTS band_sync_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  host_user_id uuid NOT NULL,
  project_id uuid NOT NULL REFERENCES projects(id),

  -- Session settings
  session_code text UNIQUE NOT NULL,  -- Shareable code for joining
  is_active boolean DEFAULT true,

  -- Current state (broadcasted to all devices)
  current_section integer DEFAULT 0,
  current_chord_index integer DEFAULT 0,
  is_playing boolean DEFAULT false,
  playback_position_ms integer DEFAULT 0,

  -- Connected devices count
  connected_devices integer DEFAULT 1,

  -- Timestamps
  created_at timestamptz DEFAULT now() NOT NULL,
  last_activity_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_band_sync_host ON band_sync_sessions (host_user_id);
CREATE INDEX IF NOT EXISTS idx_band_sync_code ON band_sync_sessions (session_code);
CREATE INDEX IF NOT EXISTS idx_band_sync_active ON band_sync_sessions (is_active) WHERE is_active = true;

-- ============================================================================
-- 7. PRACTICE PROGRESS - Track practice per song/section (PRD Section 4.4)
-- ============================================================================

CREATE TABLE IF NOT EXISTS practice_progress (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- Section identification
  section_name text NOT NULL,       -- 'verse_1', 'chorus', 'bridge', etc.
  section_start_beat integer,
  section_end_beat integer,

  -- Progress tracking
  progress_level practice_level DEFAULT 'needs_work',
  practice_count integer DEFAULT 0,
  total_practice_seconds integer DEFAULT 0,
  last_practiced_at timestamptz,

  -- Settings used
  last_tempo_percent integer DEFAULT 100,  -- 40-120%
  last_loop_enabled boolean DEFAULT false,

  -- Timestamps
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now(),

  UNIQUE(user_id, project_id, section_name)
);

CREATE INDEX IF NOT EXISTS idx_practice_user_project ON practice_progress (user_id, project_id);

-- ============================================================================
-- 8. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE band_sync_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_progress ENABLE ROW LEVEL SECURITY;

-- Projects: Users can only access their own projects
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

-- Users: Users can only access their own record
DROP POLICY IF EXISTS "Users can view own record" ON users;
CREATE POLICY "Users can view own record" ON users
  FOR SELECT USING (auth.uid()::text = auth_user_id::text OR auth.email() = email);

DROP POLICY IF EXISTS "Users can update own record" ON users;
CREATE POLICY "Users can update own record" ON users
  FOR UPDATE USING (auth.uid()::text = auth_user_id::text OR auth.email() = email);

-- Marketplace: Anyone can view active listings, sellers can manage their own
DROP POLICY IF EXISTS "Anyone can view active listings" ON marketplace_listings;
CREATE POLICY "Anyone can view active listings" ON marketplace_listings
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Sellers can manage own listings" ON marketplace_listings;
CREATE POLICY "Sellers can manage own listings" ON marketplace_listings
  FOR ALL USING (auth.uid() = seller_id);

-- Purchases: Users can view their own purchases (as buyer or seller)
DROP POLICY IF EXISTS "Users can view own purchases" ON purchases;
CREATE POLICY "Users can view own purchases" ON purchases
  FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Band Sync: Hosts can manage, anyone with the code can read
DROP POLICY IF EXISTS "Hosts can manage sessions" ON band_sync_sessions;
CREATE POLICY "Hosts can manage sessions" ON band_sync_sessions
  FOR ALL USING (auth.uid() = host_user_id);

DROP POLICY IF EXISTS "Anyone can view active sessions" ON band_sync_sessions;
CREATE POLICY "Anyone can view active sessions" ON band_sync_sessions
  FOR SELECT USING (is_active = true);

-- Practice Progress: Users can only access their own
DROP POLICY IF EXISTS "Users can manage own practice" ON practice_progress;
CREATE POLICY "Users can manage own practice" ON practice_progress
  FOR ALL USING (auth.uid() = user_id);

-- Service role can do anything (for API routes)
DROP POLICY IF EXISTS "Service role full access projects" ON projects;
CREATE POLICY "Service role full access projects" ON projects
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access users" ON users;
CREATE POLICY "Service role full access users" ON users
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access marketplace" ON marketplace_listings;
CREATE POLICY "Service role full access marketplace" ON marketplace_listings
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access purchases" ON purchases;
CREATE POLICY "Service role full access purchases" ON purchases
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access band_sync" ON band_sync_sessions;
CREATE POLICY "Service role full access band_sync" ON band_sync_sessions
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access practice" ON practice_progress;
CREATE POLICY "Service role full access practice" ON practice_progress
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- 9. TRIGGERS FOR UPDATED_AT
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

DROP TRIGGER IF EXISTS update_marketplace_updated_at ON marketplace_listings;
CREATE TRIGGER update_marketplace_updated_at
  BEFORE UPDATE ON marketplace_listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_practice_updated_at ON practice_progress;
CREATE TRIGGER update_practice_updated_at
  BEFORE UPDATE ON practice_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 10. AUTO-CREATE USER RECORD ON AUTH SIGNUP
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, tier, auth_user_id, credits_remaining, credits_used)
  VALUES (
    NEW.id,
    NEW.email,
    'free',
    NEW.id,
    3,  -- PRD: 3 free transcriptions per month
    0
  )
  ON CONFLICT (email) DO UPDATE SET
    auth_user_id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 11. SYNC EXISTING AUTH USERS
-- ============================================================================

INSERT INTO public.users (id, email, tier, auth_user_id, credits_remaining, credits_used)
SELECT
  au.id,
  au.email,
  'free',
  au.id,
  3,
  0
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.users u WHERE u.email = au.email
)
ON CONFLICT (email) DO UPDATE SET
  auth_user_id = EXCLUDED.auth_user_id;

-- ============================================================================
-- 12. FOUNDING ARTIST POSITION TRACKING
-- ============================================================================

-- Function to get next founding artist position
CREATE OR REPLACE FUNCTION get_next_founding_position()
RETURNS integer AS $$
DECLARE
  next_pos integer;
BEGIN
  SELECT COALESCE(MAX(founding_artist_position), 0) + 1
  INTO next_pos
  FROM users
  WHERE is_founding_artist = true;

  IF next_pos > 500 THEN
    RAISE EXCEPTION 'Founding Artist spots are sold out (500 limit reached)';
  END IF;

  RETURN next_pos;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 13. MONTHLY CREDITS RESET FUNCTION
-- ============================================================================

-- Call this via a scheduled job (e.g., Supabase cron or external scheduler)
CREATE OR REPLACE FUNCTION reset_monthly_credits()
RETURNS void AS $$
BEGIN
  UPDATE users
  SET
    credits_remaining = CASE
      WHEN tier = 'free' THEN 3
      WHEN tier IN ('pro', 'founding', 'enterprise') THEN 999999  -- Unlimited
      ELSE 3
    END,
    credits_used = 0,
    credits_reset_at = now()
  WHERE credits_reset_at < now() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to confirm setup:
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
-- Check Founding Artist spots remaining:
-- SELECT 500 - COUNT(*) as spots_remaining FROM users WHERE is_founding_artist = true;
--
-- ============================================================================

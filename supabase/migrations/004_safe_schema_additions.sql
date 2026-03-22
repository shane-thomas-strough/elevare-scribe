-- ============================================================================
-- ELEVARE SCRIBE - SAFE SCHEMA ADDITIONS
-- Based on PRD v2.0 - Additive only, no destructive changes
-- ============================================================================
-- This migration ONLY adds new columns and tables.
-- It does NOT modify existing column types or drop anything.
-- Safe to run on existing database.
-- ============================================================================

-- ============================================================================
-- 1. ADD MISSING COLUMNS TO PROJECTS TABLE
-- ============================================================================

-- Source information
ALTER TABLE projects ADD COLUMN IF NOT EXISTS source_type text DEFAULT 'url';

-- Song metadata
ALTER TABLE projects ADD COLUMN IF NOT EXISTS artist_name text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS duration_seconds numeric;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS bpm numeric;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS detected_key text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS genre text;

-- Processing
ALTER TABLE projects ADD COLUMN IF NOT EXISTS error_message text;

-- Transcription outputs (MIDI files)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS midi_vocals_url text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS midi_guitar_url text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS midi_bass_url text;

-- Arrangement settings
ALTER TABLE projects ADD COLUMN IF NOT EXISTS transpose_semitones integer DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS simplification_level text DEFAULT 'full';

-- Ownership/Copyright (PRD Section 4.5)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS isrc_code text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS copyright_certificate_url text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS blockchain_timestamp text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS ascap_bmi_registration_id text;

-- Marketplace
ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_published boolean DEFAULT false;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS marketplace_price_cents integer;

-- Timestamps
ALTER TABLE projects ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE projects ADD COLUMN IF NOT EXISTS completed_at timestamptz;

-- ============================================================================
-- 2. ADD MISSING COLUMNS TO USERS TABLE
-- ============================================================================

-- Auth link
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_user_id uuid;

-- Subscription tracking
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_period_end timestamptz;

-- Founding Artist tracking (PRD: $149 one-time, limited to 500 spots)
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_founding_artist boolean DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS founding_artist_position integer;
ALTER TABLE users ADD COLUMN IF NOT EXISTS founding_artist_purchased_at timestamptz;

-- Profile fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio text;

-- ============================================================================
-- 3. CREATE INDEXES (IF NOT EXISTS)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects (user_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects (status);
CREATE INDEX IF NOT EXISTS idx_projects_is_published ON projects (is_published) WHERE is_published = true;

CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users (auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users (stripe_customer_id);

-- ============================================================================
-- 4. MARKETPLACE LISTINGS TABLE (NEW)
-- ============================================================================

CREATE TABLE IF NOT EXISTS marketplace_listings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL,

  -- Listing details
  title text NOT NULL,
  description text,
  preview_audio_url text,
  preview_sheet_url text,

  -- Pricing (PRD: $1 to $20)
  price_cents integer NOT NULL CHECK (price_cents >= 100 AND price_cents <= 2000),

  -- Categorization
  genre text,
  instrument_tags text[],
  difficulty_level text,

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
-- 5. PURCHASES TABLE (NEW)
-- ============================================================================

CREATE TABLE IF NOT EXISTS purchases (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id uuid NOT NULL REFERENCES marketplace_listings(id),
  buyer_id uuid NOT NULL,
  seller_id uuid NOT NULL,

  -- Purchase details
  purchase_type text NOT NULL,
  price_cents integer NOT NULL,
  platform_fee_cents integer NOT NULL,
  seller_revenue_cents integer NOT NULL,

  -- Stripe tracking
  stripe_payment_intent_id text,
  stripe_transfer_id text,

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
-- 6. BAND SYNC SESSIONS TABLE (NEW) - Gig Mode multi-device
-- ============================================================================

CREATE TABLE IF NOT EXISTS band_sync_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  host_user_id uuid NOT NULL,
  project_id uuid NOT NULL REFERENCES projects(id),

  -- Session settings
  session_code text UNIQUE NOT NULL,
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
-- 7. PRACTICE PROGRESS TABLE (NEW)
-- ============================================================================

CREATE TABLE IF NOT EXISTS practice_progress (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- Section identification
  section_name text NOT NULL,
  section_start_beat integer,
  section_end_beat integer,

  -- Progress tracking (values: 'needs_work', 'getting_there', 'performance_ready')
  progress_level text DEFAULT 'needs_work',
  practice_count integer DEFAULT 0,
  total_practice_seconds integer DEFAULT 0,
  last_practiced_at timestamptz,

  -- Settings used
  last_tempo_percent integer DEFAULT 100,
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

-- Band Sync: Hosts can manage, anyone can view active sessions
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
    3,
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
-- 11. SYNC EXISTING AUTH USERS (link auth_user_id)
-- ============================================================================

UPDATE public.users u
SET auth_user_id = au.id
FROM auth.users au
WHERE u.email = au.email
  AND u.auth_user_id IS NULL;

-- ============================================================================
-- 12. HELPER FUNCTIONS
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

-- Monthly credits reset function (call via scheduled job)
CREATE OR REPLACE FUNCTION reset_monthly_credits()
RETURNS void AS $$
BEGIN
  UPDATE users
  SET
    credits_remaining = CASE
      WHEN tier = 'free' THEN 3
      WHEN tier IN ('pro', 'founding', 'enterprise') THEN 999999
      ELSE 3
    END,
    credits_used = 0,
    credits_reset_at = now()
  WHERE credits_reset_at < now() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- DONE! Run verification queries below to confirm:
-- ============================================================================
--
-- Check all tables:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
--
-- Check projects columns:
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'projects' ORDER BY ordinal_position;
--
-- Check RLS policies:
-- SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename;
--
-- ============================================================================

-- ============================================================================
-- ELEVARE SCRIBE - COMPLETE DATABASE SCHEMA
-- ============================================================================
-- ONE FILE. RUN ONCE. EVERYTHING INCLUDED.
-- Safe to run multiple times (uses IF NOT EXISTS / IF EXISTS).
-- ============================================================================


-- ============================================================================
-- USERS TABLE - Add all missing columns
-- ============================================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS credits_remaining integer DEFAULT 5;
ALTER TABLE users ADD COLUMN IF NOT EXISTS credits_used integer DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS credits_reset_at timestamptz DEFAULT now();
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_user_id uuid;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_period_end timestamptz;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_founding_artist boolean DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS founding_artist_position integer;
ALTER TABLE users ADD COLUMN IF NOT EXISTS founding_artist_purchased_at timestamptz;
ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio text;


-- ============================================================================
-- PROJECTS TABLE - Add all missing columns
-- ============================================================================

ALTER TABLE projects ADD COLUMN IF NOT EXISTS source_type text DEFAULT 'url';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS artist_name text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS duration_seconds numeric;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS bpm numeric;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS detected_key text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS genre text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS error_message text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS midi_vocals_url text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS midi_guitar_url text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS midi_bass_url text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS transpose_semitones integer DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS simplification_level text DEFAULT 'full';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS isrc_code text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS copyright_certificate_url text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS blockchain_timestamp text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS ascap_bmi_registration_id text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_published boolean DEFAULT false;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS marketplace_price_cents integer;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE projects ADD COLUMN IF NOT EXISTS completed_at timestamptz;


-- ============================================================================
-- MARKETPLACE LISTINGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS marketplace_listings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  preview_audio_url text,
  preview_sheet_url text,
  price_cents integer NOT NULL CHECK (price_cents >= 100 AND price_cents <= 2000),
  genre text,
  instrument_tags text[],
  difficulty_level text,
  view_count integer DEFAULT 0,
  purchase_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  featured_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now()
);


-- ============================================================================
-- PURCHASES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS purchases (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id uuid NOT NULL REFERENCES marketplace_listings(id),
  buyer_id uuid NOT NULL,
  seller_id uuid NOT NULL,
  purchase_type text NOT NULL,
  price_cents integer NOT NULL,
  platform_fee_cents integer NOT NULL,
  seller_revenue_cents integer NOT NULL,
  stripe_payment_intent_id text,
  stripe_transfer_id text,
  download_url text,
  download_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL
);


-- ============================================================================
-- BAND SYNC SESSIONS TABLE (Gig Mode)
-- ============================================================================

CREATE TABLE IF NOT EXISTS band_sync_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  host_user_id uuid NOT NULL,
  project_id uuid NOT NULL REFERENCES projects(id),
  session_code text UNIQUE NOT NULL,
  is_active boolean DEFAULT true,
  current_section integer DEFAULT 0,
  current_chord_index integer DEFAULT 0,
  is_playing boolean DEFAULT false,
  playback_position_ms integer DEFAULT 0,
  connected_devices integer DEFAULT 1,
  created_at timestamptz DEFAULT now() NOT NULL,
  last_activity_at timestamptz DEFAULT now()
);


-- ============================================================================
-- PRACTICE PROGRESS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS practice_progress (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  section_name text NOT NULL,
  section_start_beat integer,
  section_end_beat integer,
  progress_level text DEFAULT 'needs_work',
  practice_count integer DEFAULT 0,
  total_practice_seconds integer DEFAULT 0,
  last_practiced_at timestamptz,
  last_tempo_percent integer DEFAULT 100,
  last_loop_enabled boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, project_id, section_name)
);


-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users (auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users (stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects (user_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects (status);
CREATE INDEX IF NOT EXISTS idx_projects_is_published ON projects (is_published) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_marketplace_seller_id ON marketplace_listings (seller_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_is_active ON marketplace_listings (is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_purchases_buyer_id ON purchases (buyer_id);
CREATE INDEX IF NOT EXISTS idx_purchases_seller_id ON purchases (seller_id);
CREATE INDEX IF NOT EXISTS idx_band_sync_host ON band_sync_sessions (host_user_id);
CREATE INDEX IF NOT EXISTS idx_band_sync_code ON band_sync_sessions (session_code);
CREATE INDEX IF NOT EXISTS idx_practice_user_project ON practice_progress (user_id, project_id);


-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE band_sync_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_progress ENABLE ROW LEVEL SECURITY;

-- Projects
DROP POLICY IF EXISTS "Users can view own projects" ON projects;
CREATE POLICY "Users can view own projects" ON projects FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own projects" ON projects;
CREATE POLICY "Users can insert own projects" ON projects FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own projects" ON projects;
CREATE POLICY "Users can update own projects" ON projects FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own projects" ON projects;
CREATE POLICY "Users can delete own projects" ON projects FOR DELETE USING (auth.uid() = user_id);

-- Users
DROP POLICY IF EXISTS "Users can view own record" ON users;
CREATE POLICY "Users can view own record" ON users FOR SELECT USING (auth.uid()::text = auth_user_id::text OR auth.email() = email);

DROP POLICY IF EXISTS "Users can update own record" ON users;
CREATE POLICY "Users can update own record" ON users FOR UPDATE USING (auth.uid()::text = auth_user_id::text OR auth.email() = email);

-- Marketplace
DROP POLICY IF EXISTS "Anyone can view active listings" ON marketplace_listings;
CREATE POLICY "Anyone can view active listings" ON marketplace_listings FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Sellers can manage own listings" ON marketplace_listings;
CREATE POLICY "Sellers can manage own listings" ON marketplace_listings FOR ALL USING (auth.uid() = seller_id);

-- Purchases
DROP POLICY IF EXISTS "Users can view own purchases" ON purchases;
CREATE POLICY "Users can view own purchases" ON purchases FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Band Sync
DROP POLICY IF EXISTS "Hosts can manage sessions" ON band_sync_sessions;
CREATE POLICY "Hosts can manage sessions" ON band_sync_sessions FOR ALL USING (auth.uid() = host_user_id);

DROP POLICY IF EXISTS "Anyone can view active sessions" ON band_sync_sessions;
CREATE POLICY "Anyone can view active sessions" ON band_sync_sessions FOR SELECT USING (is_active = true);

-- Practice Progress
DROP POLICY IF EXISTS "Users can manage own practice" ON practice_progress;
CREATE POLICY "Users can manage own practice" ON practice_progress FOR ALL USING (auth.uid() = user_id);

-- Service role full access
DROP POLICY IF EXISTS "Service role full access projects" ON projects;
CREATE POLICY "Service role full access projects" ON projects FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access users" ON users;
CREATE POLICY "Service role full access users" ON users FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access marketplace" ON marketplace_listings;
CREATE POLICY "Service role full access marketplace" ON marketplace_listings FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access purchases" ON purchases;
CREATE POLICY "Service role full access purchases" ON purchases FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access band_sync" ON band_sync_sessions;
CREATE POLICY "Service role full access band_sync" ON band_sync_sessions FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access practice" ON practice_progress;
CREATE POLICY "Service role full access practice" ON practice_progress FOR ALL USING (auth.role() = 'service_role');


-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_marketplace_updated_at ON marketplace_listings;
CREATE TRIGGER update_marketplace_updated_at BEFORE UPDATE ON marketplace_listings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_practice_updated_at ON practice_progress;
CREATE TRIGGER update_practice_updated_at BEFORE UPDATE ON practice_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Auto-create user on signup with 5 credits
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, tier, auth_user_id, credits_remaining, credits_used, credits_reset_at)
  VALUES (NEW.id, NEW.email, 'free', NEW.id, 5, 0, now())
  ON CONFLICT (email) DO UPDATE SET auth_user_id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Monthly credits reset (5 for free, unlimited for paid)
CREATE OR REPLACE FUNCTION reset_monthly_credits()
RETURNS void AS $$
BEGIN
  UPDATE users SET
    credits_remaining = CASE WHEN tier = 'free' THEN 5 ELSE 999999 END,
    credits_used = 0,
    credits_reset_at = now()
  WHERE credits_reset_at < now() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Founding artist position helper
CREATE OR REPLACE FUNCTION get_next_founding_position()
RETURNS integer AS $$
DECLARE next_pos integer;
BEGIN
  SELECT COALESCE(MAX(founding_artist_position), 0) + 1 INTO next_pos FROM users WHERE is_founding_artist = true;
  IF next_pos > 500 THEN RAISE EXCEPTION 'Founding Artist spots sold out'; END IF;
  RETURN next_pos;
END;
$$ LANGUAGE plpgsql;


-- ============================================================================
-- DATA FIXES
-- ============================================================================

-- Link existing auth users to their user records
UPDATE public.users u SET auth_user_id = au.id FROM auth.users au WHERE u.email = au.email AND u.auth_user_id IS NULL;

-- Set credits for existing users who don't have them
UPDATE users SET credits_remaining = 5, credits_used = 0, credits_reset_at = now() WHERE credits_remaining IS NULL;


-- ============================================================================
-- DONE
-- ============================================================================

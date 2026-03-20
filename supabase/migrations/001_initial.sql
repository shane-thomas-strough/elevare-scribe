-- Elevare Scribe initial schema
-- Run in Supabase SQL Editor or via supabase db push

CREATE TABLE IF NOT EXISTS waitlist (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text UNIQUE NOT NULL,
  tools text,
  instrument text,
  referral_code text,
  position integer,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text UNIQUE NOT NULL,
  tier text NOT NULL,
  stripe_session_id text,
  stripe_customer_id text,
  stripe_subscription_id text,
  subscription_status text,
  activated_at timestamptz DEFAULT now()
);

-- Index for waitlist lookups by email
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist (email);

-- Index for users lookups by email
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

-- Index for webhook lookups by Stripe customer ID
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer ON users (stripe_customer_id);

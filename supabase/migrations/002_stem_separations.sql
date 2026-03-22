-- Safe migration: Only adds new columns, never drops or modifies existing data
-- All operations use IF NOT EXISTS / ADD COLUMN IF NOT EXISTS patterns
-- Uses existing `users` and `projects` tables

-- 1. Add credits columns to users table (if missing)
ALTER TABLE users ADD COLUMN IF NOT EXISTS credits_remaining integer DEFAULT 3;
ALTER TABLE users ADD COLUMN IF NOT EXISTS credits_used integer DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS credits_reset_at timestamptz DEFAULT now();

-- 2. Add missing columns to projects table for better history display
ALTER TABLE projects ADD COLUMN IF NOT EXISTS video_author text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS thumbnail_url text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS processing_time_seconds numeric;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS stem_other_url text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS track_id text;

-- 3. Create indexes for faster lookups (if not exists)
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects (user_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_credits ON users (credits_remaining);

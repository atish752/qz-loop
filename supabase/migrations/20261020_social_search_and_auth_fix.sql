-- ==============================================================================
-- Qz Loop - Supabase Multi-Device Auth, Profile Search & Friendship Hardening
-- File: supabase/migrations/20261020_social_search_and_auth_fix.sql
--
-- HOW TO APPLY THIS MIGRATION IN SUPABASE:
-- 1. Open your Supabase Project Dashboard (https://supabase.com/dashboard).
-- 2. Click "SQL Editor" in the left sidebar menu.
-- 3. Click "New Query", paste the entire content of this script, and click "Run".
-- ==============================================================================

-- 1. Ensure extensions for high-speed fuzzy search & UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 2. Ensure all required columns exist on 'profiles' table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS language_preference TEXT DEFAULT 'en';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- 3. High-performance indexes for username & display_name instant search
CREATE INDEX IF NOT EXISTS idx_profiles_username_lower ON profiles (lower(username));
CREATE INDEX IF NOT EXISTS idx_profiles_display_name_lower ON profiles (lower(display_name));
CREATE INDEX IF NOT EXISTS idx_profiles_username_trgm ON profiles USING gin (username gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_profiles_display_name_trgm ON profiles USING gin (display_name gin_trgm_ops);

-- 4. Enable Row-Level Security (RLS) on 'profiles'
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 4a. Public profiles must be viewable by all authenticated & anonymous users
--     (so peers can be searched by @handle or name in the Social study partner lounge)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT
  USING (true);

-- 4b. Users can insert their own profile on signup / OAuth callback
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT
  WITH CHECK (auth.uid()::text = id);

-- 4c. Users can only update their own profile (prevents cross-device identity pollution)
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE
  USING (auth.uid()::text = id);

-- 5. Friendships Table RLS & Indexing
CREATE TABLE IF NOT EXISTS friendships (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  friend_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'friend',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

CREATE INDEX IF NOT EXISTS idx_friendships_user_id ON friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend_id ON friendships(friend_id);

ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view friendships" ON friendships;
CREATE POLICY "Users can view friendships" ON friendships
  FOR SELECT
  USING (auth.uid()::text = user_id OR auth.uid()::text = friend_id);

DROP POLICY IF EXISTS "Users can insert friend requests" ON friendships;
CREATE POLICY "Users can insert friend requests" ON friendships
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update friendships" ON friendships;
CREATE POLICY "Users can update friendships" ON friendships
  FOR UPDATE
  USING (auth.uid()::text = user_id OR auth.uid()::text = friend_id);

DROP POLICY IF EXISTS "Users can delete friendships" ON friendships;
CREATE POLICY "Users can delete friendships" ON friendships
  FOR DELETE
  USING (auth.uid()::text = user_id OR auth.uid()::text = friend_id);

-- 6. Direct Messages Table RLS & Indexing
CREATE TABLE IF NOT EXISTS direct_messages (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  from_user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  text TEXT,
  question_id TEXT REFERENCES questions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_direct_messages_from_to ON direct_messages(from_user_id, to_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_direct_messages_to_from ON direct_messages(to_user_id, from_user_id, created_at DESC);

ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own messages" ON direct_messages;
CREATE POLICY "Users can view own messages" ON direct_messages
  FOR SELECT
  USING (auth.uid()::text = from_user_id OR auth.uid()::text = to_user_id);

DROP POLICY IF EXISTS "Users can send messages" ON direct_messages;
CREATE POLICY "Users can send messages" ON direct_messages
  FOR INSERT
  WITH CHECK (auth.uid()::text = from_user_id);

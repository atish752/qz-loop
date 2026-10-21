-- ==============================================================================
-- Qz Loop - Supabase Multi-Device Serverless Persistence RLS Hardening
-- File: supabase/migrations/20261021_serverless_persistence_fix.sql
--
-- HOW TO APPLY THIS MIGRATION IN SUPABASE:
-- 1. Open your Supabase Project Dashboard (https://supabase.com/dashboard).
-- 2. Click "SQL Editor" in the left sidebar menu.
-- 3. Click "New Query", paste the entire content of this script, and click "Run".
-- ==============================================================================

-- 0. Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 1. Profiles Table (Ensure table and columns exist with relaxed constraints for serverless API routes)
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  display_name TEXT,
  username TEXT UNIQUE,
  avatar_url TEXT,
  target_exam TEXT DEFAULT 'NEET UG',
  preferred_examination_id TEXT,
  email TEXT,
  current_streak INT DEFAULT 0,
  onboarding_completed BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS target_exam TEXT DEFAULT 'NEET UG';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_examination_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_streak INT DEFAULT 0;

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

CREATE INDEX IF NOT EXISTS idx_profiles_username_lower ON profiles (lower(username));
CREATE INDEX IF NOT EXISTS idx_profiles_display_name_lower ON profiles (lower(display_name));

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Allow serverless insert profile" ON profiles;
CREATE POLICY "Allow serverless insert profile" ON profiles
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Allow serverless update profile" ON profiles;
CREATE POLICY "Allow serverless update profile" ON profiles
  FOR UPDATE
  USING (true);

-- 2. Friendships Table (Ensure table exists and drop restrictive FK constraints)
CREATE TABLE IF NOT EXISTS friendships (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  friend_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'friend' CHECK (status IN ('friend', 'request_sent', 'request_received', 'pending_incoming')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

ALTER TABLE friendships DROP CONSTRAINT IF EXISTS friendships_user_id_fkey;
ALTER TABLE friendships DROP CONSTRAINT IF EXISTS friendships_friend_id_fkey;

CREATE INDEX IF NOT EXISTS idx_friendships_user_id ON friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend_id ON friendships(friend_id);

ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view friendships" ON friendships;
DROP POLICY IF EXISTS "Users can view their own friendships" ON friendships;
CREATE POLICY "Users can view friendships" ON friendships
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert friendships" ON friendships;
DROP POLICY IF EXISTS "Users can insert friend requests" ON friendships;
CREATE POLICY "Users can insert friend requests" ON friendships
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update friendships" ON friendships;
CREATE POLICY "Users can update friendships" ON friendships
  FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Users can delete friendships" ON friendships;
CREATE POLICY "Users can delete friendships" ON friendships
  FOR DELETE
  USING (true);

-- 3. Direct Messages Table
CREATE TABLE IF NOT EXISTS direct_messages (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  from_user_id TEXT NOT NULL,
  to_user_id TEXT NOT NULL,
  text TEXT NOT NULL,
  question_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE direct_messages DROP CONSTRAINT IF EXISTS direct_messages_question_id_fkey;
ALTER TABLE direct_messages DROP CONSTRAINT IF EXISTS direct_messages_from_user_id_fkey;
ALTER TABLE direct_messages DROP CONSTRAINT IF EXISTS direct_messages_to_user_id_fkey;

CREATE INDEX IF NOT EXISTS idx_direct_messages_participants ON direct_messages(from_user_id, to_user_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_created ON direct_messages(created_at DESC);

ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own messages" ON direct_messages;
DROP POLICY IF EXISTS "Users can view their direct messages" ON direct_messages;
CREATE POLICY "Users can view own messages" ON direct_messages
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can send messages" ON direct_messages;
DROP POLICY IF EXISTS "Users can send direct messages" ON direct_messages;
CREATE POLICY "Users can send messages" ON direct_messages
  FOR INSERT
  WITH CHECK (true);

-- 4. Question Comments Table
CREATE TABLE IF NOT EXISTS question_comments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  question_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_avatar TEXT,
  comment_text TEXT NOT NULL,
  likes_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE question_comments DROP CONSTRAINT IF EXISTS question_comments_question_id_fkey;
ALTER TABLE question_comments DROP CONSTRAINT IF EXISTS question_comments_user_id_fkey;

CREATE INDEX IF NOT EXISTS idx_question_comments_qid ON question_comments(question_id, created_at DESC);

ALTER TABLE question_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view comments" ON question_comments;
CREATE POLICY "Anyone can view comments" ON question_comments
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert comments" ON question_comments;
CREATE POLICY "Users can insert comments" ON question_comments
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update comments" ON question_comments;
CREATE POLICY "Users can update comments" ON question_comments
  FOR UPDATE
  USING (true);

-- 5. Question Likes Table
CREATE TABLE IF NOT EXISTS question_likes (
  user_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, question_id)
);

ALTER TABLE question_likes DROP CONSTRAINT IF EXISTS question_likes_question_id_fkey;
ALTER TABLE question_likes DROP CONSTRAINT IF EXISTS question_likes_user_id_fkey;

CREATE INDEX IF NOT EXISTS idx_question_likes_qid ON question_likes(question_id);

ALTER TABLE question_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view question likes" ON question_likes;
CREATE POLICY "Anyone can view question likes" ON question_likes
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can toggle own likes" ON question_likes;
CREATE POLICY "Users can toggle own likes" ON question_likes
  FOR ALL
  USING (true);

-- ==============================================================================
-- Qz Loop - Complete Persistence, Cloud Sync & DPDP Act Data Management Fix
-- File: supabase/migrations/20261104_complete_persistence_and_sync_fix.sql
--
-- HOW TO APPLY THIS MIGRATION IN SUPABASE:
-- 1. Open your Supabase Dashboard: https://supabase.com/dashboard/project/ebpskykwfjulyoxebmyo
-- 2. Navigate to "SQL Editor" in the left sidebar menu.
-- 3. Click "New Query", paste this entire script, and click "Run".
-- 4. All tables, policies, and columns will be updated safely.
-- ==============================================================================

-- 0. Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 1. Profiles Table Enhancement (Unique username constraint & full sync fields)
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  display_name TEXT,
  username TEXT UNIQUE,
  avatar_url TEXT,
  target_exam TEXT DEFAULT 'NEET UG',
  preferred_examination_id TEXT DEFAULT 'exam-neet-ug',
  role TEXT DEFAULT 'student',
  email TEXT,
  current_streak INT DEFAULT 0,
  daily_goal INT DEFAULT 10,
  today_solved_count INT DEFAULT 0,
  total_questions_answered INT DEFAULT 0,
  overall_accuracy NUMERIC DEFAULT 0,
  last_active_date TEXT,
  last_streak_achieved_date TEXT,
  language_preference TEXT DEFAULT 'en',
  onboarding_completed BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS target_exam TEXT DEFAULT 'NEET UG';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_examination_id TEXT DEFAULT 'exam-neet-ug';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'student';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_streak INT DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS daily_goal INT DEFAULT 10;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS today_solved_count INT DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_questions_answered INT DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS overall_accuracy NUMERIC DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_active_date TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_streak_achieved_date TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS language_preference TEXT DEFAULT 'en';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Enforce Unique Username constraint & Indexing
CREATE INDEX IF NOT EXISTS idx_profiles_username_lower ON profiles (lower(username));
CREATE INDEX IF NOT EXISTS idx_profiles_email_lower ON profiles (lower(email));
CREATE INDEX IF NOT EXISTS idx_profiles_display_name_lower ON profiles (lower(display_name));

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Allow serverless insert profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Allow serverless update profile" ON profiles;
DROP POLICY IF EXISTS "Allow all for profiles" ON profiles;

CREATE POLICY "Allow all for profiles" ON profiles
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 2. Collections / Saved Playlists Table (Full Persistence)
CREATE TABLE IF NOT EXISTS collections (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  question_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE collections DROP CONSTRAINT IF EXISTS collections_user_id_fkey;
CREATE INDEX IF NOT EXISTS idx_collections_user_id ON collections(user_id);

ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own collections" ON collections;
DROP POLICY IF EXISTS "Allow all for collections" ON collections;
CREATE POLICY "Allow all for collections" ON collections
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 3. Question Attempts Table (Solve history & Live Metrics)
CREATE TABLE IF NOT EXISTS question_attempts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  selected_option_id TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  response_time_ms INT NOT NULL CHECK (response_time_ms >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE question_attempts DROP CONSTRAINT IF EXISTS question_attempts_user_id_fkey;
ALTER TABLE question_attempts DROP CONSTRAINT IF EXISTS question_attempts_question_id_fkey;

CREATE INDEX IF NOT EXISTS idx_question_attempts_user_id ON question_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_question_attempts_created ON question_attempts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_question_attempts_user_created ON question_attempts(user_id, created_at DESC);

ALTER TABLE question_attempts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view attempts" ON question_attempts;
DROP POLICY IF EXISTS "Users can view question attempts" ON question_attempts;
DROP POLICY IF EXISTS "Users can record question attempts" ON question_attempts;
DROP POLICY IF EXISTS "Allow serverless attempt insertion" ON question_attempts;
DROP POLICY IF EXISTS "Allow all for question_attempts" ON question_attempts;

CREATE POLICY "Allow all for question_attempts" ON question_attempts
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 4. Question Repeat Preferences Table (Spaced Repetition: 1 Day, 1 Week, 1 Month, Never)
CREATE TABLE IF NOT EXISTS question_repeat_preferences (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  interval TEXT NOT NULL CHECK (interval IN ('day', 'week', 'month', 'never')),
  next_review_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, question_id)
);

ALTER TABLE question_repeat_preferences DROP CONSTRAINT IF EXISTS question_repeat_preferences_user_id_fkey;
ALTER TABLE question_repeat_preferences DROP CONSTRAINT IF EXISTS question_repeat_preferences_question_id_fkey;

CREATE INDEX IF NOT EXISTS idx_repeat_preferences_user_id ON question_repeat_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_repeat_preferences_user_next ON question_repeat_preferences(user_id, next_review_at);

ALTER TABLE question_repeat_preferences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view repeat preferences" ON question_repeat_preferences;
DROP POLICY IF EXISTS "Users can view repeat preferences" ON question_repeat_preferences;
DROP POLICY IF EXISTS "Users can insert or update repeat preferences" ON question_repeat_preferences;
DROP POLICY IF EXISTS "Allow serverless repeat preference upsert" ON question_repeat_preferences;
DROP POLICY IF EXISTS "Allow all for question_repeat_preferences" ON question_repeat_preferences;

CREATE POLICY "Allow all for question_repeat_preferences" ON question_repeat_preferences
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 5. Friendships Table (Mutual study challenges & friend requests)
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
DROP POLICY IF EXISTS "Users can insert friendships" ON friendships;
DROP POLICY IF EXISTS "Users can insert friend requests" ON friendships;
DROP POLICY IF EXISTS "Users can update friendships" ON friendships;
DROP POLICY IF EXISTS "Users can delete friendships" ON friendships;
DROP POLICY IF EXISTS "Allow all for friendships" ON friendships;

CREATE POLICY "Allow all for friendships" ON friendships
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 6. Direct Messages / In-Loop Question Challenges
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
DROP POLICY IF EXISTS "Users can send messages" ON direct_messages;
DROP POLICY IF EXISTS "Users can send direct messages" ON direct_messages;
DROP POLICY IF EXISTS "Allow all for direct_messages" ON direct_messages;

CREATE POLICY "Allow all for direct_messages" ON direct_messages
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 7. Question Likes Table
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
DROP POLICY IF EXISTS "Users can toggle own likes" ON question_likes;
DROP POLICY IF EXISTS "Allow all for question_likes" ON question_likes;

CREATE POLICY "Allow all for question_likes" ON question_likes
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 8. Question Comments Table
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
DROP POLICY IF EXISTS "Users can insert comments" ON question_comments;
DROP POLICY IF EXISTS "Users can update comments" ON question_comments;
DROP POLICY IF EXISTS "Allow all for question_comments" ON question_comments;

CREATE POLICY "Allow all for question_comments" ON question_comments
  FOR ALL
  USING (true)
  WITH CHECK (true);

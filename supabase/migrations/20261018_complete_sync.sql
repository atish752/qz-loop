-- ==============================================================================
-- Qz Loop - Complete Cloud Synchronization & Persistence Migration
-- File: supabase/migrations/20261018_complete_sync.sql
-- 
-- HOW TO APPLY THIS MIGRATION IN SUPABASE:
-- 1. Open your Supabase Project Dashboard (https://supabase.com/dashboard).
-- 2. Click "SQL Editor" in the left sidebar menu.
-- 3. Click "New Query", paste the entire content of this script, and click "Run".
-- 4. All tables, missing columns, and Row-Level Security (RLS) policies will be
--    created safely with IF NOT EXISTS guards.
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Upgrade 'profiles' Table Schema
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS language_preference TEXT DEFAULT 'en';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT true;

-- Ensure profiles insert RLS policy exists so authenticated users and OAuth triggers can save
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can insert own profile'
  ) THEN
    CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid()::text = id);
  END IF;
END $$;

-- 3. Friendships Table (Mutual friend requests & in-loop study network)
CREATE TABLE IF NOT EXISTS friendships (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  friend_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'friend' CHECK (status IN ('friend', 'request_sent', 'request_received', 'pending_incoming')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

CREATE INDEX IF NOT EXISTS idx_friendships_user_id ON friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend_id ON friendships(friend_id);

ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'friendships' AND policyname = 'Users can view their own friendships') THEN
    CREATE POLICY "Users can view their own friendships" ON friendships FOR SELECT USING (auth.uid()::text = user_id OR auth.uid()::text = friend_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'friendships' AND policyname = 'Users can insert friendships') THEN
    CREATE POLICY "Users can insert friendships" ON friendships FOR INSERT WITH CHECK (auth.uid()::text = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'friendships' AND policyname = 'Users can update friendships') THEN
    CREATE POLICY "Users can update friendships" ON friendships FOR UPDATE USING (auth.uid()::text = user_id OR auth.uid()::text = friend_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'friendships' AND policyname = 'Users can delete friendships') THEN
    CREATE POLICY "Users can delete friendships" ON friendships FOR DELETE USING (auth.uid()::text = user_id OR auth.uid()::text = friend_id);
  END IF;
END $$;

-- 4. Direct Messages / In-Loop Question Sharing Table
CREATE TABLE IF NOT EXISTS direct_messages (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  from_user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  question_id TEXT REFERENCES questions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_direct_messages_participants ON direct_messages(from_user_id, to_user_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_created ON direct_messages(created_at DESC);

ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'direct_messages' AND policyname = 'Users can view their direct messages') THEN
    CREATE POLICY "Users can view their direct messages" ON direct_messages FOR SELECT USING (auth.uid()::text = from_user_id OR auth.uid()::text = to_user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'direct_messages' AND policyname = 'Users can send direct messages') THEN
    CREATE POLICY "Users can send direct messages" ON direct_messages FOR INSERT WITH CHECK (auth.uid()::text = from_user_id);
  END IF;
END $$;

-- 5. Collections / Playlists Table (Instagram-style custom folders & saved bookmarks)
CREATE TABLE IF NOT EXISTS collections (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  question_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_collections_user_id ON collections(user_id);

ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'collections' AND policyname = 'Users can manage their own collections') THEN
    CREATE POLICY "Users can manage their own collections" ON collections FOR ALL USING (auth.uid()::text = user_id);
  END IF;
END $$;

-- 6. Question Likes Table (Social engagement fire/likes count)
CREATE TABLE IF NOT EXISTS question_likes (
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_question_likes_qid ON question_likes(question_id);

ALTER TABLE question_likes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'question_likes' AND policyname = 'Anyone can view question likes') THEN
    CREATE POLICY "Anyone can view question likes" ON question_likes FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'question_likes' AND policyname = 'Users can toggle own likes') THEN
    CREATE POLICY "Users can toggle own likes" ON question_likes FOR ALL USING (auth.uid()::text = user_id);
  END IF;
END $$;

-- 7. Question Comments Table (Community discussion thread)
CREATE TABLE IF NOT EXISTS question_comments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_avatar TEXT,
  comment_text TEXT NOT NULL,
  likes_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_question_comments_qid ON question_comments(question_id, created_at DESC);

ALTER TABLE question_comments ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'question_comments' AND policyname = 'Anyone can view comments') THEN
    CREATE POLICY "Anyone can view comments" ON question_comments FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'question_comments' AND policyname = 'Users can insert comments') THEN
    CREATE POLICY "Users can insert comments" ON question_comments FOR INSERT WITH CHECK (auth.uid()::text = user_id);
  END IF;
END $$;

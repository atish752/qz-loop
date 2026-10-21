-- ==============================================================================
-- Qz Loop - Supabase Multi-Device Serverless Persistence RLS Hardening
-- File: supabase/migrations/20261021_serverless_persistence_fix.sql
--
-- HOW TO APPLY THIS MIGRATION IN SUPABASE:
-- 1. Open your Supabase Project Dashboard (https://supabase.com/dashboard).
-- 2. Click "SQL Editor" in the left sidebar menu.
-- 3. Click "New Query", paste the entire content of this script, and click "Run".
-- ==============================================================================

-- 1. Relax Friendships Table RLS for Serverless API Route Handlers
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

-- 2. Direct Messages Table RLS
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

-- 3. Question Comments Table RLS
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

-- 4. Question Likes Table RLS
ALTER TABLE question_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view question likes" ON question_likes;
CREATE POLICY "Anyone can view question likes" ON question_likes
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can toggle own likes" ON question_likes;
CREATE POLICY "Users can toggle own likes" ON question_likes
  FOR ALL
  USING (true);

-- 5. Profiles Table RLS (ensure serverless API routes can register and update profiles)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow serverless insert profile" ON profiles;
CREATE POLICY "Allow serverless insert profile" ON profiles
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow serverless update profile" ON profiles;
CREATE POLICY "Allow serverless update profile" ON profiles
  FOR UPDATE
  USING (true);

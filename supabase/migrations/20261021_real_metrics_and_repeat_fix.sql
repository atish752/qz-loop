-- ==============================================================================
-- Qz Loop - Real Metrics, Spaced Repetition & Leaderboard Hardening
-- File: supabase/migrations/20261021_real_metrics_and_repeat_fix.sql
--
-- HOW TO APPLY THIS MIGRATION IN SUPABASE:
-- 1. Open your Supabase Project Dashboard (https://supabase.com/dashboard).
-- 2. Click "SQL Editor" in the left sidebar menu.
-- 3. Click "New Query", paste the entire content of this script, and click "Run".
-- ==============================================================================

-- 0. Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 1. Question Repeat Preferences Table (Spaced Repetition: day, week, month, never)
CREATE TABLE IF NOT EXISTS question_repeat_preferences (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  interval TEXT NOT NULL CHECK (interval IN ('day', 'week', 'month', 'never')),
  next_review_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, question_id)
);

-- Drop restrictive foreign keys for serverless compatibility
ALTER TABLE question_repeat_preferences DROP CONSTRAINT IF EXISTS question_repeat_preferences_user_id_fkey;
ALTER TABLE question_repeat_preferences DROP CONSTRAINT IF EXISTS question_repeat_preferences_question_id_fkey;

CREATE INDEX IF NOT EXISTS idx_repeat_preferences_user_id ON question_repeat_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_repeat_preferences_user_next ON question_repeat_preferences(user_id, next_review_at);
CREATE INDEX IF NOT EXISTS idx_repeat_preferences_user_interval ON question_repeat_preferences(user_id, interval);

ALTER TABLE question_repeat_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view repeat preferences" ON question_repeat_preferences;
DROP POLICY IF EXISTS "Users can view repeat preferences" ON question_repeat_preferences;
CREATE POLICY "Users can view repeat preferences" ON question_repeat_preferences
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert or update repeat preferences" ON question_repeat_preferences;
DROP POLICY IF EXISTS "Allow serverless repeat preference upsert" ON question_repeat_preferences;
CREATE POLICY "Allow serverless repeat preference upsert" ON question_repeat_preferences
  FOR ALL
  USING (true);

-- 2. Question Attempts Table Hardening (for live AIR Leaderboard and Home Matrix)
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
CREATE POLICY "Users can view question attempts" ON question_attempts
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can record question attempts" ON question_attempts;
DROP POLICY IF EXISTS "Allow serverless attempt insertion" ON question_attempts;
CREATE POLICY "Allow serverless attempt insertion" ON question_attempts
  FOR INSERT
  WITH CHECK (true);

-- 3. Profiles live stats sync
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_questions_answered INT DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS overall_accuracy INT DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS today_solved_count INT DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS language_preference TEXT DEFAULT 'en';
UPDATE profiles SET onboarding_completed = true WHERE onboarding_completed IS NULL;

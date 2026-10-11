-- Qz Loop - Complete Database Schema & Migrations
-- Designed for PostgreSQL 15+ on Supabase

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 2. Clean teardown if needed (for fresh setup)
-- DROP TABLE IF EXISTS question_reports CASCADE;
-- DROP TABLE IF EXISTS hidden_questions CASCADE;
-- DROP TABLE IF EXISTS question_attempts CASCADE;
-- DROP TABLE IF EXISTS questions CASCADE;
-- DROP TABLE IF EXISTS subjects CASCADE;
-- DROP TABLE IF EXISTS examinations CASCADE;
-- DROP TABLE IF EXISTS profiles CASCADE;

-- 3. Examinations table
CREATE TABLE IF NOT EXISTS examinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Subjects table
CREATE TABLE IF NOT EXISTS subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  examination_id UUID NOT NULL REFERENCES examinations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  icon TEXT DEFAULT 'menu_book',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(examination_id, slug)
);

-- 5. Profiles table (linked to auth.users in Supabase)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  preferred_examination_id UUID REFERENCES examinations(id) ON DELETE SET NULL,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin', 'moderator')),
  current_streak INT NOT NULL DEFAULT 0,
  last_active_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Questions table
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  examination_id UUID NOT NULL REFERENCES examinations(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'hi')),
  options JSONB NOT NULL, -- Array of { id: string, text: string }
  correct_option_id TEXT NOT NULL, -- 'A', 'B', 'C', 'D'
  explanation TEXT,
  difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  normalized_fingerprint TEXT NOT NULL, -- Lowercase, punctuation & whitespace stripped
  publication_status TEXT NOT NULL DEFAULT 'published' CHECK (publication_status IN ('draft', 'published', 'archived')),
  moderation_status TEXT NOT NULL DEFAULT 'active' CHECK (moderation_status IN ('active', 'flagged', 'hidden')),
  
  -- Cached Community Metrics (updated via trigger/API)
  total_attempts INT NOT NULL DEFAULT 0,
  correct_attempts INT NOT NULL DEFAULT 0,
  total_time_ms BIGINT NOT NULL DEFAULT 0,
  fastest_correct_ms INT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Question Attempts table
CREATE TABLE IF NOT EXISTS question_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  selected_option_id TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  response_time_ms INT NOT NULL CHECK (response_time_ms >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Hidden Questions table
CREATE TABLE IF NOT EXISTS hidden_questions (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  hidden_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, question_id)
);

-- 9. Question Reports table
CREATE TABLE IF NOT EXISTS question_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN ('incorrect_answer', 'duplicate', 'misleading', 'offensive', 'other')),
  details TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed', 'resolved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_questions_exam_subject ON questions(examination_id, subject_id, publication_status, moderation_status);
CREATE INDEX IF NOT EXISTS idx_questions_fingerprint ON questions(normalized_fingerprint);
CREATE INDEX IF NOT EXISTS idx_questions_trgm ON questions USING gin (question_text gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_attempts_user_created ON question_attempts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_attempts_question ON question_attempts(question_id);
CREATE INDEX IF NOT EXISTS idx_hidden_user ON hidden_questions(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_question ON question_reports(question_id);

-- 11. Helper Function: Duplicate Similarity Search
CREATE OR REPLACE FUNCTION check_question_similarity(
  p_text TEXT,
  p_threshold FLOAT DEFAULT 0.4
)
RETURNS TABLE (
  id UUID,
  question_text TEXT,
  author_id UUID,
  similarity_score FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    q.id,
    q.question_text,
    q.author_id,
    similarity(q.question_text, p_text)::FLOAT AS similarity_score
  FROM questions q
  WHERE 
    q.publication_status = 'published'
    AND q.moderation_status = 'active'
    AND similarity(q.question_text, p_text) >= p_threshold
  ORDER BY similarity_score DESC
  LIMIT 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Helper Trigger: Update Question Metrics upon new attempt
CREATE OR REPLACE FUNCTION update_question_community_metrics()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE questions
  SET
    total_attempts = total_attempts + 1,
    correct_attempts = correct_attempts + (CASE WHEN NEW.is_correct THEN 1 ELSE 0 END),
    total_time_ms = total_time_ms + NEW.response_time_ms,
    fastest_correct_ms = CASE 
      WHEN NEW.is_correct AND (fastest_correct_ms IS NULL OR NEW.response_time_ms < fastest_correct_ms)
      THEN NEW.response_time_ms
      ELSE fastest_correct_ms
    END,
    updated_at = NOW()
  WHERE id = NEW.question_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_question_metrics ON question_attempts;
CREATE TRIGGER trg_update_question_metrics
AFTER INSERT ON question_attempts
FOR EACH ROW
EXECUTE FUNCTION update_question_community_metrics();

-- 13. Row Level Security (RLS) Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE examinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE hidden_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_reports ENABLE ROW LEVEL SECURITY;

-- Profiles: Anyone can view public profile details, users can only update their own
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Examinations and Subjects: viewable by all
CREATE POLICY "Examinations viewable by all" ON examinations FOR SELECT USING (true);
CREATE POLICY "Subjects viewable by all" ON subjects FOR SELECT USING (true);

-- Questions: Viewable by all when published and active.
-- Important: API endpoint masks correct_option_id for feed queries!
CREATE POLICY "Published questions viewable by all" ON questions FOR SELECT USING (
  publication_status = 'published' AND moderation_status = 'active'
);
CREATE POLICY "Authors can insert questions" ON questions FOR INSERT WITH CHECK (
  auth.uid() = author_id
);
CREATE POLICY "Authors can update own questions" ON questions FOR UPDATE USING (
  auth.uid() = author_id
);

-- Question Attempts: Users can view own attempts and insert own attempts
CREATE POLICY "Users can view own attempts" ON question_attempts FOR SELECT USING (
  auth.uid() = user_id
);
CREATE POLICY "Users can insert own attempts" ON question_attempts FOR INSERT WITH CHECK (
  auth.uid() = user_id
);

-- Hidden Questions: Users can only see and manage their own hidden entries
CREATE POLICY "Users can manage own hidden questions" ON hidden_questions FOR ALL USING (
  auth.uid() = user_id
);

-- Question Reports: Users can insert reports
CREATE POLICY "Users can insert reports" ON question_reports FOR INSERT WITH CHECK (
  auth.uid() = reporter_id
);

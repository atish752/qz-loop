-- Qz Loop - Complete Database Schema & Migrations
-- Designed for PostgreSQL 15+ on Supabase
-- Launch Edition: Top 10 Indian Competitive Examinations Ordered by Candidate Registration Volume
-- Includes 100% Zero-Scratch User Initialization & 10 Default Baseline GK Questions

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 2. Fresh launch reset (Uncomment if full schema reset is desired)
-- DROP TABLE IF EXISTS question_reports CASCADE;
-- DROP TABLE IF EXISTS hidden_questions CASCADE;
-- DROP TABLE IF EXISTS question_attempts CASCADE;
-- DROP TABLE IF EXISTS questions CASCADE;
-- DROP TABLE IF EXISTS subjects CASCADE;
-- DROP TABLE IF EXISTS examinations CASCADE;
-- DROP TABLE IF EXISTS profiles CASCADE;

-- 3. Examinations table
CREATE TABLE IF NOT EXISTS examinations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  category TEXT,
  display_order INT NOT NULL DEFAULT 0,
  marks_per_question NUMERIC(4,2) DEFAULT 2.0,
  negative_marks NUMERIC(4,2) DEFAULT 0.5,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Subjects table
CREATE TABLE IF NOT EXISTS subjects (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  examination_id TEXT NOT NULL REFERENCES examinations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  icon TEXT DEFAULT 'menu_book',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(examination_id, slug)
);

-- 5. Profiles table (linked to auth.users in Supabase)
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  display_name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  target_exam TEXT,
  avatar_url TEXT,
  preferred_examination_id TEXT REFERENCES examinations(id) ON DELETE SET NULL,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin', 'moderator')),
  current_streak INT NOT NULL DEFAULT 0,
  last_active_date DATE,
  daily_goal INT NOT NULL DEFAULT 10,
  today_solved_count INT NOT NULL DEFAULT 0,
  total_questions_answered INT NOT NULL DEFAULT 0,
  overall_accuracy NUMERIC(5,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Questions table
CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  author_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  examination_id TEXT NOT NULL REFERENCES examinations(id) ON DELETE CASCADE,
  subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  hindi_question_text TEXT,
  language TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'hi')),
  options JSONB NOT NULL,
  correct_option_id TEXT NOT NULL,
  explanation TEXT,
  hindi_explanation TEXT,
  difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  syllabus_tag TEXT,
  pyq_info TEXT,
  quality_upvotes INT NOT NULL DEFAULT 0,
  quality_downvotes INT NOT NULL DEFAULT 0,
  normalized_fingerprint TEXT NOT NULL,
  publication_status TEXT NOT NULL DEFAULT 'published' CHECK (publication_status IN ('draft', 'published', 'archived')),
  moderation_status TEXT NOT NULL DEFAULT 'active' CHECK (moderation_status IN ('active', 'flagged', 'hidden')),
  
  -- Cached Community Metrics
  total_attempts INT NOT NULL DEFAULT 0,
  correct_attempts INT NOT NULL DEFAULT 0,
  total_time_ms BIGINT NOT NULL DEFAULT 0,
  fastest_correct_ms INT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Question Attempts table
CREATE TABLE IF NOT EXISTS question_attempts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  selected_option_id TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  response_time_ms INT NOT NULL CHECK (response_time_ms >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Hidden Questions table
CREATE TABLE IF NOT EXISTS hidden_questions (
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  hidden_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, question_id)
);

-- 9. Question Reports table
CREATE TABLE IF NOT EXISTS question_reports (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  reporter_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
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
  id TEXT,
  question_text TEXT,
  author_id TEXT,
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

CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid()::text = id);

CREATE POLICY "Examinations viewable by all" ON examinations FOR SELECT USING (true);
CREATE POLICY "Subjects viewable by all" ON subjects FOR SELECT USING (true);

CREATE POLICY "Published questions viewable by all" ON questions FOR SELECT USING (
  publication_status = 'published' AND moderation_status = 'active'
);
CREATE POLICY "Authors can insert questions" ON questions FOR INSERT WITH CHECK (
  auth.uid()::text = author_id
);
CREATE POLICY "Authors can update own questions" ON questions FOR UPDATE USING (
  auth.uid()::text = author_id
);

CREATE POLICY "Users can view own attempts" ON question_attempts FOR SELECT USING (
  auth.uid()::text = user_id
);
CREATE POLICY "Users can insert own attempts" ON question_attempts FOR INSERT WITH CHECK (
  auth.uid()::text = user_id
);

CREATE POLICY "Users can manage own hidden questions" ON hidden_questions FOR ALL USING (
  auth.uid()::text = user_id
);

CREATE POLICY "Users can insert reports" ON question_reports FOR INSERT WITH CHECK (
  auth.uid()::text = reporter_id
);

-- 14. Fresh Launch Rollout Seed Data & Reset Commands
-- (Top 10 Indian Competitive Examinations, Authentic Subjects & 10 Clean GK Questions)

-- A. Top 10 Indian Examinations (Ordered by Candidate Registration Volume)
INSERT INTO examinations (id, name, slug, description, category, display_order, marks_per_question, negative_marks, is_active)
VALUES ('exam-railway-ntpc', 'Railways (RRB NTPC & Group D)', 'rrb-ntpc', 'Railway Recruitment Board Non-Technical Popular Categories & Group D (~1.5+ Crore candidates)', 'Railways', 1, 1, 0.33, true)
ON CONFLICT (slug) DO UPDATE SET
  id = EXCLUDED.id,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  display_order = EXCLUDED.display_order,
  marks_per_question = EXCLUDED.marks_per_question,
  negative_marks = EXCLUDED.negative_marks;
INSERT INTO examinations (id, name, slug, description, category, display_order, marks_per_question, negative_marks, is_active)
VALUES ('exam-ssc-cgl', 'SSC CGL / CHSL / MTS', 'ssc-cgl', 'Staff Selection Commission Combined Graduate Level, CHSL & MTS (~40-50 Lakh candidates)', 'Staff Selection Commission', 2, 2, 0.5, true)
ON CONFLICT (slug) DO UPDATE SET
  id = EXCLUDED.id,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  display_order = EXCLUDED.display_order,
  marks_per_question = EXCLUDED.marks_per_question,
  negative_marks = EXCLUDED.negative_marks;
INSERT INTO examinations (id, name, slug, description, category, display_order, marks_per_question, negative_marks, is_active)
VALUES ('exam-neet-ug', 'NEET UG (Medical Entrance)', 'neet-ug', 'National Eligibility cum Entrance Test for Undergraduate Medical Programs (~24 Lakh candidates)', 'Medical Entrance', 3, 4, 1, true)
ON CONFLICT (slug) DO UPDATE SET
  id = EXCLUDED.id,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  display_order = EXCLUDED.display_order,
  marks_per_question = EXCLUDED.marks_per_question,
  negative_marks = EXCLUDED.negative_marks;
INSERT INTO examinations (id, name, slug, description, category, display_order, marks_per_question, negative_marks, is_active)
VALUES ('exam-cuet-ug', 'CUET UG (Central Universities)', 'cuet-ug', 'Common University Entrance Test for Central & Participating Universities (~14 Lakh candidates)', 'University Entrance', 4, 5, 1, true)
ON CONFLICT (slug) DO UPDATE SET
  id = EXCLUDED.id,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  display_order = EXCLUDED.display_order,
  marks_per_question = EXCLUDED.marks_per_question,
  negative_marks = EXCLUDED.negative_marks;
INSERT INTO examinations (id, name, slug, description, category, display_order, marks_per_question, negative_marks, is_active)
VALUES ('exam-jee-main', 'JEE Main (Engineering Entrance)', 'jee-main', 'Joint Entrance Examination Main for NITs, IIITs and Top Engineering Colleges (~12 Lakh candidates)', 'Engineering Entrance', 5, 4, 1, true)
ON CONFLICT (slug) DO UPDATE SET
  id = EXCLUDED.id,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  display_order = EXCLUDED.display_order,
  marks_per_question = EXCLUDED.marks_per_question,
  negative_marks = EXCLUDED.negative_marks;
INSERT INTO examinations (id, name, slug, description, category, display_order, marks_per_question, negative_marks, is_active)
VALUES ('exam-banking-ibps', 'Banking (IBPS / SBI PO & Clerk)', 'ibps-banking', 'Institute of Banking Personnel Selection & State Bank of India Prelims & Mains (~12 Lakh candidates)', 'Banking & Insurance', 6, 1, 0.25, true)
ON CONFLICT (slug) DO UPDATE SET
  id = EXCLUDED.id,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  display_order = EXCLUDED.display_order,
  marks_per_question = EXCLUDED.marks_per_question,
  negative_marks = EXCLUDED.negative_marks;
INSERT INTO examinations (id, name, slug, description, category, display_order, marks_per_question, negative_marks, is_active)
VALUES ('exam-state-police', 'State Police / Constable & SI (UP/Bihar/MP)', 'state-police', 'State Police Constable and Sub-Inspector Recruitment Exams (~15-20 Lakh candidates)', 'Police & Security Services', 7, 2, 0.5, true)
ON CONFLICT (slug) DO UPDATE SET
  id = EXCLUDED.id,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  display_order = EXCLUDED.display_order,
  marks_per_question = EXCLUDED.marks_per_question,
  negative_marks = EXCLUDED.negative_marks;
INSERT INTO examinations (id, name, slug, description, category, display_order, marks_per_question, negative_marks, is_active)
VALUES ('exam-state-pcs', 'State PCS (BPSC, UPPSC, MPPSC)', 'state-pcs', 'State Public Service Commission Combined Civil Services Prelims (~6-8 Lakh candidates)', 'State Civil Services', 8, 2, 0.66, true)
ON CONFLICT (slug) DO UPDATE SET
  id = EXCLUDED.id,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  display_order = EXCLUDED.display_order,
  marks_per_question = EXCLUDED.marks_per_question,
  negative_marks = EXCLUDED.negative_marks;
INSERT INTO examinations (id, name, slug, description, category, display_order, marks_per_question, negative_marks, is_active)
VALUES ('exam-defence-cds', 'Defence (NDA / CDS / AFCAT)', 'defence-cds', 'Combined Defence Services & National Defence Academy Officer Selection (~6-8 Lakh candidates)', 'Defence Services', 9, 1, 0.33, true)
ON CONFLICT (slug) DO UPDATE SET
  id = EXCLUDED.id,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  display_order = EXCLUDED.display_order,
  marks_per_question = EXCLUDED.marks_per_question,
  negative_marks = EXCLUDED.negative_marks;
INSERT INTO examinations (id, name, slug, description, category, display_order, marks_per_question, negative_marks, is_active)
VALUES ('exam-upsc-csat', 'UPSC Civil Services (IAS / IPS Prelims)', 'upsc-csat', 'Civil Services Preliminary Examination (Paper-I GS & Paper-II CSAT) (~10-12 Lakh candidates)', 'Civil Services', 10, 2.5, 0.83, true)
ON CONFLICT (slug) DO UPDATE SET
  id = EXCLUDED.id,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  display_order = EXCLUDED.display_order,
  marks_per_question = EXCLUDED.marks_per_question,
  negative_marks = EXCLUDED.negative_marks;

-- B. Authentic Mapped Subjects (All 36 Subjects Across Top 10 Exams)
INSERT INTO subjects (id, examination_id, name, slug, display_order, icon)
VALUES ('subj-rrb-maths', 'exam-railway-ntpc', 'General Mathematics', 'maths', 1, 'calculate')
ON CONFLICT (examination_id, slug) DO UPDATE SET
  id = EXCLUDED.id,
  name = EXCLUDED.name,
  display_order = EXCLUDED.display_order,
  icon = EXCLUDED.icon;
INSERT INTO subjects (id, examination_id, name, slug, display_order, icon)
VALUES ('subj-rrb-reasoning', 'exam-railway-ntpc', 'General Intelligence & Reasoning', 'reasoning', 2, 'psychology')
ON CONFLICT (examination_id, slug) DO UPDATE SET
  id = EXCLUDED.id,
  name = EXCLUDED.name,
  display_order = EXCLUDED.display_order,
  icon = EXCLUDED.icon;
INSERT INTO subjects (id, examination_id, name, slug, display_order, icon)
VALUES ('subj-rrb-science', 'exam-railway-ntpc', 'General Science', 'science', 3, 'science')
ON CONFLICT (examination_id, slug) DO UPDATE SET
  id = EXCLUDED.id,
  name = EXCLUDED.name,
  display_order = EXCLUDED.display_order,
  icon = EXCLUDED.icon;
INSERT INTO subjects (id, examination_id, name, slug, display_order, icon)
VALUES ('subj-rrb-gk', 'exam-railway-ntpc', 'General Awareness & Current Affairs', 'gk', 4, 'public')
ON CONFLICT (examination_id, slug) DO UPDATE SET
  id = EXCLUDED.id,
  name = EXCLUDED.name,
  display_order = EXCLUDED.display_order,
  icon = EXCLUDED.icon;
INSERT INTO subjects (id, examination_id, name, slug, display_order, icon)
VALUES ('subj-maths', 'exam-ssc-cgl', 'Maths (Quantitative Aptitude)', 'maths', 1, 'calculate')
ON CONFLICT (examination_id, slug) DO UPDATE SET
  id = EXCLUDED.id,
  name = EXCLUDED.name,
  display_order = EXCLUDED.display_order,
  icon = EXCLUDED.icon;
INSERT INTO subjects (id, examination_id, name, slug, display_order, icon)
VALUES ('subj-reasoning', 'exam-ssc-cgl', 'Reasoning (Logic & Intelligence)', 'reasoning', 2, 'psychology')
ON CONFLICT (examination_id, slug) DO UPDATE SET
  id = EXCLUDED.id,
  name = EXCLUDED.name,
  display_order = EXCLUDED.display_order,
  icon = EXCLUDED.icon;
INSERT INTO subjects (id, examination_id, name, slug, display_order, icon)
VALUES ('subj-english', 'exam-ssc-cgl', 'English Comprehension', 'english', 3, 'spellcheck')
ON CONFLICT (examination_id, slug) DO UPDATE SET
  id = EXCLUDED.id,
  name = EXCLUDED.name,
  display_order = EXCLUDED.display_order,
  icon = EXCLUDED.icon;
INSERT INTO subjects (id, examination_id, name, slug, display_order, icon)
VALUES ('subj-gk', 'exam-ssc-cgl', 'General Knowledge (GK & GA)', 'gk', 4, 'public')
ON CONFLICT (examination_id, slug) DO UPDATE SET
  id = EXCLUDED.id,
  name = EXCLUDED.name,
  display_order = EXCLUDED.display_order,
  icon = EXCLUDED.icon;
INSERT INTO subjects (id, examination_id, name, slug, display_order, icon)
VALUES ('subj-neet-bio', 'exam-neet-ug', 'Biology (Botany & Zoology)', 'biology', 1, 'eco')
ON CONFLICT (examination_id, slug) DO UPDATE SET
  id = EXCLUDED.id,
  name = EXCLUDED.name,
  display_order = EXCLUDED.display_order,
  icon = EXCLUDED.icon;
INSERT INTO subjects (id, examination_id, name, slug, display_order, icon)
VALUES ('subj-neet-chem', 'exam-neet-ug', 'Chemistry', 'chemistry', 2, 'biotech')
ON CONFLICT (examination_id, slug) DO UPDATE SET
  id = EXCLUDED.id,
  name = EXCLUDED.name,
  display_order = EXCLUDED.display_order,
  icon = EXCLUDED.icon;
INSERT INTO subjects (id, examination_id, name, slug, display_order, icon)
VALUES ('subj-neet-phy', 'exam-neet-ug', 'Physics', 'physics', 3, 'bolt')
ON CONFLICT (examination_id, slug) DO UPDATE SET
  id = EXCLUDED.id,
  name = EXCLUDED.name,
  display_order = EXCLUDED.display_order,
  icon = EXCLUDED.icon;
INSERT INTO subjects (id, examination_id, name, slug, display_order, icon)
VALUES ('subj-cuet-gt', 'exam-cuet-ug', 'General Test (Quant, Logic & GK)', 'gk', 1, 'auto_awesome')
ON CONFLICT (examination_id, slug) DO UPDATE SET
  id = EXCLUDED.id,
  name = EXCLUDED.name,
  display_order = EXCLUDED.display_order,
  icon = EXCLUDED.icon;
INSERT INTO subjects (id, examination_id, name, slug, display_order, icon)
VALUES ('subj-cuet-eng', 'exam-cuet-ug', 'English Language & Verbal Ability', 'english', 2, 'spellcheck')
ON CONFLICT (examination_id, slug) DO UPDATE SET
  id = EXCLUDED.id,
  name = EXCLUDED.name,
  display_order = EXCLUDED.display_order,
  icon = EXCLUDED.icon;
INSERT INTO subjects (id, examination_id, name, slug, display_order, icon)
VALUES ('subj-cuet-domain', 'exam-cuet-ug', 'Domain Specific Knowledge', 'domain', 3, 'menu_book')
ON CONFLICT (examination_id, slug) DO UPDATE SET
  id = EXCLUDED.id,
  name = EXCLUDED.name,
  display_order = EXCLUDED.display_order,
  icon = EXCLUDED.icon;
INSERT INTO subjects (id, examination_id, name, slug, display_order, icon)
VALUES ('subj-jee-maths', 'exam-jee-main', 'Mathematics', 'maths', 1, 'calculate')
ON CONFLICT (examination_id, slug) DO UPDATE SET
  id = EXCLUDED.id,
  name = EXCLUDED.name,
  display_order = EXCLUDED.display_order,
  icon = EXCLUDED.icon;
INSERT INTO subjects (id, examination_id, name, slug, display_order, icon)
VALUES ('subj-jee-physics', 'exam-jee-main', 'Physics', 'physics', 2, 'bolt')
ON CONFLICT (examination_id, slug) DO UPDATE SET
  id = EXCLUDED.id,
  name = EXCLUDED.name,
  display_order = EXCLUDED.display_order,
  icon = EXCLUDED.icon;
INSERT INTO subjects (id, examination_id, name, slug, display_order, icon)
VALUES ('subj-jee-chemistry', 'exam-jee-main', 'Chemistry', 'chemistry', 3, 'science')
ON CONFLICT (examination_id, slug) DO UPDATE SET
  id = EXCLUDED.id,
  name = EXCLUDED.name,
  display_order = EXCLUDED.display_order,
  icon = EXCLUDED.icon;
INSERT INTO subjects (id, examination_id, name, slug, display_order, icon)
VALUES ('subj-bank-quant', 'exam-banking-ibps', 'Quantitative Aptitude & DI', 'maths', 1, 'calculate')
ON CONFLICT (examination_id, slug) DO UPDATE SET
  id = EXCLUDED.id,
  name = EXCLUDED.name,
  display_order = EXCLUDED.display_order,
  icon = EXCLUDED.icon;
INSERT INTO subjects (id, examination_id, name, slug, display_order, icon)
VALUES ('subj-bank-reasoning', 'exam-banking-ibps', 'Reasoning Ability & Puzzles', 'reasoning', 2, 'psychology')
ON CONFLICT (examination_id, slug) DO UPDATE SET
  id = EXCLUDED.id,
  name = EXCLUDED.name,
  display_order = EXCLUDED.display_order,
  icon = EXCLUDED.icon;
INSERT INTO subjects (id, examination_id, name, slug, display_order, icon)
VALUES ('subj-bank-english', 'exam-banking-ibps', 'English Language', 'english', 3, 'spellcheck')
ON CONFLICT (examination_id, slug) DO UPDATE SET
  id = EXCLUDED.id,
  name = EXCLUDED.name,
  display_order = EXCLUDED.display_order,
  icon = EXCLUDED.icon;
INSERT INTO subjects (id, examination_id, name, slug, display_order, icon)
VALUES ('subj-bank-ga', 'exam-banking-ibps', 'Banking Awareness & Economy', 'gk', 4, 'account_balance')
ON CONFLICT (examination_id, slug) DO UPDATE SET
  id = EXCLUDED.id,
  name = EXCLUDED.name,
  display_order = EXCLUDED.display_order,
  icon = EXCLUDED.icon;
INSERT INTO subjects (id, examination_id, name, slug, display_order, icon)
VALUES ('subj-pol-gk', 'exam-state-police', 'General Knowledge & Constitution', 'gk', 1, 'shield')
ON CONFLICT (examination_id, slug) DO UPDATE SET
  id = EXCLUDED.id,
  name = EXCLUDED.name,
  display_order = EXCLUDED.display_order,
  icon = EXCLUDED.icon;
INSERT INTO subjects (id, examination_id, name, slug, display_order, icon)
VALUES ('subj-pol-num', 'exam-state-police', 'Numerical & Mental Ability', 'maths', 2, 'calculate')
ON CONFLICT (examination_id, slug) DO UPDATE SET
  id = EXCLUDED.id,
  name = EXCLUDED.name,
  display_order = EXCLUDED.display_order,
  icon = EXCLUDED.icon;
INSERT INTO subjects (id, examination_id, name, slug, display_order, icon)
VALUES ('subj-pol-reas', 'exam-state-police', 'Mental Aptitude & Reasoning', 'reasoning', 3, 'psychology')
ON CONFLICT (examination_id, slug) DO UPDATE SET
  id = EXCLUDED.id,
  name = EXCLUDED.name,
  display_order = EXCLUDED.display_order,
  icon = EXCLUDED.icon;
INSERT INTO subjects (id, examination_id, name, slug, display_order, icon)
VALUES ('subj-pol-hindi', 'exam-state-police', 'General Hindi (सामान्य हिन्दी)', 'hindi', 4, 'translate')
ON CONFLICT (examination_id, slug) DO UPDATE SET
  id = EXCLUDED.id,
  name = EXCLUDED.name,
  display_order = EXCLUDED.display_order,
  icon = EXCLUDED.icon;
INSERT INTO subjects (id, examination_id, name, slug, display_order, icon)
VALUES ('subj-pcs-gs', 'exam-state-pcs', 'General Studies Paper-I', 'gk', 1, 'public')
ON CONFLICT (examination_id, slug) DO UPDATE SET
  id = EXCLUDED.id,
  name = EXCLUDED.name,
  display_order = EXCLUDED.display_order,
  icon = EXCLUDED.icon;
INSERT INTO subjects (id, examination_id, name, slug, display_order, icon)
VALUES ('subj-pcs-csat', 'exam-state-pcs', 'General Aptitude & CSAT', 'reasoning', 2, 'psychology')
ON CONFLICT (examination_id, slug) DO UPDATE SET
  id = EXCLUDED.id,
  name = EXCLUDED.name,
  display_order = EXCLUDED.display_order,
  icon = EXCLUDED.icon;
INSERT INTO subjects (id, examination_id, name, slug, display_order, icon)
VALUES ('subj-pcs-state', 'exam-state-pcs', 'State Special GK & History', 'state-gk', 3, 'map')
ON CONFLICT (examination_id, slug) DO UPDATE SET
  id = EXCLUDED.id,
  name = EXCLUDED.name,
  display_order = EXCLUDED.display_order,
  icon = EXCLUDED.icon;
INSERT INTO subjects (id, examination_id, name, slug, display_order, icon)
VALUES ('subj-pcs-hindi', 'exam-state-pcs', 'General Hindi & Essay', 'hindi', 4, 'translate')
ON CONFLICT (examination_id, slug) DO UPDATE SET
  id = EXCLUDED.id,
  name = EXCLUDED.name,
  display_order = EXCLUDED.display_order,
  icon = EXCLUDED.icon;
INSERT INTO subjects (id, examination_id, name, slug, display_order, icon)
VALUES ('subj-def-maths', 'exam-defence-cds', 'Elementary Mathematics', 'maths', 1, 'calculate')
ON CONFLICT (examination_id, slug) DO UPDATE SET
  id = EXCLUDED.id,
  name = EXCLUDED.name,
  display_order = EXCLUDED.display_order,
  icon = EXCLUDED.icon;
INSERT INTO subjects (id, examination_id, name, slug, display_order, icon)
VALUES ('subj-def-english', 'exam-defence-cds', 'English Language', 'english', 2, 'spellcheck')
ON CONFLICT (examination_id, slug) DO UPDATE SET
  id = EXCLUDED.id,
  name = EXCLUDED.name,
  display_order = EXCLUDED.display_order,
  icon = EXCLUDED.icon;
INSERT INTO subjects (id, examination_id, name, slug, display_order, icon)
VALUES ('subj-def-gk', 'exam-defence-cds', 'General Knowledge & Defence', 'gk', 3, 'military_tech')
ON CONFLICT (examination_id, slug) DO UPDATE SET
  id = EXCLUDED.id,
  name = EXCLUDED.name,
  display_order = EXCLUDED.display_order,
  icon = EXCLUDED.icon;
INSERT INTO subjects (id, examination_id, name, slug, display_order, icon)
VALUES ('subj-def-science', 'exam-defence-cds', 'General Science', 'science', 4, 'science')
ON CONFLICT (examination_id, slug) DO UPDATE SET
  id = EXCLUDED.id,
  name = EXCLUDED.name,
  display_order = EXCLUDED.display_order,
  icon = EXCLUDED.icon;
INSERT INTO subjects (id, examination_id, name, slug, display_order, icon)
VALUES ('subj-upsc-gs', 'exam-upsc-csat', 'General Studies Paper-I (GS)', 'gk', 1, 'account_balance')
ON CONFLICT (examination_id, slug) DO UPDATE SET
  id = EXCLUDED.id,
  name = EXCLUDED.name,
  display_order = EXCLUDED.display_order,
  icon = EXCLUDED.icon;
INSERT INTO subjects (id, examination_id, name, slug, display_order, icon)
VALUES ('subj-upsc-csat', 'exam-upsc-csat', 'CSAT Paper-II (Reasoning & Comprehension)', 'reasoning', 2, 'psychology')
ON CONFLICT (examination_id, slug) DO UPDATE SET
  id = EXCLUDED.id,
  name = EXCLUDED.name,
  display_order = EXCLUDED.display_order,
  icon = EXCLUDED.icon;
INSERT INTO subjects (id, examination_id, name, slug, display_order, icon)
VALUES ('subj-upsc-ca', 'exam-upsc-csat', 'Current Affairs & Environment', 'current-affairs', 3, 'eco')
ON CONFLICT (examination_id, slug) DO UPDATE SET
  id = EXCLUDED.id,
  name = EXCLUDED.name,
  display_order = EXCLUDED.display_order,
  icon = EXCLUDED.icon;

-- C. Baseline 10 Clean Default GK Questions for Immediate Browsing
INSERT INTO questions (
  id, examination_id, subject_id, question_text, hindi_question_text, language,
  options, correct_option_id, explanation, hindi_explanation, difficulty,
  syllabus_tag, pyq_info, quality_upvotes, quality_downvotes, normalized_fingerprint,
  publication_status, moderation_status, total_attempts, correct_attempts, total_time_ms, fastest_correct_ms
) VALUES (
  'q-gk-1', 'exam-ssc-cgl', 'subj-gk',
  'Which Article of the Constitution of India guarantees Equality before Law and Equal Protection of the Laws within the territory of India?', 'भारत के संविधान का कौन सा अनुच्छेद भारत के राज्यक्षेत्र में कानून के समक्ष समानता और कानूनों के समान संरक्षण की गारंटी देता है?', 'en',
  '[{"id":"A","text":"Article 19","hindi_text":"अनुच्छेद 19"},{"id":"B","text":"Article 14","hindi_text":"अनुच्छेद 14"},{"id":"C","text":"Article 21","hindi_text":"अनुच्छेद 21"},{"id":"D","text":"Article 32","hindi_text":"अनुच्छेद 32"}]'::jsonb, 'B', 'Article 14 of the Indian Constitution ensures equality before law and equal protection of laws to all persons within the territory of India.',
  'भारतीय संविधान का अनुच्छेद 14 भारत के राज्यक्षेत्र में सभी व्यक्तियों को विधि के समक्ष समानता और विधियों के समान संरक्षण का अधिकार देता है।', 'easy', 'Polity · Fundamental Rights (Art 14-32)',
  'SSC CGL / RRB NTPC General Awareness', 142, 1,
  'whicharticleoftheconstitutionofindiaguaranteesequalitybeforelawandequalprotectionofthelawswithintheterritoryofindia', 'published', 'active',
  1850, 1540, 13875000, 1800
) ON CONFLICT (id) DO UPDATE SET
  question_text = EXCLUDED.question_text,
  hindi_question_text = EXCLUDED.hindi_question_text,
  options = EXCLUDED.options,
  correct_option_id = EXCLUDED.correct_option_id,
  explanation = EXCLUDED.explanation,
  hindi_explanation = EXCLUDED.hindi_explanation;
INSERT INTO questions (
  id, examination_id, subject_id, question_text, hindi_question_text, language,
  options, correct_option_id, explanation, hindi_explanation, difficulty,
  syllabus_tag, pyq_info, quality_upvotes, quality_downvotes, normalized_fingerprint,
  publication_status, moderation_status, total_attempts, correct_attempts, total_time_ms, fastest_correct_ms
) VALUES (
  'q-gk-2', 'exam-ssc-cgl', 'subj-gk',
  'What was the name of the lunar exploration rover carried by ISRO''s Chandrayaan-3 mission?', 'ISRO के चंद्रयान-3 मिशन द्वारा ले जाए गए चंद्र अन्वेषण रोवर का नाम क्या था?', 'en',
  '[{"id":"A","text":"Vikram","hindi_text":"विक्रम"},{"id":"B","text":"Pragyan","hindi_text":"प्रज्ञान"},{"id":"C","text":"Aditya","hindi_text":"आदित्य"},{"id":"D","text":"Dhruv","hindi_text":"ध्रुव"}]'::jsonb, 'B', 'The lander was named Vikram (after Dr. Vikram Sarabhai) and the 6-wheeled robotic rover was named Pragyan (meaning wisdom).',
  'लैंडर का नाम विक्रम और 6 पहियों वाले रोबोटिक रोवर का नाम ''प्रज्ञान'' था, जिसने चंद्रमा के दक्षिणी ध्रुव पर अनुसंधान किया।', 'easy', 'Science & Tech · Space Missions',
  'Current Affairs & GK PYQ', 189, 2,
  'whatwasthenameofthelunarexplorationrovercarriedbyisroschandrayaan3mission', 'published', 'active',
  2100, 1820, 13020000, 1500
) ON CONFLICT (id) DO UPDATE SET
  question_text = EXCLUDED.question_text,
  hindi_question_text = EXCLUDED.hindi_question_text,
  options = EXCLUDED.options,
  correct_option_id = EXCLUDED.correct_option_id,
  explanation = EXCLUDED.explanation,
  hindi_explanation = EXCLUDED.hindi_explanation;
INSERT INTO questions (
  id, examination_id, subject_id, question_text, hindi_question_text, language,
  options, correct_option_id, explanation, hindi_explanation, difficulty,
  syllabus_tag, pyq_info, quality_upvotes, quality_downvotes, normalized_fingerprint,
  publication_status, moderation_status, total_attempts, correct_attempts, total_time_ms, fastest_correct_ms
) VALUES (
  'q-gk-3', 'exam-ssc-cgl', 'subj-gk',
  'The Tropic of Cancer (23.5° N) passes through how many Indian states?', 'कर्क रेखा (23.5° N) भारत के कितने राज्यों से होकर गुजरती है?', 'en',
  '[{"id":"A","text":"6 states","hindi_text":"6 राज्य"},{"id":"B","text":"7 states","hindi_text":"7 राज्य"},{"id":"C","text":"8 states","hindi_text":"8 राज्य"},{"id":"D","text":"9 states","hindi_text":"9 राज्य"}]'::jsonb, 'C', 'The Tropic of Cancer passes through 8 Indian states: Gujarat, Rajasthan, MP, Chhattisgarh, Jharkhand, West Bengal, Tripura, and Mizoram.',
  'कर्क रेखा 8 राज्यों से होकर गुजरती है: गुजरात, राजस्थान, मध्य प्रदेश, छत्तीसगढ़, झारखंड, पश्चिम बंगाल, त्रिपुरा और मिजोरम।', 'easy', 'Geography · Indian Physical Geography',
  'SSC CGL / State Police GK', 165, 1,
  'thetropicofcancer235npassesthroughhowmanyindianstates', 'published', 'active',
  1620, 1380, 13122000, 1900
) ON CONFLICT (id) DO UPDATE SET
  question_text = EXCLUDED.question_text,
  hindi_question_text = EXCLUDED.hindi_question_text,
  options = EXCLUDED.options,
  correct_option_id = EXCLUDED.correct_option_id,
  explanation = EXCLUDED.explanation,
  hindi_explanation = EXCLUDED.hindi_explanation;
INSERT INTO questions (
  id, examination_id, subject_id, question_text, hindi_question_text, language,
  options, correct_option_id, explanation, hindi_explanation, difficulty,
  syllabus_tag, pyq_info, quality_upvotes, quality_downvotes, normalized_fingerprint,
  publication_status, moderation_status, total_attempts, correct_attempts, total_time_ms, fastest_correct_ms
) VALUES (
  'q-gk-4', 'exam-ssc-cgl', 'subj-gk',
  'Who served as the Chairman of the Drafting Committee of the Constituent Assembly of India?', 'भारतीय संविधान सभा की प्रारूप समिति (ड्राफ्टिंग कमेटी) के अध्यक्ष कौन थे?', 'en',
  '[{"id":"A","text":"Dr. Rajendra Prasad","hindi_text":"डॉ. राजेंद्र प्रसाद"},{"id":"B","text":"Dr. B. R. Ambedkar","hindi_text":"डॉ. बी. आर. अम्बेडकर"},{"id":"C","text":"Jawaharlal Nehru","hindi_text":"जवाहरलाल नेहरू"},{"id":"D","text":"Sardar Vallabhbhai Patel","hindi_text":"सरदार वल्लभभाई पटेल"}]'::jsonb, 'B', 'Dr. B. R. Ambedkar was the Chairman of the 7-member Drafting Committee set up on 29 August 1947.',
  '29 अगस्त 1947 को गठित 7 सदस्यीय प्रारूप समिति के अध्यक्ष डॉ. भीमराव रामजी अम्बेडकर थे।', 'easy', 'History · Making of the Indian Constitution',
  'UPSC / SSC / State PCS Foundation', 210, 1,
  'whoservedasthechairmanofthedraftingcommitteeoftheconstituentassemblyofindia', 'published', 'active',
  2450, 2210, 14455000, 1200
) ON CONFLICT (id) DO UPDATE SET
  question_text = EXCLUDED.question_text,
  hindi_question_text = EXCLUDED.hindi_question_text,
  options = EXCLUDED.options,
  correct_option_id = EXCLUDED.correct_option_id,
  explanation = EXCLUDED.explanation,
  hindi_explanation = EXCLUDED.hindi_explanation;
INSERT INTO questions (
  id, examination_id, subject_id, question_text, hindi_question_text, language,
  options, correct_option_id, explanation, hindi_explanation, difficulty,
  syllabus_tag, pyq_info, quality_upvotes, quality_downvotes, normalized_fingerprint,
  publication_status, moderation_status, total_attempts, correct_attempts, total_time_ms, fastest_correct_ms
) VALUES (
  'q-math-1', 'exam-ssc-cgl', 'subj-maths',
  'A train 150 m long crosses a pole in 9 seconds. What is its speed in km/h?', '150 मीटर लंबी एक रेलगाड़ी एक खंभे को 9 सेकंड में पार करती है। इसकी गति किमी/घंटा में क्या है?', 'en',
  '[{"id":"A","text":"45 km/h","hindi_text":"45 किमी/घंटा"},{"id":"B","text":"60 km/h","hindi_text":"60 किमी/घंटा"},{"id":"C","text":"54 km/h","hindi_text":"54 किमी/घंटा"},{"id":"D","text":"72 km/h","hindi_text":"72 किमी/घंटा"}]'::jsonb, 'B', 'Speed = Distance ÷ Time = (150 m ÷ 9 s) × (18/5) = (50/3) × (18/5) = 10 × 6 = 60 km/h.',
  'चाल = दूरी ÷ समय = (150 मी ÷ 9 से) × (18/5) = (50/3) × (18/5) = 60 किमी/घंटा।', 'medium', 'Quant · Speed, Time & Distance',
  'SSC CGL / RRB NTPC Tier-1', 98, 1,
  'atrain150mlongcrossesapolein9secondswhatisitsspeedinkmh', 'published', 'active',
  1420, 980, 19170000, 3800
) ON CONFLICT (id) DO UPDATE SET
  question_text = EXCLUDED.question_text,
  hindi_question_text = EXCLUDED.hindi_question_text,
  options = EXCLUDED.options,
  correct_option_id = EXCLUDED.correct_option_id,
  explanation = EXCLUDED.explanation,
  hindi_explanation = EXCLUDED.hindi_explanation;
INSERT INTO questions (
  id, examination_id, subject_id, question_text, hindi_question_text, language,
  options, correct_option_id, explanation, hindi_explanation, difficulty,
  syllabus_tag, pyq_info, quality_upvotes, quality_downvotes, normalized_fingerprint,
  publication_status, moderation_status, total_attempts, correct_attempts, total_time_ms, fastest_correct_ms
) VALUES (
  'q-math-2', 'exam-ssc-cgl', 'subj-maths',
  'An article bought for ₹1,200 is sold for ₹1,440. What is the profit percentage?', '₹1,200 में खरीदी गई वस्तु को ₹1,440 में बेचा जाता है। लाभ प्रतिशत क्या है?', 'en',
  '[{"id":"A","text":"15%","hindi_text":"15%"},{"id":"B","text":"20%","hindi_text":"20%"},{"id":"C","text":"25%","hindi_text":"25%"},{"id":"D","text":"18%","hindi_text":"18%"}]'::jsonb, 'B', 'Profit = SP - CP = 1440 - 1200 = 240. Profit % = (240 / 1200) × 100 = 20%.',
  'लाभ = विक्रय मूल्य - क्रय मूल्य = 1440 - 1200 = ₹240। लाभ % = (240 / 1200) × 100 = 20%।', 'easy', 'Quant · Profit, Loss & Discount',
  'Banking / SSC Foundation', 112, 1,
  'anarticleboughtfor1200issoldfor1440whatistheprofitpercentage', 'published', 'active',
  1310, 1040, 14410000, 3200
) ON CONFLICT (id) DO UPDATE SET
  question_text = EXCLUDED.question_text,
  hindi_question_text = EXCLUDED.hindi_question_text,
  options = EXCLUDED.options,
  correct_option_id = EXCLUDED.correct_option_id,
  explanation = EXCLUDED.explanation,
  hindi_explanation = EXCLUDED.hindi_explanation;
INSERT INTO questions (
  id, examination_id, subject_id, question_text, hindi_question_text, language,
  options, correct_option_id, explanation, hindi_explanation, difficulty,
  syllabus_tag, pyq_info, quality_upvotes, quality_downvotes, normalized_fingerprint,
  publication_status, moderation_status, total_attempts, correct_attempts, total_time_ms, fastest_correct_ms
) VALUES (
  'q-reas-1', 'exam-ssc-cgl', 'subj-reasoning',
  'In a code language, TEACHER is written as VGCEJGT. How is CHILDREN written in that code?', 'एक कूट भाषा में TEACHER को VGCEJGT लिखा जाता है। उसी भाषा में CHILDREN को कैसे लिखा जाएगा?', 'en',
  '[{"id":"A","text":"EJKNFTGP","hindi_text":"EJKNFTGP"},{"id":"B","text":"EJKNFPGT","hindi_text":"EJKNFPGT"},{"id":"C","text":"EJKNEGTP","hindi_text":"EJKNEGTP"},{"id":"D","text":"EJKNFTPO","hindi_text":"EJKNFTPO"}]'::jsonb, 'A', 'Each letter is shifted forward by +2 positions in alphabetical order: C(+2)=E, H(+2)=J, I(+2)=K, L(+2)=N, D(+2)=F, R(+2)=T, E(+2)=G, N(+2)=P.',
  'प्रत्येक वर्ण में वर्णमाला क्रम से +2 का विस्थापन है: C(+2)=E, H(+2)=J, I(+2)=K, L(+2)=N, D(+2)=F, R(+2)=T, E(+2)=G, N(+2)=P -> EJKNFTGP।', 'easy', 'Reasoning · Coding-Decoding Letter Shift',
  'SSC CGL / CHSL Reasoning', 135, 1,
  'inacodelanguageteacheriswrittenasvgcejgthowischildrenwritteninthatcode', 'published', 'active',
  1540, 1190, 18788000, 3100
) ON CONFLICT (id) DO UPDATE SET
  question_text = EXCLUDED.question_text,
  hindi_question_text = EXCLUDED.hindi_question_text,
  options = EXCLUDED.options,
  correct_option_id = EXCLUDED.correct_option_id,
  explanation = EXCLUDED.explanation,
  hindi_explanation = EXCLUDED.hindi_explanation;
INSERT INTO questions (
  id, examination_id, subject_id, question_text, hindi_question_text, language,
  options, correct_option_id, explanation, hindi_explanation, difficulty,
  syllabus_tag, pyq_info, quality_upvotes, quality_downvotes, normalized_fingerprint,
  publication_status, moderation_status, total_attempts, correct_attempts, total_time_ms, fastest_correct_ms
) VALUES (
  'q-reas-2', 'exam-ssc-cgl', 'subj-reasoning',
  'Complete the analogy: New Delhi : India :: Tokyo : ?', 'सादृश्यता पूर्ण करें: नई दिल्ली : भारत :: टोक्यो : ?', 'en',
  '[{"id":"A","text":"China","hindi_text":"चीन"},{"id":"B","text":"Japan","hindi_text":"जापान"},{"id":"C","text":"South Korea","hindi_text":"दक्षिण कोरिया"},{"id":"D","text":"Thailand","hindi_text":"थाईलैंड"}]'::jsonb, 'B', 'New Delhi is the capital city of India. Similarly, Tokyo is the capital city of Japan.',
  'नई दिल्ली भारत की राजधानी है; उसी प्रकार टोक्यो जापान की राजधानी है।', 'easy', 'Reasoning · Capital & Country Analogy',
  'General Intelligence & Reasoning', 150, 1,
  'completetheanalogynewdelhiindiatokyo', 'published', 'active',
  1780, 1610, 11570000, 1400
) ON CONFLICT (id) DO UPDATE SET
  question_text = EXCLUDED.question_text,
  hindi_question_text = EXCLUDED.hindi_question_text,
  options = EXCLUDED.options,
  correct_option_id = EXCLUDED.correct_option_id,
  explanation = EXCLUDED.explanation,
  hindi_explanation = EXCLUDED.hindi_explanation;
INSERT INTO questions (
  id, examination_id, subject_id, question_text, hindi_question_text, language,
  options, correct_option_id, explanation, hindi_explanation, difficulty,
  syllabus_tag, pyq_info, quality_upvotes, quality_downvotes, normalized_fingerprint,
  publication_status, moderation_status, total_attempts, correct_attempts, total_time_ms, fastest_correct_ms
) VALUES (
  'q-eng-1', 'exam-ssc-cgl', 'subj-english',
  'Spot the error: ''Neither of the two candidates (A) / are eligible (B) / for the executive post (C) / No error (D)''', 'त्रुटि पहचानें: ''Neither of the two candidates (A) / are eligible (B) / for the executive post (C) / No error (D)''', 'en',
  '[{"id":"A","text":"Neither of the two candidates","hindi_text":"Neither of the two candidates"},{"id":"B","text":"are eligible","hindi_text":"are eligible"},{"id":"C","text":"for the executive post","hindi_text":"for the executive post"},{"id":"D","text":"No error","hindi_text":"No error"}]'::jsonb, 'B', '''Neither of'' takes a singular verb. ''are eligible'' must be corrected to ''is eligible''.',
  '''Neither of'' के साथ हमेशा एकवचन क्रिया (singular verb) का प्रयोग होता है। अतः ''are'' की जगह ''is'' का प्रयोग होगा।', 'medium', 'English · Subject-Verb Agreement',
  'SSC CGL / Banking English', 120, 2,
  'spottheerrorneitherofthetwocandidatesareeligiblefortheexecutivepostnoerror', 'published', 'active',
  1390, 980, 14595000, 2700
) ON CONFLICT (id) DO UPDATE SET
  question_text = EXCLUDED.question_text,
  hindi_question_text = EXCLUDED.hindi_question_text,
  options = EXCLUDED.options,
  correct_option_id = EXCLUDED.correct_option_id,
  explanation = EXCLUDED.explanation,
  hindi_explanation = EXCLUDED.hindi_explanation;
INSERT INTO questions (
  id, examination_id, subject_id, question_text, hindi_question_text, language,
  options, correct_option_id, explanation, hindi_explanation, difficulty,
  syllabus_tag, pyq_info, quality_upvotes, quality_downvotes, normalized_fingerprint,
  publication_status, moderation_status, total_attempts, correct_attempts, total_time_ms, fastest_correct_ms
) VALUES (
  'q-eng-2', 'exam-ssc-cgl', 'subj-english',
  'Choose the word which can substitute the phrase: ''A person who knows and speaks many different languages fluently''', 'दिए गए वाक्यांश के लिए एक शब्द चुनें: ''वह व्यक्ति जो कई भाषाएं धाराप्रवाह जानता और बोलता है''', 'en',
  '[{"id":"A","text":"Philologist","hindi_text":"भाषाविद् (Philologist)"},{"id":"B","text":"Polyglot","hindi_text":"बहुभाषाविद् (Polyglot)"},{"id":"C","text":"Linguist","hindi_text":"भाषाशास्त्री (Linguist)"},{"id":"D","text":"Omniscient","hindi_text":"सर्वज्ञ (Omniscient)"}]'::jsonb, 'B', 'A ''Polyglot'' is a person who knows and uses several languages. (Linguist studies grammar/structure; Philologist studies historical development).',
  'कई भाषाएं जानने और बोलने वाले व्यक्ति को ''Polyglot'' (बहुभाषाविद्) कहा जाता है।', 'easy', 'English · Vocabulary & One Word Substitution',
  'SSC CGL / NDA / CDS English', 140, 1,
  'choosethewordwhichcansubstitutethephraseapersonwhoknowandspeaksmanydifferentlanguagesfluently', 'published', 'active',
  1480, 1220, 12136000, 2100
) ON CONFLICT (id) DO UPDATE SET
  question_text = EXCLUDED.question_text,
  hindi_question_text = EXCLUDED.hindi_question_text,
  options = EXCLUDED.options,
  correct_option_id = EXCLUDED.correct_option_id,
  explanation = EXCLUDED.explanation,
  hindi_explanation = EXCLUDED.hindi_explanation;

-- D. Fresh Launch Reset Helper: Wipe all practice history to absolute 0
-- (Run when rolling out to production so every new user starts from zero scratch)
-- TRUNCATE TABLE question_attempts, hidden_questions, question_reports CASCADE;
-- UPDATE profiles SET current_streak = 0, today_solved_count = 0, total_questions_answered = 0, overall_accuracy = 0;

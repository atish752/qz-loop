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

-- 2. Ensure all required columns exist on 'profiles' table with correct defaults
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS language_preference TEXT DEFAULT 'en';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- Fix onboarding_completed default to false so new accounts always complete handle selection
ALTER TABLE profiles ALTER COLUMN onboarding_completed SET DEFAULT false;

-- Reset any uncustomized placeholder accounts so they get prompted for username setup:
UPDATE profiles 
SET onboarding_completed = false 
WHERE username LIKE 'aspirant_%' OR username IS NULL;

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
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
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
  user_id TEXT NOT NULL,
  friend_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'friend' CHECK (status IN ('friend', 'request_sent', 'request_received', 'pending_incoming')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- Drop restrictive FK constraints if they existed from prior migration
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
  WITH CHECK (auth.uid()::text = user_id OR auth.uid()::text = friend_id);

DROP POLICY IF EXISTS "Users can update friendships" ON friendships;
CREATE POLICY "Users can update friendships" ON friendships
  FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Users can delete friendships" ON friendships;
CREATE POLICY "Users can delete friendships" ON friendships
  FOR DELETE
  USING (true);

-- 6. Direct Messages Table RLS & Indexing
CREATE TABLE IF NOT EXISTS direct_messages (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  from_user_id TEXT NOT NULL,
  to_user_id TEXT NOT NULL,
  text TEXT NOT NULL,
  question_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Drop restrictive FK constraints if they existed from prior migration
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

-- 7. Question Likes Table (Social engagement fire/likes count)
CREATE TABLE IF NOT EXISTS question_likes (
  user_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, question_id)
);

-- Drop restrictive FK constraints if they existed from prior migration
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

-- 8. Question Comments Table (Community discussion thread)
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

-- Drop restrictive FK constraints if they existed from prior migration
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

-- 9. Baseline NEET UG Seed Questions (Guarantees foreign key integrity if strict schema is kept)
INSERT INTO examinations (id, name, slug, description, category, display_order, marks_per_question, negative_marks, is_active)
VALUES ('exam-neet-ug', 'NEET UG (Medical Entrance)', 'neet-ug', 'National Eligibility cum Entrance Test for Undergraduate Medical Programs (~24 Lakh candidates)', 'Medical Entrance', 3, 4, 1, true)
ON CONFLICT (slug) DO UPDATE SET is_active = true;

INSERT INTO subjects (id, examination_id, name, slug, display_order, icon)
VALUES 
  ('subj-neet-bio', 'exam-neet-ug', 'Biology (Botany & Zoology)', 'biology', 1, 'eco'),
  ('subj-neet-chem', 'exam-neet-ug', 'Chemistry', 'chemistry', 2, 'biotech'),
  ('subj-neet-phy', 'exam-neet-ug', 'Physics', 'physics', 3, 'bolt')
ON CONFLICT (examination_id, slug) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon;

INSERT INTO questions (
  id, examination_id, subject_id, question_text, hindi_question_text, language,
  options, correct_option_id, explanation, hindi_explanation, difficulty,
  syllabus_tag, pyq_info, publication_status, moderation_status
) VALUES 
(
  'q-neet-bio-1', 'exam-neet-ug', 'subj-neet-bio',
  'What is the expected phenotypic ratio in the F2 generation of a classic Mendelian monohybrid cross with complete dominance?',
  'पूर्ण प्रभाविता वाले मेंडेलियन मोनोहाइब्रिड क्रॉस की F2 पीढ़ी में अपेक्षित लक्षणप्ररूपी (phenotypic) अनुपात क्या होता है?', 'en',
  '[{"id":"A","text":"1:2:1","hindi_text":"1:2:1"},{"id":"B","text":"3:1","hindi_text":"3:1"},{"id":"C","text":"9:3:3:1","hindi_text":"9:3:3:1"},{"id":"D","text":"2:1","hindi_text":"2:1"}]'::jsonb,
  'B', 'In a monohybrid cross (e.g. Tt x Tt), the phenotypic ratio is 3 Dominant : 1 Recessive (3:1), while the genotypic ratio is 1 TT : 2 Tt : 1 tt (1:2:1).',
  'मोनोहाइब्रिड क्रॉस में F2 पीढ़ी का लक्षणप्ररूपी (phenotypic) अनुपात 3:1 (3 लंबा : 1 बौना) और जीनप्ररूपी अनुपात 1:2:1 होता है।',
  'easy', 'Genetics & Molecular Basis of Inheritance', 'NEET UG Biology PYQ', 'published', 'active'
),
(
  'q-neet-bio-2', 'exam-neet-ug', 'subj-neet-bio',
  'Which organelle is considered the ''powerhouse of the cell'' due to oxidative phosphorylation and ATP synthesis?',
  'ऑक्सीडेटिव फॉस्फारिलीकरण और एटीपी संश्लेषण के कारण किस कोशिकांग को ''कोशिका का पावरहाउस'' कहा जाता है?', 'en',
  '[{"id":"A","text":"Ribosome","hindi_text":"राइबोसोम (Ribosome)"},{"id":"B","text":"Mitochondria","hindi_text":"माइटोकॉन्ड्रिया (Mitochondria)"},{"id":"C","text":"Golgi Apparatus","hindi_text":"गॉल्जी काय (Golgi)"},{"id":"D","text":"Lysosome","hindi_text":"लाइसोसोम (Lysosome)"}]'::jsonb,
  'B', 'Mitochondria produce cellular energy in the form of ATP via the Krebs cycle and electron transport system on their inner cristae membranes.',
  'माइटोकॉन्ड्रिया में क्रेब्स चक्र और ईटीएस के माध्यम से एटीपी (ATP) का उत्पादन होता है, इसलिए इसे कोशिका का पावरहाउस कहा जाता है।',
  'easy', 'Cell Biology: Structure, Function & Division', 'NEET UG Biology PYQ', 'published', 'active'
),
(
  'q-neet-chem-1', 'exam-neet-ug', 'subj-neet-chem',
  'Which of the following molecules has a linear molecular geometry according to VSEPR theory?',
  'VSEPR सिद्धांत के अनुसार निम्नलिखित में से किस अणु की आणविक ज्यामिति रैखिक (linear) है?', 'en',
  '[{"id":"A","text":"H2O","hindi_text":"H2O (जल)"},{"id":"B","text":"BeCl2","hindi_text":"BeCl2 (बेरिलियम क्लोराइड)"},{"id":"C","text":"NH3","hindi_text":"NH3 (अमोनिया)"},{"id":"D","text":"CH4","hindi_text":"CH4 (मीथेन)"}]'::jsonb,
  'B', 'BeCl2 has sp hybridization with 2 bond pairs and 0 lone pairs on the central Be atom, giving it a 180° linear geometry.',
  'BeCl2 में sp संकरण होता है तथा केंद्रीय Be परमाणु पर शून्य एकाकी युग्म होने के कारण इसकी आकृति 180° रैखिक (linear) होती है।',
  'easy', 'Chemical Bonding & Molecular Structure', 'NEET UG Chemistry PYQ', 'published', 'active'
),
(
  'q-neet-phy-1', 'exam-neet-ug', 'subj-neet-phy',
  'Total Internal Reflection (TIR) occurs only when light travels from a:',
  'पूर्ण आंतरिक परावर्तन (TIR) केवल तब घटित होता है जब प्रकाश किरण गुजरती है:', 'en',
  '[{"id":"A","text":"Rarer to denser medium at angle > critical angle","hindi_text":"विरल से सघन माध्यम में क्रांतिक कोण से अधिक कोण पर"},{"id":"B","text":"Denser to rarer medium at an angle of incidence greater than the critical angle","hindi_text":"सघन से विरल माध्यम में क्रांतिक कोण से अधिक आपतन कोण पर"},{"id":"C","text":"Denser to rarer medium at an angle less than critical angle","hindi_text":"सघन से विरल माध्यम में क्रांतिक कोण से कम आपतन कोण पर"},{"id":"D","text":"Vacuum into any transparent material","hindi_text":"निर्वात से किसी पारदर्शी पदार्थ में"}]'::jsonb,
  'B', 'Two conditions for TIR: 1) Light must travel from optically denser to rarer medium. 2) Angle of incidence must exceed the critical angle (i > C).',
  'पूर्ण आंतरिक परावर्तन की दो आवश्यक शर्तें हैं: 1) प्रकाश किरण सघन से विरल माध्यम में प्रवेश करे। 2) आपतन कोण का मान क्रांतिक कोण से अधिक हो (i > C)।',
  'medium', 'Optics: Ray Optics & Wave Optics', 'NEET UG Physics PYQ', 'published', 'active'
)
ON CONFLICT (id) DO UPDATE SET
  question_text = EXCLUDED.question_text,
  hindi_question_text = EXCLUDED.hindi_question_text,
  options = EXCLUDED.options,
  correct_option_id = EXCLUDED.correct_option_id,
  explanation = EXCLUDED.explanation,
  hindi_explanation = EXCLUDED.hindi_explanation;

export interface Examination {
  id: string;
  name: string;
  slug: string;
  description?: string;
  is_active: boolean;
  created_at: string;
}

export interface Subject {
  id: string;
  examination_id: string;
  name: string;
  slug: string;
  display_order: number;
  icon?: string;
  created_at: string;
}

export interface QuestionOption {
  id: string; // 'A' | 'B' | 'C' | 'D'
  text: string;
}

export interface Question {
  id: string;
  author_id: string;
  author_name?: string;
  author_avatar?: string;
  examination_id: string;
  subject_id: string;
  subject_name?: string;
  subject_slug?: string;
  question_text: string;
  language: 'en' | 'hi';
  options: QuestionOption[];
  correct_option_id?: string; // Hidden in public feed until submitted!
  explanation?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  normalized_fingerprint: string;
  publication_status: 'draft' | 'published' | 'archived';
  moderation_status: 'active' | 'flagged' | 'hidden';
  total_attempts: number;
  correct_attempts: number;
  total_time_ms: number;
  fastest_correct_ms?: number;
  created_at: string;
  updated_at?: string;
}

export interface QuestionAttempt {
  id: string;
  user_id: string;
  question_id: string;
  selected_option_id: string;
  is_correct: boolean;
  response_time_ms: number;
  created_at: string;
}

export interface HiddenQuestion {
  user_id: string;
  question_id: string;
  hidden_at: string;
}

export interface QuestionReport {
  id: string;
  reporter_id: string;
  question_id: string;
  reason: 'incorrect_answer' | 'duplicate' | 'misleading' | 'offensive' | 'other';
  details?: string;
  status: 'pending' | 'reviewed' | 'dismissed' | 'resolved';
  created_at: string;
}

export interface UserProfile {
  id: string;
  display_name: string;
  avatar_url?: string;
  preferred_examination_id?: string;
  role: 'student' | 'admin' | 'moderator';
  current_streak: number;
  last_active_date?: string;
  daily_goal: number;
  today_solved_count: number;
  total_questions_answered?: number;
  overall_accuracy?: number;
  created_at: string;
}

export interface MatrixSubjectStat {
  subject_id: string;
  subject_name: string;
  subject_slug: string;
  attempts: number;
  correct: number;
  accuracy: number;
  avg_time_seconds: number;
  status: 'Strong' | 'OK' | 'Practise more';
}

export interface MatrixStats {
  period: 'today' | 'week' | 'month' | 'lifetime';
  total_solved: number;
  correct_count: number;
  incorrect_count: number;
  accuracy_percentage: number;
  total_time_seconds: number;
  avg_time_seconds: number;
  fastest_correct_seconds: number | null;
  weekly_activity?: { day: string; count: number; day_label: string }[];
  subjects: MatrixSubjectStat[];
}

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  display_name: string;
  avatar_url?: string;
  total_attempts: number;
  correct_count: number;
  accuracy_percentage: number;
  avg_time_seconds: number;
  score: number;
  streak_days: number;
  is_current_user?: boolean;
  is_qualified?: boolean;
}

export interface DuplicateCheckResult {
  is_exact_duplicate: boolean;
  is_similar: boolean;
  similarity_score: number;
  matched_question?: {
    id: string;
    question_text: string;
    subject_name?: string;
    author_name?: string;
    total_attempts: number;
    accuracy_percentage: number;
  };
}

export type RepeatInterval = 'day' | 'week' | 'month' | 'never';

export interface QuestionRepeatPreference {
  user_id: string;
  question_id: string;
  interval: RepeatInterval;
  next_review_at?: string;
  updated_at: string;
}

export interface QuestionCollection {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  question_ids: string[];
  created_at: string;
  updated_at?: string;
}

export interface FriendUser {
  id: string;
  display_name: string;
  avatar_url?: string;
  streak_days: number;
  target_exam: string;
  status: 'friend' | 'request_sent' | 'request_received';
  last_active?: string;
}

export interface DirectMessage {
  id: string;
  from_user_id: string;
  to_user_id: string;
  text?: string;
  question_id?: string;
  created_at: string;
}

export interface QuestionComment {
  id: string;
  question_id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  comment_text: string;
  likes_count: number;
  created_at: string;
}

export interface HabitScheduleSlot {
  id: string;
  time: string; // e.g. "08:00 AM"
  label: string; // e.g. "Morning Boost"
  active: boolean;
}

export interface HabitSettings {
  daily_goal: number;
  solved_today: number;
  combo_streak: number;
  boost_multiplier: number;
  boost_expires_at?: string;
  schedule_slots: HabitScheduleSlot[];
}


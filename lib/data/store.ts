import {
  Examination,
  Subject,
  Question,
  QuestionAttempt,
  HiddenQuestion,
  QuestionReport,
  UserProfile,
  MatrixStats,
  LeaderboardEntry,
  DuplicateCheckResult,
  RepeatInterval,
  QuestionRepeatPreference,
  QuestionCollection,
  FriendUser,
  DirectMessage,
  QuestionComment,
  HabitSettings,
  HabitScheduleSlot,
} from "@/types/database";
import {
  SEED_EXAMS,
  SEED_SUBJECTS,
  SEED_QUESTIONS,
  SEED_PROFILES,
} from "./seed";
import { normalizeTextFingerprint, cleanText } from "@/lib/utils/fingerprint";
import { checkSimilarity } from "@/lib/utils/similarity";

// In-memory persistent data store
class DataStore {
  private examinations: Examination[] = [...SEED_EXAMS];
  private subjects: Subject[] = [...SEED_SUBJECTS];
  private questions: Question[] = [...SEED_QUESTIONS];
  private profiles: UserProfile[] = [...SEED_PROFILES];
  private attempts: QuestionAttempt[] = [];
  private hiddenQuestions: HiddenQuestion[] = [];
  private reports: QuestionReport[] = [];
  private currentUserId: string = "user-current";

  // New Reel & Study Habit Features
  private repeatPreferences: Map<string, QuestionRepeatPreference> = new Map();
  private likes: Map<string, Set<string>> = new Map();
  private collections: QuestionCollection[] = [];
  private friends: FriendUser[] = [];
  private messages: DirectMessage[] = [];
  private comments: QuestionComment[] = [];
  private habitSettings: Map<string, HabitSettings> = new Map();
  private qualityVotes: Map<string, "up" | "down"> = new Map();

  constructor() {
    this.seedInitialAttempts();
    this.seedInitialSocialAndHabitData();
  }


  // Pre-seed some realistic historical attempts for rich initial stats
  private seedInitialAttempts() {
    const now = new Date();
    // Seed attempts for current user across the past few days (22 attempts, genuine practice history)
    const baseAttempts: { qId: string; correct: boolean; ms: number; daysAgo: number }[] = [
      // Today (6 attempts)
      { qId: "q-math-1", correct: true, ms: 8200, daysAgo: 0 },
      { qId: "q-reas-1", correct: true, ms: 9500, daysAgo: 0 },
      { qId: "q-eng-1", correct: true, ms: 7400, daysAgo: 0 },
      { qId: "q-gk-1", correct: true, ms: 6800, daysAgo: 0 },
      { qId: "q-math-2", correct: false, ms: 22000, daysAgo: 0 },
      { qId: "q-gk-2", correct: true, ms: 7100, daysAgo: 0 },
      // Yesterday (4 attempts)
      { qId: "q-reas-2", correct: true, ms: 14200, daysAgo: 1 },
      { qId: "q-math-1", correct: true, ms: 11000, daysAgo: 1 },
      { qId: "q-eng-2", correct: false, ms: 16800, daysAgo: 1 },
      { qId: "q-gk-3", correct: true, ms: 5500, daysAgo: 1 },
      // 2 days ago (4 attempts)
      { qId: "q-math-2", correct: true, ms: 12000, daysAgo: 2 },
      { qId: "q-reas-1", correct: false, ms: 18000, daysAgo: 2 },
      { qId: "q-eng-1", correct: true, ms: 8900, daysAgo: 2 },
      { qId: "q-gk-4", correct: true, ms: 6200, daysAgo: 2 },
      // 3 days ago (4 attempts)
      { qId: "q-math-1", correct: true, ms: 9100, daysAgo: 3 },
      { qId: "q-reas-2", correct: true, ms: 13500, daysAgo: 3 },
      { qId: "q-eng-2", correct: false, ms: 15400, daysAgo: 3 },
      { qId: "q-gk-1", correct: true, ms: 7800, daysAgo: 3 },
      // 4 days ago (4 attempts)
      { qId: "q-math-2", correct: true, ms: 10400, daysAgo: 4 },
      { qId: "q-reas-1", correct: true, ms: 8800, daysAgo: 4 },
      { qId: "q-eng-1", correct: true, ms: 9200, daysAgo: 4 },
      { qId: "q-gk-2", correct: false, ms: 19500, daysAgo: 4 },
    ];

    for (const a of baseAttempts) {
      const attemptDate = new Date(now.getTime() - (a.daysAgo * 86400000 + 3600000));
      this.attempts.push({
        id: `att-seed-${Math.random().toString(36).substring(2, 9)}`,
        user_id: "user-current",
        question_id: a.qId,
        selected_option_id: a.correct ? "B" : "A",
        is_correct: a.correct,
        response_time_ms: a.ms,
        created_at: attemptDate.toISOString(),
      });
    }

    // Seed attempts for competitor users (Amit, Priya, Vikram, Ananya) for Leaderboard
    const competitors = [
      { id: "user-amit", solves: 42, correct: 38, avgMs: 9200 },
      { id: "user-priya", solves: 36, correct: 33, avgMs: 11000 },
      { id: "user-vikram", solves: 31, correct: 26, avgMs: 13500 },
      { id: "user-ananya", solves: 25, correct: 21, avgMs: 14000 },
    ];

    competitors.forEach((c) => {
      for (let i = 0; i < c.solves; i++) {
        const isCorr = i < c.correct;
        const qIndex = i % this.questions.length;
        this.attempts.push({
          id: `att-${c.id}-${i}`,
          user_id: c.id,
          question_id: this.questions[qIndex].id,
          selected_option_id: isCorr ? (this.questions[qIndex].correct_option_id || "B") : "C",
          is_correct: isCorr,
          response_time_ms: Math.round(c.avgMs + (Math.random() * 4000 - 2000)),
          created_at: new Date(now.getTime() - Math.floor(Math.random() * 5 * 86400000)).toISOString(),
        });
      }
    });
  }

  // Pre-seed social, playlist, friend and habit data
  private seedInitialSocialAndHabitData() {
    // 1. Likes for questions
    this.questions.forEach((q, idx) => {
      const likers = new Set<string>();
      // Random mock likes between 18 and 64
      const seedLikerIds = ["user-amit", "user-priya", "user-vikram", "user-ananya"];
      seedLikerIds.slice(0, (idx % 4) + 1).forEach((id) => likers.add(id));
      if (idx % 2 === 0) {
        likers.add(this.currentUserId);
      }
      this.likes.set(q.id, likers);
    });

    // 2. Playlists / Collections
    const defaultPlaylists: { name: string; qIds: string[]; desc: string }[] = [
      { name: "Saved Questions", qIds: ["q-math-1", "q-reas-1"], desc: "General bookmarked questions" },
      { name: "Maths Tricks", qIds: ["q-math-1", "q-math-2"], desc: "High-yield calculation and shortcut proofs" },
      { name: "Reasoning Logic", qIds: ["q-reas-1", "q-reas-2"], desc: "Syllogisms and pattern mastery" },
      { name: "High-Yield English", qIds: ["q-eng-1", "q-eng-2"], desc: "Vocabulary and critical grammar rules" },
      { name: "GK Rapid Recall", qIds: ["q-gk-1", "q-gk-2", "q-gk-3", "q-gk-4"], desc: "Static GK and recurring PYQs" },
    ];

    this.collections = defaultPlaylists.map((p, idx) => ({
      id: `col-${idx + 1}`,
      user_id: this.currentUserId,
      name: p.name,
      description: p.desc,
      question_ids: p.qIds,
      created_at: new Date(Date.now() - (idx + 1) * 86400000).toISOString(),
    }));

    // 3. Friends
    this.friends = [
      {
        id: "user-amit",
        display_name: "Amit Kumar",
        username: "amit_ssc",
        avatar_url: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80",
        streak_days: 18,
        target_exam: "SSC CGL (AIR #1 Aim)",
        status: "friend",
        last_active: "Active 5m ago",
      },
      {
        id: "user-priya",
        display_name: "Priya Sharma",
        username: "priya_quant",
        avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80",
        streak_days: 14,
        target_exam: "SSC CGL (Quant Specialist)",
        status: "friend",
        last_active: "Active now",
      },
      {
        id: "user-vikram",
        display_name: "Vikram Singh",
        username: "vikram_p",
        avatar_url: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&auto=format&fit=crop&q=80",
        streak_days: 22,
        target_exam: "SSC CGL & CHSL",
        status: "friend",
        last_active: "Active 2h ago",
      },
      {
        id: "user-ananya",
        display_name: "Ananya Roy",
        username: "ananya_r",
        avatar_url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&auto=format&fit=crop&q=80",
        streak_days: 9,
        target_exam: "SSC CGL (GK & English)",
        status: "friend",
        last_active: "Active yesterday",
      },
    ];

    // 4. Initial study chat messages
    this.messages = [
      {
        id: "msg-1",
        from_user_id: "user-priya",
        to_user_id: this.currentUserId,
        text: "Hey! Try this question, the formula trick saved me so much time!",
        question_id: "q-math-1",
        created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
      {
        id: "msg-2",
        from_user_id: this.currentUserId,
        to_user_id: "user-priya",
        text: "Thanks! Solved it in 8.2s!",
        created_at: new Date(Date.now() - 3600000 * 1.5).toISOString(),
      },
      {
        id: "msg-3",
        from_user_id: "user-amit",
        to_user_id: this.currentUserId,
        text: "Are you practicing reasoning loop today? Let's hit the 50 goal together!",
        question_id: "q-reas-1",
        created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
      },
    ];

    // 5. Initial Discussion Comments on questions
    this.comments = [
      {
        id: "cmt-1",
        question_id: "q-math-1",
        user_id: "user-priya",
        user_name: "Priya Sharma",
        user_avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80",
        comment_text: "Shortcut: When radius is doubled, area scales by square of radius factor (2² = 4). Hence 4:1 instantly without writing π!",
        likes_count: 34,
        created_at: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: "cmt-2",
        question_id: "q-math-1",
        user_id: "user-amit",
        user_name: "Amit Kumar",
        user_avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80",
        comment_text: "Very classic SSC question. Frequently asked in Tier-1. Master the scaling ratio rule.",
        likes_count: 19,
        created_at: new Date(Date.now() - 43200000).toISOString(),
      },
      {
        id: "cmt-3",
        question_id: "q-eng-1",
        user_id: "user-ananya",
        user_name: "Ananya Roy",
        user_avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&auto=format&fit=crop&q=80",
        comment_text: "Rule: 'Neither of' takes a singular verb ('is' not 'are'). Always spot the subject-verb agreement first!",
        likes_count: 27,
        created_at: new Date(Date.now() - 72000000).toISOString(),
      },
    ];

    // 6. Habit & Study Settings
    this.habitSettings.set(this.currentUserId, {
      daily_goal: 25,
      solved_today: 6,
      combo_streak: 4,
      boost_multiplier: 2.0,
      boost_expires_at: new Date(Date.now() + 1800000).toISOString(), // 30 mins boost
      schedule_slots: [
        { id: "slot-1", time: "08:00 AM", label: "Morning Warmup Drill", active: true },
        { id: "slot-2", time: "02:00 PM", label: "Speed & Accuracy Sprint", active: true },
        { id: "slot-3", time: "09:00 PM", label: "Night Spaced Revision Loop", active: true },
      ],
    });
  }

  // --- Profile & User Management ---
  public getUserLifetimeSummary(userId: string): { totalSolved: number; overallAccuracy: number } {
    const userAttempts = this.attempts.filter((a) => a.user_id === userId);
    const totalSolved = userAttempts.length;
    const correctCount = userAttempts.filter((a) => a.is_correct).length;
    const overallAccuracy = totalSolved > 0 ? Math.round((correctCount / totalSolved) * 100) : 0;
    return { totalSolved, overallAccuracy };
  }

  public getAttemptsByUser(userId: string): QuestionAttempt[] {
    return this.attempts.filter((a) => a.user_id === userId);
  }

  public getCurrentUser(): UserProfile {
    const user = this.profiles.find((p) => p.id === this.currentUserId);
    if (!user) {
      return this.profiles[0];
    }
    // Update today's count based on attempts in Asia/Kolkata
    const todayAttempts = this.getAttemptsInPeriod(user.id, "today");
    user.today_solved_count = todayAttempts.length;
    const lifetime = this.getUserLifetimeSummary(user.id);
    user.total_questions_answered = lifetime.totalSolved;
    user.overall_accuracy = lifetime.overallAccuracy;
    return user;
  }

  public setCurrentUser(userId: string): UserProfile {
    const user = this.profiles.find((p) => p.id === userId);
    if (user) {
      this.currentUserId = userId;
      return this.getCurrentUser();
    }
    return this.getCurrentUser();
  }

  public getAllProfiles(): UserProfile[] {
    return this.profiles;
  }

  public getProfileById(userId: string): UserProfile | undefined {
    const user = this.profiles.find((p) => p.id === userId);
    if (!user) return undefined;
    const todayAttempts = this.getAttemptsInPeriod(user.id, "today");
    user.today_solved_count = todayAttempts.length;
    const lifetime = this.getUserLifetimeSummary(user.id);
    user.total_questions_answered = lifetime.totalSolved;
    user.overall_accuracy = lifetime.overallAccuracy;
    return user;
  }

  public isUsernameAvailable(username: string, excludeUserId?: string): boolean {
    const clean = username.trim().toLowerCase().replace(/^@+/, "");
    if (!clean || clean.length < 3 || clean.length > 30) return false;
    if (!/^[a-zA-Z0-9_.]+$/.test(clean)) return false;
    if (clean.startsWith(".") || clean.endsWith(".") || clean.includes("..")) return false;
    const existing = this.profiles.find((p) => p.username?.toLowerCase() === clean);
    if (existing && existing.id !== excludeUserId) {
      return false;
    }
    return true;
  }

  public updateProfile(
    updatesOrId: Partial<UserProfile> | string,
    targetUserIdOrUpdates?: string | Partial<UserProfile>
  ): UserProfile {
    let updates: Partial<UserProfile>;
    let targetUserId: string | undefined;

    if (typeof updatesOrId === "string") {
      targetUserId = updatesOrId;
      updates = (targetUserIdOrUpdates as Partial<UserProfile>) || {};
    } else {
      updates = updatesOrId || {};
      targetUserId = typeof targetUserIdOrUpdates === "string" ? targetUserIdOrUpdates : undefined;
    }

    const user =
      (targetUserId ? this.profiles.find((p) => p.id === targetUserId) : null) ||
      (updates.id ? this.profiles.find((p) => p.id === updates.id) : null) ||
      this.getCurrentUser();

    if (updates.username !== undefined) {
      const cleanUsername = updates.username.trim().toLowerCase().replace(/^@+/, "");
      if (cleanUsername.length < 3 || cleanUsername.length > 30) {
        throw new Error("Username must be between 3 and 30 characters long");
      }
      if (!/^[a-zA-Z0-9_.]+$/.test(cleanUsername)) {
        throw new Error("Username can only contain letters, numbers, underscores and periods");
      }
      if (cleanUsername.startsWith(".") || cleanUsername.endsWith(".") || cleanUsername.includes("..")) {
        throw new Error("Username cannot start or end with a period, or contain consecutive periods");
      }
      if (!this.isUsernameAvailable(cleanUsername, user.id)) {
        throw new Error(`Username @${cleanUsername} is already taken. Please choose another.`);
      }
      updates.username = cleanUsername;
    }

    if (updates.preferred_examination_id && !updates.target_exam) {
      const ex = this.examinations.find((e) => e.id === updates.preferred_examination_id);
      if (ex) {
        updates.target_exam = ex.name;
      }
    }

    Object.assign(user, updates);

    // Keep friends list sync if current user is represented
    const matchingFriend = this.friends.find((f) => f.id === user.id);
    if (matchingFriend) {
      if (user.display_name) matchingFriend.display_name = user.display_name;
      if (user.username) matchingFriend.username = user.username;
      if (user.target_exam) matchingFriend.target_exam = user.target_exam;
    }

    return user;
  }

  public signUpUser(data: {
    display_name: string;
    username: string;
    target_exam?: string;
    preferred_examination_id?: string;
    avatar_url?: string;
    email?: string;
    language_preference?: 'en' | 'hi';
  }): UserProfile {
    const cleanUsername = data.username.trim().toLowerCase().replace(/^@+/, "");
    if (!this.isUsernameAvailable(cleanUsername)) {
      throw new Error(`Username @${cleanUsername} is already taken. Please choose another.`);
    }

    // Determine target exam name
    let targetExam = data.target_exam;
    const examId = data.preferred_examination_id || "exam-ssc-cgl";
    if (!targetExam) {
      const ex = this.examinations.find((e) => e.id === examId);
      targetExam = ex ? ex.name : "SSC CGL / CHSL / MTS";
    }

    const newUserId = `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const newProfile: UserProfile = {
      id: newUserId,
      display_name: data.display_name.trim(),
      username: cleanUsername,
      target_exam: targetExam,
      preferred_examination_id: examId,
      avatar_url: data.avatar_url || "",
      email: data.email?.trim() || undefined,
      language_preference: data.language_preference || "en",
      role: "student",
      current_streak: 0, // Starts at zero scratch!
      last_active_date: undefined, // undefined until first practice attempt
      daily_goal: 10,
      today_solved_count: 0, // 0 solved
      total_questions_answered: 0, // 0 total answered
      overall_accuracy: 0, // 0% accuracy
      created_at: new Date().toISOString(),
    };

    this.profiles.push(newProfile);
    this.currentUserId = newUserId;

    // Fresh 0-scratch habit engine settings
    this.habitSettings.set(newUserId, {
      daily_goal: 10,
      solved_today: 0,
      combo_streak: 0,
      boost_multiplier: 1.0,
      schedule_slots: [
        { id: "slot-1", time: "08:00 AM", label: "Morning Warmup Drill", active: true },
        { id: "slot-2", time: "02:00 PM", label: "Speed & Accuracy Sprint", active: true },
        { id: "slot-3", time: "09:00 PM", label: "Night Spaced Revision Loop", active: true },
      ],
    });

    // Zero attempts, zero friends, zero playlists for this clean slate user
    return newProfile;
  }

  public resetUserData(userId: string): UserProfile {
    this.attempts = this.attempts.filter((a) => a.user_id !== userId);
    this.collections = this.collections.filter((c) => c.user_id !== userId);
    this.friends = this.friends.filter((f) => f.id !== userId);
    this.hiddenQuestions = this.hiddenQuestions.filter((h) => h.user_id !== userId);

    // Clear likes by this user
    for (const [qId, likers] of this.likes.entries()) {
      likers.delete(userId);
    }

    const profile = this.profiles.find((p) => p.id === userId);
    if (profile) {
      profile.current_streak = 0;
      profile.today_solved_count = 0;
      profile.total_questions_answered = 0;
      profile.overall_accuracy = 0;
      profile.last_active_date = undefined;
    }

    const habit = this.habitSettings.get(userId);
    if (habit) {
      habit.solved_today = 0;
      habit.combo_streak = 0;
    }

    return profile || this.getCurrentUser();
  }

  public syncUserFromAuth(data: {
    id: string;
    display_name: string;
    username: string;
    target_exam?: string;
    preferred_examination_id?: string;
    avatar_url?: string | null;
    email?: string;
  }): UserProfile {
    let existing = this.profiles.find((p) => p.id === data.id);
    if (!existing) {
      existing = {
        id: data.id,
        display_name: data.display_name,
        username: data.username,
        target_exam: data.target_exam || "Railways (RRB NTPC & Group D)",
        preferred_examination_id: data.preferred_examination_id || "exam-railway-ntpc",
        avatar_url: data.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80",
        email: data.email || undefined,
        role: "student",
        current_streak: 0,
        daily_goal: 10,
        today_solved_count: 0,
        total_questions_answered: 0,
        overall_accuracy: 0,
        created_at: new Date().toISOString(),
      };
      this.profiles.push(existing);
    } else {
      if (data.display_name) existing.display_name = data.display_name;
      if (data.username) existing.username = data.username;
      if (data.target_exam) existing.target_exam = data.target_exam;
      if (data.preferred_examination_id) existing.preferred_examination_id = data.preferred_examination_id;
      if (data.avatar_url) existing.avatar_url = data.avatar_url;
      if (data.email) existing.email = data.email;
    }
    this.currentUserId = data.id;
    return existing;
  }

  // --- Examinations & Subjects ---
  public getExaminations(): Examination[] {
    return this.examinations;
  }

  public getSubjects(examId?: string): Subject[] {
    if (examId) {
      return this.subjects.filter((s) => s.examination_id === examId);
    }
    return this.subjects;
  }

  // --- Question Eligibility & Feed System ---
  public getFeedQuestions(options: {
    userId?: string;
    examId?: string;
    subjectSlug?: string;
    subjectSlugs?: string[];
    sessionExcludedIds?: string[];
    language?: 'en' | 'hi' | 'all';
    limit?: number;
  }): Question[] {
    const userId = options.userId || this.currentUserId;
    const examId = options.examId || this.getCurrentUser()?.preferred_examination_id || "exam-ssc-cgl";
    const subjectSlug = options.subjectSlug || "all";
    const sessionExcludedIds = new Set(options.sessionExcludedIds || []);
    const limit = options.limit || 10;
    const lang = options.language || "all";

    // 1. Exclude questions hidden by user
    const userHiddenIds = new Set(
      this.hiddenQuestions.filter((h) => h.user_id === userId).map((h) => h.question_id)
    );

    // Multi-subject resolution (supports "maths,reasoning", ["maths", "gk"], or "all")
    let targetSlugs: string[] = [];
    if (options.subjectSlugs && options.subjectSlugs.length > 0) {
      targetSlugs = options.subjectSlugs.map((s) => s.trim().toLowerCase());
    } else if (subjectSlug && subjectSlug !== "all") {
      targetSlugs = subjectSlug.split(",").map((s) => s.trim().toLowerCase());
    }
    const filterAll = targetSlugs.length === 0 || targetSlugs.includes("all");

    // Check if current exam has specific questions
    const hasSpecificQuestions = this.questions.some(
      (q) => q.examination_id === examId && q.publication_status === "published" && q.moderation_status === "active"
    );

    // Filter by exam, subject, and language
    let pool = this.questions.filter((q) => {
      if (hasSpecificQuestions && q.examination_id !== examId) return false;
      if (q.publication_status !== "published" || q.moderation_status !== "active") return false;
      if (userHiddenIds.has(q.id)) return false;
      if (sessionExcludedIds.has(q.id)) return false;
      const repeatPref = this.repeatPreferences.get(`${userId}:${q.id}`);
      if (repeatPref?.interval === "never") return false;

      // Language filter
      if (lang === "hi") {
        const hasHindi = q.language === "hi" || Boolean(q.hindi_question_text);
        if (!hasHindi) return false;
      } else if (lang === "en") {
        const hasEnglish = q.language === "en" || (Boolean(q.question_text) && !q.question_text.match(/^[\u0900-\u097F\s.,!?:;0-9\-—]+$/));
        if (!hasEnglish) return false;
      }

      if (!filterAll) {
        const matchingSubjIds = new Set(
          this.subjects.filter((s) => targetSlugs.includes(s.slug.toLowerCase())).map((s) => s.id)
        );
        const matchesSlugDirectly = q.subject_slug && targetSlugs.includes(q.subject_slug.toLowerCase());
        if (!matchingSubjIds.has(q.subject_id) && !matchesSlugDirectly) return false;
      }
      return true;
    });

    // If pool is empty for chosen specific subject, fallback to all active published questions so anyone can browse
    if (pool.length === 0) {
      pool = this.questions.filter(
        (q) => q.publication_status === "published" && q.moderation_status === "active" && !userHiddenIds.has(q.id)
      );
    }

    // 2. Classify by attempt history and Spaced Repetition Rules
    const userAttempts = this.attempts.filter((a) => a.user_id === userId);
    const lastAttemptByQ = new Map<string, QuestionAttempt>();
    for (const a of userAttempts) {
      const existing = lastAttemptByQ.get(a.question_id);
      if (!existing || new Date(a.created_at) > new Date(existing.created_at)) {
        lastAttemptByQ.set(a.question_id, a);
      }
    }

    const now = Date.now();
    const MS_PER_HOUR = 3600 * 1000;
    const MS_PER_DAY = 24 * MS_PER_HOUR;

    const neverAnswered: Question[] = [];
    const eligibleForRevision: Question[] = [];

    for (const q of pool) {
      // Check user's explicit repeat preference for this question
      const prefKey = `${userId}:${q.id}`;
      const repeatPref = this.repeatPreferences.get(prefKey);
      if (repeatPref?.interval === "never") {
        // Explicitly set to NEVER repeat
        continue;
      }

      const last = lastAttemptByQ.get(q.id);
      if (!last) {
        neverAnswered.push(q);
      } else {
        const timeSinceAttempt = now - new Date(last.created_at).getTime();

        if (repeatPref) {
          if (repeatPref.interval === "day") {
            // Repeat quickly: reappears within a few hours / same day (e.g. 4 hours)
            if (timeSinceAttempt >= 4 * MS_PER_HOUR) {
              eligibleForRevision.push(q);
            }
          } else if (repeatPref.interval === "week") {
            // Repeat within a week (7 days)
            if (timeSinceAttempt >= 7 * MS_PER_DAY) {
              eligibleForRevision.push(q);
            }
          } else if (repeatPref.interval === "month") {
            // Repeat within a month (30 days)
            if (timeSinceAttempt >= 30 * MS_PER_DAY) {
              eligibleForRevision.push(q);
            }
          }
        } else {
          // Default heuristic spaced repetition
          if (!last.is_correct) {
            // Rule 5: Incorrect question eligible after ~24 hours
            if (timeSinceAttempt >= 24 * MS_PER_HOUR) {
              eligibleForRevision.push(q);
            }
          } else {
            // Rule 6: Correct answer
            const avgTime = q.total_attempts > 0 ? q.total_time_ms / q.total_attempts : 15000;
            if (last.response_time_ms > avgTime * 1.3) {
              // Unusually slow correct answer: eligible after ~3 days
              if (timeSinceAttempt >= 3 * MS_PER_DAY) {
                eligibleForRevision.push(q);
              }
            } else {
              // Consistently correct: eligible after ~7 days
              if (timeSinceAttempt >= 7 * MS_PER_DAY) {
                eligibleForRevision.push(q);
              }
            }
          }
        }
      }
    }

    // Shuffle helper to prevent predictable feed
    const shuffle = (array: Question[]) => {
      const arr = [...array];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    };

    // Priority 3: Never answered questions first, then eligible revisions
    let selected = [...shuffle(neverAnswered), ...shuffle(eligibleForRevision)];

    // If candidate pool is small (early database), include questions that haven't been seen in this session
    if (selected.length < limit && pool.length > 0) {
      const remaining = pool.filter((q) => !selected.some((s) => s.id === q.id));
      selected = [...selected, ...shuffle(remaining)];
    }

    selected = selected.slice(0, limit);

    // CRITICAL SECURITY REQUIREMENT: Mask correct_option_id in feed response!
    return selected.map((q) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { correct_option_id, ...safeQuestion } = q;
      return safeQuestion as Question;
    });
  }


  // --- Submit Question Attempt ---
  public submitAttempt(params: {
    userId?: string;
    questionId: string;
    selectedOptionId: string;
    responseTimeMs: number;
  }): {
    isCorrect: boolean;
    correctOptionId: string;
    explanation?: string;
    updatedMetrics: {
      total_attempts: number;
      correct_attempts: number;
      accuracy_percentage: number;
      avg_time_seconds: number;
      fastest_correct_seconds: number | null;
    };
  } {
    const userId = params.userId || this.currentUserId;
    const q = this.questions.find((item) => item.id === params.questionId);
    if (!q) {
      throw new Error("Question not found");
    }

    const isCorrect = q.correct_option_id === params.selectedOptionId;
    const validTime = Math.max(500, Math.min(params.responseTimeMs, 300000)); // Cap between 0.5s and 5 mins

    // Prevent duplicate rapid submission (idempotency check within 2.5s)
    const recentAttempt = this.attempts.slice().reverse().find(
      (a) => a.user_id === userId && a.question_id === q.id && a.selected_option_id === params.selectedOptionId && Date.now() - new Date(a.created_at).getTime() < 2500
    );
    if (recentAttempt) {
      const accuracy = Math.round((q.correct_attempts / q.total_attempts) * 100);
      const avgTimeSec = Math.round(q.total_time_ms / q.total_attempts / 1000);
      const fastestSec = q.fastest_correct_ms ? Number((q.fastest_correct_ms / 1000).toFixed(1)) : null;
      return {
        isCorrect: recentAttempt.is_correct,
        correctOptionId: q.correct_option_id || "A",
        explanation: q.explanation,
        updatedMetrics: {
          total_attempts: q.total_attempts,
          correct_attempts: q.correct_attempts,
          accuracy_percentage: accuracy,
          avg_time_seconds: avgTimeSec,
          fastest_correct_seconds: fastestSec,
        },
      };
    }

    // Record attempt
    const newAttempt: QuestionAttempt = {
      id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      user_id: userId,
      question_id: q.id,
      selected_option_id: params.selectedOptionId,
      is_correct: isCorrect,
      response_time_ms: validTime,
      created_at: new Date().toISOString(),
    };
    this.attempts.push(newAttempt);

    // Update Question Community Metrics
    q.total_attempts += 1;
    if (isCorrect) {
      q.correct_attempts += 1;
      if (!q.fastest_correct_ms || validTime < q.fastest_correct_ms) {
        q.fastest_correct_ms = validTime;
      }
    }
    q.total_time_ms += validTime;

    // Update User Streak (Asia/Kolkata check)
    const user = this.profiles.find((p) => p.id === userId) || this.getCurrentUser();
    const todayStr = this.getAsiaKolkataDateString(new Date());
    if (!user.current_streak || user.current_streak === 0) {
      user.current_streak = 1;
      user.last_active_date = todayStr;
    } else if (user.last_active_date !== todayStr) {
      if (user.last_active_date) {
        const lastDate = new Date(user.last_active_date + "T00:00:00Z");
        const currDate = new Date(todayStr + "T00:00:00Z");
        const diffDays = Math.round((currDate.getTime() - lastDate.getTime()) / 86400000);
        if (diffDays === 1) {
          user.current_streak += 1;
        } else if (diffDays > 1) {
          user.current_streak = 1;
        }
      } else {
        user.current_streak = 1;
      }
      user.last_active_date = todayStr;
    }
    user.today_solved_count = (user.today_solved_count || 0) + 1;

    const accuracy = Math.round((q.correct_attempts / q.total_attempts) * 100);
    const avgTimeSec = Math.round(q.total_time_ms / q.total_attempts / 1000);
    const fastestSec = q.fastest_correct_ms ? Number((q.fastest_correct_ms / 1000).toFixed(1)) : null;

    return {
      isCorrect,
      correctOptionId: q.correct_option_id || "A",
      explanation: q.explanation,
      updatedMetrics: {
        total_attempts: q.total_attempts,
        correct_attempts: q.correct_attempts,
        accuracy_percentage: accuracy,
        avg_time_seconds: avgTimeSec,
        fastest_correct_seconds: fastestSec,
      },
    };
  }

  // --- Duplicate Detection (Layers 1, 2 & 3) ---
  public checkDuplicate(questionText: string, optionsText?: string[]): DuplicateCheckResult {
    const cleaned = cleanText(questionText);
    const inputFp = normalizeTextFingerprint(cleaned);

    if (!inputFp || inputFp.length < 5) {
      return { is_exact_duplicate: false, is_similar: false, similarity_score: 0 };
    }

    let highestScore = 0;
    let matchedQ: Question | undefined;
    let isExact = false;

    for (const q of this.questions) {
      if (q.publication_status !== "published") continue;

      // Layer 1: Exact Normalized Fingerprint
      if (q.normalized_fingerprint === inputFp) {
        return {
          is_exact_duplicate: true,
          is_similar: true,
          similarity_score: 1.0,
          matched_question: {
            id: q.id,
            question_text: q.question_text,
            subject_name: q.subject_name,
            author_name: q.author_name,
            total_attempts: q.total_attempts,
            accuracy_percentage: q.total_attempts > 0 ? Math.round((q.correct_attempts / q.total_attempts) * 100) : 0,
          },
        };
      }

      // Layer 2: Trigram Similarity on question text and answer options
      let sim = checkSimilarity(cleaned, q.question_text);
      if (optionsText && optionsText.length > 0 && q.options?.length > 0) {
        const fullInput = `${cleaned} ${optionsText.join(" ")}`;
        const fullQ = `${q.question_text} ${q.options.map((o) => o.text).join(" ")}`;
        const fullSim = checkSimilarity(fullInput, fullQ);
        if (fullSim.score > sim.score) {
          sim = fullSim;
        }
      }

      if (sim.score > highestScore) {
        highestScore = sim.score;
        matchedQ = q;
        isExact = sim.isExact;
      }
    }

    const isSimilar = highestScore >= 0.42;

    return {
      is_exact_duplicate: isExact,
      is_similar: isSimilar,
      similarity_score: highestScore,
      matched_question: isSimilar && matchedQ ? {
        id: matchedQ.id,
        question_text: matchedQ.question_text,
        subject_name: matchedQ.subject_name,
        author_name: matchedQ.author_name,
        total_attempts: matchedQ.total_attempts,
        accuracy_percentage: matchedQ.total_attempts > 0 ? Math.round((matchedQ.correct_attempts / matchedQ.total_attempts) * 100) : 0,
      } : undefined,
    };
  }

  // --- Create Question ---
  public createQuestion(params: {
    examinationId?: string;
    subjectId: string;
    questionText: string;
    hindiQuestionText?: string;
    language?: "en" | "hi";
    options: { id: string; text: string; hindi_text?: string }[];
    correctOptionId: string;
    explanation?: string;
    hindiExplanation?: string;
    difficulty?: "easy" | "medium" | "hard";
    syllabusTag?: string;
    targetTopic?: string;
    pyqInfo?: string;
  }): Question {
    const author = this.getCurrentUser();
    const effectiveText = (params.questionText || params.hindiQuestionText || "").trim();
    const cleanedText = cleanText(effectiveText);
    const fingerprint = normalizeTextFingerprint(cleanedText);

    if (!cleanedText || cleanedText.length < 5) {
      throw new Error("Question text must be at least 5 characters long");
    }

    if (cleanedText.length > 600) {
      throw new Error("Question text cannot exceed 600 characters");
    }

    const sanitizedOptions = params.options.map((o) => ({
      id: o.id,
      text: (o.text || o.hindi_text || "").trim(),
      hindi_text: o.hindi_text ? o.hindi_text.trim() : undefined,
    }));

    if (!sanitizedOptions || sanitizedOptions.length < 2) {
      throw new Error("Question must have at least 2 options");
    }

    const hasCorrect = sanitizedOptions.some((o) => o.id === params.correctOptionId);
    if (!hasCorrect) {
      throw new Error("Correct option must be one of the provided options");
    }

    // Server-side duplicate check
    const dupCheck = this.checkDuplicate(cleanedText);
    if (dupCheck.is_exact_duplicate) {
      throw new Error("Exact duplicate question already exists in the system");
    }

    const subj = this.subjects.find((s) => s.id === params.subjectId);
    const examId = params.examinationId || subj?.examination_id || "exam-ssc-cgl";

    let finalSyllabusTag = params.syllabusTag?.trim() || "";
    if (params.targetTopic?.trim()) {
      finalSyllabusTag = finalSyllabusTag
        ? `${params.targetTopic.trim()} · ${finalSyllabusTag}`
        : params.targetTopic.trim();
    }

    const newQuestion: Question = {
      id: `q-usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      author_id: author.id,
      author_name: author.display_name,
      author_avatar: author.avatar_url,
      examination_id: examId,
      subject_id: params.subjectId,
      subject_name: subj?.name || "General",
      subject_slug: subj?.slug || "general",
      question_text: cleanedText,
      hindi_question_text: params.hindiQuestionText?.trim() || undefined,
      language: params.language || "en",
      options: sanitizedOptions,
      correct_option_id: params.correctOptionId,
      explanation: params.explanation?.trim() || undefined,
      hindi_explanation: params.hindiExplanation?.trim() || undefined,
      difficulty: params.difficulty || "medium",
      syllabus_tag: finalSyllabusTag || undefined,
      pyq_info: params.pyqInfo || undefined,
      quality_upvotes: 1,
      quality_downvotes: 0,
      normalized_fingerprint: fingerprint,
      publication_status: "published",
      moderation_status: "active",
      total_attempts: 0,
      correct_attempts: 0,
      total_time_ms: 0,
      created_at: new Date().toISOString(),
    };

    this.questions.unshift(newQuestion);
    return newQuestion;
  }

  // --- Hide and Restore Questions ---
  public hideQuestion(userId: string, questionId: string) {
    const existing = this.hiddenQuestions.find(
      (h) => h.user_id === userId && h.question_id === questionId
    );
    if (!existing) {
      this.hiddenQuestions.push({
        user_id: userId,
        question_id: questionId,
        hidden_at: new Date().toISOString(),
      });
    }
  }

  public restoreQuestion(userId: string, questionId: string) {
    this.hiddenQuestions = this.hiddenQuestions.filter(
      (h) => !(h.user_id === userId && h.question_id === questionId)
    );
  }

  public getHiddenQuestions(userId: string): Question[] {
    const hiddenIds = new Set(
      this.hiddenQuestions.filter((h) => h.user_id === userId).map((h) => h.question_id)
    );
    return this.questions.filter((q) => hiddenIds.has(q.id));
  }

  // --- Report Question ---
  public reportQuestion(report: {
    reporterId: string;
    questionId: string;
    reason: "incorrect_answer" | "duplicate" | "misleading" | "offensive" | "other";
    details?: string;
  }) {
    this.reports.push({
      id: `rep-${Date.now()}`,
      reporter_id: report.reporterId,
      question_id: report.questionId,
      reason: report.reason,
      details: report.details,
      status: "pending",
      created_at: new Date().toISOString(),
    });
  }

  // --- Asia/Kolkata Timezone Utilities & Matrix Stats ---
  private getAsiaKolkataDateString(date: Date): string {
    return date.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }); // YYYY-MM-DD
  }

  private getAttemptsInPeriod(userId: string, period: "today" | "week" | "month" | "lifetime"): QuestionAttempt[] {
    const userAttempts = this.attempts.filter((a) => a.user_id === userId);
    if (period === "lifetime") return userAttempts;

    const now = new Date();
    // Get start of today in IST
    const istTodayStr = this.getAsiaKolkataDateString(now);

    return userAttempts.filter((a) => {
      const attDate = new Date(a.created_at);
      const attIstStr = this.getAsiaKolkataDateString(attDate);

      if (period === "today") {
        return attIstStr === istTodayStr;
      }

      if (period === "week") {
        const diffMs = now.getTime() - attDate.getTime();
        return diffMs <= 7 * 86400000;
      }

      if (period === "month") {
        const diffMs = now.getTime() - attDate.getTime();
        return diffMs <= 30 * 86400000;
      }

      return true;
    });
  }

  public getMatrixStats(userId: string, period: "today" | "week" | "month" | "lifetime"): MatrixStats {
    const periodAttempts = this.getAttemptsInPeriod(userId, period);
    const totalSolved = periodAttempts.length;
    const correctCount = periodAttempts.filter((a) => a.is_correct).length;
    const incorrectCount = totalSolved - correctCount;
    const accuracy = totalSolved > 0 ? Math.round((correctCount / totalSolved) * 100) : 0;
    const totalTimeMs = periodAttempts.reduce((acc, a) => acc + a.response_time_ms, 0);
    const avgTimeSeconds = totalSolved > 0 ? Math.round(totalTimeMs / totalSolved / 1000) : 0;

    const correctAttempts = periodAttempts.filter((a) => a.is_correct);
    let fastestCorrectSec: number | null = null;
    if (correctAttempts.length > 0) {
      const minMs = Math.min(...correctAttempts.map((a) => a.response_time_ms));
      fastestCorrectSec = Number((minMs / 1000).toFixed(1));
    }

    // Weekly consistency bars (last 7 calendar days in Asia/Kolkata)
    const now = new Date();
    const userAllAttempts = this.attempts.filter((a) => a.user_id === userId);
    const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const weeklyActivity: { day: string; count: number; day_label: string }[] = [];
    for (let i = 6; i >= 0; i--) {
      const targetDate = new Date(now.getTime() - i * 86400000);
      const targetStr = this.getAsiaKolkataDateString(targetDate);
      const dayAttempts = userAllAttempts.filter((a) => {
        const attDate = new Date(a.created_at);
        return this.getAsiaKolkataDateString(attDate) === targetStr;
      });
      const dayOfWeek = new Date(targetStr + "T00:00:00Z").getUTCDay();
      weeklyActivity.push({
        day: targetStr,
        day_label: dayLabels[dayOfWeek],
        count: dayAttempts.length,
      });
    }

    // Subject breakdown (Target exam subject matrix)
    const user = this.profiles.find((p) => p.id === userId) || this.getCurrentUser();
    const targetExamId = user?.preferred_examination_id || "exam-ssc-cgl";
    let relevantSubjects = this.subjects.filter((s) => s.examination_id === targetExamId);
    if (relevantSubjects.length === 0) {
      relevantSubjects = this.subjects.filter((s) => s.examination_id === "exam-ssc-cgl");
    }

    const subjectMap = new Map<string, { attempts: number; correct: number; totalTimeMs: number }>();
    relevantSubjects.forEach((s) => {
      subjectMap.set(s.id, { attempts: 0, correct: 0, totalTimeMs: 0 });
    });

    for (const a of periodAttempts) {
      const q = this.questions.find((item) => item.id === a.question_id);
      if (q) {
        let matchedSubjId = subjectMap.has(q.subject_id) ? q.subject_id : undefined;
        if (!matchedSubjId && q.subject_slug) {
          const matchBySlug = relevantSubjects.find((s) => s.slug === q.subject_slug);
          if (matchBySlug) matchedSubjId = matchBySlug.id;
        }
        if (matchedSubjId && subjectMap.has(matchedSubjId)) {
          const stat = subjectMap.get(matchedSubjId)!;
          stat.attempts += 1;
          if (a.is_correct) stat.correct += 1;
          stat.totalTimeMs += a.response_time_ms;
        }
      }
    }

    const subjectsStat = relevantSubjects.map((s) => {
      const data = subjectMap.get(s.id)!;
      const attempts = data.attempts;
      const correct = data.correct;
      const acc = attempts > 0 ? Math.round((correct / attempts) * 100) : 0;
      const avgTime = attempts > 0 ? Math.round(data.totalTimeMs / attempts / 1000) : 0;

      let status: "Strong" | "OK" | "Practise more" = "Practise more";
      if (attempts === 0) {
        status = "Practise more";
      } else if (acc >= 75) {
        status = "Strong";
      } else if (acc >= 50) {
        status = "OK";
      } else {
        status = "Practise more";
      }

      return {
        subject_id: s.id,
        subject_name: s.name,
        subject_slug: s.slug,
        slug: s.slug,
        attempts,
        correct,
        accuracy: acc,
        avg_time_seconds: avgTime,
        status,
      };
    });

    return {
      period,
      total_solved: totalSolved,
      correct_count: correctCount,
      incorrect_count: incorrectCount,
      accuracy_percentage: accuracy,
      total_time_seconds: Math.round(totalTimeMs / 1000),
      avg_time_seconds: avgTimeSeconds,
      fastest_correct_seconds: fastestCorrectSec,
      weekly_activity: weeklyActivity,
      subjects: subjectsStat,
    };
  }

  // --- Leaderboard Calculation ---
  /**
   * Transparent deterministic scoring formula:
   * Base score: 25 points per correct answer
   * Accuracy bonus: Math.round(accuracy_percentage * 8) (e.g. 80% = +640 pts)
   * Speed bonus: For attempts answered within 15s, +5 pts each (capped at 200 pts max)
   * Minimum participation threshold: 20 submitted answers in the relevant period
   */
  public getLeaderboard(period: "weekly" | "monthly"): LeaderboardEntry[] {
    const now = new Date();
    const periodDays = period === "weekly" ? 7 : 30;
    const cutoffTime = now.getTime() - periodDays * 86400000;
    const QUALIFICATION_THRESHOLD = 20;

    const periodAttempts = this.attempts.filter(
      (a) => new Date(a.created_at).getTime() >= cutoffTime
    );

    const userStats = new Map<
      string,
      { attempts: number; correct: number; totalTimeMs: number; fastCount: number }
    >();

    // Initialize all seed users
    this.profiles.forEach((p) => {
      userStats.set(p.id, { attempts: 0, correct: 0, totalTimeMs: 0, fastCount: 0 });
    });

    for (const a of periodAttempts) {
      if (!userStats.has(a.user_id)) {
        userStats.set(a.user_id, { attempts: 0, correct: 0, totalTimeMs: 0, fastCount: 0 });
      }
      const u = userStats.get(a.user_id)!;
      u.attempts += 1;
      if (a.is_correct) {
        u.correct += 1;
        if (a.response_time_ms < 15000) {
          u.fastCount += 1;
        }
      }
      u.totalTimeMs += a.response_time_ms;
    }

    const entries: LeaderboardEntry[] = [];

    userStats.forEach((stat, uId) => {
      const profile = this.profiles.find((p) => p.id === uId);
      if (!profile) return;

      const attempts = stat.attempts;
      const correct = stat.correct;
      const accuracy = attempts > 0 ? Math.round((correct / attempts) * 100) : 0;
      const avgTime = attempts > 0 ? Math.round(stat.totalTimeMs / attempts / 1000) : 0;

      // Scoring formula
      const basePoints = correct * 25;
      const accuracyBonus = Math.round(accuracy * 8);
      const speedBonus = Math.min(stat.fastCount * 5, 200);
      const totalScore = basePoints + accuracyBonus + speedBonus;
      const isQualified = attempts >= QUALIFICATION_THRESHOLD;

      entries.push({
        rank: 0,
        user_id: uId,
        display_name: profile.display_name,
        username: profile.username,
        avatar_url: profile.avatar_url,
        total_attempts: attempts,
        correct_count: correct,
        accuracy_percentage: accuracy,
        avg_time_seconds: avgTime,
        score: totalScore,
        streak_days: profile.current_streak,
        is_current_user: uId === this.currentUserId,
        is_qualified: isQualified,
      });
    });

    // Sort qualified entries by score desc, accuracy desc, speed asc
    const qualified = entries.filter((e) => e.is_qualified);
    qualified.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.accuracy_percentage !== a.accuracy_percentage) return b.accuracy_percentage - a.accuracy_percentage;
      return a.avg_time_seconds - b.avg_time_seconds;
    });

    // Assign 1-indexed ranks to qualified participants
    qualified.forEach((e, idx) => {
      e.rank = idx + 1;
    });

    // Unqualified participants (e.g., fewer than 20 attempts)
    const unqualified = entries.filter((e) => !e.is_qualified);
    unqualified.sort((a, b) => b.total_attempts - a.total_attempts);
    unqualified.forEach((e) => {
      e.rank = 0;
    });

    return [...qualified, ...unqualified];
  }

  // --- Get Question By ID (with masked correct option) ---
  public getQuestionById(id: string): Question | undefined {
    const q = this.questions.find((item) => item.id === id);
    if (!q) return undefined;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { correct_option_id, ...safeQuestion } = q;
    return safeQuestion as Question;
  }

  // --- Get Raw Question By ID (for author editing / preview) ---
  public getRawQuestionById(id: string): Question | undefined {
    return this.questions.find((item) => item.id === id);
  }

  // --- Get Questions Created by a Specific Author ---
  public getQuestionsByAuthor(authorId?: string): Question[] {
    const user = this.getCurrentUser();
    const target = authorId || user.id;
    return this.questions.filter(
      (q) =>
        q.author_id === target ||
        q.author_name === user.display_name ||
        q.author_id === "user-1" ||
        q.author_name === "Rahul S."
    );
  }

  // --- Update Existing Question (Author Edit) ---
  public updateQuestion(
    id: string,
    updates: Partial<Question>,
    userId?: string
  ): Question {
    const q = this.questions.find((item) => item.id === id);
    if (!q) {
      throw new Error("Question not found");
    }
    const callerId = userId || this.currentUserId;
    const authorUser = this.getCurrentUser();
    const isAuthorized =
      q.author_id === callerId ||
      callerId === "user-current" ||
      q.author_id === authorUser.id ||
      q.author_name === authorUser.display_name ||
      q.author_id === "user-1" ||
      q.author_name === "Rahul S.";
    if (!isAuthorized) {
      throw new Error("Unauthorized to edit this question");
    }

    if (updates.question_text) {
      const cleaned = cleanText(updates.question_text);
      q.question_text = cleaned;
      q.normalized_fingerprint = normalizeTextFingerprint(cleaned);
    }
    if (updates.hindi_question_text !== undefined) {
      q.hindi_question_text = updates.hindi_question_text;
    }
    if (updates.language) {
      q.language = updates.language;
    }
    if (updates.options && updates.options.length >= 2) {
      q.options = updates.options;
    }
    if (updates.correct_option_id) {
      q.correct_option_id = updates.correct_option_id;
    }
    if (updates.explanation !== undefined) {
      q.explanation = updates.explanation;
    }
    if (updates.hindi_explanation !== undefined) {
      q.hindi_explanation = updates.hindi_explanation;
    }
    if (updates.difficulty !== undefined) {
      q.difficulty = updates.difficulty;
    }
    if (updates.syllabus_tag !== undefined) {
      q.syllabus_tag = updates.syllabus_tag;
    }
    if (updates.pyq_info !== undefined) {
      q.pyq_info = updates.pyq_info;
    }
    if (updates.examination_id) {
      q.examination_id = updates.examination_id;
    }
    if (updates.subject_id) {
      q.subject_id = updates.subject_id;
      const s = this.subjects.find((sub) => sub.id === updates.subject_id);
      if (s) {
        q.subject_name = s.name;
        q.subject_slug = s.slug;
        if (!updates.examination_id && s.examination_id) {
          q.examination_id = s.examination_id;
        }
      }
    }
    q.updated_at = new Date().toISOString();
    return q;
  }

  // --- Delete Question (Author Delete) ---
  public deleteQuestion(id: string, userId?: string): boolean {
    const idx = this.questions.findIndex((item) => item.id === id);
    if (idx === -1) return false;
    this.questions.splice(idx, 1);
    // Remove from any collections
    for (const col of this.collections) {
      col.question_ids = col.question_ids.filter((qId) => qId !== id);
    }
    return true;
  }

  // --- Question Quality Peer Verification (Upvote / Downvote) ---
  public voteQuestionQuality(
    userId: string,
    questionId: string,
    vote: "up" | "down"
  ): { upvotes: number; downvotes: number; userVote: "up" | "down" } {
    const q = this.questions.find((item) => item.id === questionId);
    if (!q) throw new Error("Question not found");

    if (typeof q.quality_upvotes !== "number") q.quality_upvotes = 95;
    if (typeof q.quality_downvotes !== "number") q.quality_downvotes = 2;

    const key = `${userId}:${questionId}`;
    const existingVote = this.qualityVotes.get(key);

    if (existingVote === vote) {
      return { upvotes: q.quality_upvotes, downvotes: q.quality_downvotes, userVote: vote };
    }

    if (existingVote === "up") {
      q.quality_upvotes = Math.max(0, q.quality_upvotes - 1);
    } else if (existingVote === "down") {
      q.quality_downvotes = Math.max(0, q.quality_downvotes - 1);
    }

    if (vote === "up") {
      q.quality_upvotes += 1;
    } else {
      q.quality_downvotes += 1;
    }

    this.qualityVotes.set(key, vote);
    return { upvotes: q.quality_upvotes, downvotes: q.quality_downvotes, userVote: vote };
  }

  public getQuestionQualityVote(
    userId: string,
    questionId: string
  ): { upvotes: number; downvotes: number; userVote?: "up" | "down" } {
    const q = this.questions.find((item) => item.id === questionId);
    const upvotes = typeof q?.quality_upvotes === "number" ? q.quality_upvotes : 95;
    const downvotes = typeof q?.quality_downvotes === "number" ? q.quality_downvotes : 2;
    const userVote = this.qualityVotes.get(`${userId}:${questionId}`);
    return { upvotes, downvotes, userVote };
  }

  // --- Spaced Repetition System ---
  public setQuestionRepeatInterval(
    userId: string,
    questionId: string,
    interval: RepeatInterval
  ): QuestionRepeatPreference {
    const key = `${userId}:${questionId}`;
    const now = new Date();
    let nextReviewMs = now.getTime();
    if (interval === "day") {
      nextReviewMs += 4 * 3600 * 1000; // 4 hours / same day
    } else if (interval === "week") {
      nextReviewMs += 7 * 86400 * 1000;
    } else if (interval === "month") {
      nextReviewMs += 30 * 86400 * 1000;
    }

    const pref: QuestionRepeatPreference = {
      user_id: userId,
      question_id: questionId,
      interval,
      next_review_at: interval === "never" ? undefined : new Date(nextReviewMs).toISOString(),
      updated_at: now.toISOString(),
    };

    this.repeatPreferences.set(key, pref);
    return pref;
  }

  public getQuestionRepeatInterval(userId: string, questionId: string): RepeatInterval | undefined {
    const key = `${userId}:${questionId}`;
    return this.repeatPreferences.get(key)?.interval;
  }

  // --- Likes & Interactions ---
  public toggleLikeQuestion(userId: string, questionId: string): { liked: boolean; totalLikes: number } {
    if (!this.likes.has(questionId)) {
      this.likes.set(questionId, new Set<string>());
    }
    const set = this.likes.get(questionId)!;
    const isLiked = set.has(userId);
    if (isLiked) {
      set.delete(userId);
    } else {
      set.add(userId);
    }
    return {
      liked: !isLiked,
      totalLikes: set.size,
    };
  }

  public getQuestionLikeStatus(userId: string, questionId: string): { liked: boolean; totalLikes: number } {
    const set = this.likes.get(questionId) || new Set<string>();
    return {
      liked: set.has(userId),
      totalLikes: set.size,
    };
  }

  // --- Playlists / Collections System ---
  public getUserCollections(userId: string): QuestionCollection[] {
    return this.collections.filter((c) => c.user_id === userId);
  }

  public getQuestionCollections(userId: string, questionId: string): string[] {
    return this.collections
      .filter((c) => c.user_id === userId && c.question_ids.includes(questionId))
      .map((c) => c.name);
  }

  public saveQuestionToCollection(
    userId: string,
    questionId: string,
    collectionName: string
  ): { saved: boolean; collection: string } {
    let col = this.collections.find((c) => c.user_id === userId && c.name.toLowerCase() === collectionName.trim().toLowerCase());
    if (!col) {
      col = {
        id: `col-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        user_id: userId,
        name: collectionName.trim(),
        question_ids: [],
        created_at: new Date().toISOString(),
      };
      this.collections.push(col);
    }

    if (!col.question_ids.includes(questionId)) {
      col.question_ids.push(questionId);
      col.updated_at = new Date().toISOString();
    }

    return { saved: true, collection: col.name };
  }

  public removeQuestionFromCollection(
    userId: string,
    questionId: string,
    collectionName: string
  ): boolean {
    const col = this.collections.find((c) => c.user_id === userId && c.name.toLowerCase() === collectionName.trim().toLowerCase());
    if (!col) return false;
    col.question_ids = col.question_ids.filter((id) => id !== questionId);
    col.updated_at = new Date().toISOString();
    return true;
  }

  public createCollection(userId: string, name: string, description?: string): QuestionCollection {
    const existing = this.collections.find((c) => c.user_id === userId && c.name.toLowerCase() === name.trim().toLowerCase());
    if (existing) return existing;

    const newCol: QuestionCollection = {
      id: `col-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      user_id: userId,
      name: name.trim(),
      description,
      question_ids: [],
      created_at: new Date().toISOString(),
    };
    this.collections.push(newCol);
    return newCol;
  }

  public getQuestionsByIds(ids: string[]): Question[] {
    const set = new Set(ids);
    return this.questions.filter((q) => set.has(q.id));
  }

  // --- Friends System ---
  private userFriends: Map<string, FriendUser[]> = new Map();

  public getFriends(userId?: string): FriendUser[] {
    const targetId = userId || this.currentUserId;
    if (targetId === "user-current") {
      return this.friends;
    }
    return this.userFriends.get(targetId) || [];
  }

  public searchUsers(query: string, currentUserId?: string): (UserProfile & { isFriend: boolean; friendStatus?: string })[] {
    const q = query.trim().toLowerCase().replace(/^@/, "");
    if (!q) return [];
    const currId = currentUserId || this.currentUserId;

    return this.profiles
      .filter((p) => p.id !== currId)
      .filter((p) =>
        p.username.toLowerCase().includes(q) ||
        p.display_name.toLowerCase().includes(q)
      )
      .map((p) => {
        const friend = this.friends.find((f) => f.id === p.id || f.username?.toLowerCase() === p.username.toLowerCase());
        return {
          ...p,
          isFriend: friend?.status === "friend",
          friendStatus: friend?.status,
        };
      });
  }

  public sendFriendRequest(
    userId: string,
    targetUserIdOrName: string
  ): { success: boolean; message: string; friend?: FriendUser } {
    const cleanTarget = targetUserIdOrName.trim();
    const isHandle = cleanTarget.startsWith("@");
    const query = cleanTarget.toLowerCase().replace(/^@+/, "");

    // 0. Prevent adding oneself
    const currentUser = this.profiles.find((p) => p.id === userId) || this.getCurrentUser();
    if (
      targetUserIdOrName === currentUser.id ||
      query === currentUser.username.toLowerCase() ||
      cleanTarget.toLowerCase() === currentUser.display_name.toLowerCase()
    ) {
      return { success: false, message: "You cannot add yourself as a study partner" };
    }

    // 1. Check if already in friends list
    const existing = this.friends.find(
      (f) =>
        f.id === targetUserIdOrName ||
        f.username?.toLowerCase() === query ||
        f.display_name.toLowerCase() === query ||
        f.display_name.toLowerCase() === cleanTarget.toLowerCase()
    );
    if (existing) {
      if (existing.status === "friend") {
        return {
          success: true,
          message: `@${existing.username || existing.display_name} is already your study partner!`,
          friend: existing,
        };
      }
      existing.status = "friend";
      return {
        success: true,
        message: `Connected with @${existing.username || existing.display_name}!`,
        friend: existing,
      };
    }

    // 2. Check in registered user profiles (Exact match on ID, username, or display name)
    const matchedProfile = this.profiles.find(
      (p) =>
        p.id === targetUserIdOrName ||
        p.username?.toLowerCase() === query ||
        p.display_name.toLowerCase() === cleanTarget.toLowerCase() ||
        (!isHandle && p.display_name.toLowerCase().includes(query))
    );

    if (isHandle && !matchedProfile) {
      return {
        success: false,
        message: `No aspirant found with username @${query}. Please verify the handle.`,
      };
    }

    const generatedUsername = matchedProfile
      ? matchedProfile.username
      : query.replace(/[^a-z0-9_.]/g, "_");

    const newFriend: FriendUser = {
      id: matchedProfile ? matchedProfile.id : `usr-fr-${Date.now()}`,
      display_name: matchedProfile ? matchedProfile.display_name : cleanTarget,
      username: generatedUsername,
      avatar_url: matchedProfile?.avatar_url,
      streak_days: matchedProfile ? matchedProfile.current_streak : Math.floor(Math.random() * 15) + 3,
      target_exam: matchedProfile?.target_exam || "SSC CGL Aspirant",
      status: "friend",
      last_active: "Active just now",
    };
    this.friends.unshift(newFriend);
    return {
      success: true,
      message: `Friend request accepted! Now studying with @${newFriend.username}`,
      friend: newFriend,
    };
  }

  public respondFriendRequest(
    userId: string,
    friendId: string,
    action: "accept" | "decline"
  ): { success: boolean; message: string } {
    const friend = this.friends.find((f) => f.id === friendId);
    if (!friend) {
      return { success: false, message: "Request not found" };
    }
    if (action === "accept") {
      friend.status = "friend";
      return { success: true, message: `Accepted friend request from @${friend.username || friend.display_name}` };
    } else {
      this.friends = this.friends.filter((f) => f.id !== friendId);
      return { success: true, message: `Declined friend request` };
    }
  }

  // --- Direct Study Chat Messages ---
  public getMessages(userId: string, friendId: string): DirectMessage[] {
    return this.messages.filter(
      (m) =>
        (m.from_user_id === userId && m.to_user_id === friendId) ||
        (m.from_user_id === friendId && m.to_user_id === userId)
    );
  }

  public getAllMessagesForUser(userId: string): DirectMessage[] {
    return this.messages.filter(
      (m) => m.from_user_id === userId || m.to_user_id === userId
    );
  }

  public sendMessage(params: {
    fromUserId: string;
    toUserId: string;
    text?: string;
    questionId?: string;
  }): DirectMessage {
    const newMsg: DirectMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      from_user_id: params.fromUserId,
      to_user_id: params.toUserId,
      text: params.text,
      question_id: params.questionId,
      created_at: new Date().toISOString(),
    };
    this.messages.push(newMsg);
    return newMsg;
  }

  // --- Comments & Tricks Discussion ---
  public getComments(questionId: string): QuestionComment[] {
    return this.comments.filter((c) => c.question_id === questionId);
  }

  public addComment(params: {
    questionId: string;
    userId: string;
    text: string;
  }): QuestionComment {
    const user = this.getCurrentUser();
    const newCmt: QuestionComment = {
      id: `cmt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      question_id: params.questionId,
      user_id: user.id,
      user_name: user.display_name,
      user_avatar: user.avatar_url,
      comment_text: params.text.trim(),
      likes_count: 1,
      created_at: new Date().toISOString(),
    };
    this.comments.unshift(newCmt);
    return newCmt;
  }

  // --- Habit Formation, Goals & Boosts ---
  public getHabitSettings(userId: string): HabitSettings {
    let settings = this.habitSettings.get(userId);
    const user = this.getCurrentUser();
    if (!settings) {
      settings = {
        daily_goal: user.daily_goal || 25,
        solved_today: user.today_solved_count || 0,
        combo_streak: 0,
        boost_multiplier: 1.5,
        schedule_slots: [
          { id: "slot-1", time: "08:00 AM", label: "Morning Warmup Drill", active: true },
          { id: "slot-2", time: "02:00 PM", label: "Speed & Accuracy Sprint", active: true },
          { id: "slot-3", time: "09:00 PM", label: "Night Spaced Revision Loop", active: true },
        ],
      };
      this.habitSettings.set(userId, settings);
    }
    settings.solved_today = user.today_solved_count || 0;
    return settings;
  }

  public updateDailyGoal(userId: string, goal: number): HabitSettings {
    const settings = this.getHabitSettings(userId);
    settings.daily_goal = Math.max(5, Math.min(goal, 200));
    const user = this.getCurrentUser();
    user.daily_goal = settings.daily_goal;
    return settings;
  }

  public updateHabitSchedule(userId: string, slots: HabitScheduleSlot[]): HabitSettings {
    const settings = this.getHabitSettings(userId);
    settings.schedule_slots = slots;
    return settings;
  }
}

// Global singleton instance
const globalStore = new DataStore();
export const db = globalStore;

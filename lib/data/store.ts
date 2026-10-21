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
    // 1. Likes for questions (all start at 0 for real data)
    this.questions.forEach((q) => {
      this.likes.set(q.id, new Set<string>());
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

    // 5. Initial Discussion Comments on questions (real customer data: starts empty)
    this.comments = [];

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

  public getCurrentUser(userId?: string): UserProfile {
    const targetId = userId || "user-current";
    const user =
      this.profiles.find((p) => p.id === targetId) ||
      this.profiles.find((p) => p.id === "user-current") ||
      this.profiles[0];
    // Update today's count based on attempts in Asia/Kolkata
    const todayAttempts = this.getAttemptsInPeriod(user.id, "today");
    user.today_solved_count = todayAttempts.length;
    const lifetime = this.getUserLifetimeSummary(user.id);
    user.total_questions_answered = lifetime.totalSolved;
    user.overall_accuracy = lifetime.overallAccuracy;
    return user;
  }

  public setCurrentUser(userId: string): UserProfile {
    // Pure getter for switched user, never mutating a global server singleton variable
    const user = this.profiles.find((p) => p.id === userId);
    if (user) {
      return this.getCurrentUser(userId);
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

    const targetId = targetUserId || updates.id || "user-current";

    let user = this.profiles.find((p) => p.id === targetId);
    if (!user) {
      user = {
        id: targetId,
        display_name: updates.display_name || "Aspirant",
        username: updates.username || `aspirant_${targetId.slice(0, 6)}`,
        target_exam: updates.target_exam || "NEET UG (Medical Entrance)",
        preferred_examination_id: updates.preferred_examination_id || "exam-neet-ug",
        avatar_url: updates.avatar_url || "",
        email: updates.email,
        language_preference: updates.language_preference || "en",
        role: "student",
        current_streak: 0,
        daily_goal: 10,
        today_solved_count: 0,
        total_questions_answered: 0,
        overall_accuracy: 0,
        onboarding_completed: updates.onboarding_completed ?? true,
        created_at: new Date().toISOString(),
      };
      this.profiles.push(user);
    }

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

    const { id: _ignoredId, ...safeUpdates } = updates as any;
    Object.assign(user, safeUpdates);
    user.id = targetId; // Strictly preserve target user id

    // Keep friends list sync across user-scoped friend maps
    for (const friendsList of this.userFriends.values()) {
      const matchingFriend = friendsList.find((f) => f.id === user.id);
      if (matchingFriend) {
        if (user.display_name) matchingFriend.display_name = user.display_name;
        if (user.username) matchingFriend.username = user.username;
        if (user.target_exam) matchingFriend.target_exam = user.target_exam;
        if (user.avatar_url) matchingFriend.avatar_url = user.avatar_url;
      }
    }
    const matchingFriend = this.friends.find((f) => f.id === user.id);
    if (matchingFriend) {
      if (user.display_name) matchingFriend.display_name = user.display_name;
      if (user.username) matchingFriend.username = user.username;
      if (user.target_exam) matchingFriend.target_exam = user.target_exam;
      if (user.avatar_url) matchingFriend.avatar_url = user.avatar_url;
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
    const examId = data.preferred_examination_id || "exam-neet-ug";
    if (!targetExam) {
      const ex = this.examinations.find((e) => e.id === examId);
      targetExam = ex ? ex.name : "NEET UG (Medical Entrance)";
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
      onboarding_completed: true,
      created_at: new Date().toISOString(),
    };

    this.profiles.push(newProfile);

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
    language_preference?: 'en' | 'hi';
    onboarding_completed?: boolean;
  }): UserProfile {
    let existing = this.profiles.find((p) => p.id === data.id);
    if (!existing) {
      existing = {
        id: data.id,
        display_name: data.display_name,
        username: data.username,
        target_exam: data.target_exam || "NEET UG (Medical Entrance)",
        preferred_examination_id: data.preferred_examination_id || "exam-neet-ug",
        avatar_url: data.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80",
        email: data.email || undefined,
        language_preference: data.language_preference || "en",
        role: "student",
        current_streak: 0,
        daily_goal: 10,
        today_solved_count: 0,
        total_questions_answered: 0,
        overall_accuracy: 0,
        onboarding_completed: data.onboarding_completed ?? false,
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
      if (data.language_preference) existing.language_preference = data.language_preference;
      if (data.onboarding_completed !== undefined) existing.onboarding_completed = data.onboarding_completed;
    }
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

  public getSubjectById(id: string): Subject | undefined {
    return this.subjects.find((s) => s.id === id);
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
    const isExplicitUser = Boolean(options.userId);
    const userId = options.userId;
    const userProfile = userId ? this.profiles.find((p) => p.id === userId) : null;
    const examId = options.examId || userProfile?.preferred_examination_id || "exam-neet-ug";
    const subjectSlug = options.subjectSlug || "all";
    const sessionExcludedIds = new Set(options.sessionExcludedIds || []);
    const limit = options.limit || 10;
    const lang = options.language || "all";

    // 1. Exclude questions hidden by user
    const userHiddenIds = new Set(
      userId ? this.hiddenQuestions.filter((h) => h.user_id === userId).map((h) => h.question_id) : []
    );

    // Multi-subject resolution (supports "maths,reasoning", ["maths", "gk"], or "all")
    let targetSlugs: string[] = [];
    if (options.subjectSlugs && options.subjectSlugs.length > 0) {
      targetSlugs = options.subjectSlugs.map((s) => s.trim().toLowerCase());
    } else if (subjectSlug && subjectSlug !== "all") {
      targetSlugs = subjectSlug.split(",").map((s) => s.trim().toLowerCase());
    }
    const filterAll = targetSlugs.length === 0 || targetSlugs.includes("all");

    // Check if requested exam has published active questions in the store
    const hasExamQuestions = Boolean(
      examId &&
      this.questions.some(
        (q) => q.examination_id === examId && q.publication_status === "published" && q.moderation_status === "active"
      )
    );

    // Filter strictly by exam, subject, and language
    let pool = this.questions.filter((q) => {
      if (hasExamQuestions && q.examination_id !== examId) return false;
      // If exam has no questions in database yet, allow authentic baseline clean NEET questions so fresh user feed is never empty
      if (!hasExamQuestions && q.examination_id !== "exam-neet-ug") return false;
      if (q.publication_status !== "published" || q.moderation_status !== "active") return false;
      if (userHiddenIds.has(q.id)) return false;
      if (sessionExcludedIds.has(q.id)) return false;
      const repeatPref = userId ? this.repeatPreferences.get(`${userId}:${q.id}`) : undefined;
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

    // If pool is empty for chosen specific subject, fallback to all active published questions of the SAME exam
    if (pool.length === 0) {
      if (hasExamQuestions) {
        pool = this.questions.filter(
          (q) => q.examination_id === examId && q.publication_status === "published" && q.moderation_status === "active" && !userHiddenIds.has(q.id)
        );
      } else {
        pool = this.questions.filter(
          (q) => q.examination_id === "exam-neet-ug" && q.publication_status === "published" && q.moderation_status === "active" && !userHiddenIds.has(q.id)
        );
      }
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
          if (repeatPref.next_review_at) {
            const nextReviewTime = new Date(repeatPref.next_review_at).getTime();
            if (now >= nextReviewTime) {
              eligibleForRevision.push({ ...q, is_repeat: true, repeat_at: repeatPref.next_review_at });
            }
          } else if (repeatPref.interval === "day") {
            if (timeSinceAttempt >= 4 * MS_PER_HOUR) {
              eligibleForRevision.push({ ...q, is_repeat: true });
            }
          } else if (repeatPref.interval === "week") {
            if (timeSinceAttempt >= 2 * MS_PER_DAY) {
              eligibleForRevision.push({ ...q, is_repeat: true });
            }
          } else if (repeatPref.interval === "month") {
            if (timeSinceAttempt >= 14 * MS_PER_DAY) {
              eligibleForRevision.push({ ...q, is_repeat: true });
            }
          }
        } else {
          // Default heuristic spaced repetition
          if (!last.is_correct) {
            // Rule 5: Incorrect question eligible after ~24 hours
            if (timeSinceAttempt >= 24 * MS_PER_HOUR) {
              eligibleForRevision.push({ ...q, is_repeat: true });
            }
          } else {
            // Rule 6: Correct answer
            const avgTime = q.total_attempts > 0 ? q.total_time_ms / q.total_attempts : 15000;
            if (last.response_time_ms > avgTime * 1.3) {
              // Unusually slow correct answer: eligible after ~3 days
              if (timeSinceAttempt >= 3 * MS_PER_DAY) {
                eligibleForRevision.push({ ...q, is_repeat: true });
              }
            } else {
              // Consistently correct: eligible after ~7 days
              if (timeSinceAttempt >= 7 * MS_PER_DAY) {
                eligibleForRevision.push({ ...q, is_repeat: true });
              }
            }
          }
        }
      }
    }

    // Shuffle helper to prevent predictable feed (deterministic during automated tests)
    const shuffle = (array: Question[]) => {
      if (typeof process !== "undefined" && (process.env.NODE_ENV === "test" || process.env.npm_lifecycle_event === "test")) {
        return array;
      }
      const arr = [...array];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    };

    // Priority: Direct user-authored questions first, then DUE spaced repetition questions, then new community questions, then standard questions
    const directAuthorQuestions = neverAnswered.filter((q) => userId && q.author_id === userId);
    const otherNewQuestions = neverAnswered.filter(
      (q) => (!userId || q.author_id !== userId) && q.id.startsWith("q-usr-")
    );
    const standardNeverAnswered = neverAnswered.filter(
      (q) => !(userId && q.author_id === userId) && !q.id.startsWith("q-usr-")
    );

    let selected = [
      ...directAuthorQuestions,
      ...shuffle(eligibleForRevision),
      ...otherNewQuestions,
      ...shuffle(standardNeverAnswered),
    ];

    // If candidate pool is small (early database), include questions that haven't been seen in this session
    if (selected.length < limit && pool.length > 0) {
      const remaining = pool.filter((q) => {
        if (selected.some((s) => s.id === q.id)) return false;
        const pref = this.repeatPreferences.get(`${userId}:${q.id}`);
        if (pref?.interval === "never") return false;
        // If an explicit logged-in user has answered this question, DO NOT resurface unless eligible for revision
        if (isExplicitUser && lastAttemptByQ.has(q.id)) {
          if (!pref) return false;
          if (pref.next_review_at && now < new Date(pref.next_review_at).getTime()) return false;
        }
        return true;
      });
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
    const userId = params.userId || "user-current";
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

    // If this was a resurfaced scheduled repetition, the review has been served!
    // Clear the past next_review_at so the question does not repeat immediately in a continuous loop.
    const prefKey = `${userId}:${q.id}`;
    const existingRepeatPref = this.repeatPreferences.get(prefKey);
    if (existingRepeatPref && existingRepeatPref.next_review_at) {
      const reviewTimestamp = new Date(existingRepeatPref.next_review_at).getTime();
      if (Date.now() >= reviewTimestamp) {
        existingRepeatPref.next_review_at = undefined;
      }
    }

    // Update Question Community Metrics
    q.total_attempts += 1;
    if (isCorrect) {
      q.correct_attempts += 1;
      if (!q.fastest_correct_ms || validTime < q.fastest_correct_ms) {
        q.fastest_correct_ms = validTime;
      }
    }
    q.total_time_ms += validTime;

    // Update User Streak (Asia/Kolkata check) for logged in user only
    const user = userId && userId !== "guest" ? this.profiles.find((p) => p.id === userId) : null;
    if (user) {
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
    }

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
    authorId?: string;
  }): Question {
    const subj = this.subjects.find((s) => s.id === params.subjectId);
    const examId = params.examinationId || subj?.examination_id || "exam-neet-ug";
    const examObj = this.examinations.find((e) => e.id === examId);

    let author = params.authorId ? this.profiles.find((p) => p.id === params.authorId) : null;
    if (!author && params.authorId) {
      author = {
        id: params.authorId,
        display_name: "Aspirant",
        username: "aspirant_" + params.authorId.slice(0, 6),
        target_exam: examObj?.name || "NEET UG (Medical Entrance)",
        preferred_examination_id: examId,
        role: "student",
        current_streak: 0,
        daily_goal: 10,
        today_solved_count: 0,
        total_questions_answered: 0,
        overall_accuracy: 0,
        onboarding_completed: true,
        created_at: new Date().toISOString(),
      };
      this.profiles.push(author);
    }
    if (!author) {
      author = this.getCurrentUser();
    }
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

    // Duplicate check passed

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
      quality_upvotes: 0,
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

  public syncCloudQuestion(q: Question): void {
    const idx = this.questions.findIndex((item) => item.id === q.id);
    if (idx === -1) {
      this.questions.unshift(q);
    }
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
    const targetExamId = user?.preferred_examination_id || "exam-neet-ug";
    let relevantSubjects = this.subjects.filter((s) => s.examination_id === targetExamId);
    if (relevantSubjects.length === 0) {
      relevantSubjects = this.subjects.filter((s) => s.examination_id === "exam-neet-ug");
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
    if (authorId) {
      const authorProf = this.profiles.find((p) => p.id === authorId);
      return this.questions.filter(
        (q) =>
          q.author_id === authorId ||
          (authorProf && q.author_name?.toLowerCase() === authorProf.display_name.toLowerCase())
      );
    }
    const target = user.id;
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
    const callerId = userId || "guest";
    const authorUser = userId ? this.profiles.find((p) => p.id === userId) : null;
    const isAuthorized =
      callerId !== "guest" &&
      (q.author_id === callerId ||
        callerId === "user-current" ||
        (authorUser && (q.author_id === authorUser.id || q.author_name === authorUser.display_name)) ||
        q.author_id === "user-1" ||
        q.author_name === "Rahul S.");
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
    const isTest = typeof process !== "undefined" && (process.env.NODE_ENV === "test" || process.env.npm_lifecycle_event === "test");
    if (interval === "day") {
      nextReviewMs += 4 * 3600 * 1000; // 4 hours / same day
    } else if (interval === "week") {
      // Bring question within a week (randomized between 2 and 6 days)
      const randomDays = isTest ? 3 : 2 + Math.floor(Math.random() * 5);
      nextReviewMs += randomDays * 86400 * 1000;
    } else if (interval === "month") {
      // Bring question within a month (randomized between 14 and 28 days)
      const randomDays = isTest ? 20 : 14 + Math.floor(Math.random() * 15);
      nextReviewMs += randomDays * 86400 * 1000;
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

  public toggleQuestionLike(arg1: string, arg2: string): { liked: boolean; totalLikes: number } {
    const isFirstQ = this.questions.some((q) => q.id === arg1);
    const qId = isFirstQ ? arg1 : arg2;
    const uId = isFirstQ ? arg2 : arg1;
    return this.toggleLikeQuestion(uId, qId);
  }

  public getQuestionLikeStatus(arg1?: string, arg2?: string): { liked: boolean; totalLikes: number } {
    let qId = "";
    let uId: string | undefined = undefined;
    if (arg1 && (this.questions.some((q) => q.id === arg1) || this.likes.has(arg1) || (!arg2 && typeof arg1 === "string"))) {
      qId = arg1;
      uId = arg2;
    } else if (arg2 && (this.questions.some((q) => q.id === arg2) || this.likes.has(arg2))) {
      uId = arg1;
      qId = arg2;
    } else {
      uId = arg1;
      qId = arg2 || "";
    }
    const set = this.likes.get(qId) || new Set<string>();
    return {
      liked: Boolean(uId && uId !== "guest" && set.has(uId)),
      totalLikes: set.size,
    };
  }

  public syncQuestionLikes(questionId: string, userIds: string[]): void {
    this.likes.set(questionId, new Set<string>(userIds.filter(Boolean)));
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
    const targetId = userId || "guest";
    if (targetId === "guest") return [];
    if (!this.userFriends.has(targetId)) {
      if (targetId === "user-current") {
        this.userFriends.set(targetId, [...this.friends]);
      } else {
        this.userFriends.set(targetId, []);
      }
    }
    const list = this.userFriends.get(targetId)!;
    // Strict self-exclusion: never include target user themselves
    const currentProf = this.profiles.find((p) => p.id === targetId);
    const filtered = list.filter(
      (f) =>
        f.id !== targetId &&
        (!currentProf?.username || f.username?.toLowerCase() !== currentProf.username.toLowerCase())
    );
    if (filtered.length !== list.length) {
      this.userFriends.set(targetId, filtered);
    }
    return filtered;
  }

  public syncFriendsList(userId: string, friends: FriendUser[]): void {
    if (!userId || userId === "guest") return;
    this.userFriends.set(userId, [...friends]);
    if (userId === "user-current") {
      this.friends = [...friends];
    }
  }

  public getIncomingFriendRequests(userId?: string): FriendUser[] {
    return this.getFriends(userId).filter(
      (f) => f.status === "pending_incoming" || f.status === "request_received"
    );
  }

  public searchUsers(query: string, currentUserId?: string): (UserProfile & { isFriend: boolean; friendStatus?: string })[] {
    const q = query.trim().toLowerCase().replace(/^@/, "");
    if (!q) return [];
    const currId = currentUserId || "";
    const currentUser = currId ? this.profiles.find((p) => p.id === currId) : null;
    const userFriends = currId ? this.getFriends(currId) : [];

    return this.profiles
      .filter(
        (p) =>
          !currId ||
          (p.id !== currId &&
            (!currentUser?.username || p.username.toLowerCase() !== currentUser.username.toLowerCase()))
      )
      .filter((p) =>
        (Boolean(p.username) && p.username.toLowerCase().includes(q)) ||
        (Boolean(p.display_name) && p.display_name.toLowerCase().includes(q))
      )
      .map((p) => {
        const friend = userFriends.find(
          (f) => f.id === p.id || (f.username && p.username && f.username.toLowerCase() === p.username.toLowerCase())
        );
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
  ): { success: boolean; message: string; friend?: FriendUser; status?: string } {
    const cleanTarget = targetUserIdOrName.trim();
    const isHandle = cleanTarget.startsWith("@");
    const query = cleanTarget.toLowerCase().replace(/^@+/, "");

    // 0. Prevent adding oneself
    const currentUser = this.profiles.find((p) => p.id === userId);
    if (!currentUser) {
      return { success: false, message: "User session required to send friend request" };
    }
    if (
      targetUserIdOrName === currentUser.id ||
      query === currentUser.username.toLowerCase()
    ) {
      return { success: false, message: "You cannot add yourself as a study partner" };
    }

    const userFriends = this.getFriends(userId);

    // 1. Check if already in friends list
    const existing = userFriends.find(
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
      if (existing.status === "request_sent") {
        return {
          success: true,
          message: `Friend request already sent to @${existing.username || existing.display_name}!`,
          friend: existing,
        };
      }
      if (existing.status === "pending_incoming" || existing.status === "request_received") {
        // Reciprocal acceptance
        existing.status = "friend";
        const otherFriends = this.getFriends(existing.id);
        const otherEntry = otherFriends.find((f) => f.id === userId);
        if (otherEntry) otherEntry.status = "friend";
        return {
          success: true,
          message: `Accepted friend request from @${existing.username || existing.display_name}! You are now study partners.`,
          friend: existing,
        };
      }
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
      target_exam: matchedProfile?.target_exam || "NEET UG Aspirant",
      status: "request_sent",
      last_active: "Active just now",
    };
    userFriends.unshift(newFriend);
    this.userFriends.set(userId, userFriends);
    if (userId === "user-current") {
      this.friends = userFriends;
    }

    // Also add to recipient's friends list as incoming friend request
    if (matchedProfile && matchedProfile.id !== userId) {
      const recipientFriends = this.getFriends(matchedProfile.id);
      const inRecipient = recipientFriends.find((f) => f.id === currentUser.id);
      if (!inRecipient) {
        recipientFriends.unshift({
          id: currentUser.id,
          display_name: currentUser.display_name,
          username: currentUser.username,
          avatar_url: currentUser.avatar_url,
          streak_days: currentUser.current_streak,
          target_exam: currentUser.target_exam || "Aspirant",
          status: "pending_incoming",
          last_active: "Active just now",
        });
        this.userFriends.set(matchedProfile.id, recipientFriends);
        if (matchedProfile.id === "user-current") {
          this.friends = recipientFriends;
        }
      }
    }

    return {
      success: true,
      status: "request_sent",
      message: `Friend request sent to @${newFriend.username}!`,
      friend: newFriend,
    };
  }

  public respondFriendRequest(
    userId: string,
    friendId: string,
    action: "accept" | "decline" | "reject"
  ): { success: boolean; message: string } {
    const userFriends = this.getFriends(userId);
    let friend = userFriends.find((f) => f.id === friendId);
    if (!friend) {
      const friendProf = this.profiles.find((p) => p.id === friendId);
      if (friendProf) {
        friend = {
          id: friendProf.id,
          display_name: friendProf.display_name,
          username: friendProf.username,
          avatar_url: friendProf.avatar_url,
          streak_days: friendProf.current_streak,
          target_exam: friendProf.target_exam || "Aspirant",
          status: "pending_incoming",
          last_active: "Active recently",
        };
        userFriends.unshift(friend);
        this.userFriends.set(userId, userFriends);
      } else {
        return { success: false, message: "Request not found" };
      }
    }
    if (action === "accept") {
      friend.status = "friend";
      // Reciprocal acceptance
      const otherFriends = this.getFriends(friendId);
      const otherEntry = otherFriends.find((f) => f.id === userId);
      if (otherEntry) {
        otherEntry.status = "friend";
      } else {
        const userProf = this.profiles.find((p) => p.id === userId);
        if (userProf) {
          otherFriends.unshift({
            id: userProf.id,
            display_name: userProf.display_name,
            username: userProf.username,
            avatar_url: userProf.avatar_url,
            streak_days: userProf.current_streak,
            target_exam: userProf.target_exam || "Aspirant",
            status: "friend",
            last_active: "Active just now",
          });
        }
      }
      return { success: true, message: `Accepted friend request from @${friend.username || friend.display_name}` };
    } else {
      const idx = userFriends.findIndex((f) => f.id === friendId);
      if (idx !== -1) userFriends.splice(idx, 1);
      this.userFriends.set(userId, userFriends);
      if (userId === "user-current") {
        this.friends = userFriends;
      }

      const otherFriends = this.getFriends(friendId);
      const otherIdx = otherFriends.findIndex((f) => f.id === userId);
      if (otherIdx !== -1) otherFriends.splice(otherIdx, 1);
      this.userFriends.set(friendId, otherFriends);
      if (friendId === "user-current") {
        this.friends = otherFriends;
      }

      return { success: true, message: `Declined friend request` };
    }
  }

  // --- Direct Study Chat Messages ---
  public getMessages(userId: string, friendId: string): DirectMessage[] {
    const list = this.messages.filter(
      (m) =>
        (m.from_user_id === userId && m.to_user_id === friendId) ||
        (m.from_user_id === friendId && m.to_user_id === userId)
    );
    const seen = new Set<string>();
    const deduped: DirectMessage[] = [];
    for (const m of list) {
      if (!seen.has(m.id)) {
        seen.add(m.id);
        deduped.push(m);
      }
    }
    return deduped;
  }

  public getAllMessagesForUser(userId: string): DirectMessage[] {
    const list = this.messages.filter(
      (m) => m.from_user_id === userId || m.to_user_id === userId
    );
    const seen = new Set<string>();
    const deduped: DirectMessage[] = [];
    for (const m of list) {
      if (!seen.has(m.id)) {
        seen.add(m.id);
        deduped.push(m);
      }
    }
    return deduped;
  }

  public sendMessage(params: {
    id?: string;
    fromUserId: string;
    toUserId: string;
    text?: string;
    questionId?: string;
    created_at?: string;
  }): DirectMessage {
    if (params.id) {
      const existing = this.messages.find((m) => m.id === params.id);
      if (existing) return existing;
    }
    const newMsg: DirectMessage = {
      id: params.id || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      from_user_id: params.fromUserId,
      to_user_id: params.toUserId,
      text: params.text,
      question_id: params.questionId,
      created_at: params.created_at || new Date().toISOString(),
    };
    this.messages.push(newMsg);
    return newMsg;
  }

  // --- Comments & Tricks Discussion ---
  public getComments(questionId: string): QuestionComment[] {
    return this.comments.filter((c) => c.question_id === questionId);
  }

  public syncComments(questionId: string, remoteComments: QuestionComment[]): void {
    const existingIds = new Set(this.comments.map((c) => c.id));
    for (const rc of remoteComments) {
      if (!existingIds.has(rc.id)) {
        this.comments.unshift(rc);
        existingIds.add(rc.id);
      }
    }
  }

  public addComment(params: {
    questionId: string;
    userId: string;
    text: string;
    id?: string;
  }): QuestionComment {
    const user = params.userId ? this.profiles.find((p) => p.id === params.userId) : null;
    const authorUser = user || this.getCurrentUser();
    const newCmt: QuestionComment = {
      id: params.id || `cmt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      question_id: params.questionId,
      user_id: params.userId || authorUser.id,
      user_name: user ? user.display_name : authorUser.display_name || "Aspirant",
      user_avatar: user ? user.avatar_url : authorUser.avatar_url,
      comment_text: params.text.trim(),
      likes_count: 0,
      created_at: new Date().toISOString(),
    };
    this.comments.unshift(newCmt);
    return newCmt;
  }

  public toggleLikeComment(commentId: string, userId?: string): { comment: QuestionComment | null; isLiked: boolean } {
    const cmt = this.comments.find((c) => c.id === commentId);
    if (!cmt) return { comment: null, isLiked: false };
    cmt.likes_count = (cmt.likes_count || 0) + 1;
    return { comment: cmt, isLiked: true };
  }

  // --- Habit Formation, Goals & Boosts ---
  public getHabitSettings(userId: string): HabitSettings {
    let settings = this.habitSettings.get(userId);
    const user = userId ? this.profiles.find((p) => p.id === userId) : null;
    if (!settings) {
      settings = {
        daily_goal: user?.daily_goal || 25,
        solved_today: user?.today_solved_count || 0,
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
    if (user) {
      settings.solved_today = user.today_solved_count || 0;
    }
    return settings;
  }

  public updateDailyGoal(userId: string, goal: number): HabitSettings {
    const settings = this.getHabitSettings(userId);
    settings.daily_goal = Math.max(5, Math.min(goal, 200));
    const user = userId ? this.profiles.find((p) => p.id === userId) : null;
    if (user) {
      user.daily_goal = settings.daily_goal;
    }
    return settings;
  }

  public updateHabitSchedule(userId: string, slots: HabitScheduleSlot[]): HabitSettings {
    const settings = this.getHabitSettings(userId);
    settings.schedule_slots = slots;
    return settings;
  }
}

// Global singleton instance across Next.js API route evaluations
const globalForDb = globalThis as unknown as { __qz_db?: DataStore };
export const db = globalForDb.__qz_db ?? new DataStore();
globalForDb.__qz_db = db;


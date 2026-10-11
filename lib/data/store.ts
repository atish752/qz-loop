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

  constructor() {
    this.seedInitialAttempts();
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
      { qId: "q-gk-hi-1", correct: true, ms: 7100, daysAgo: 0 },
      // Yesterday (4 attempts)
      { qId: "q-reas-2", correct: true, ms: 14200, daysAgo: 1 },
      { qId: "q-math-3", correct: true, ms: 11000, daysAgo: 1 },
      { qId: "q-eng-2", correct: false, ms: 16800, daysAgo: 1 },
      { qId: "q-gk-2", correct: true, ms: 5500, daysAgo: 1 },
      // 2 days ago (4 attempts)
      { qId: "q-math-hi-1", correct: true, ms: 12000, daysAgo: 2 },
      { qId: "q-reas-3", correct: false, ms: 18000, daysAgo: 2 },
      { qId: "q-eng-3", correct: true, ms: 8900, daysAgo: 2 },
      { qId: "q-gk-3", correct: true, ms: 6200, daysAgo: 2 },
      // 3 days ago (4 attempts)
      { qId: "q-math-4", correct: true, ms: 9100, daysAgo: 3 },
      { qId: "q-reas-4", correct: true, ms: 13500, daysAgo: 3 },
      { qId: "q-eng-4", correct: false, ms: 15400, daysAgo: 3 },
      { qId: "q-gk-4", correct: true, ms: 7800, daysAgo: 3 },
      // 4 days ago (4 attempts)
      { qId: "q-math-5", correct: true, ms: 10400, daysAgo: 4 },
      { qId: "q-reas-5", correct: true, ms: 8800, daysAgo: 4 },
      { qId: "q-eng-5", correct: true, ms: 9200, daysAgo: 4 },
      { qId: "q-gk-5", correct: false, ms: 19500, daysAgo: 4 },
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

  // --- Profile & User Management ---
  public getUserLifetimeSummary(userId: string): { totalSolved: number; overallAccuracy: number } {
    const userAttempts = this.attempts.filter((a) => a.user_id === userId);
    const totalSolved = userAttempts.length;
    const correctCount = userAttempts.filter((a) => a.is_correct).length;
    const overallAccuracy = totalSolved > 0 ? Math.round((correctCount / totalSolved) * 100) : 0;
    return { totalSolved, overallAccuracy };
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

  public updateProfile(updates: Partial<UserProfile>): UserProfile {
    const user = this.getCurrentUser();
    Object.assign(user, updates);
    return user;
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
    sessionExcludedIds?: string[];
    limit?: number;
  }): Question[] {
    const userId = options.userId || this.currentUserId;
    const examId = options.examId || "exam-ssc-cgl";
    const subjectSlug = options.subjectSlug || "all";
    const sessionExcludedIds = new Set(options.sessionExcludedIds || []);
    const limit = options.limit || 10;

    // 1. Exclude questions hidden by user
    const userHiddenIds = new Set(
      this.hiddenQuestions.filter((h) => h.user_id === userId).map((h) => h.question_id)
    );

    // Filter by exam and subject
    let pool = this.questions.filter((q) => {
      if (q.examination_id !== examId) return false;
      if (q.publication_status !== "published" || q.moderation_status !== "active") return false;
      if (userHiddenIds.has(q.id)) return false;
      if (sessionExcludedIds.has(q.id)) return false;

      if (subjectSlug !== "all") {
        const subj = this.subjects.find((s) => s.slug === subjectSlug);
        if (subj && q.subject_id !== subj.id) return false;
      }
      return true;
    });

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
      const last = lastAttemptByQ.get(q.id);
      if (!last) {
        neverAnswered.push(q);
      } else {
        const timeSinceAttempt = now - new Date(last.created_at).getTime();
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
    const user = this.getCurrentUser();
    const todayStr = this.getAsiaKolkataDateString(new Date());
    if (user.last_active_date !== todayStr) {
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
    language?: "en" | "hi";
    options: { id: string; text: string }[];
    correctOptionId: string;
    explanation?: string;
    difficulty?: "easy" | "medium" | "hard";
  }): Question {
    const author = this.getCurrentUser();
    const cleanedText = cleanText(params.questionText);
    const fingerprint = normalizeTextFingerprint(cleanedText);

    if (!cleanedText || cleanedText.length < 5) {
      throw new Error("Question text must be at least 5 characters long");
    }

    if (!params.options || params.options.length < 2) {
      throw new Error("Question must have at least 2 options");
    }

    const hasCorrect = params.options.some((o) => o.id === params.correctOptionId);
    if (!hasCorrect) {
      throw new Error("Correct option must be one of the provided options");
    }

    // Server-side duplicate check
    const dupCheck = this.checkDuplicate(cleanedText);
    if (dupCheck.is_exact_duplicate) {
      throw new Error("Exact duplicate question already exists in the system");
    }

    const subj = this.subjects.find((s) => s.id === params.subjectId);

    const newQuestion: Question = {
      id: `q-usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      author_id: author.id,
      author_name: author.display_name,
      author_avatar: author.avatar_url,
      examination_id: params.examinationId || "exam-ssc-cgl",
      subject_id: params.subjectId,
      subject_name: subj?.name || "General",
      subject_slug: subj?.slug || "general",
      question_text: cleanedText,
      language: params.language || "en",
      options: params.options,
      correct_option_id: params.correctOptionId,
      explanation: params.explanation?.trim() || undefined,
      difficulty: params.difficulty || "medium",
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

    // Subject breakdown
    const subjectMap = new Map<string, { attempts: number; correct: number; totalTimeMs: number }>();
    this.subjects.forEach((s) => {
      subjectMap.set(s.id, { attempts: 0, correct: 0, totalTimeMs: 0 });
    });

    for (const a of periodAttempts) {
      const q = this.questions.find((item) => item.id === a.question_id);
      if (q && subjectMap.has(q.subject_id)) {
        const stat = subjectMap.get(q.subject_id)!;
        stat.attempts += 1;
        if (a.is_correct) stat.correct += 1;
        stat.totalTimeMs += a.response_time_ms;
      }
    }

    const subjectsStat = this.subjects.map((s) => {
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
}

// Global singleton instance
const globalStore = new DataStore();
export const db = globalStore;

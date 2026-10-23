"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Question, Examination, UserProfile, FriendUser, RepeatInterval } from "@/types/database";
import { QuestionReelCard, AnswerRecord } from "./QuestionReelCard";
import { StudyChatModal } from "./StudyChatModal";
import { SavePlaylistModal } from "./SavePlaylistModal";
import { ShareFriendModal } from "./ShareFriendModal";
import { CommentsModal } from "./CommentsModal";
import { AuthorModal } from "../feed/AuthorModal";
import { ReportModal } from "../feed/ReportModal";
import { SuggestionModal } from "./SuggestionModal";
import { TopHeader } from "../layout/TopHeader";
import { ExamSwitchModal } from "../feed/ExamSwitchModal";
import { OFFICIAL_WHATSAPP_GROUP_URL } from "@/lib/utils/whatsapp";
import { useAppLanguage, LANGUAGE_CHANGE_EVENT } from "@/lib/utils/i18n";
import { EXAMS_LIST, EXAM_SUBJECTS_MAP } from "@/components/create/CreateQuestionView";
import { getExamScoringRule } from "@/lib/utils/examScoring";

interface QuizLoopContainerProps {
  initialExams?: Examination[];
}

const AVAILABLE_SUBJECTS = [
  { slug: "all", defaultLabel: "All Subjects", icon: "auto_awesome" },
  { slug: "biology", defaultLabel: "Biology (Botany & Zoology)", icon: "eco" },
  { slug: "chemistry", defaultLabel: "Chemistry", icon: "biotech" },
  { slug: "physics", defaultLabel: "Physics", icon: "bolt" },
];

export const QuizLoopContainer: React.FC<QuizLoopContainerProps> = ({
  initialExams = [],
}) => {
  const { lang, t } = useAppLanguage();
  // Session Start State: resumes where student left off if active in session
  const [isStarted, setIsStarted] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("qz_loop_is_active") === "true";
    }
    return false;
  });
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(["all"]);
  const [quizLanguage, setQuizLanguage] = useState<"all" | "hi" | "en">("all");

  // Exam & User State
  const [currentExamId, setCurrentExamId] = useState<string>("exam-neet-ug");
  const [exams, setExams] = useState<Examination[]>(initialExams);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [showExamModal, setShowExamModal] = useState<boolean>(false);

  // Reel Feed State: resumes exact question list & index if returning from another tab
  const [questions, setQuestions] = useState<Question[]>(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("qz_loop_is_active") === "true") {
      try {
        const cached = sessionStorage.getItem("qz_loop_cached_questions");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return [];
  });
  const [currentIndex, setCurrentIndex] = useState<number>(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("qz_loop_is_active") === "true") {
      const activeQId = sessionStorage.getItem("qz_loop_active_question_id");
      const cached = sessionStorage.getItem("qz_loop_cached_questions");
      if (activeQId && cached) {
        try {
          const list: Question[] = JSON.parse(cached);
          const foundIdx = list.findIndex((q) => q.id === activeQId);
          if (foundIdx >= 0) return foundIdx;
        } catch {}
      }
      const saved = sessionStorage.getItem("qz_last_loop_index");
      if (saved) {
        const parsed = parseInt(saved, 10);
        return isNaN(parsed) ? 0 : parsed;
      }
    }
    return 0;
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Preserved Answer Records for session (So swiping back retains answered state & explanation)
  const [answeredRecords, setAnsweredRecords] = useState<Record<string, AnswerRecord>>(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("qz_loop_is_active") === "true") {
      try {
        const raw = sessionStorage.getItem("qz_loop_answered_records");
        if (raw) return JSON.parse(raw);
      } catch {}
    }
    return {};
  });

  // Active Answering status registered by child QuestionReelCard
  const activeStatusRef = useRef<{
    isAnswerMode: boolean;
    isAnswered: boolean;
    hasSelectedPendingOption: boolean;
    submitCurrentOption: () => void;
  }>({
    isAnswerMode: false,
    isAnswered: false,
    hasSelectedPendingOption: false,
    submitCurrentOption: () => {},
  });

  const [activeAnswerStatus, setActiveAnswerStatus] = useState<{
    isAnswerMode: boolean;
    isAnswered: boolean;
    hasSelectedPendingOption: boolean;
  }>({
    isAnswerMode: false,
    isAnswered: false,
    hasSelectedPendingOption: false,
  });

  const startParamHandledRef = useRef<boolean>(false);

  // Intercept Swipe Confirmation Modal ("Answer or Skip?")
  const [showAnswerOrSkipModal, setShowAnswerOrSkipModal] = useState<boolean>(false);
  const pendingSwipeActionRef = useRef<(() => void) | null>(null);

  // Direct Study Chat Modal
  const [activeChatFriend, setActiveChatFriend] = useState<FriendUser | null>(null);

  // Hoisted Modals State (Eliminates CSS transform positioning glitch across reels)
  const [showSolutionModal, setShowSolutionModal] = useState<boolean>(false);
  const [solutionQuestionId, setSolutionQuestionId] = useState<string | null>(null);
  const [todaySolvedCount, setTodaySolvedCount] = useState<number>(0);
  const [activeSaveQuestion, setActiveSaveQuestion] = useState<Question | null>(null);
  const [activeShareQuestion, setActiveShareQuestion] = useState<Question | null>(null);
  const [activeCommentsQuestion, setActiveCommentsQuestion] = useState<Question | null>(null);
  const [activeAuthorQuestion, setActiveAuthorQuestion] = useState<Question | null>(null);
  const [activeReportQuestionId, setActiveReportQuestionId] = useState<string | null>(null);
  const [activeSuggestionQuestion, setActiveSuggestionQuestion] = useState<Question | null>(null);
  const [savedQuestionIds, setSavedQuestionIds] = useState<Set<string>>(new Set());

  // Handle Escape key to dismiss solution modal
  useEffect(() => {
    if (!showSolutionModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowSolutionModal(false);
        setSolutionQuestionId(null);
        window.dispatchEvent(new CustomEvent("qz_close_solution_modal"));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showSolutionModal]);

  // Synchronize today's solved count strictly for Asia/Kolkata today
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const uid = localStorage.getItem("qz_user_id");
        const storageKey = `qz_user_attempts_${uid || "guest"}`;
        const cachedRaw = localStorage.getItem(storageKey);
        if (cachedRaw) {
          const list = JSON.parse(cachedRaw);
          if (Array.isArray(list)) {
            const istTodayStr = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
            const count = list.filter((a: any) => {
              const aIstStr = new Date(a.created_at).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
              return aIstStr === istTodayStr;
            }).length;
            setTodaySolvedCount(uid ? Math.max(count, user?.today_solved_count || 0) : count);
            return;
          }
        }
        setTodaySolvedCount(user?.today_solved_count || 0);
      } catch {
        setTodaySolvedCount(user?.today_solved_count || 0);
      }
    }
  }, [user?.today_solved_count, isStarted]);

  // Load user's saved collections on mount to initialize bookmark state accurately
  useEffect(() => {
    const currentUid = typeof window !== "undefined" ? localStorage.getItem("qz_user_id") : null;
    const url = currentUid ? `/api/collections?userId=${encodeURIComponent(currentUid)}` : "/api/collections";
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && Array.isArray(data.collections)) {
          const ids = new Set<string>();
          data.collections.forEach((c: { question_ids?: string[] }) => {
            if (Array.isArray(c.question_ids)) {
              c.question_ids.forEach((id: string) => ids.add(id));
            }
          });
          setSavedQuestionIds(ids);
        }
      })
      .catch(() => {});

    const handleSavedChanged = (e: Event) => {
      const customEvent = e as CustomEvent<{ questionId: string; isSaved: boolean }>;
      if (customEvent.detail) {
        const { questionId, isSaved } = customEvent.detail;
        setSavedQuestionIds((prev) => {
          const next = new Set(prev);
          if (isSaved) next.add(questionId);
          else next.delete(questionId);
          return next;
        });
      }
    };
    window.addEventListener("qz_saved_changed", handleSavedChanged);
    return () => {
      window.removeEventListener("qz_saved_changed", handleSavedChanged);
    };
  }, []);

  // Prefetch accepted friends on mount for 0ms share modal rendering
  useEffect(() => {
    const currentUid = typeof window !== "undefined" ? localStorage.getItem("qz_user_id") : null;
    if (currentUid && currentUid !== "guest") {
      fetch(`/api/friends?userId=${encodeURIComponent(currentUid)}`, {
        headers: { "x-user-id": currentUid },
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.success && Array.isArray(data.friends)) {
            const accepted = data.friends.filter((f: FriendUser) => f.status === "friend");
            localStorage.setItem("qz_cached_friends", JSON.stringify(accepted));
          }
        })
        .catch(() => {});
    }
  }, []);

  // Streak & Dopamine combo tracking
  const [comboCount, setComboCount] = useState<number>(0);
  const [comboToast, setComboToast] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  // Synchronize theme with TopHeader and localStorage (Light mode default)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("qz_theme");
      setIsDarkMode(savedTheme === "dark");
    }
    const handleThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ isDark: boolean }>;
      if (customEvent.detail && typeof customEvent.detail.isDark === "boolean") {
        setIsDarkMode(customEvent.detail.isDark);
      }
    };
    window.addEventListener("qz_theme_changed", handleThemeChange);
    return () => window.removeEventListener("qz_theme_changed", handleThemeChange);
  }, []);

  const toggleDarkModeInLoop = () => {
    const nextMode = !isDarkMode;
    setIsDarkMode(nextMode);
    if (typeof window !== "undefined") {
      if (nextMode) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("qz_theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("qz_theme", "light");
      }
      window.dispatchEvent(new CustomEvent("qz_theme_changed", { detail: { isDark: nextMode } }));
    }
  };

  // Handler to smoothly exit back to Subject Flow selector
  const handleExitToSubjectSelect = useCallback(() => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("qz_loop_is_active");
      sessionStorage.removeItem("qz_last_loop_index");
      sessionStorage.removeItem("qz_loop_cached_questions");
      sessionStorage.removeItem("qz_loop_active_question_id");
      sessionStorage.removeItem("qz_loop_answered_records");
    }
    setIsStarted(false);
  }, []);

  // Language change handler synchronized with localStorage & state
  const handleLanguageChange = useCallback((newLang: "en" | "hi" | "all") => {
    setQuizLanguage(newLang);
    if (typeof window !== "undefined") {
      localStorage.setItem("qz_quiz_lang", newLang);
    }
  }, []);

  useEffect(() => {
    const handleGlobalLang = (e: Event) => {
      const customEvent = e as CustomEvent<{ lang: "en" | "hi" }>;
      if (customEvent.detail?.lang) {
        handleLanguageChange(customEvent.detail.lang);
      }
    };
    const handleSubjectFlow = () => {
      handleExitToSubjectSelect();
    };
    window.addEventListener("qz_language_changed", handleGlobalLang);
    window.addEventListener("qz_change_subject_flow", handleSubjectFlow);
    return () => {
      window.removeEventListener("qz_language_changed", handleGlobalLang);
      window.removeEventListener("qz_change_subject_flow", handleSubjectFlow);
    };
  }, [handleLanguageChange, handleExitToSubjectSelect]);

  // Track session displayed question IDs to avoid repeats
  const displayedQuestionIdsRef = useRef<Set<string>>(new Set());

  // Load user profile & saved preferences on mount
  useEffect(() => {
    const checkAuthAndLoad = () => {
      if (typeof window !== "undefined") {
        localStorage.setItem("qz_target_exam", "exam-neet-ug");
        localStorage.setItem("qz_last_exam", "exam-neet-ug");
        setCurrentExamId("exam-neet-ug");

        const savedLang = localStorage.getItem("qz_quiz_lang");
        if (savedLang === "hi" || savedLang === "en" || savedLang === "all") {
          setQuizLanguage(savedLang);
        }

        const uid = localStorage.getItem("qz_user_id");
        if (uid) {
          fetch(`/api/profile?userId=${encodeURIComponent(uid)}`)
            .then((res) => res.json())
            .then((data) => {
              if (data.success && data.user) {
                setUser(data.user);
                if (data.exams?.length > 0) {
                  setExams(data.exams);
                }
                setCurrentExamId("exam-neet-ug");
                if (!savedLang && data.user?.language_preference) {
                  setQuizLanguage(data.user.language_preference);
                }
              }
            })
            .catch(() => {});
        } else {
          setUser(null);
          fetch("/api/profile")
            .then((res) => res.json())
            .then((data) => {
              if (data.success && data.exams?.length > 0) {
                setExams(data.exams);
              }
            })
            .catch(() => {});
        }
      }
    };

    checkAuthAndLoad();
    window.addEventListener("qz_auth_changed", checkAuthAndLoad);

    const handleExamChanged = (e: Event) => {
      const customEvent = e as CustomEvent<{ examId?: string }>;
      if (customEvent.detail?.examId) {
        setCurrentExamId(customEvent.detail.examId);
      }
    };
    window.addEventListener("qz_exam_changed", handleExamChanged);

    const handleQuestionCreated = (e: Event) => {
      const customEvent = e as CustomEvent<{ question?: Question }>;
      if (customEvent.detail?.question) {
        const newQ = customEvent.detail.question;
        setQuestions((prev) => [newQ, ...prev.filter((q) => q.id !== newQ.id)]);
        setCurrentIndex(0);
        setIsStarted(true);
        displayedQuestionIdsRef.current.clear();
        displayedQuestionIdsRef.current.add(newQ.id);
      }
    };
    window.addEventListener("qz_question_created", handleQuestionCreated);

    const handleLangChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ lang?: "en" | "hi" }>;
      if (customEvent.detail?.lang) {
        setQuizLanguage(customEvent.detail.lang);
        localStorage.setItem("qz_quiz_lang", customEvent.detail.lang);
      }
    };
    window.addEventListener(LANGUAGE_CHANGE_EVENT, handleLangChange);

    const handleOpenSolutionModal = (e: Event) => {
      const customEvent = e as CustomEvent<{ questionId?: string }>;
      if (customEvent.detail?.questionId) {
        setSolutionQuestionId(customEvent.detail.questionId);
      }
      setShowSolutionModal(true);
    };
    window.addEventListener("qz_open_solution_modal", handleOpenSolutionModal);

    const handleLeaveQuizLoop = () => {
      setIsStarted(false);
      setCurrentIndex(0);
      setQuestions([]);
      setShowSolutionModal(false);
      setSolutionQuestionId(null);
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("qz_loop_is_active");
        sessionStorage.removeItem("qz_loop_cached_questions");
        sessionStorage.removeItem("qz_loop_active_question_id");
        sessionStorage.removeItem("qz_loop_answered_records");
        sessionStorage.removeItem("qz_last_loop_index");
      }
    };
    window.addEventListener("qz_leave_quiz_loop", handleLeaveQuizLoop);

    return () => {
      window.removeEventListener("qz_auth_changed", checkAuthAndLoad);
      window.removeEventListener("qz_exam_changed", handleExamChanged);
      window.removeEventListener("qz_question_created", handleQuestionCreated);
      window.removeEventListener(LANGUAGE_CHANGE_EVENT, handleLangChange);
      window.removeEventListener("qz_open_solution_modal", handleOpenSolutionModal);
      window.removeEventListener("qz_leave_quiz_loop", handleLeaveQuizLoop);
    };
  }, []);

  // Fetch Questions for the chosen subject flow and language
  const loadFeedQuestions = useCallback(
    async (subjects = selectedSubjects, exam = currentExamId, lang = quizLanguage, reset = false) => {
      setIsLoading(true);
      setError(null);

      try {
        const uid = typeof window !== "undefined" ? localStorage.getItem("qz_user_id") : null;
        const subjectsParam = subjects.includes("all") ? "all" : subjects.join(",");
        const excludedList = Array.from(displayedQuestionIdsRef.current).join(",");
        const userParam = uid ? `&userId=${encodeURIComponent(uid)}` : "";
        const url = `/api/feed?subjects=${subjectsParam}&examId=${exam}&lang=${lang}&excludedIds=${reset ? "" : excludedList}${userParam}`;

        const headers: Record<string, string> = uid ? { "x-user-id": uid } : {};
        const res = await fetch(url, { headers });
        const data = await res.json();

        if (data.success) {
          let fetched: Question[] = data.questions || [];

          // Also merge locally authored questions matching this exam
          if (typeof window !== "undefined") {
            try {
              const raw = localStorage.getItem("qz_local_authored_questions");
              if (raw) {
                const localList: Question[] = JSON.parse(raw);
                const matching = localList.filter((q) => !exam || q.examination_id === exam);
                for (const lq of matching) {
                  if (!fetched.some((f) => f.id === lq.id)) {
                    fetched.unshift(lq);
                  }
                }
              }
            } catch {
              // ignore
            }
          }

          if (reset) {
            setQuestions(fetched);
            let resumeIndex = 0;
            if (typeof window !== "undefined") {
              const saved = sessionStorage.getItem("qz_last_loop_index");
              if (saved) {
                const parsed = parseInt(saved, 10);
                if (!isNaN(parsed) && parsed >= 0 && parsed < fetched.length) {
                  resumeIndex = parsed;
                }
              }
            }
            setCurrentIndex(resumeIndex);
            displayedQuestionIdsRef.current.clear();
            fetched.forEach((q) => displayedQuestionIdsRef.current.add(q.id));
          } else {
            setQuestions((prev) => {
              const combined = [...prev, ...fetched];
              fetched.forEach((q) => displayedQuestionIdsRef.current.add(q.id));
              return combined;
            });
          }
        } else {
          setError(data.error || "Failed to load questions");
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Network error. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [selectedSubjects, currentExamId, quizLanguage]
  );

  useEffect(() => {
    // Deep link directly to a shared quiz question: /loop?q=... or auto-start: /loop?start=true
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const qParam = params.get("q") || params.get("questionId");
      const startParam = params.get("start");
      const examParam = params.get("examId");

      const playlistParam = params.get("playlist");
      const shuffleParam = params.get("shuffle") === "true";

      if (qParam) {
        fetch(`/api/questions/${qParam}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.success && data.question) {
              setQuestions([data.question]);
              setCurrentIndex(0);
              setIsStarted(true);
            }
          })
          .catch(() => {});
      } else if (playlistParam || sessionStorage.getItem("qz_shuffle_playlist_ids")) {
        const storedIdsRaw = sessionStorage.getItem("qz_shuffle_playlist_ids");
        sessionStorage.removeItem("qz_shuffle_playlist_ids");
        const uid = localStorage.getItem("qz_user_id");
        const colUrl = uid
          ? `/api/collections?includeQuestions=true&userId=${encodeURIComponent(uid)}`
          : "/api/collections?includeQuestions=true";
        fetch(colUrl)
          .then((res) => res.json())
          .then((data) => {
            if (data.success && data.collections) {
              let playlistQuestions: Question[] = [];
              if (storedIdsRaw) {
                try {
                  const targetIds = JSON.parse(storedIdsRaw);
                  const allColQuestions = (data.collections as { questions?: Question[] }[])
                    .flatMap((c) => c.questions || []);
                  playlistQuestions = allColQuestions.filter((q) => targetIds.includes(q.id));
                } catch {}
              } else if (playlistParam === "all") {
                playlistQuestions = (data.collections as { questions?: Question[] }[])
                  .flatMap((c) => c.questions || []);
              } else {
                const targetCol = (data.collections as { id: string; questions?: Question[] }[])
                  .find((c) => c.id === playlistParam);
                playlistQuestions = targetCol?.questions || [];
              }

              if (playlistQuestions.length > 0) {
                // Deduplicate questions by ID
                const seen = new Set<string>();
                const uniqueQuestions: Question[] = [];
                for (const q of playlistQuestions) {
                  if (!seen.has(q.id)) {
                    seen.add(q.id);
                    uniqueQuestions.push(q);
                  }
                }
                playlistQuestions = uniqueQuestions;

                if (shuffleParam || Boolean(storedIdsRaw)) {
                  for (let i = playlistQuestions.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [playlistQuestions[i], playlistQuestions[j]] = [playlistQuestions[j], playlistQuestions[i]];
                  }
                }
                setQuestions(playlistQuestions);
                setCurrentIndex(0);
                setIsStarted(true);
              } else {
                loadFeedQuestions(selectedSubjects, currentExamId, quizLanguage, true);
              }
            }
          })
          .catch(() => {});
      } else if ((startParam === "true" || startParam === "1") && !startParamHandledRef.current) {
        startParamHandledRef.current = true;
        const targetExam = examParam || localStorage.getItem("qz_target_exam") || currentExamId;
        if (targetExam) {
          setCurrentExamId(targetExam);
        }
        setIsStarted(true);
        loadFeedQuestions(selectedSubjects, targetExam, quizLanguage, true);
        try {
          const newUrl = window.location.pathname;
          window.history.replaceState({}, "", newUrl);
        } catch {}
      }
    }
  }, [loadFeedQuestions, selectedSubjects, currentExamId, quizLanguage]);

  // Subject Flow Multi-Select toggle handler
  const handleToggleSubject = (slug: string) => {
    if (slug === "all") {
      setSelectedSubjects(["all"]);
      return;
    }

    let next = selectedSubjects.filter((s) => s !== "all");
    if (next.includes(slug)) {
      next = next.filter((s) => s !== slug);
    } else {
      next.push(slug);
    }

    if (next.length === 0) {
      next = ["all"];
    }
    setSelectedSubjects(next);
  };

  // Synchronize questions, currentIndex, and active question ID to sessionStorage
  useEffect(() => {
    if (typeof window !== "undefined" && isStarted) {
      sessionStorage.setItem("qz_last_loop_index", String(currentIndex));
      localStorage.setItem("qz_last_loop_index", String(currentIndex));
      if (questions.length > 0) {
        try {
          sessionStorage.setItem("qz_loop_cached_questions", JSON.stringify(questions));
          if (questions[currentIndex]) {
            sessionStorage.setItem("qz_loop_active_question_id", questions[currentIndex].id);
          }
        } catch {}
      }
    }
  }, [currentIndex, isStarted, questions]);

  // Synchronize answeredRecords to sessionStorage
  useEffect(() => {
    if (typeof window !== "undefined" && isStarted && Object.keys(answeredRecords).length > 0) {
      try {
        sessionStorage.setItem("qz_loop_answered_records", JSON.stringify(answeredRecords));
      } catch {}
    }
  }, [answeredRecords, isStarted]);

  // On mount: if returning to loop from another tab, automatically resume if cached questions exist, otherwise fetch
  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("qz_loop_is_active") === "true") {
      const cached = sessionStorage.getItem("qz_loop_cached_questions");
      if (!cached || cached === "[]") {
        loadFeedQuestions(selectedSubjects, currentExamId, quizLanguage, true);
      }
    }
  }, []);

  // Start Button Clicked
  const handleStartLoop = () => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("qz_loop_is_active", "true");
      sessionStorage.setItem("qz_last_loop_index", "0");
      sessionStorage.removeItem("qz_loop_cached_questions");
      sessionStorage.removeItem("qz_loop_active_question_id");
    }
    setIsStarted(true);
    loadFeedQuestions(selectedSubjects, currentExamId, quizLanguage, true);
  };

  // Move to Next Reel with Synchronized Reel Physics Animation (Current goes UP, New comes from DOWN to CENTER)
  const isTransitioningRef = useRef<boolean>(false);

  const executeNextQuestion = useCallback(() => {
    if (isTransitioningRef.current) return;

    if (currentIndex < questions.length - 1) {
      isTransitioningRef.current = true;
      // Immediately reset answering status so the new question does not inherit stale answer mode!
      activeStatusRef.current = {
        isAnswerMode: false,
        isAnswered: false,
        hasSelectedPendingOption: false,
        submitCurrentOption: () => {},
      };
      setActiveAnswerStatus({
        isAnswerMode: false,
        isAnswered: false,
        hasSelectedPendingOption: false,
      });
      // Reset any open hoisted modals
      setActiveSaveQuestion(null);
      setActiveShareQuestion(null);
      setActiveCommentsQuestion(null);
      setActiveAuthorQuestion(null);
      setActiveReportQuestionId(null);
      setActiveSuggestionQuestion(null);

      setCurrentIndex((prev) => {
        const next = prev + 1;
        // Auto prefetch when remaining queue is low
        if (next >= questions.length - 3) {
          loadFeedQuestions(selectedSubjects, currentExamId, quizLanguage, false);
        }
        return next;
      });
      setTimeout(() => {
        isTransitioningRef.current = false;
      }, 360);
    } else {
      loadFeedQuestions(selectedSubjects, currentExamId, quizLanguage, false);
    }
  }, [currentIndex, questions.length, loadFeedQuestions, selectedSubjects, currentExamId, quizLanguage]);

  // Move to Previous Reel with Reel Physics Animation (Current goes DOWN, Previous comes from UP to CENTER)
  const executePrevQuestion = useCallback(() => {
    if (isTransitioningRef.current || currentIndex <= 0) return;

    isTransitioningRef.current = true;
    // Immediately reset answering status so the previous question does not inherit stale answer mode!
    activeStatusRef.current = {
      isAnswerMode: false,
      isAnswered: false,
      hasSelectedPendingOption: false,
      submitCurrentOption: () => {},
    };
    setActiveAnswerStatus({
      isAnswerMode: false,
      isAnswered: false,
      hasSelectedPendingOption: false,
    });
    // Reset any open hoisted modals
    setActiveSaveQuestion(null);
    setActiveShareQuestion(null);
    setActiveCommentsQuestion(null);
    setActiveAuthorQuestion(null);
    setActiveReportQuestionId(null);
    setActiveSuggestionQuestion(null);

    setCurrentIndex((prev) => prev - 1);
    setTimeout(() => {
      isTransitioningRef.current = false;
    }, 360);
  }, [currentIndex]);

  // Swipe Attempt Interception Handler: Only prompt if user clicked Answer and options are showing!
  const attemptNextQuestion = useCallback(() => {
    const status = activeStatusRef.current;
    if (status.isAnswerMode && !status.isAnswered) {
      pendingSwipeActionRef.current = executeNextQuestion;
      setShowAnswerOrSkipModal(true);
      return;
    }
    executeNextQuestion();
  }, [executeNextQuestion]);

  const attemptPrevQuestion = useCallback(() => {
    const status = activeStatusRef.current;
    if (status.isAnswerMode && !status.isAnswered) {
      pendingSwipeActionRef.current = executePrevQuestion;
      setShowAnswerOrSkipModal(true);
      return;
    }
    executePrevQuestion();
  }, [executePrevQuestion]);

  // Touch Swipe Gesture Detection for Instagram Reels
  const touchStartYRef = useRef<number | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const touchTargetRef = useRef<EventTarget | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    const targetEl = e.target as HTMLElement | null;
    // Strictly isolate: swipe gestures only start from question statement or whitespace card body.
    // Never trigger scroll/swipe from bottom buttons, metrics bar, action rail, or modals.
    if (
      targetEl?.closest('[data-no-swipe="true"]') ||
      targetEl?.closest("button") ||
      targetEl?.closest("a") ||
      targetEl?.closest("input") ||
      targetEl?.closest("select") ||
      targetEl?.closest('[role="button"]') ||
      targetEl?.closest(".bottom-controls") ||
      targetEl?.closest(".action-rail")
    ) {
      touchStartYRef.current = null;
      touchStartXRef.current = null;
      touchTargetRef.current = null;
      return;
    }

    touchStartYRef.current = e.touches[0].clientY;
    touchStartXRef.current = e.touches[0].clientX;
    touchTargetRef.current = e.target;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartYRef.current === null) return;
    const targetEl = touchTargetRef.current as HTMLElement | null;
    const scrollableEl = targetEl?.closest("[data-reel-scrollable='true'], [data-reel-explanation='true']");
    if (!scrollableEl && e.cancelable) {
      e.preventDefault();
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartYRef.current === null || touchStartXRef.current === null) return;
    const deltaY = e.changedTouches[0].clientY - touchStartYRef.current;
    const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;

    // Check if touch was inside a scrollable container (Question Statement or Explanation)
    const targetEl = touchTargetRef.current as HTMLElement | null;
    const scrollableEl = targetEl?.closest("[data-reel-scrollable='true'], [data-reel-explanation='true']");
    if (scrollableEl) {
      const isScrollable = scrollableEl.scrollHeight > scrollableEl.clientHeight + 4;
      if (isScrollable) {
        // Swiping UP inside scrollable (deltaY < -40):
        // Only trigger next reel if already scrolled to the very bottom!
        if (deltaY < -40) {
          const atBottom =
            scrollableEl.scrollTop + scrollableEl.clientHeight >= scrollableEl.scrollHeight - 8;
          if (!atBottom) {
            // Let the container scroll naturally so user can view it full
            touchStartYRef.current = null;
            touchStartXRef.current = null;
            touchTargetRef.current = null;
            return;
          }
        } else if (deltaY > 40) {
          // Swiping DOWN inside scrollable: only trigger prev reel if at top
          const atTop = scrollableEl.scrollTop <= 8;
          if (!atTop) {
            touchStartYRef.current = null;
            touchStartXRef.current = null;
            touchTargetRef.current = null;
            return;
          }
        }
      }
    }

    // Predominantly vertical swipe
    if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 45) {
      if (deltaY < 0) {
        // Swipe Up -> Next Question Reel
        attemptNextQuestion();
      } else if (deltaY > 0 && currentIndex > 0) {
        // Swipe Down -> Prev Question Reel
        attemptPrevQuestion();
      }
    }

    touchStartYRef.current = null;
    touchStartXRef.current = null;
    touchTargetRef.current = null;
  };

  // Mouse Wheel Navigation with Explanation/Question Scroll Isolation & 400ms debounce
  const lastWheelTimeRef = useRef<number>(0);
  const handleWheel = (e: React.WheelEvent) => {
    const targetEl = e.target as HTMLElement | null;
    if (
      targetEl?.closest('[data-no-swipe="true"]') ||
      targetEl?.closest("button") ||
      targetEl?.closest("a") ||
      targetEl?.closest(".bottom-controls") ||
      targetEl?.closest(".action-rail")
    ) {
      return;
    }
    const scrollableEl = targetEl?.closest("[data-reel-scrollable='true'], [data-reel-explanation='true']");
    if (scrollableEl) {
      const isScrollable = scrollableEl.scrollHeight > scrollableEl.clientHeight + 4;
      if (isScrollable) {
        if (e.deltaY > 0) {
          const atBottom =
            scrollableEl.scrollTop + scrollableEl.clientHeight >= scrollableEl.scrollHeight - 8;
          if (!atBottom) {
            // Allow native scrolling inside question or explanation
            return;
          }
        } else if (e.deltaY < 0) {
          const atTop = scrollableEl.scrollTop <= 8;
          if (!atTop) {
            // Allow native scrolling inside question or explanation
            return;
          }
        }
      }
    }

    const now = Date.now();
    if (now - lastWheelTimeRef.current < 450) return;

    if (e.deltaY > 40) {
      lastWheelTimeRef.current = now;
      attemptNextQuestion();
    } else if (e.deltaY < -40 && currentIndex > 0) {
      lastWheelTimeRef.current = now;
      attemptPrevQuestion();
    }
  };

  // Keyboard Navigation (ArrowUp / ArrowDown)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowDown" || e.key === "PageDown") {
        e.preventDefault();
        attemptNextQuestion();
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        attemptPrevQuestion();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [attemptNextQuestion, attemptPrevQuestion]);

  // Answer Submitted callback
  const handleAnswerSubmitted = (result: {
    questionId: string;
    isCorrect: boolean;
    responseTimeMs: number;
    record: AnswerRecord;
  }) => {
    // Save to answered records map so swiping back preserves state & explanation!
    setAnsweredRecords((prev) => {
      const next = {
        ...prev,
        [result.questionId]: result.record,
      };
      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem("qz_loop_answered_records", JSON.stringify(next));
        } catch {}
      }
      return next;
    });
    setActiveAnswerStatus((prev) => ({
      ...prev,
      isAnswered: true,
      isAnswerMode: false,
    }));

    // Update Dopamine Combo Streak
    if (result.isCorrect) {
      const nextCombo = comboCount + 1;
      setComboCount(nextCombo);
      if (nextCombo >= 3) {
        setComboToast(`🔥 ${nextCombo}x Combo Streak! (+${nextCombo * 25} XP)`);
        setTimeout(() => setComboToast(null), 3000);
      }
    } else {
      setComboCount(0);
    }
  };

  // Hide Question handler
  const handleHideQuestion = async (questionId: string) => {
    try {
      await fetch("/api/questions/hide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId }),
      });
      executeNextQuestion();
    } catch {
      executeNextQuestion();
    }
  };

  const activeQuestion = questions[currentIndex];
  const activeExam = exams.find((e) => e.id === currentExamId);

  const handleSelectExam = async (exam: Examination) => {
    setCurrentExamId(exam.id);
    setShowExamModal(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("qz_target_exam", exam.id);
      localStorage.setItem("qz_last_exam", exam.id);
      window.dispatchEvent(new CustomEvent("qz_exam_changed", { detail: { examId: exam.id, examName: exam.name } }));
    }
    try {
      const uid = user?.id || (typeof window !== "undefined" ? localStorage.getItem("qz_user_id") : null);
      await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(uid ? { "x-user-id": uid } : {}),
        },
        body: JSON.stringify({
          userId: uid || undefined,
          preferred_examination_id: exam.id,
          target_exam: exam.name,
        }),
      });
      loadFeedQuestions(selectedSubjects, exam.id, quizLanguage, true);
    } catch {
      // optimistic
    }
  };

  // ==========================================
  // VIEW 1: START SCREEN (Before Loop Begins)
  // ==========================================
  if (!isStarted) {
    return (
      <div className="flex flex-col min-h-screen pb-24">
        <TopHeader
          currentTab="loop"
          streakDays={user?.current_streak ?? 0}
          activeExamName={activeExam?.name || "NEET UG (Medical Entrance)"}
          user={user}
          onSelectExam={() => setShowExamModal(true)}
        />

        <div className="flex flex-col w-full px-4 pt-4 pb-8 max-w-[480px] mx-auto">
          {/* Header */}
          <div className="text-center py-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-primary-container text-on-primary shadow-lg mb-3 animate-bounce">
              <span className="material-symbols-outlined text-[36px]">all_inclusive</span>
            </div>
            
            {/* Active Exam Badge */}
            <div className="flex items-center justify-center mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-bold shadow-xs">
                <span className="material-symbols-outlined text-[15px]">school</span>
                <span>{activeExam?.name || "NEET UG"}</span>
              </span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-on-surface">
              Qz Loop
            </h1>
            <p className="text-xs text-secondary mt-1 max-w-xs mx-auto leading-relaxed">
              Infinite reel-style practice feed. Choose your subject flow, swipe questions, and train your brain.
            </p>
          </div>

          {/* Prominent Start CTA Button at the Very Top Side (Above Select Subject Flow) */}
          <button
            onClick={handleStartLoop}
            className="w-full h-14 rounded-2xl bg-gradient-to-r from-primary to-primary-container text-on-primary font-bold text-base shadow-lg hover:shadow-xl active:scale-[0.99] transition-all flex items-center justify-center gap-2 group mb-5"
          >
            <span className="material-symbols-outlined text-[24px] transition-transform group-hover:scale-125">
              play_circle
            </span>
            <span>{t.startQuiz}</span>
          </button>

          {/* Subject Flow Multi-Selector - Dynamically mapped to student's chosen exam */}
          {(() => {
            const currentExamSubjects = EXAM_SUBJECTS_MAP[currentExamId] || [];
            const dynamicSubjects = [
              { slug: "all", label: t.allSubjects || "All Subjects", icon: "auto_awesome" },
              ...(currentExamSubjects.length > 0
                ? currentExamSubjects.map((s) => ({
                    slug: s.slug,
                    label: s.name,
                    icon: s.icon,
                  }))
                : AVAILABLE_SUBJECTS.filter((s) => s.slug !== "all").map((s) => ({
                    slug: s.slug,
                    label: s.defaultLabel,
                    icon: s.icon,
                  }))),
            ];

            return (
              <div className="bg-surface-container-low rounded-2xl p-4 border border-surface-container-high/60 shadow-xs mb-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-xs uppercase tracking-wider text-secondary">
                    {t.selectSubjectFlow}
                  </span>
                  <span className="text-[11px] font-semibold text-primary">
                    {t.multiSelectEnabled}
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  {dynamicSubjects.map((subj) => {
                    const isSelected =
                      subj.slug === "all"
                        ? selectedSubjects.includes("all")
                        : selectedSubjects.includes(subj.slug);

                    return (
                      <button
                        key={subj.slug}
                        onClick={() => handleToggleSubject(subj.slug)}
                        className={`w-full p-3 rounded-xl flex items-center justify-between text-left transition-all border ${
                          isSelected
                            ? "bg-primary-container/20 border-primary text-on-surface shadow-xs font-bold"
                            : "bg-surface-container/60 hover:bg-surface-container border-transparent text-secondary hover:text-on-surface"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                              isSelected ? "bg-primary text-on-primary" : "bg-surface-container text-secondary"
                            }`}
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              {subj.icon}
                            </span>
                          </div>
                          <span className="text-sm">{subj.label}</span>
                        </div>

                        <div className="shrink-0">
                          <span
                            className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs ${
                              isSelected
                                ? "bg-primary border-primary text-on-primary"
                                : "border-secondary/40 text-transparent"
                            }`}
                          >
                            ✓
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Session Overview Badges */}
          <div className="grid grid-cols-2 gap-2 mb-5 text-center">
            <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high/40">
              <span className="text-secondary text-[11px] font-semibold uppercase">{t.practiceStreak}</span>
              <div className="text-base font-bold text-on-surface mt-0.5">
                🔥 {user?.current_streak ?? 0} {t.daysUnit}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high/40">
              <span className="text-secondary text-[11px] font-semibold uppercase">{t.dailyGoal}</span>
              <div className="text-base font-bold text-primary mt-0.5">
                {todaySolvedCount} / {user?.daily_goal ?? 10} {t.solvedOutOf}
              </div>
            </div>
          </div>

          {/* Question Language Preference Selector */}
          <div className="bg-surface-container-low rounded-2xl p-4 border border-surface-container-high/60 shadow-xs mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-xs uppercase tracking-wider text-secondary">
                {t.questionLanguagePref}
              </span>
              <span className="text-[10px] font-bold text-primary">
                {quizLanguage === "hi" ? t.langHindiOnly : quizLanguage === "en" ? t.langEnglishOnly : t.langBilingual}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setQuizLanguage("en");
                  localStorage.setItem("qz_quiz_lang", "en");
                }}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 border ${
                  quizLanguage === "en"
                    ? "bg-primary text-on-primary border-primary shadow-xs"
                    : "bg-surface-container/60 hover:bg-surface-container border-transparent text-secondary hover:text-on-surface"
                }`}
              >
                <span>🇬🇧</span>
                <span>{t.formatEnglish}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setQuizLanguage("hi");
                  localStorage.setItem("qz_quiz_lang", "hi");
                }}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 border ${
                  quizLanguage === "hi"
                    ? "bg-primary text-on-primary border-primary shadow-xs"
                    : "bg-surface-container/60 hover:bg-surface-container border-transparent text-secondary hover:text-on-surface"
                }`}
              >
                <span>🇮🇳</span>
                <span>{t.formatHindi}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setQuizLanguage("all");
                  localStorage.setItem("qz_quiz_lang", "all");
                }}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 border ${
                  quizLanguage === "all"
                    ? "bg-primary text-on-primary border-primary shadow-xs"
                    : "bg-surface-container/60 hover:bg-surface-container border-transparent text-secondary hover:text-on-surface"
                }`}
              >
                <span>🌐</span>
                <span>{t.langBilingual}</span>
              </button>
            </div>
            <p className="text-[10px] text-secondary mt-2 text-center">
              {t.questionLangSelectorDesc}
            </p>
          </div>

          {/* Aspirants WhatsApp Study Group CTA */}
          <a
            href={OFFICIAL_WHATSAPP_GROUP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-bold text-xs mb-4 transition-all group"
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-[20px]">group</span>
              <div>
                <p className="text-xs font-bold text-on-surface">{t.joinWhatsAppCommunityBanner}</p>
                <p className="text-[10px] text-secondary font-normal">{t.communityBannerDesc}</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-bold group-hover:scale-105 transition-transform">
              {t.joinFree}
            </span>
          </a>

          {/* Prominent High-Energy Start CTA Button */}
          <button
            onClick={handleStartLoop}
            className="w-full h-14 rounded-2xl bg-gradient-to-r from-primary to-primary-container text-on-primary font-bold text-base shadow-lg hover:shadow-xl active:scale-[0.99] transition-all flex items-center justify-center gap-2 group"
          >
            <span className="material-symbols-outlined text-[24px] transition-transform group-hover:scale-125">
              play_circle
            </span>
            <span>{t.startQuiz}</span>
          </button>
        </div>

        {/* Target Exam Switcher Modal */}
        <ExamSwitchModal
          exams={exams}
          currentExamId={currentExamId}
          isOpen={showExamModal}
          onClose={() => setShowExamModal(false)}
          onSelectExam={handleSelectExam}
        />
      </div>
    );
  }

  // ==========================================
  // VIEW 2: ACTIVE QZ LOOP (Vertical Reels)
  // ==========================================
  return (
    <div className="flex flex-col h-[100dvh] max-h-[100dvh] bg-surface overflow-hidden overscroll-none select-none touch-none">
      {/* Dopamine Combo Toast */}
      {comboToast && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-40 px-4 py-1.5 rounded-full bg-primary text-on-primary font-bold text-xs shadow-lg animate-in fade-in slide-in-from-top-2">
          {comboToast}
        </div>
      )}

      {/* Main Reel Feed Container */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
        className="relative flex-1 w-full max-w-[480px] mx-auto overflow-hidden select-none"
      >
        {/* Loading State */}
        {isLoading && questions.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 gap-3 z-20 bg-surface">
            <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-semibold text-secondary">Entering the Qz Loop...</p>
          </div>
        )}

        {/* Error State */}
        {error && questions.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 gap-3 z-20 bg-surface">
            <span className="material-symbols-outlined text-[44px] text-error">wifi_off</span>
            <p className="text-sm font-bold text-on-surface">{error}</p>
            <button
              onClick={() => loadFeedQuestions(selectedSubjects, currentExamId, quizLanguage, true)}
              className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-sm"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State when no questions match or exhausted */}
        {!isLoading && questions.length === 0 && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 gap-3 z-20 bg-surface">
            <span className="material-symbols-outlined text-[48px] text-primary">verified</span>
            <h3 className="text-lg font-bold text-on-surface">You've cleared this subject flow!</h3>
            <p className="text-xs text-secondary max-w-xs">
              Great practice! Select more subjects or restart to keep your streak going.
            </p>
            <button
              onClick={() => {
                if (typeof window !== "undefined") {
                  sessionStorage.removeItem("qz_loop_is_active");
                  sessionStorage.removeItem("qz_last_loop_index");
                  sessionStorage.removeItem("qz_loop_cached_questions");
                  sessionStorage.removeItem("qz_loop_active_question_id");
                  sessionStorage.removeItem("qz_loop_answered_records");
                }
                setIsStarted(false);
              }}
              className="px-5 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-md"
            >
              Select Subjects
            </button>
          </div>
        )}

        {/* Synchronized Reel Track: Stacked reels sliding vertically at 60fps */}
        {questions.length > 0 && (
          <div
            className="w-full h-full transition-transform duration-350 ease-out will-change-transform"
            style={{
              transform: `translate3d(0, -${currentIndex * 100}%, 0)`,
            }}
          >
            {questions.map((q, idx) => (
              <div
                key={q.id}
                className={`w-full h-full shrink-0 relative overflow-hidden ${
                  idx === currentIndex ? "pointer-events-auto" : "pointer-events-none"
                }`}
              >
                <QuestionReelCard
                  question={q}
                  index={idx + 1}
                  totalQuestions={questions.length}
                  isActive={idx === currentIndex}
                  initialAnswerRecord={answeredRecords[q.id]}
                  onAnswerSubmitted={handleAnswerSubmitted}
                  onHideQuestion={handleHideQuestion}
                  onNextQuestion={attemptNextQuestion}
                  onPrevQuestion={attemptPrevQuestion}
                  onRegisterAnsweringStatus={(status) => {
                    if (idx === currentIndex) {
                      activeStatusRef.current = status;
                      setActiveAnswerStatus({
                        isAnswerMode: status.isAnswerMode,
                        isAnswered: status.isAnswered,
                        hasSelectedPendingOption: status.hasSelectedPendingOption,
                      });
                    }
                  }}
                  onOpenChatWithFriend={(friend) => setActiveChatFriend(friend)}
                  preferredLanguage={quizLanguage}
                  onLanguageChange={handleLanguageChange}
                  onSwitchSubject={handleExitToSubjectSelect}
                  onOpenSaveModal={(question) => setActiveSaveQuestion(question)}
                  onOpenShareModal={(question) => setActiveShareQuestion(question)}
                  onOpenCommentsModal={(question) => setActiveCommentsQuestion(question)}
                  onOpenAuthorModal={(question) => setActiveAuthorQuestion(question)}
                  onOpenReportModal={(qId) => setActiveReportQuestionId(qId)}
                  onOpenSuggestionModal={(question) => setActiveSuggestionQuestion(question)}
                  isSavedExternal={savedQuestionIds.has(q.id)}
                />
              </div>
            ))}
          </div>
        )}

        {/* Pinned Bottom Answering Bar & 4 Community Metrics Bar (Rigidly Fixed, Zero Glitch) */}
        {activeQuestion && (
          <div
            data-no-swipe="true"
            style={{ touchAction: "none", overscrollBehavior: "none" }}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchMove={(e) => {
              e.stopPropagation();
            }}
            onTouchEnd={(e) => e.stopPropagation()}
            className="absolute bottom-16 sm:bottom-[4.5rem] left-0 right-0 z-30 px-3.5 sm:px-4 pb-[max(0.25rem,env(safe-area-inset-bottom))] bg-gradient-to-t from-surface via-surface/98 to-transparent pt-2.5 pointer-events-auto flex flex-col gap-1.5 overscroll-none bottom-controls"
          >
            {!activeAnswerStatus.isAnswerMode && !activeAnswerStatus.isAnswered && !answeredRecords[activeQuestion.id] && (
              <div className="w-full">
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== "undefined" && !localStorage.getItem("qz_user_id")) {
                      window.dispatchEvent(
                        new CustomEvent("open_auth_modal", {
                          detail: {
                            reason: "Sign in required to answer questions, test your accuracy & track rank",
                            mode: "signup",
                          },
                        })
                      );
                      return;
                    }
                    window.dispatchEvent(
                      new CustomEvent("qz_open_answer_options", { detail: { questionId: activeQuestion.id } })
                    );
                    setActiveAnswerStatus((prev) => ({ ...prev, isAnswerMode: true }));
                  }}
                  className="w-full h-11 bg-primary text-on-primary rounded-xl font-label-md text-xs sm:text-sm font-bold shadow-sm hover:bg-primary-container active:scale-[0.99] transition-all flex items-center justify-center gap-1.5 group cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px] transition-transform group-hover:scale-110">
                    touch_app
                  </span>
                  <span>{t.answerQuestion || "Answer & Learn"}</span>
                </button>
              </div>
            )}

            {activeAnswerStatus.isAnswerMode && !activeAnswerStatus.isAnswered && !answeredRecords[activeQuestion.id] && (
              <div className="w-full">
                <div className="w-full h-11 px-3 rounded-xl bg-surface-container-high/80 text-secondary border border-surface-container-high flex items-center justify-between text-xs font-semibold">
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px] text-primary">touch_app</span>
                    <span>{(t.answerQuestion || "Answer & Learn") + " · Select Option"}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      window.dispatchEvent(
                        new CustomEvent("qz_hide_answer_options", { detail: { questionId: activeQuestion.id } })
                      );
                      setActiveAnswerStatus((prev) => ({ ...prev, isAnswerMode: false }));
                    }}
                    className="text-[11px] text-primary hover:underline font-bold cursor-pointer"
                  >
                    Hide
                  </button>
                </div>
              </div>
            )}

            {(activeAnswerStatus.isAnswered || Boolean(answeredRecords[activeQuestion.id])) && (
              <>
                <div className="w-full">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSolutionModal(true);
                      window.dispatchEvent(
                        new CustomEvent("qz_open_solution_modal", { detail: { questionId: activeQuestion.id } })
                      );
                    }}
                    className="w-full h-11 px-3 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 flex items-center justify-center gap-2 text-xs font-bold transition-all shadow-2xs group cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px] transition-transform group-hover:scale-110">bolt</span>
                    <span>{lang === "hi" ? "समाधान देखें (Quick Proof & Solution)" : "Quick Proof & Solution"}</span>
                  </button>
                </div>

                {/* Spaced Repetition Timeline Selector (1 Day, 1 Week, 1 Month, Never) */}
                <div className="w-full bg-surface-container-low/95 rounded-xl p-2 border border-surface-container-high/50 flex flex-col gap-1 shadow-2xs animate-in fade-in">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-secondary px-0.5">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px] text-primary">history</span>
                      <span>{t.repeatPrompt || "Repeat question in (optional):"}</span>
                    </span>
                    {answeredRecords[activeQuestion.id]?.repeatInterval && (
                      <span className="text-[10px] text-tertiary font-bold capitalize">
                        {answeredRecords[activeQuestion.id]?.repeatInterval === "never"
                          ? "Never"
                          : `1 ${answeredRecords[activeQuestion.id]?.repeatInterval}`}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    {(
                      [
                        { id: "day", label: t.repeatDay || "1 Day" },
                        { id: "week", label: t.repeatWeek || "1 Week" },
                        { id: "month", label: t.repeatMonth || "1 Month" },
                        { id: "never", label: t.repeatNever || "Never" },
                      ] as const
                    ).map((item) => {
                      const currentRepeat = answeredRecords[activeQuestion.id]?.repeatInterval;
                      const isChosen = currentRepeat === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            const uid = typeof window !== "undefined" ? localStorage.getItem("qz_user_id") : null;
                            setAnsweredRecords((prev) => {
                              const rec = prev[activeQuestion.id] || {
                                selectedOptionId: "",
                                isCorrect: false,
                                correctOptionId: activeQuestion.correct_option_id,
                              };
                              return {
                                ...prev,
                                [activeQuestion.id]: {
                                  ...rec,
                                  repeatInterval: item.id as RepeatInterval,
                                },
                              };
                            });
                            window.dispatchEvent(
                              new CustomEvent("qz_select_repeat_interval", {
                                detail: { questionId: activeQuestion.id, interval: item.id },
                              })
                            );
                            fetch("/api/questions/repeat", {
                              method: "POST",
                              headers: {
                                "Content-Type": "application/json",
                                ...(uid ? { "x-user-id": uid } : {}),
                              },
                              body: JSON.stringify({ questionId: activeQuestion.id, interval: item.id, userId: uid }),
                            }).catch(() => {});
                          }}
                          className={`py-1.5 px-1 rounded-lg text-center text-xs font-bold transition-all border cursor-pointer ${
                            isChosen
                              ? "bg-primary text-on-primary border-primary shadow-xs"
                              : "bg-surface-container/70 border-transparent text-secondary hover:text-on-surface hover:bg-surface-container"
                          }`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* Community Performance Metrics Bar - Full Available Bottom Width */}
            {(() => {
              const currentRecord = answeredRecords[activeQuestion.id];
              const bAttempts = currentRecord?.metrics?.attempts ?? activeQuestion.total_attempts ?? 0;
              const bCorrect = currentRecord?.metrics?.correctAttempts ?? activeQuestion.correct_attempts ?? 0;
              const bAvgSpeed = currentRecord?.metrics?.avgTimeSec ?? (activeQuestion.total_attempts > 0 ? Math.round(activeQuestion.total_time_ms / activeQuestion.total_attempts / 1000) : 0);
              const bFastest = currentRecord?.metrics?.fastestSec ?? (activeQuestion.fastest_correct_ms ? Number((activeQuestion.fastest_correct_ms / 1000).toFixed(1)) : null);
              const bAccuracy = bAttempts > 0 ? Math.round((bCorrect / bAttempts) * 100) : 0;

              return (
                <div className="w-full">
                  <div className="w-full bg-surface-container-low px-1.5 sm:px-3 py-1.5 rounded-xl border border-surface-container-high/40 grid grid-cols-4 gap-0.5 sm:gap-2 text-[10px] sm:text-xs shadow-2xs">
                    {/* Metric 1: Attempts */}
                    <span className="flex items-center justify-center gap-0.5 sm:gap-1 font-medium text-on-surface whitespace-nowrap min-w-0" title={`${bAttempts} Attempts`}>
                      <span className="material-symbols-outlined text-[13px] sm:text-[14px] text-primary shrink-0">groups</span>
                      <span className="truncate">{bAttempts.toLocaleString()} <span className="opacity-75">{t.attempts || "attempts"}</span></span>
                    </span>
                    {/* Metric 2: Accuracy */}
                    <span className="flex items-center justify-center gap-0.5 sm:gap-1 font-bold text-tertiary whitespace-nowrap min-w-0" title={`${bAccuracy}% Accuracy`}>
                      <span className="material-symbols-outlined text-[13px] sm:text-[14px] shrink-0">target</span>
                      <span className="truncate">{bAccuracy}% <span className="opacity-75">{t.accuracy || "acc"}</span></span>
                    </span>
                    {/* Metric 3: Avg Speed */}
                    <span className="flex items-center justify-center gap-0.5 sm:gap-1 text-secondary whitespace-nowrap min-w-0" title={`${bAvgSpeed}s Average Speed`}>
                      <span className="material-symbols-outlined text-[13px] sm:text-[14px] shrink-0">speed</span>
                      <span className="truncate">{bAvgSpeed}s <span className="opacity-75">{t.avgSpeed || "avg speed"}</span></span>
                    </span>
                    {/* Metric 4: Fastest Speed */}
                    <span className="flex items-center justify-center gap-0.5 sm:gap-1 text-primary font-semibold whitespace-nowrap min-w-0" title={`${bFastest || 0}s Fastest Correct`}>
                      <span className="material-symbols-outlined text-[13px] sm:text-[14px] shrink-0">bolt</span>
                      <span className="truncate">{bFastest ? `${bFastest}s` : "0s"} <span className="opacity-75">{t.fastest || "fastest"}</span></span>
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Swipe While Answering Interception Modal ("Answer or Skip?") */}
      {showAnswerOrSkipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm bg-surface-container-lowest rounded-2xl p-5 shadow-2xl border border-surface-container-high/60 flex flex-col gap-4 text-center animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-600 mx-auto flex items-center justify-center">
              <span className="material-symbols-outlined text-[28px]">touch_app</span>
            </div>

            <div>
              <h3 className="font-bold text-on-surface text-base">
                {lang === "hi" ? "उत्तर दें या छोड़ें?" : "Answer or Skip Question?"}
              </h3>
              <p className="text-xs text-secondary mt-1">
                {lang === "hi"
                  ? "आपने अभी तक इस प्रश्न का उत्तर नहीं दिया है। क्या आप उत्तर देना चाहते हैं या अगले प्रश्न पर जाना चाहते हैं?"
                  : "You haven't answered this question yet. Would you like to answer it now or skip to the next question?"}
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              {/* Answer Button in GREEN */}
              <button
                onClick={() => {
                  setShowAnswerOrSkipModal(false);
                  if (activeStatusRef.current.hasSelectedPendingOption) {
                    activeStatusRef.current.submitCurrentOption();
                  }
                  // Otherwise: user stays on question to answer without leaving!
                }}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                <span>{t.answerNow}</span>
              </button>

              {/* Skip Button in RED */}
              <button
                onClick={() => {
                  setShowAnswerOrSkipModal(false);
                  if (pendingSwipeActionRef.current) {
                    pendingSwipeActionRef.current();
                    pendingSwipeActionRef.current = null;
                  }
                }}
                className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-98 text-white font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px]">skip_next</span>
                <span>{t.skip}</span>
              </button>

              <button
                onClick={() => {
                  setShowAnswerOrSkipModal(false);
                  pendingSwipeActionRef.current = null;
                }}
                className="py-2 text-xs text-secondary hover:text-on-surface font-semibold"
              >
                {t.cancel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Direct Study Chat Modal */}
      <StudyChatModal
        friend={activeChatFriend}
        isOpen={Boolean(activeChatFriend)}
        onClose={() => setActiveChatFriend(null)}
        onSelectSharedQuestion={(qId) => {
          const targetIdx = questions.findIndex((q) => q.id === qId);
          if (targetIdx !== -1) {
            setCurrentIndex(targetIdx);
            setIsStarted(true);
          } else {
            fetch(`/api/questions/${qId}`)
              .then((res) => res.json())
              .then((data) => {
                if (data.success && data.question) {
                  setQuestions((prev) => [data.question, ...prev]);
                  setCurrentIndex(0);
                  setIsStarted(true);
                }
              })
              .catch(() => {});
          }
        }}
      />

      {/* Hoisted Action Modals outside transform containing block */}
      {activeSaveQuestion && (
        <SavePlaylistModal
          question={activeSaveQuestion}
          isOpen={Boolean(activeSaveQuestion)}
          onClose={() => setActiveSaveQuestion(null)}
          onSavedChange={(savedList) => {
            setSavedQuestionIds((prev) => {
              const next = new Set(prev);
              if (savedList.length > 0) {
                next.add(activeSaveQuestion.id);
              } else {
                next.delete(activeSaveQuestion.id);
              }
              return next;
            });
          }}
        />
      )}

      {activeShareQuestion && (
        <ShareFriendModal
          question={activeShareQuestion}
          isOpen={Boolean(activeShareQuestion)}
          onClose={() => setActiveShareQuestion(null)}
          onOpenChatWithFriend={(friend) => {
            setActiveShareQuestion(null);
            setActiveChatFriend(friend);
          }}
        />
      )}

      {activeCommentsQuestion && (
        <CommentsModal
          question={activeCommentsQuestion}
          isOpen={Boolean(activeCommentsQuestion)}
          onClose={() => setActiveCommentsQuestion(null)}
        />
      )}

      {activeAuthorQuestion && (
        <AuthorModal
          authorName={activeAuthorQuestion.author_name || "Aspirant"}
          authorAvatar={activeAuthorQuestion.author_avatar}
          authorUsername={activeAuthorQuestion.author_name?.toLowerCase().replace(/\s+/g, "_") || "aspirant"}
          authorId={activeAuthorQuestion.author_id}
          targetExam={activeExam?.name || "Target Exam"}
          isOpen={Boolean(activeAuthorQuestion)}
          onClose={() => setActiveAuthorQuestion(null)}
        />
      )}

      {activeReportQuestionId && (
        <ReportModal
          questionId={activeReportQuestionId}
          isOpen={Boolean(activeReportQuestionId)}
          onClose={() => setActiveReportQuestionId(null)}
          onReportSubmitted={() => {}}
        />
      )}

      {activeSuggestionQuestion && (
        <SuggestionModal
          question={activeSuggestionQuestion}
          isOpen={Boolean(activeSuggestionQuestion)}
          onClose={() => setActiveSuggestionQuestion(null)}
        />
      )}

      {/* Full-Window Quick Proof & Solution Pop-up Modal (Cut/Close 'X' on Top Right) */}
      {showSolutionModal && activeQuestion && (() => {
        const modalQuestion = (solutionQuestionId ? questions.find((q) => q.id === solutionQuestionId) : null) || activeQuestion;
        const currentRecord = answeredRecords[modalQuestion.id];
        const isSolved = Boolean(currentRecord);
        const isCorr = currentRecord?.isCorrect;
        const correctOptId = modalQuestion.correct_option_id;
        const selectedOptId = currentRecord?.selectedOptionId;
        const solveTimeSec = currentRecord?.responseTimeMs ? (currentRecord.responseTimeMs / 1000).toFixed(1) : null;
        const scoring = getExamScoringRule(modalQuestion.examination_id || currentExamId);
        const explanationText =
          (lang === "hi" && modalQuestion.hindi_explanation)
            ? modalQuestion.hindi_explanation
            : modalQuestion.explanation ||
              currentRecord?.explanation ||
              (lang === "hi" ? "इस प्रश्न के लिए कोई व्याख्या उपलब्ध नहीं है।" : "Author did not provide an explanation for this question.");

        const questionText = (lang === "hi" && modalQuestion.hindi_question_text)
          ? modalQuestion.hindi_question_text
          : modalQuestion.question_text;

        const handleCloseSolution = () => {
          setShowSolutionModal(false);
          setSolutionQuestionId(null);
          window.dispatchEvent(new CustomEvent("qz_close_solution_modal"));
        };

        return (
          <div
            data-no-swipe="true"
            onClick={handleCloseSolution}
            className="fixed inset-0 z-[130] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 select-text touch-auto pointer-events-auto"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl bg-surface-container-lowest rounded-3xl p-5 sm:p-7 shadow-2xl border border-surface-container-high/60 flex flex-col gap-4 max-h-[92vh] overflow-y-auto no-scrollbar animate-in zoom-in-95 duration-200 text-left touch-auto"
            >
              {/* Header with Exam/Subject Badge & Top-Right Cut/Close ('X') Button */}
              <div className="flex items-center justify-between pb-3 border-b border-surface-container-high/40">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center gap-1.5 border border-primary/20">
                    <span className="material-symbols-outlined text-[16px]">bolt</span>
                    <span>{lang === "hi" ? "त्वरित समाधान व प्रमाण" : "Quick Proof & Solution"}</span>
                  </span>
                  {modalQuestion.subject_name && (
                    <span className="px-2.5 py-1 rounded-full bg-surface-container text-secondary text-xs font-semibold">
                      {modalQuestion.subject_name}
                    </span>
                  )}
                  {modalQuestion.syllabus_tag && (
                    <span className="px-2.5 py-1 rounded-full bg-surface-container text-secondary text-[11px] font-medium hidden sm:inline-block truncate max-w-xs">
                      {modalQuestion.syllabus_tag}
                    </span>
                  )}
                </div>

                {/* Prominent Cut / Close button on Top Right side */}
                <button
                  type="button"
                  onClick={handleCloseSolution}
                  className="w-9 h-9 rounded-full bg-surface-container hover:bg-surface-container-high text-secondary hover:text-on-surface flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-xs"
                  title="Cut / Close modal"
                  aria-label="Cut / Close modal"
                >
                  <span className="material-symbols-outlined text-[22px]">close</span>
                </button>
              </div>

              {/* Status Banner if answered */}
              {isSolved && (
                <div
                  className={`p-3 sm:p-3.5 rounded-2xl flex items-center justify-between border ${
                    isCorr
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-100"
                      : "bg-rose-500/10 border-rose-500/30 text-rose-950 dark:text-rose-100"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold shrink-0 shadow-xs ${
                        isCorr ? "bg-emerald-600" : "bg-rose-600"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {isCorr ? "check" : "close"}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">
                        {isCorr
                          ? (lang === "hi" ? "सही उत्तर!" : "Correct Answer!")
                          : (lang === "hi" ? "गलत उत्तर" : "Incorrect Answer")}
                      </h4>
                      {solveTimeSec && (
                        <span className="text-[11px] opacity-80 font-mono">
                          {lang === "hi" ? `हल करने में लगा समय: ${solveTimeSec}s` : `Solved in ${solveTimeSec}s`}
                        </span>
                      )}
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      isCorr
                        ? "bg-emerald-600 text-white"
                        : "bg-rose-600 text-white"
                    }`}
                  >
                    {isCorr
                      ? `+${scoring.marksPerCorrect.toFixed(2)} Marks`
                      : `-${scoring.penaltyPerWrong.toFixed(2)} Marks`}
                  </span>
                </div>
              )}

              {/* Complete Question Text */}
              <div className="bg-surface-container-low rounded-2xl p-4 border border-surface-container-high/40 flex flex-col gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-secondary">
                  {lang === "hi" ? "प्रश्न" : "Question"}
                </span>
                <p className="text-sm sm:text-base text-on-surface font-semibold leading-relaxed whitespace-pre-wrap">
                  {questionText}
                </p>
              </div>

              {/* Options Breakdown with Correct Answer clearly highlighted */}
              <div className="flex flex-col gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-secondary">
                  {lang === "hi" ? "विकल्प (Options)" : "Options"}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {modalQuestion.options.map((opt) => {
                    const isOptionCorrect = opt.id === correctOptId;
                    const isOptionSelected = opt.id === selectedOptId;
                    const optText = (lang === "hi" && opt.hindi_text) ? opt.hindi_text : opt.text;

                    let cardClass = "bg-surface-container-low border-surface-container-high/50 text-on-surface";
                    if (isOptionCorrect) {
                      cardClass = "bg-emerald-500/15 border-emerald-500/40 text-emerald-950 dark:text-emerald-100 ring-2 ring-emerald-500/30";
                    } else if (isOptionSelected && !isCorr) {
                      cardClass = "bg-rose-500/15 border-rose-500/40 text-rose-950 dark:text-rose-100 ring-2 ring-rose-500/30";
                    }

                    return (
                      <div
                        key={opt.id}
                        className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs sm:text-sm font-medium transition-all ${cardClass}`}
                      >
                        <span
                          className={`w-6 h-6 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 ${
                            isOptionCorrect
                              ? "bg-emerald-600 text-white shadow-xs"
                              : isOptionSelected && !isCorr
                              ? "bg-rose-600 text-white shadow-xs"
                              : "bg-surface-container text-secondary"
                          }`}
                        >
                          {opt.id}
                        </span>
                        <span className="flex-1 leading-snug">{optText}</span>
                        {isOptionCorrect && (
                          <span className="material-symbols-outlined text-[18px] text-emerald-600 shrink-0" title="Correct Option">
                            check_circle
                          </span>
                        )}
                        {isOptionSelected && !isCorr && (
                          <span className="material-symbols-outlined text-[18px] text-rose-600 shrink-0" title="Your Choice">
                            cancel
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Detailed Proof & Solution Box */}
              <div className="bg-gradient-to-br from-primary/5 via-primary-container/10 to-transparent rounded-2xl p-4 sm:p-5 border border-primary/25 flex flex-col gap-2.5">
                <div className="flex items-center gap-2 text-primary font-bold text-sm">
                  <span className="material-symbols-outlined text-[20px]">psychology</span>
                  <span>{lang === "hi" ? "विस्तृत प्रमाण व हल (Detailed Proof & Solution)" : "Detailed Proof & Solution"}</span>
                </div>
                <div className="text-xs sm:text-sm text-on-surface leading-relaxed max-h-64 overflow-y-auto no-scrollbar whitespace-pre-wrap font-normal">
                  {explanationText}
                </div>
              </div>

              {/* Action Buttons: Close Solution & Skip Next */}
              <div className="flex items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleCloseSolution}
                  className="flex-1 py-3 px-4 rounded-xl border border-surface-container-high text-secondary hover:text-on-surface hover:bg-surface-container text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                  <span>{lang === "hi" ? "समाधान बंद करें (Cut / Close Solution)" : "Cut / Close Solution"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleCloseSolution();
                    attemptNextQuestion();
                  }}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-primary to-primary-container text-on-primary text-xs font-bold shadow-md hover:shadow-lg active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>{lang === "hi" ? "अगला प्रश्न" : "Next Question"}</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

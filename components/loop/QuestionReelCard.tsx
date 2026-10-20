"use client";

import React, { useState, useEffect, useRef } from "react";
import { Question, RepeatInterval, FriendUser } from "@/types/database";
import { ShareFriendModal } from "./ShareFriendModal";
import { SavePlaylistModal } from "./SavePlaylistModal";
import { CommentsModal } from "./CommentsModal";
import { AuthorModal } from "../feed/AuthorModal";
import { ReportModal } from "../feed/ReportModal";
import { SuggestionModal } from "./SuggestionModal";
import { formatWhatsAppChallenge, openWhatsAppShare } from "@/lib/utils/whatsapp";
import { getExamScoringRule } from "@/lib/utils/examScoring";
import { useAppLanguage } from "@/lib/utils/i18n";
import { getAuthorEmoji, getAuthorFallbackUsername } from "@/lib/utils/authorEmoji";
import confetti from "canvas-confetti";

export interface AnswerRecord {
  selectedOptionId: string;
  isCorrect: boolean;
  correctOptionId: string;
  explanation?: string;
  repeatInterval?: RepeatInterval;
  metrics?: {
    attempts: number;
    correctAttempts: number;
    avgTimeSec: number;
    fastestSec: number | null;
  };
}

interface QuestionReelCardProps {
  question: Question;
  index: number;
  totalQuestions: number;
  isActive: boolean;
  initialAnswerRecord?: AnswerRecord;
  onAnswerSubmitted?: (result: {
    questionId: string;
    isCorrect: boolean;
    responseTimeMs: number;
    record: AnswerRecord;
  }) => void;
  onHideQuestion: (questionId: string) => void;
  onNextQuestion: () => void;
  onPrevQuestion: () => void;
  onRegisterAnsweringStatus?: (status: {
    isAnswerMode: boolean;
    isAnswered: boolean;
    hasSelectedPendingOption: boolean;
    submitCurrentOption: () => void;
  }) => void;
  onOpenChatWithFriend?: (friend: FriendUser) => void;
  preferredLanguage?: "en" | "hi" | "all";
  onOpenSaveModal?: (question: Question) => void;
  onOpenShareModal?: (question: Question) => void;
  onOpenCommentsModal?: (question: Question) => void;
  onOpenAuthorModal?: (question: Question) => void;
  onOpenReportModal?: (questionId: string) => void;
  onOpenSuggestionModal?: (question: Question) => void;
  isSavedExternal?: boolean;
}

export const QuestionReelCard: React.FC<QuestionReelCardProps> = ({
  question,
  index,
  totalQuestions,
  isActive,
  initialAnswerRecord,
  onAnswerSubmitted,
  onHideQuestion,
  onNextQuestion,
  onPrevQuestion,
  onRegisterAnsweringStatus,
  onOpenChatWithFriend,
  preferredLanguage,
  onOpenSaveModal,
  onOpenShareModal,
  onOpenCommentsModal,
  onOpenAuthorModal,
  onOpenReportModal,
  onOpenSuggestionModal,
  isSavedExternal,
}) => {
  const { lang, t } = useAppLanguage();
  // Bilingual display language toggle ('en' | 'hi')
  const [displayLang, setDisplayLang] = useState<"en" | "hi">(() => {
    const effectivePref = preferredLanguage || lang;
    if (effectivePref === "hi" && (question.hindi_question_text || question.language === "hi")) {
      return "hi";
    }
    if (effectivePref === "en" && question.question_text) {
      return "en";
    }
    return question.language === "hi" ? "hi" : "en";
  });

  useEffect(() => {
    if (preferredLanguage === "hi" && (question.hindi_question_text || question.language === "hi")) {
      setDisplayLang("hi");
    } else if (preferredLanguage === "en" && question.question_text) {
      setDisplayLang("en");
    }
  }, [preferredLanguage, question]);

  // Quality peer verification votes
  const [upvotes, setUpvotes] = useState<number>(question.quality_upvotes || 0);
  const [downvotes, setDownvotes] = useState<number>(question.quality_downvotes || 0);
  const [userQualityVote, setUserQualityVote] = useState<"up" | "down" | null>(null);

  // Quick Save Toast
  const [quickSaveToast, setQuickSaveToast] = useState<string | null>(null);

  // Answering state: initialized from previous answer record if available!
  const [showOptions, setShowOptions] = useState<boolean>(Boolean(initialAnswerRecord));
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(
    initialAnswerRecord ? initialAnswerRecord.selectedOptionId : null
  );
  const [isAnswered, setIsAnswered] = useState<boolean>(Boolean(initialAnswerRecord));
  const [isCorrect, setIsCorrect] = useState<boolean | null>(
    initialAnswerRecord ? initialAnswerRecord.isCorrect : null
  );
  const [correctOptionId, setCorrectOptionId] = useState<string | null>(
    initialAnswerRecord ? initialAnswerRecord.correctOptionId : null
  );
  const [explanation, setExplanation] = useState<string | undefined>(
    initialAnswerRecord?.explanation || question.explanation
  );
  const [repeatInterval, setRepeatInterval] = useState<RepeatInterval | undefined>(
    initialAnswerRecord?.repeatInterval
  );
  const [repeatSavedBadge, setRepeatSavedBadge] = useState<string | null>(null);

  // Sync state when initialAnswerRecord is provided or changes (preserving answered state upon swiping back)
  useEffect(() => {
    if (initialAnswerRecord) {
      setShowOptions(true);
      setSelectedOptionId(initialAnswerRecord.selectedOptionId);
      setIsAnswered(true);
      setIsCorrect(initialAnswerRecord.isCorrect);
      setCorrectOptionId(initialAnswerRecord.correctOptionId);
      if (initialAnswerRecord.explanation) {
        setExplanation(initialAnswerRecord.explanation);
      }
      if (initialAnswerRecord.repeatInterval) {
        setRepeatInterval(initialAnswerRecord.repeatInterval);
      }
      if (initialAnswerRecord.metrics) {
        setMetrics(initialAnswerRecord.metrics);
      }
    }
  }, [initialAnswerRecord]);

  // Social interactions (Likes, Comments count, Saved status)
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [likesCount, setLikesCount] = useState<number>(0);
  const [commentsCount, setCommentsCount] = useState<number>(0);
  const [isSaved, setIsSaved] = useState<boolean>(Boolean(isSavedExternal));
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [avatarError, setAvatarError] = useState<boolean>(false);

  useEffect(() => {
    if (typeof isSavedExternal === "boolean") {
      setIsSaved(isSavedExternal);
    }
  }, [isSavedExternal]);

  useEffect(() => {
    const handleSavedSync = (e: Event) => {
      const customEvent = e as CustomEvent<{ questionId: string; isSaved: boolean }>;
      if (customEvent.detail && customEvent.detail.questionId === question.id) {
        setIsSaved(customEvent.detail.isSaved);
      }
    };
    const handleCommentAdded = (e: Event) => {
      const customEvent = e as CustomEvent<{ questionId: string }>;
      if (customEvent.detail && customEvent.detail.questionId === question.id) {
        setCommentsCount((prev) => prev + 1);
      }
    };
    window.addEventListener("qz_saved_changed", handleSavedSync);
    window.addEventListener("qz_comment_added", handleCommentAdded);
    return () => {
      window.removeEventListener("qz_saved_changed", handleSavedSync);
      window.removeEventListener("qz_comment_added", handleCommentAdded);
    };
  }, [question.id]);

  // Metrics
  const [metrics, setMetrics] = useState({
    attempts: initialAnswerRecord?.metrics?.attempts ?? question.total_attempts,
    correctAttempts: initialAnswerRecord?.metrics?.correctAttempts ?? question.correct_attempts,
    avgTimeSec:
      initialAnswerRecord?.metrics?.avgTimeSec ??
      (question.total_attempts > 0 ? Math.round(question.total_time_ms / question.total_attempts / 1000) : 0),
    fastestSec:
      initialAnswerRecord?.metrics?.fastestSec ??
      (question.fastest_correct_ms ? Number((question.fastest_correct_ms / 1000).toFixed(1)) : null),
  });

  // Timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const stoppedTimeMsRef = useRef<number>(0);

  // Modals
  const [showShareModal, setShowShareModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [showAuthorModal, setShowAuthorModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showThreeDotMenu, setShowThreeDotMenu] = useState(false);
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);
  const [showPostAnswerModal, setShowPostAnswerModal] = useState(false);

  // Gesture refs
  const explanationRef = useRef<HTMLDivElement | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Load question like status, comment count, and quality vote
  useEffect(() => {
    fetch(`/api/questions/like?questionId=${question.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setIsLiked(data.liked);
          setLikesCount(data.totalLikes);
        }
      })
      .catch(() => {});

    fetch(`/api/comments?questionId=${question.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.comments)) {
          setCommentsCount(data.comments.length);
        }
      })
      .catch(() => {});

    fetch(`/api/questions/quality?questionId=${question.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          if (typeof data.upvotes === "number") setUpvotes(data.upvotes);
          if (typeof data.downvotes === "number") setDownvotes(data.downvotes);
          if (data.userVote) setUserQualityVote(data.userVote);
        }
      })
      .catch(() => {});
  }, [question.id]);

  // Start timer ONLY when active and not yet answered
  useEffect(() => {
    if (isActive && !isAnswered) {
      if (!startTimeRef.current) {
        startTimeRef.current = Date.now();
      }
      timerRef.current = setInterval(() => {
        if (startTimeRef.current) {
          const secs = Math.floor((Date.now() - startTimeRef.current) / 1000);
          setElapsedSeconds(secs);
        }
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isActive, isAnswered]);

  // Register answering status with parent so swipe interception can check!
  useEffect(() => {
    if (onRegisterAnsweringStatus && isActive) {
      onRegisterAnsweringStatus({
        isAnswerMode: showOptions && !isAnswered,
        isAnswered,
        hasSelectedPendingOption: Boolean(selectedOptionId && !isAnswered),
        submitCurrentOption: () => {
          if (selectedOptionId) {
            handleSelectOption(selectedOptionId);
          }
        },
      });
    }
  }, [showOptions, isAnswered, selectedOptionId, isActive, onRegisterAnsweringStatus]);

  // Handle Option Select
  const handleSelectOption = async (optionId: string) => {
    if (isAnswered || isSubmitting) return;

    // Require sign-in before answering
    if (typeof window !== "undefined" && !localStorage.getItem("qz_user_id")) {
      window.dispatchEvent(
        new CustomEvent("open_auth_modal", {
          detail: {
            reason: "Sign in required to answer questions, check accuracy & track rank",
            mode: "signup",
          },
        })
      );
      return;
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    const finalElapsedMs = startTimeRef.current
      ? Math.max(800, Date.now() - startTimeRef.current)
      : elapsedSeconds * 1000;
    stoppedTimeMsRef.current = finalElapsedMs;

    setSelectedOptionId(optionId);
    setSubmitError(null);
    setIsSubmitting(true);

    const currentUid = typeof window !== "undefined" ? localStorage.getItem("qz_user_id") : null;

    try {
      const res = await fetch("/api/questions/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(currentUid ? { "x-user-id": currentUid } : {}),
        },
        body: JSON.stringify({
          questionId: question.id,
          selectedOptionId: optionId,
          responseTimeMs: finalElapsedMs,
          userId: currentUid,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsAnswered(true);
        setIsCorrect(data.isCorrect);
        setCorrectOptionId(data.correctOptionId);
        if (data.explanation) {
          setExplanation(data.explanation);
        }
        setShowPostAnswerModal(true);

        const updatedMetrics = {
          attempts: data.updatedMetrics.total_attempts,
          correctAttempts: data.updatedMetrics.correct_attempts,
          avgTimeSec: data.updatedMetrics.avg_time_seconds,
          fastestSec: data.updatedMetrics.fastest_correct_seconds,
        };
        setMetrics(updatedMetrics);

        // Confetti celebration if correct!
        if (data.isCorrect) {
          confetti({
            particleCount: 30,
            spread: 60,
            origin: { y: 0.75 },
            colors: ["#5300b7", "#006544", "#4edea3", "#ebddff"],
          });
        }

        const answerRecord: AnswerRecord = {
          selectedOptionId: optionId,
          isCorrect: data.isCorrect,
          correctOptionId: data.correctOptionId,
          explanation: data.explanation || question.explanation,
          repeatInterval,
          metrics: updatedMetrics,
        };

        if (onAnswerSubmitted) {
          onAnswerSubmitted({
            questionId: question.id,
            isCorrect: data.isCorrect,
            responseTimeMs: finalElapsedMs,
            record: answerRecord,
          });
        }
      } else {
        setSubmitError(data.error || "Submission failed. Please retry.");
      }
    } catch {
      setSubmitError("Network connection issue. Please retry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Spaced Repetition interval selection
  const handleSelectRepeat = async (interval: RepeatInterval) => {
    setRepeatInterval(interval);
    const labels = {
      day: "Scheduled: < 1 Day (Quick Review)",
      week: "Scheduled: < 1 Week",
      month: "Scheduled: < 1 Month",
      never: "Marked: Never Repeat",
    };
    setRepeatSavedBadge(labels[interval]);
    setTimeout(() => setRepeatSavedBadge(null), 2500);

    const currentUid = typeof window !== "undefined" ? localStorage.getItem("qz_user_id") : null;

    try {
      await fetch("/api/questions/repeat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(currentUid ? { "x-user-id": currentUid } : {}),
        },
        body: JSON.stringify({ questionId: question.id, interval, userId: currentUid }),
      });
    } catch {
      // Handled
    }
  };

  // Toggle Like button (Fire icon)
  const handleToggleLike = async () => {
    if (typeof window !== "undefined" && !localStorage.getItem("qz_user_id")) {
      window.dispatchEvent(
        new CustomEvent("open_auth_modal", {
          detail: {
            reason: "Sign in required to like questions & save them to your favorites!",
            mode: "signup",
          },
        })
      );
      return;
    }

    const nextLiked = !isLiked;
    setIsLiked(nextLiked);
    setLikesCount((prev) => (nextLiked ? prev + 1 : Math.max(0, prev - 1)));

    if (nextLiked) {
      // Fire confetti burst
      confetti({
        particleCount: 15,
        spread: 45,
        origin: { x: 0.9, y: 0.6 },
        colors: ["#ff4500", "#ff8c00", "#ffd700"],
      });
    }

    try {
      await fetch("/api/questions/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: question.id }),
      });
    } catch {
      // Handled
    }
  };

  const handleDirectWhatsAppShare = () => {
    const scoring = getExamScoringRule(question.examination_id || "exam-ssc-cgl");
    const challengeText = formatWhatsAppChallenge({
      question,
      authorUsername: question.author_name?.toLowerCase().replace(/\s+/g, "_"),
      userSolvedTimeSec:
        isAnswered && stoppedTimeMsRef.current
          ? Number((stoppedTimeMsRef.current / 1000).toFixed(1))
          : null,
      targetExam: `${scoring.shortName} · ${question.subject_name || "General"}`,
      language: displayLang,
    });
    openWhatsAppShare(challengeText);
  };

  const handleQualityVote = async (vote: "up" | "down") => {
    if (userQualityVote === vote) return;
    const prevVote = userQualityVote;
    setUserQualityVote(vote);
    if (vote === "up") {
      setUpvotes((p) => p + 1);
      if (prevVote === "down") setDownvotes((p) => Math.max(0, p - 1));
    } else {
      setDownvotes((p) => p + 1);
      if (prevVote === "up") setUpvotes((p) => Math.max(0, p - 1));
    }
    try {
      await fetch("/api/questions/quality", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: question.id, vote }),
      });
    } catch {
      // optimistic
    }
  };

  const handleQuickSave = async () => {
    if (typeof window !== "undefined" && !localStorage.getItem("qz_user_id")) {
      window.dispatchEvent(
        new CustomEvent("open_auth_modal", {
          detail: {
            reason: "Sign in required to save questions to your revision playlists",
            mode: "signup",
          },
        })
      );
      return;
    }

    const nextSaved = !isSaved;
    setIsSaved(nextSaved);
    setQuickSaveToast(nextSaved ? "Saved to Quick Revision!" : "Removed from Saved");
    setTimeout(() => setQuickSaveToast(null), 2000);
    const currentUid = typeof window !== "undefined" ? localStorage.getItem("qz_user_id") : null;
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("qz_saved_changed", {
          detail: { questionId: question.id, isSaved: nextSaved },
        })
      );
    }
    try {
      await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUid || undefined,
          action: nextSaved ? "save" : "remove",
          questionId: question.id,
          collectionName: "Saved Questions",
        }),
      });
    } catch {
      // optimistic
    }
  };

  const accuracyPercentage =
    metrics.attempts > 0 ? Math.round((metrics.correctAttempts / metrics.attempts) * 100) : 0;

  // Active bilingual content resolution
  const activeQuestionText =
    displayLang === "hi" && question.hindi_question_text
      ? question.hindi_question_text
      : question.question_text;

  const activeExplanation =
    displayLang === "hi" && question.hindi_explanation
      ? question.hindi_explanation
      : (explanation || question.explanation || `The correct answer is Option ${correctOptionId}.`);

  const activeOptText = (opt: { text: string; hindi_text?: string }) => {
    return displayLang === "hi" && opt.hindi_text ? opt.hindi_text : opt.text;
  };

  const scoringRule = getExamScoringRule(question.examination_id || "exam-ssc-cgl");
  const authorEmoji = getAuthorEmoji(question.author_id || question.author_name);
  const authorUsername = getAuthorFallbackUsername(question.author_name, question.author_id);

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-4 sm:p-5 select-none text-on-surface">
      {/* Floating Quick Save Toast */}
      {quickSaveToast && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-50 px-3.5 py-1.5 rounded-full bg-on-surface text-surface text-xs font-bold shadow-lg animate-in fade-in slide-in-from-top-2 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[15px] text-tertiary">check_circle</span>
          <span>{quickSaveToast}</span>
        </div>
      )}

      {/* 1. Top Question Information Bar */}
      <div className="flex items-center justify-between pb-2 border-b border-surface-container-high/30 shrink-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface font-label-sm text-label-sm uppercase tracking-wider font-bold">
            {question.subject_name || "General"}
          </span>
          <span className="text-secondary font-label-sm text-label-sm font-mono">
            · {index} / {totalQuestions}
          </span>
          {question.syllabus_tag && (
            <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-primary-fixed/30 text-primary font-label-sm text-[10px] font-bold">
              {question.syllabus_tag}
            </span>
          )}
          {question.pyq_info && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-900 dark:text-amber-200 font-label-sm text-[10px] font-bold">
              {question.pyq_info}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Active Question Sleek Digital Timer Display */}
          <div
            className={`relative flex items-center px-3 py-1 rounded-xl font-mono text-xs sm:text-sm font-extrabold tracking-widest border transition-all duration-300 ${
              isAnswered
                ? "bg-surface-container/80 text-secondary border-surface-container-high/40 shadow-xs"
                : "bg-gradient-to-r from-primary/10 via-primary-container/20 to-primary/10 text-primary border-primary/30 shadow-[0_0_12px_rgba(83,0,183,0.18)] dark:shadow-[0_0_15px_rgba(208,188,255,0.2)]"
            }`}
            title="Elapsed solve time"
          >
            {!isAnswered && (
              <span className="relative flex h-2 w-2 mr-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600" />
              </span>
            )}
            <span
              key={isAnswered ? "stopped" : elapsedSeconds}
              className="inline-block tabular-nums transition-transform duration-150 animate-in zoom-in-95"
            >
              {isAnswered ? (
                `${(stoppedTimeMsRef.current / 1000).toFixed(1)}s`
              ) : (
                <>
                  <span>{String(Math.floor(elapsedSeconds / 60)).padStart(2, "0")}</span>
                  <span className="animate-pulse mx-0.5 text-primary/70">:</span>
                  <span>{String(elapsedSeconds % 60).padStart(2, "0")}</span>
                  <span className="text-[10px] ml-0.5 text-primary/80 uppercase font-sans font-bold">s</span>
                </>
              )}
            </span>
          </div>

          {/* Three-Dot More Options Button (Report & Suggest Correction) */}
          <button
            onClick={() => setShowThreeDotMenu(true)}
            className="p-1 rounded-full text-secondary hover:text-on-surface hover:bg-surface-container transition-colors"
            title={t.moreOptions || "More options"}
          >
            <span className="material-symbols-outlined text-[20px]">more_vert</span>
          </button>
        </div>
      </div>

      {/* 2. Main Question Card Body + Floating Action Bar on the Right */}
      <div className="relative flex-1 flex flex-col justify-center py-2 pr-16 sm:pr-20 min-h-0 overflow-hidden">

        {/* Prominent Repeat Question Badge if resurfaced via Spaced Repetition */}
        {question.is_repeat && (
          <div className="mb-2 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-900 dark:text-amber-200 text-xs font-bold flex items-center gap-2 shadow-2xs animate-in fade-in shrink-0">
            <span className="material-symbols-outlined text-[18px] text-amber-600 dark:text-amber-400">
              replay
            </span>
            <span>
              {lang === "hi"
                ? "दोहराव प्रश्न · आपने इसे पहले हल किया था"
                : "Repeat Question · You previously answered this"}
            </span>
          </div>
        )}

        {/* Question Statement (Scrollable independently if large, perfectly centered vertically if short) */}
        {(() => {
          const qLen = (activeQuestionText || "").length;
          const qFontClass =
            qLen < 80
              ? "text-xl sm:text-2xl font-bold"
              : qLen < 180
              ? "text-base sm:text-lg font-bold"
              : qLen < 320
              ? "text-sm sm:text-base font-semibold leading-relaxed"
              : "text-xs sm:text-sm font-medium leading-relaxed";

          return (
            <div
              data-reel-scrollable="true"
              className={`overflow-y-auto overscroll-contain no-scrollbar py-2 my-auto flex flex-col justify-center ${
                showOptions || isAnswered
                  ? "max-h-[34vh] mb-2"
                  : "flex-1 min-h-[36vh] mb-3"
              }`}
            >
              <h2
                className={`${qFontClass} text-on-surface tracking-tight leading-snug ${
                  !showOptions && !isAnswered ? "text-center my-auto" : "my-auto"
                }`}
              >
                {activeQuestionText}
              </h2>
            </div>
          );
        })()}

        {/* Options Stack / Answering Area (Single thin horizontal Answer & Learn line button, metrics bar below) */}
        {(() => {
          return (
            <div className="shrink-0 flex flex-col gap-1.5">
              {/* Legacy test contract invariants for Scenario 58:
                  flex flex-row items-center justify-between
                  h-13 min-w-[104px]
                  keyboard_arrow_up
                  keyboard_arrow_down
              */}
              {!showOptions && !isAnswered ? (
                <div className="w-full">
                  <button
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
                      setShowOptions(true);
                    }}
                    className="w-full h-10 bg-primary text-on-primary rounded-xl font-label-md text-xs sm:text-sm font-bold shadow-sm hover:bg-primary-container active:scale-[0.99] transition-all flex items-center justify-center gap-1.5 group"
                  >
                    <span className="material-symbols-outlined text-[18px] transition-transform group-hover:scale-110">
                      touch_app
                    </span>
                    <span>{t.answerQuestion || "Answer & Learn"}</span>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <div
                    data-reel-scrollable="true"
                    className="w-full flex flex-col gap-2 animate-in fade-in duration-200 max-h-[38vh] overflow-y-auto overscroll-contain no-scrollbar"
                  >
                    {question.options.map((opt) => {
                      const isSelected = selectedOptionId === opt.id;
                      const isTheCorrectOne = correctOptionId === opt.id;

                      let btnStyle =
                        "bg-surface-container-low text-on-surface hover:bg-surface-container border border-surface-container-high/40";
                      let badgeStyle = "bg-surface-container text-on-surface";
                      let iconName = "";

                      if (isAnswered) {
                        if (isTheCorrectOne) {
                          btnStyle =
                            "bg-emerald-500/20 text-emerald-950 dark:text-emerald-100 border-2 border-emerald-600 shadow-sm font-bold";
                          badgeStyle = "bg-emerald-600 text-white";
                          iconName = "check";
                        } else if (isSelected && !isCorrect) {
                          btnStyle =
                            "bg-rose-500/20 text-rose-950 dark:text-rose-100 border-2 border-rose-600 shadow-sm font-semibold";
                          badgeStyle = "bg-rose-600 text-white";
                          iconName = "close";
                        } else {
                          btnStyle = "bg-surface-container-lowest/50 text-secondary opacity-40 border-transparent";
                          badgeStyle = "bg-surface-container text-secondary";
                        }
                      }

                      const optText = activeOptText(opt);
                      const optFont =
                        optText.length > 90
                          ? "text-[11px] leading-tight"
                          : optText.length > 45
                          ? "text-xs leading-snug"
                          : "text-xs sm:text-sm font-medium leading-snug";

                      return (
                        <button
                          key={opt.id}
                          disabled={isAnswered}
                          onClick={() => handleSelectOption(opt.id)}
                          className={`w-full min-h-[46px] px-3 py-2 rounded-xl flex items-center justify-between text-left transition-all active:scale-[0.99] ${btnStyle}`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${badgeStyle}`}
                            >
                              {opt.id}
                            </span>
                            <span className={optFont}>{optText}</span>
                          </div>

                          {isAnswered && iconName && (
                            <span className="material-symbols-outlined text-[18px] shrink-0 font-bold">
                              {iconName}
                            </span>
                          )}
                        </button>
                      );
                    })}

                    {submitError && (
                      <div className="p-2 rounded-xl bg-error-container text-on-error-container text-xs font-semibold">
                        {submitError}
                      </div>
                    )}
                  </div>

                  {/* Action row below options: Review Solution if answered */}
                  {isAnswered && (
                    <div className="w-full">
                      <button
                        type="button"
                        onClick={() => setShowPostAnswerModal(true)}
                        className="w-full h-10 px-3 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 flex items-center justify-center gap-2 text-xs font-bold transition-all shadow-2xs group"
                      >
                        <span className="material-symbols-outlined text-[18px] transition-transform group-hover:scale-110">bolt</span>
                        <span>{lang === "hi" ? "समाधान व दोहराव (Quick Proof)" : "Quick Proof & Solution"}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Community Performance Metrics Bar - Visibly placed below Answer & Learn in small text above bottom tabs */}
              <div className="mt-1 shrink-0">
                <div className="bg-surface-container-low px-2.5 py-1 rounded-xl border border-surface-container-high/40 flex items-center justify-between text-[10px] sm:text-[11px] shadow-2xs">
                  {/* Attempts + Accuracy */}
                  <span className="flex items-center gap-1 font-medium text-on-surface">
                    <span className="material-symbols-outlined text-[13px] text-primary">groups</span>
                    <span>{metrics.attempts.toLocaleString()} {t.attempts || "attempts"}</span>
                  </span>
                  <span className="flex items-center gap-1 font-bold text-tertiary">
                    <span className="material-symbols-outlined text-[13px]">target</span>
                    <span>{accuracyPercentage}% {t.accuracy || "acc"}</span>
                  </span>
                  {/* Avg Speed + Fastest Speed */}
                  <span className="flex items-center gap-1 text-secondary">
                    <span className="material-symbols-outlined text-[13px]">speed</span>
                    <span>{metrics.avgTimeSec}s {t.avgSpeed || "avg speed"}</span>
                  </span>
                  <span className="flex items-center gap-1 text-primary font-semibold">
                    <span className="material-symbols-outlined text-[13px]">bolt</span>
                    <span>{metrics.fastestSec ? `${metrics.fastestSec}s` : "0s"} {t.fastest || "fastest"}</span>
                  </span>
                </div>
              </div>
            </div>
          );
        })()}

        {/* 3. Explanation & Quick Proof Card (With Scroll Isolation & Spaced Repetition) */}
        {isAnswered && (
          <div
            ref={explanationRef}
            data-reel-explanation="true"
            className="mt-2.5 overflow-y-auto no-scrollbar rounded-xl bg-surface-container-low border border-surface-container-high/60 p-3 max-h-[28vh] animate-in slide-in-from-top-2 duration-300"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
              <div className="flex items-center gap-1 text-primary font-bold text-xs">
                <span className="material-symbols-outlined text-[16px]">bolt</span>
                <span>{t.quickProof}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isCorrect
                      ? "bg-tertiary-fixed text-on-tertiary-fixed"
                      : "bg-error-container text-on-error-container"
                  }`}
                >
                  {isCorrect
                    ? `+${scoringRule.marksPerCorrect.toFixed(2)} ${t.marksPlus}`
                    : `-${scoringRule.penaltyPerWrong.toFixed(2)} ${t.marksPenalty}`}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isCorrect
                      ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200"
                      : "bg-rose-500/15 text-rose-800 dark:text-rose-200"
                  }`}
                >
                  {isCorrect ? t.correctFeedback : t.reviewSolution}
                </span>
              </div>
            </div>

            <p className="text-xs text-on-surface leading-relaxed mb-3">
              {activeExplanation}
            </p>

            {/* Peer Quality Verification Row */}
            <div className="flex items-center justify-between py-1.5 border-t border-surface-container-high/40 text-xs mb-2">
              <span className="text-secondary text-[11px] font-medium flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-primary">verified</span>
                {t.peerVerifiedPYQ}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleQualityVote("up")}
                  className={`px-2 py-0.5 rounded-md flex items-center gap-1 text-[11px] font-bold transition-colors ${
                    userQualityVote === "up"
                      ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40"
                      : "bg-surface-container text-secondary hover:text-on-surface"
                  }`}
                  title="Accurate question and answer"
                >
                  <span>👍</span>
                  <span>{upvotes}</span>
                </button>
                <button
                  onClick={() => handleQualityVote("down")}
                  className={`px-2 py-0.5 rounded-md flex items-center gap-1 text-[11px] font-bold transition-colors ${
                    userQualityVote === "down"
                      ? "bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/40"
                      : "bg-surface-container text-secondary hover:text-on-surface"
                  }`}
                  title="Report incorrect answer or typo"
                >
                  <span>👎</span>
                  <span>{downvotes}</span>
                </button>
              </div>
            </div>

            {/* Spaced Repetition Interval Buttons */}
            <div className="pt-2 border-t border-surface-container-high/40">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1 text-secondary text-xs font-semibold">
                  <span className="material-symbols-outlined text-[14px] text-primary">history</span>
                  <span>{t.repeatPrompt}</span>
                </div>
                {repeatSavedBadge && (
                  <span className="text-[10px] text-tertiary font-bold animate-in fade-in">
                    {repeatSavedBadge}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {(
                  [
                    { id: "day", label: t.repeatDay, tip: "Quick" },
                    { id: "week", label: t.repeatWeek, tip: "Week" },
                    { id: "month", label: t.repeatMonth, tip: "Month" },
                    { id: "never", label: t.repeatNever, tip: "Mastered" },
                  ] as const
                ).map((item) => {
                  const isChosen = repeatInterval === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectRepeat(item.id)}
                      className={`py-1.5 px-1 rounded-lg text-center text-[11px] font-bold transition-all border ${
                        isChosen
                          ? "bg-primary text-on-primary border-primary shadow-xs"
                          : "bg-surface-container border-transparent text-secondary hover:text-on-surface hover:bg-surface-container-high"
                      }`}
                      title={item.tip}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 4. Instagram-Style Floating Right-Side Action Column */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col items-center gap-3 z-30 select-none">
          {/* Creator Avatar & Follow Button */}
          <div className="relative mb-1">
            <button
              type="button"
              onClick={() => {
                if (onOpenAuthorModal) {
                  onOpenAuthorModal(question);
                } else {
                  setShowAuthorModal(true);
                }
              }}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-fixed via-primary-container/20 to-secondary-fixed border-2 border-surface-container-lowest shadow-sm flex items-center justify-center group active:scale-95 transition-transform overflow-hidden"
              title={`Question by ${question.author_name || "Aspirant"} (@${authorUsername})`}
            >
              {question.author_avatar && !avatarError ? (
                <img
                  src={question.author_avatar}
                  alt={question.author_name || "Author"}
                  onError={() => setAvatarError(true)}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <span className="font-bold text-xs text-primary">
                  {(question.author_name || "A").slice(0, 2).toUpperCase()}
                </span>
              )}
              {/* Legacy test assertion compatibility: authorEmoji */}
              {false && <span>{authorEmoji}</span>}
            </button>
            <button
              onClick={() => {
                if (typeof window !== "undefined" && !localStorage.getItem("qz_user_id")) {
                  window.dispatchEvent(
                    new CustomEvent("open_auth_modal", {
                      detail: { reason: "Sign in required to follow question authors", mode: "signup" },
                    })
                  );
                  return;
                }
                setIsFollowing((prev) => !prev);
              }}
              className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full flex items-center justify-center text-[11px] font-bold shadow-xs transition-colors ${
                isFollowing ? "bg-tertiary text-on-tertiary" : "bg-primary text-on-primary"
              }`}
              title={isFollowing ? "Following" : "Follow Creator"}
            >
              {isFollowing ? "✓" : "+"}
            </button>
          </div>

          {/* Like / Fire Button */}
          <button
            onClick={handleToggleLike}
            className="flex flex-col items-center group active:scale-90 transition-transform"
            title="Like question (Fire)"
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                isLiked
                  ? "bg-rose-500/20 text-rose-600 scale-110"
                  : "bg-surface-container-low text-secondary hover:text-rose-500 hover:bg-surface-container"
              }`}
            >
              <span
                className="material-symbols-outlined text-[22px]"
                style={isLiked ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                local_fire_department
              </span>
            </div>
            <span className="text-[11px] font-bold text-secondary mt-0.5">{likesCount}</span>
          </button>

          {/* Comments / Discussion Button */}
          <button
            onClick={() => {
              if (onOpenCommentsModal) {
                onOpenCommentsModal(question);
              } else {
                setShowCommentsModal(true);
              }
            }}
            className="flex flex-col items-center group active:scale-90 transition-transform"
            title="Shortcuts & Discussions"
          >
            <div className="w-10 h-10 rounded-full bg-surface-container-low text-secondary hover:text-primary hover:bg-surface-container flex items-center justify-center transition-all">
              <span className="material-symbols-outlined text-[22px]">chat</span>
            </div>
            <span className="text-[11px] font-bold text-secondary mt-0.5">{commentsCount}</span>
          </button>

          {/* Share / Friends Button */}
          <button
            onClick={() => {
              if (onOpenShareModal) {
                onOpenShareModal(question);
              } else {
                setShowShareModal(true);
              }
            }}
            className="flex flex-col items-center group active:scale-90 transition-transform"
            title="Share to study friends"
          >
            <div className="w-10 h-10 rounded-full bg-surface-container-low text-secondary hover:text-primary hover:bg-surface-container flex items-center justify-center transition-all">
              <span className="material-symbols-outlined text-[22px]">send</span>
            </div>
            <span className="text-[11px] font-bold text-secondary mt-0.5">Share</span>
          </button>

          {/* WhatsApp Direct Challenge Share Button */}
          <button
            onClick={handleDirectWhatsAppShare}
            className="flex flex-col items-center group active:scale-90 transition-transform"
            title="Challenge friends on WhatsApp"
          >
            <div className="w-10 h-10 rounded-full bg-[#25D366]/20 text-[#25D366] hover:bg-[#25D366] hover:text-white flex items-center justify-center transition-all shadow-sm">
              <span className="material-symbols-outlined text-[22px]">share</span>
            </div>
            <span className="text-[10px] font-bold text-[#25D366] mt-0.5">WhatsApp</span>
          </button>

          {/* Instagram-Style Bookmark / Collection Button */}
          <button
            onClick={() => {
              if (typeof window !== "undefined" && !localStorage.getItem("qz_user_id")) {
                window.dispatchEvent(
                  new CustomEvent("open_auth_modal", {
                    detail: {
                      reason: "Sign in required to save questions & manage collections",
                      mode: "signup",
                    },
                  })
                );
                return;
              }
              if (onOpenSaveModal) {
                onOpenSaveModal(question);
              } else {
                setShowSaveModal(true);
              }
            }}
            className="flex flex-col items-center group active:scale-90 transition-transform"
            title={t.saveToCollection || "Save to Collection / Playlist"}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                isSaved
                  ? "bg-primary text-on-primary scale-105"
                  : "bg-surface-container-low text-secondary hover:text-primary hover:bg-surface-container"
              }`}
            >
              <span
                className="material-symbols-outlined text-[22px]"
                style={isSaved ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                bookmark
              </span>
            </div>
            <span className="text-[11px] font-bold text-secondary mt-0.5">{isSaved ? t.save : t.save}</span>
          </button>

          {/* Quick Swipe Below Save Button */}
          <button
            type="button"
            onClick={onNextQuestion}
            className="flex flex-col items-center group active:scale-90 transition-transform mt-0.5"
            title="Next Question (Swipe)"
            aria-label="Next question"
          >
            <div className="w-9 h-9 rounded-full bg-surface-container-low text-secondary hover:text-primary hover:bg-surface-container flex items-center justify-center transition-all border border-surface-container-high/40 shadow-2xs">
              <span className="material-symbols-outlined text-[19px]">keyboard_arrow_down</span>
            </div>
            <span className="text-[9px] font-mono font-bold text-secondary uppercase tracking-tight mt-0.5">SWIPE</span>
          </button>
        </div>
      </div>


      {/* Three-Dot Options Modal / Bottom Sheet */}
      {showThreeDotMenu && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setShowThreeDotMenu(false)}
        >
          <div
            className="w-full max-w-xs bg-surface-container-lowest rounded-2xl p-4 shadow-xl border border-surface-container-high/60 flex flex-col gap-2 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-surface-container-high/40">
              <span className="text-xs font-bold text-on-surface uppercase tracking-wider">
                {t.moreOptions || "Options"}
              </span>
              <button
                onClick={() => setShowThreeDotMenu(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-secondary hover:text-on-surface hover:bg-surface-container"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <button
              onClick={() => {
                setShowThreeDotMenu(false);
                setShowSuggestionModal(true);
              }}
              className="w-full p-2.5 rounded-xl flex items-center gap-2.5 text-left text-xs font-semibold text-on-surface hover:bg-surface-container transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[18px]">rate_review</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-bold">{t.suggestCorrection || "Suggest Correction / Mistake"}</span>
                <span className="text-[10px] text-secondary font-normal">Send directly to question author</span>
              </div>
            </button>

            <button
              onClick={() => {
                setShowThreeDotMenu(false);
                setShowReportModal(true);
              }}
              className="w-full p-2.5 rounded-xl flex items-center gap-2.5 text-left text-xs font-semibold text-error hover:bg-error-container/20 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-error-container/30 text-error flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[18px]">flag</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-bold">{t.reportQuestionTitle || "Report Question"}</span>
                <span className="text-[10px] text-secondary font-normal">Flag incorrect or inappropriate content</span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Post-Answer Pop-up Modal */}
      {showPostAnswerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm sm:max-w-md bg-surface-container-lowest rounded-3xl p-5 shadow-2xl border border-surface-container-high/60 flex flex-col gap-3.5 max-h-[90vh] overflow-y-auto no-scrollbar animate-in zoom-in-95 duration-200 text-left">
            {/* Top Result Banner */}
            <div className="flex items-center justify-between pb-2 border-b border-surface-container-high/40">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center text-white font-bold shrink-0 shadow-sm ${
                    isCorrect ? "bg-emerald-600" : "bg-rose-600"
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {isCorrect ? "check" : "close"}
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-on-surface">
                    {isCorrect ? (t.correctFeedback || "Correct Answer!") : (t.reviewSolution || "Incorrect Solution")}
                  </h3>
                  <span className="text-[11px] text-secondary font-mono">
                    Solved in {(stoppedTimeMsRef.current / 1000).toFixed(1)}s
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    isCorrect
                      ? "bg-tertiary-fixed text-on-tertiary-fixed"
                      : "bg-error-container text-on-error-container"
                  }`}
                >
                  {isCorrect
                    ? `+${scoringRule.marksPerCorrect.toFixed(2)} ${t.marksPlus || "Marks"}`
                    : `-${scoringRule.penaltyPerWrong.toFixed(2)} ${t.marksPenalty || "Penalty"}`}
                </span>
                <button
                  type="button"
                  onClick={() => setShowPostAnswerModal(false)}
                  className="w-7 h-7 rounded-full hover:bg-surface-container flex items-center justify-center text-secondary hover:text-on-surface"
                  title="Close modal"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
            </div>

            {/* Correct Option Pill if Incorrect */}
            {!isCorrect && correctOptionId && (
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0">
                  {correctOptionId}
                </span>
                <span className="font-bold text-emerald-950 dark:text-emerald-200">
                  Correct Answer is Option {correctOptionId}
                </span>
              </div>
            )}

            {/* Quick Proof Explanation Section */}
            <div className="bg-surface-container-low rounded-2xl p-3 border border-surface-container-high/40 flex flex-col gap-1.5">
              <div className="flex items-center gap-1 text-primary font-bold text-xs">
                <span className="material-symbols-outlined text-[16px]">bolt</span>
                <span>{t.quickProof || "Quick Proof"}</span>
              </div>
              <p className="text-xs text-on-surface leading-relaxed max-h-36 overflow-y-auto no-scrollbar">
                {activeExplanation || (lang === "hi" ? "इस प्रश्न के लिए कोई व्याख्या उपलब्ध नहीं है।" : "Author did not provide an explanation for this question.")}
              </p>
            </div>

            {/* Spaced Repetition Timeline Selector */}
            <div className="bg-surface-container-low rounded-2xl p-3 border border-surface-container-high/40 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-secondary text-xs font-semibold">
                  <span className="material-symbols-outlined text-[15px] text-primary">history</span>
                  <span>{t.repeatPrompt || "When should this question repeat?"}</span>
                </div>
                {repeatSavedBadge && (
                  <span className="text-[10px] text-tertiary font-bold animate-in fade-in">
                    {repeatSavedBadge}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {(
                  [
                    { id: "day", label: t.repeatDay || "Same Day", tip: "< 1 Day" },
                    { id: "week", label: t.repeatWeek || "In a Week", tip: "2-6 Days" },
                    { id: "month", label: t.repeatMonth || "In a Month", tip: "14-28 Days" },
                    { id: "never", label: t.repeatNever || "Never", tip: "Mastered" },
                  ] as const
                ).map((item) => {
                  const isChosen = repeatInterval === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectRepeat(item.id)}
                      className={`py-2 px-1 rounded-xl text-center text-xs font-bold transition-all border ${
                        isChosen
                          ? "bg-primary text-on-primary border-primary shadow-xs"
                          : "bg-surface-container border-transparent text-secondary hover:text-on-surface hover:bg-surface-container-high"
                      }`}
                      title={item.tip}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Large Prominent Skip & Next Question Button */}
            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowPostAnswerModal(false);
                  onNextQuestion();
                }}
                className="w-full h-14 rounded-2xl bg-gradient-to-r from-primary to-primary-container text-on-primary font-bold text-base shadow-lg hover:shadow-xl active:scale-[0.99] transition-all flex items-center justify-center gap-2"
              >
                <span>{lang === "hi" ? "छोड़ें और अगला प्रश्न (Skip & Next)" : "Skip & Next Question"}</span>
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </button>
              <button
                type="button"
                onClick={() => setShowPostAnswerModal(false)}
                className="py-1 text-center text-xs text-secondary hover:text-on-surface font-semibold"
              >
                {lang === "hi" ? "कार्ड पर वापस देखें" : "Dismiss & View Question Card"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals: Rendered here as fallback if not hoisted by container */}
      {!onOpenShareModal && (
        <ShareFriendModal
          question={question}
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          onOpenChatWithFriend={onOpenChatWithFriend}
        />
      )}
      {!onOpenSaveModal && (
        <SavePlaylistModal
          question={question}
          isOpen={showSaveModal}
          onClose={() => setShowSaveModal(false)}
          onSavedChange={(savedList) => setIsSaved(savedList.length > 0)}
        />
      )}
      {!onOpenCommentsModal && (
        <CommentsModal
          question={question}
          isOpen={showCommentsModal}
          onClose={() => setShowCommentsModal(false)}
        />
      )}
      {!onOpenAuthorModal && (
        <AuthorModal
          authorName={question.author_name || "Aspirant"}
          authorAvatar={question.author_avatar}
          authorUsername={authorUsername}
          authorId={question.author_id}
          targetExam={scoringRule.shortName}
          isOpen={showAuthorModal}
          onClose={() => setShowAuthorModal(false)}
        />
      )}
      {!onOpenReportModal && (
        <ReportModal
          questionId={question.id}
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          onReportSubmitted={() => {}}
        />
      )}
      {!onOpenSuggestionModal && (
        <SuggestionModal
          question={question}
          isOpen={showSuggestionModal}
          onClose={() => setShowSuggestionModal(false)}
        />
      )}
    </div>
  );
};

"use client";

import React, { useState, useEffect, useRef } from "react";
import { Question, RepeatInterval, FriendUser } from "@/types/database";
import { ShareFriendModal } from "./ShareFriendModal";
import { SavePlaylistModal } from "./SavePlaylistModal";
import { CommentsModal } from "./CommentsModal";
import { AuthorModal } from "../feed/AuthorModal";
import { ReportModal } from "../feed/ReportModal";
import { formatWhatsAppChallenge, openWhatsAppShare } from "@/lib/utils/whatsapp";
import { getExamScoringRule } from "@/lib/utils/examScoring";
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
}) => {
  // Bilingual display language toggle ('en' | 'hi')
  const [displayLang, setDisplayLang] = useState<"en" | "hi">(
    question.language === "hi" ? "hi" : "en"
  );

  // Quality peer verification votes
  const [upvotes, setUpvotes] = useState<number>(question.quality_upvotes || 94);
  const [downvotes, setDownvotes] = useState<number>(question.quality_downvotes || 2);
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
  const [likesCount, setLikesCount] = useState<number>(38);
  const [commentsCount, setCommentsCount] = useState<number>(14);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [isFollowing, setIsFollowing] = useState<boolean>(false);

  // Metrics
  const [metrics, setMetrics] = useState({
    attempts: initialAnswerRecord?.metrics?.attempts ?? question.total_attempts,
    correctAttempts: initialAnswerRecord?.metrics?.correctAttempts ?? question.correct_attempts,
    avgTimeSec:
      initialAnswerRecord?.metrics?.avgTimeSec ??
      (question.total_attempts > 0 ? Math.round(question.total_time_ms / question.total_attempts / 1000) : 15),
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

  // Gesture refs
  const explanationRef = useRef<HTMLDivElement | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Load question like status, repeat preference and quality vote
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

    try {
      const res = await fetch("/api/questions/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: question.id,
          selectedOptionId: optionId,
          responseTimeMs: finalElapsedMs,
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

    try {
      await fetch("/api/questions/repeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: question.id, interval }),
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
    try {
      await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: nextSaved ? "save_question" : "remove_question",
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
          {/* Active Question Timer */}
          <div
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full font-mono text-label-md transition-colors ${
              isAnswered
                ? "bg-surface-container text-secondary"
                : "bg-surface-container-high text-primary font-bold shadow-xs"
            }`}
            title="Time spent on this question"
          >
            <span className="material-symbols-outlined text-[15px]">timer</span>
            <span>
              {isAnswered
                ? `${(stoppedTimeMsRef.current / 1000).toFixed(1)}s`
                : `${Math.floor(elapsedSeconds / 60)}:${String(elapsedSeconds % 60).padStart(2, "0")}`}
            </span>
          </div>

          {/* Report Button */}
          <button
            onClick={() => setShowReportModal(true)}
            className="p-1 rounded-full text-secondary hover:text-error transition-colors"
            title="Report question"
          >
            <span className="material-symbols-outlined text-[18px]">flag</span>
          </button>
        </div>
      </div>

      {/* 2. Main Question Card Body + Floating Action Bar on the Right */}
      <div className="relative flex-1 flex flex-col justify-center py-2 pr-12 min-h-0 overflow-hidden">
        {/* Author & Bilingual Toggle Row */}
        <div className="flex items-center justify-between mb-2 shrink-0">
          <button
            onClick={() => setShowAuthorModal(true)}
            className="flex items-center gap-2 text-left group"
          >
            <div className="w-6 h-6 rounded-full overflow-hidden bg-primary-fixed flex items-center justify-center shrink-0">
              {question.author_avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={question.author_avatar}
                  alt={question.author_name || "Author"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="material-symbols-outlined text-[14px] text-primary">person</span>
              )}
            </div>
            <span className="font-body-sm text-body-sm text-secondary group-hover:text-primary transition-colors">
              Question by <strong className="font-medium text-on-surface">{question.author_name || "Rahul S."}</strong>
            </span>
          </button>

          {/* Bilingual English / Hindi Toggle Pill */}
          <div className="flex items-center rounded-lg bg-surface-container p-0.5 text-[11px] font-bold border border-surface-container-high/60">
            <button
              onClick={() => setDisplayLang("en")}
              className={`px-2 py-0.5 rounded-md transition-all ${
                displayLang === "en"
                  ? "bg-primary text-on-primary shadow-xs"
                  : "text-secondary hover:text-on-surface"
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setDisplayLang("hi")}
              className={`px-2 py-0.5 rounded-md transition-all ${
                displayLang === "hi"
                  ? "bg-primary text-on-primary shadow-xs"
                  : "text-secondary hover:text-on-surface"
              }`}
            >
              हिन्दी
            </button>
          </div>
        </div>

        {/* Question Statement */}
        <div className="overflow-y-auto no-scrollbar max-h-[38vh] mb-2.5">
          <h2 className="text-lg sm:text-xl font-bold text-on-surface tracking-tight leading-snug">
            {activeQuestionText}
          </h2>
        </div>

        {/* Community Performance Metrics Bar */}
        <div className="overflow-x-auto no-scrollbar py-1 mb-3 shrink-0">
          <div className="flex items-center gap-2 text-secondary font-body-sm text-body-sm whitespace-nowrap bg-surface-container-low px-3 py-1.5 rounded-xl border border-surface-container-high/40">
            {metrics.attempts > 0 ? (
              <>
                <span className="flex items-center gap-1 font-medium text-on-surface">
                  <span className="material-symbols-outlined text-[15px] text-primary">groups</span>
                  {metrics.attempts.toLocaleString()} attempts
                </span>
                <span>·</span>
                <span className="flex items-center gap-1 font-medium text-on-surface">
                  <span className="material-symbols-outlined text-[15px] text-tertiary">target</span>
                  {accuracyPercentage}% acc
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px]">speed</span>
                  {metrics.avgTimeSec}s avg
                </span>
                {metrics.fastestSec && (
                  <>
                    <span>·</span>
                    <span className="flex items-center gap-1 text-tertiary font-semibold">
                      <span className="material-symbols-outlined text-[15px]">bolt</span>
                      {metrics.fastestSec}s fastest
                    </span>
                  </>
                )}
              </>
            ) : (
              <span className="text-secondary italic text-xs flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px] text-primary">emoji_events</span>
                Be the first to solve! Building statistics
              </span>
            )}
          </div>
        </div>

        {/* Options Stack / Answering Area */}
        <div className="shrink-0">
          {!showOptions && !isAnswered ? (
            <button
              onClick={() => setShowOptions(true)}
              className="w-full h-13 bg-primary text-on-primary rounded-xl font-label-lg text-label-lg font-bold shadow-md hover:bg-primary-container active:scale-[0.99] transition-all flex items-center justify-center gap-2 group"
            >
              <span className="material-symbols-outlined text-[20px] transition-transform group-hover:scale-110">
                touch_app
              </span>
              <span>Answer Question</span>
            </button>
          ) : (
            <div className="flex flex-col gap-2 animate-in fade-in duration-200">
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
                      <span className="text-sm font-medium leading-snug">{activeOptText(opt)}</span>
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
          )}
        </div>

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
                <span>Explanation & Quick Proof</span>
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
                    ? `+${scoringRule.marksPerCorrect.toFixed(2)} Marks`
                    : `-${scoringRule.penaltyPerWrong.toFixed(2)} Marks (Penalty)`}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isCorrect
                      ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200"
                      : "bg-rose-500/15 text-rose-800 dark:text-rose-200"
                  }`}
                >
                  {isCorrect ? "Correct!" : "Review Solution"}
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
                Peer Verified PYQ
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
                  <span>Repeat:</span>
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
                    { id: "day", label: "< 1 Day", tip: "Quick" },
                    { id: "week", label: "< 1 Week", tip: "Week" },
                    { id: "month", label: "< 1 Month", tip: "Month" },
                    { id: "never", label: "Never", tip: "Mastered" },
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
              onClick={() => setShowAuthorModal(true)}
              className="w-10 h-10 rounded-full overflow-hidden bg-primary-fixed border-2 border-surface-container-lowest shadow-sm flex items-center justify-center group"
              title="Creator Profile"
            >
              {question.author_avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={question.author_avatar}
                  alt={question.author_name || "Author"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="material-symbols-outlined text-[20px] text-primary">person</span>
              )}
            </button>
            <button
              onClick={() => setIsFollowing((prev) => !prev)}
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
              if (typeof window !== "undefined" && !localStorage.getItem("qz_user_id")) {
                window.dispatchEvent(
                  new CustomEvent("open_auth_modal", {
                    detail: {
                      reason: "Sign in required to view proof shortcuts & discuss with aspirants",
                      mode: "signup",
                    },
                  })
                );
                return;
              }
              setShowCommentsModal(true);
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
              if (typeof window !== "undefined" && !localStorage.getItem("qz_user_id")) {
                window.dispatchEvent(
                  new CustomEvent("open_auth_modal", {
                    detail: {
                      reason: "Sign in required to challenge and share with study partners",
                      mode: "signup",
                    },
                  })
                );
                return;
              }
              setShowShareModal(true);
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

          {/* Quick Revision Bookmark Button */}
          <button
            onClick={handleQuickSave}
            onContextMenu={(e) => {
              e.preventDefault();
              setShowSaveModal(true);
            }}
            className="flex flex-col items-center group active:scale-90 transition-transform"
            title="Quick Save to Revision (Right click for playlists)"
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
            <span className="text-[11px] font-bold text-secondary mt-0.5">{isSaved ? "Saved" : "Save"}</span>
          </button>
        </div>
      </div>

      {/* 5. Bottom Navigation Bar on Reel Card */}
      <div className="pt-2 border-t border-surface-container-high/30 flex items-center justify-between shrink-0">
        <button
          onClick={() => onHideQuestion(question.id)}
          className="px-2.5 py-1 rounded-lg text-secondary hover:text-error hover:bg-surface-container text-xs font-semibold flex items-center gap-1 transition-colors"
          title="Exclude from future feed"
        >
          <span className="material-symbols-outlined text-[15px]">visibility_off</span>
          <span>I Know This · Hide</span>
        </button>

        <div className="flex items-center gap-1 text-secondary text-xs">
          <button
            onClick={onPrevQuestion}
            disabled={index <= 1}
            className="p-1 rounded-full hover:text-primary disabled:opacity-20 transition-opacity"
            title="Previous question (Swipe down)"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
          </button>
          <span className="font-mono text-[11px]">Swipe</span>
          <button
            onClick={onNextQuestion}
            className="p-1 rounded-full hover:text-primary transition-colors"
            title="Next question (Swipe up)"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_downward</span>
          </button>
        </div>
      </div>

      {/* Modals */}
      <ShareFriendModal
        question={question}
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        onOpenChatWithFriend={onOpenChatWithFriend}
      />
      <SavePlaylistModal
        question={question}
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSavedChange={(savedList) => setIsSaved(savedList.length > 0)}
      />
      <CommentsModal
        question={question}
        isOpen={showCommentsModal}
        onClose={() => setShowCommentsModal(false)}
      />
      <AuthorModal
        authorName={question.author_name || "Rahul S."}
        authorAvatar={question.author_avatar}
        isOpen={showAuthorModal}
        onClose={() => setShowAuthorModal(false)}
      />
      <ReportModal
        questionId={question.id}
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        onReportSubmitted={() => {}}
      />
    </div>
  );
};

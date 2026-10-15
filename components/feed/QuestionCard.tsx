"use client";

import React, { useState, useEffect, useRef } from "react";
import { Question } from "@/types/database";
import { ReportModal } from "./ReportModal";
import { AuthorModal } from "./AuthorModal";
import { formatWhatsAppChallenge, openWhatsAppShare } from "@/lib/utils/whatsapp";
import { getExamScoringRule } from "@/lib/utils/examScoring";

interface QuestionCardProps {
  question: Question;
  index: number;
  isActive: boolean;
  onAnswerSubmitted?: (result: {
    questionId: string;
    isCorrect: boolean;
    responseTimeMs: number;
  }) => void;
  onHideQuestion: (questionId: string) => void;
  onNextQuestion: () => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  index,
  isActive,
  onAnswerSubmitted,
  onHideQuestion,
  onNextQuestion,
}) => {
  // Option revelation state
  const [showOptions, setShowOptions] = useState(false);
  // Answering & result state
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [correctOptionId, setCorrectOptionId] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<string | undefined>(question.explanation);
  const [metrics, setMetrics] = useState({
    attempts: question.total_attempts,
    correctAttempts: question.correct_attempts,
    avgTimeSec: question.total_attempts > 0 ? Math.round(question.total_time_ms / question.total_attempts / 1000) : 15,
    fastestSec: question.fastest_correct_ms ? Number((question.fastest_correct_ms / 1000).toFixed(1)) : null,
  });

  // Timer: Begins ONLY when question becomes the active, visible question!
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const stoppedTimeMsRef = useRef<number>(0);

  // Modals
  const [showReportModal, setShowReportModal] = useState(false);
  const [showAuthorModal, setShowAuthorModal] = useState(false);

  // Bilingual language toggle
  const [displayLang, setDisplayLang] = useState<"en" | "hi">(
    question.language === "hi" ? "hi" : "en"
  );
  // Quality votes
  const [upvotes, setUpvotes] = useState<number>(question.quality_upvotes || 94);
  const [downvotes, setDownvotes] = useState<number>(question.quality_downvotes || 2);
  const [userQualityVote, setUserQualityVote] = useState<"up" | "down" | null>(null);

  // Hiding state
  const [isHiding, setIsHiding] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  // Fetch question quality vote on mount
  useEffect(() => {
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

  // Format seconds to mm:ss
  const formatTimer = (secs: number) => {
    const m = String(Math.floor(secs / 60)).padStart(2, "0");
    const s = String(secs % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  // Handle Option Select
  const handleSelectOption = async (optionId: string) => {
    if (isAnswered || isSubmitting) return;

    // Stop timer
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
        if (data.updatedMetrics) {
          setMetrics({
            attempts: data.updatedMetrics.total_attempts,
            correctAttempts: data.updatedMetrics.correct_attempts,
            avgTimeSec: data.updatedMetrics.avg_time_seconds,
            fastestSec: data.updatedMetrics.fastest_correct_seconds,
          });
        }
        if (onAnswerSubmitted) {
          onAnswerSubmitted({
            questionId: question.id,
            isCorrect: data.isCorrect,
            responseTimeMs: finalElapsedMs,
          });
        }
      } else {
        setSubmitError(data.error || "Submission failed. Please retry.");
        // Resume timer if unrecorded
        if (!isAnswered && startTimeRef.current) {
          timerRef.current = setInterval(() => {
            if (startTimeRef.current) {
              setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
            }
          }, 1000);
        }
      }
    } catch {
      setSubmitError("Network connection issue. Answer not recorded yet.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShareQuestion = async () => {
    const url = typeof window !== "undefined" ? `${window.location.origin}/q/${question.id}` : "";
    const shareText = `Solve this SSC CGL question on Qz Loop: "${question.question_text}"`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Qz Loop Practice Question",
          text: shareText,
          url,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    }
  };

  const handleHide = () => {
    setIsHiding(true);
    setTimeout(() => {
      onHideQuestion(question.id);
    }, 250);
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

  const activeQuestionText =
    displayLang === "hi" && question.hindi_question_text
      ? question.hindi_question_text
      : question.question_text;

  const activeExplanation =
    displayLang === "hi" && question.hindi_explanation
      ? question.hindi_explanation
      : (explanation || "The correct option is " + correctOptionId + ".");

  const activeOptText = (opt: { text: string; hindi_text?: string }) => {
    return displayLang === "hi" && opt.hindi_text ? opt.hindi_text : opt.text;
  };

  const scoringRule = getExamScoringRule(question.examination_id || "exam-ssc-cgl");

  const accuracyPercentage =
    metrics.attempts > 0 ? Math.round((metrics.correctAttempts / metrics.attempts) * 100) : 0;

  return (
    <div
      className={`relative w-full rounded-2xl bg-surface-container-lowest p-4 sm:p-5 shadow-sm border border-surface-container-high/60 transition-all duration-300 flex flex-col justify-between ${
        isHiding ? "opacity-30 scale-95 pointer-events-none" : "opacity-100"
      }`}
    >
      <div>
        {/* A. Top Information Bar */}
        <div className="flex items-center justify-between mb-3 pb-1 border-b border-surface-container-high/30">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider font-semibold">
              {question.subject_name || "General"}
            </span>
            <span className="text-secondary font-label-sm text-label-sm font-mono">
              · Q.{1400 + index}
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
            {question.difficulty && (
              <span className="px-2 py-0.5 rounded-full bg-tertiary-fixed/40 text-tertiary font-label-sm text-label-sm font-semibold capitalize">
                {question.difficulty}
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
              title="Time on this question"
            >
              <span className="material-symbols-outlined text-[15px]">timer</span>
              <span>
                {isAnswered
                  ? `${(stoppedTimeMsRef.current / 1000).toFixed(1)}s`
                  : formatTimer(elapsedSeconds)}
              </span>
            </div>

            {/* WhatsApp Direct Share */}
            <button
              onClick={handleDirectWhatsAppShare}
              className="p-1 rounded-full text-[#25D366] hover:bg-[#25D366]/15 transition-colors"
              title="Challenge friends on WhatsApp"
            >
              <span className="material-symbols-outlined text-[18px]">share</span>
            </button>

            {/* Share Question */}
            <button
              onClick={handleShareQuestion}
              className="p-1 rounded-full text-secondary hover:text-primary hover:bg-surface-container transition-colors relative"
              title="Share question link"
            >
              <span className="material-symbols-outlined text-[18px]">link</span>
              {shareCopied && (
                <span className="absolute -bottom-7 right-0 text-[10px] bg-on-surface text-surface px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap z-20">
                  Link copied!
                </span>
              )}
            </button>

            {/* Report Menu */}
            <button
              onClick={() => setShowReportModal(true)}
              className="p-1 rounded-full text-secondary hover:text-error hover:bg-surface-container transition-colors"
              title="Report question"
            >
              <span className="material-symbols-outlined text-[18px]">flag</span>
            </button>
          </div>
        </div>

        {/* B. Question Author & Bilingual Toggle */}
        <div className="flex items-center justify-between mb-3">
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

        {/* C. Question Text */}
        <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface tracking-tight mb-4 leading-snug">
          {activeQuestionText}
        </h2>

        {/* D. Community Performance Metrics Row (Visible BEFORE answering!) */}
        <div className="overflow-x-auto no-scrollbar py-1 mb-4">
          <div className="flex items-center gap-2 text-secondary font-body-sm text-body-sm whitespace-nowrap bg-surface-container-low px-3 py-2 rounded-xl border border-surface-container-high/40">
            {metrics.attempts > 0 ? (
              <>
                <span className="flex items-center gap-1 font-medium text-on-surface">
                  <span className="material-symbols-outlined text-[15px] text-primary">groups</span>
                  {metrics.attempts.toLocaleString()} attempts
                </span>
                <span>·</span>
                <span className="flex items-center gap-1 font-medium text-on-surface">
                  <span className="material-symbols-outlined text-[15px] text-tertiary">target</span>
                  {accuracyPercentage}% accuracy
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
              <span className="text-secondary italic flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-primary">emoji_events</span>
                Be the first to solve! Building statistics
              </span>
            )}
          </div>
        </div>

        {/* E. Primary Action: Answer Question Button OR Revealed Options Stack */}
        {!showOptions && !isAnswered ? (
          <div className="my-3">
            <button
              onClick={() => setShowOptions(true)}
              className="w-full h-14 bg-primary-container text-on-primary rounded-xl font-label-lg text-label-lg shadow-sm hover:bg-primary active:scale-[0.99] transition-all flex items-center justify-center gap-2 group"
            >
              <span className="material-symbols-outlined text-[20px] transition-transform group-hover:scale-110">
                touch_app
              </span>
              <span>Answer Question</span>
            </button>
          </div>
        ) : (
          /* Options Stack */
          <div className="flex flex-col gap-2.5 my-3 animate-in fade-in duration-200">
            {question.options.map((opt) => {
              const isSelected = selectedOptionId === opt.id;
              const isTheCorrectOne = correctOptionId === opt.id;

              let btnStyle =
                "bg-surface-container-low text-on-surface hover:bg-surface-container border border-transparent";
              let badgeStyle = "bg-surface-container text-on-surface";
              let iconName = "";

              if (isAnswered) {
                if (isTheCorrectOne) {
                  btnStyle =
                    "bg-tertiary-fixed text-on-tertiary-fixed border border-tertiary shadow-sm font-semibold";
                  badgeStyle = "bg-tertiary text-on-tertiary";
                  iconName = "check";
                } else if (isSelected && !isCorrect) {
                  btnStyle =
                    "bg-error-container text-on-error-container border border-error shadow-sm font-medium";
                  badgeStyle = "bg-error text-on-error";
                  iconName = "close";
                } else {
                  btnStyle = "bg-surface-container-lowest/60 text-secondary opacity-40 border-transparent";
                  badgeStyle = "bg-surface-container text-secondary";
                }
              }

              return (
                <button
                  key={opt.id}
                  disabled={isAnswered}
                  onClick={() => handleSelectOption(opt.id)}
                  className={`w-full min-h-[52px] px-3.5 py-3 rounded-xl flex items-center justify-between text-left transition-all active:scale-[0.99] ${btnStyle}`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-label-md text-label-md font-bold shrink-0 shadow-xs ${badgeStyle}`}
                    >
                      {opt.id}
                    </span>
                    <span className="font-body-lg text-body-lg leading-snug">{activeOptText(opt)}</span>
                  </div>

                  {isAnswered && iconName && (
                    <span className="material-symbols-outlined text-[20px] shrink-0 font-bold">
                      {iconName}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Network / Submission Error State */}
            {submitError && (
              <div className="p-3 rounded-xl bg-error-container text-on-error-container flex items-center justify-between gap-2 text-label-sm font-semibold animate-in fade-in">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="material-symbols-outlined text-[18px] shrink-0">wifi_off</span>
                  <span className="truncate">{submitError}</span>
                </div>
                {selectedOptionId && (
                  <button
                    onClick={() => handleSelectOption(selectedOptionId)}
                    className="px-2.5 py-1 rounded-lg bg-error text-on-error font-bold shrink-0 hover:bg-error/90 active:scale-95 transition-all text-xs"
                  >
                    Retry
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Immediate Explanation Drawer Card ("Quick Proof") */}
        {isAnswered && (
          <div className="mt-3 overflow-hidden rounded-xl bg-surface-container-low border border-surface-container-high/60 p-4 animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
              <div className="flex items-center gap-1.5 text-primary font-label-md text-label-md font-bold">
                <span className="material-symbols-outlined text-[18px]">bolt</span>
                <span>Explanation & Quick Proof</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className={`px-2 py-0.5 rounded-full font-label-sm text-label-sm font-bold ${
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
                  className={`px-2 py-0.5 rounded-full font-label-sm text-label-sm font-bold ${
                    isCorrect
                      ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200"
                      : "bg-rose-500/15 text-rose-800 dark:text-rose-200"
                  }`}
                >
                  {isCorrect ? "Correct!" : "Review Solution"}
                </span>
              </div>
            </div>

            <p className="font-body-md text-body-md text-on-surface leading-relaxed mb-3">
              {activeExplanation}
            </p>

            {/* Peer Quality Verification Row */}
            <div className="flex items-center justify-between py-2 border-t border-surface-container-high/40 text-xs">
              <span className="text-secondary text-[11px] font-medium flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-primary">verified</span>
                Peer Verified PYQ
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleQualityVote("up")}
                  className={`px-2.5 py-1 rounded-md flex items-center gap-1 text-[11px] font-bold transition-colors ${
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
                  className={`px-2.5 py-1 rounded-md flex items-center gap-1 text-[11px] font-bold transition-colors ${
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

            {/* Next Question CTA */}
            <div className="mt-4 pt-3 border-t border-surface-container-high/50 flex items-center justify-between">
              <span className="font-body-sm text-body-sm text-secondary">
                Ready for the next challenge?
              </span>
              <button
                onClick={onNextQuestion}
                className="px-4 py-2 rounded-xl bg-primary text-on-primary font-label-md text-label-md font-bold shadow-sm hover:bg-primary-container active:scale-95 transition-all flex items-center gap-1"
              >
                <span>Next Question</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* F. Personal Question Control: "I Know This · Hide" */}
      <div className="mt-4 pt-2.5 border-t border-surface-container-high/30 flex items-center justify-between text-secondary">
        <span className="font-body-sm text-body-sm text-secondary">
          {isAnswered ? "Answer recorded securely" : "Practice at your own pace"}
        </span>

        <button
          onClick={handleHide}
          className="px-2.5 py-1 rounded-lg bg-surface-container/60 hover:bg-surface-container text-secondary hover:text-error transition-colors flex items-center gap-1.5 group text-label-sm font-medium"
          title="Exclude this question from your future feed"
        >
          <span className="material-symbols-outlined text-[16px] group-hover:text-error">visibility_off</span>
          <span className="font-semibold">I Know This · Hide</span>
        </button>
      </div>

      {/* Modals */}
      <ReportModal
        questionId={question.id}
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        onReportSubmitted={() => {}}
      />
      <AuthorModal
        authorName={question.author_name || "Rahul S."}
        authorAvatar={question.author_avatar}
        isOpen={showAuthorModal}
        onClose={() => setShowAuthorModal(false)}
      />
    </div>
  );
};

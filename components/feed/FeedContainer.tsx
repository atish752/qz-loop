"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Question, Examination, UserProfile } from "@/types/database";
import { QuestionCard } from "./QuestionCard";
import { TopHeader } from "../layout/TopHeader";
import { ExamSwitchModal } from "./ExamSwitchModal";
import confetti from "canvas-confetti";

interface FeedContainerProps {
  initialExams?: Examination[];
  initialUser?: UserProfile;
}

const SUBJECT_FILTERS = [
  { slug: "all", label: "All" },
  { slug: "maths", label: "Maths" },
  { slug: "reasoning", label: "Reasoning" },
  { slug: "english", label: "English" },
  { slug: "gk", label: "GK" },
];

export const FeedContainer: React.FC<FeedContainerProps> = ({
  initialExams = [],
}) => {
  // State
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [currentExamId, setCurrentExamId] = useState<string>("exam-ssc-cgl");
  const [exams, setExams] = useState<Examination[]>(initialExams);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showExamModal, setShowExamModal] = useState<boolean>(false);

  // Track session displayed question IDs to avoid repeats
  const displayedQuestionIdsRef = useRef<Set<string>>(new Set());

  // Load preferences from localStorage on mount
  useEffect(() => {
    const savedSubject = localStorage.getItem("qz_last_subject");
    if (savedSubject) setSelectedSubject(savedSubject);

    const savedExam = localStorage.getItem("qz_last_exam");
    if (savedExam) setCurrentExamId(savedExam);

    // Fetch user profile
    fetch("/api/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setUser(data.user);
          if (data.exams?.length > 0) {
            setExams(data.exams);
          }
          if (data.user?.preferred_examination_id && !savedExam) {
            setCurrentExamId(data.user.preferred_examination_id);
          }
        }
      })
      .catch(() => {});
  }, []);

  // Fetch Questions from API with eligibility & repetition logic
  const loadFeed = useCallback(
    async (subject = selectedSubject, exam = currentExamId, reset = false) => {
      setIsLoading(true);
      setError(null);

      try {
        const excludedList = Array.from(displayedQuestionIdsRef.current).join(",");
        const url = `/api/feed?subject=${subject}&examId=${exam}&excludedIds=${reset ? "" : excludedList}`;

        const res = await fetch(url);
        const data = await res.json();

        if (data.success) {
          const fetched: Question[] = data.questions || [];
          if (reset) {
            setQuestions(fetched);
            setCurrentIndex(0);
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
    [selectedSubject, currentExamId]
  );

  // Initial load and filter change
  useEffect(() => {
    displayedQuestionIdsRef.current.clear();
    loadFeed(selectedSubject, currentExamId, true);
  }, [selectedSubject, currentExamId, loadFeed]);

  // Subject chip click
  const handleSubjectChange = (slug: string) => {
    setSelectedSubject(slug);
    localStorage.setItem("qz_last_subject", slug);
  };

  // Exam select
  const handleExamChange = (exam: Examination) => {
    setCurrentExamId(exam.id);
    localStorage.setItem("qz_last_exam", exam.id);
  };

  // Answer submitted celebration
  const handleAnswerSubmitted = (result: {
    questionId: string;
    isCorrect: boolean;
    responseTimeMs: number;
  }) => {
    if (result.isCorrect) {
      confetti({
        particleCount: 25,
        spread: 60,
        origin: { y: 0.8 },
        colors: ["#5300b7", "#006544", "#4edea3", "#ebddff"],
      });
    }

    // Refresh user profile streak/stats in background
    fetch("/api/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setUser(data.user);
      })
      .catch(() => {});
  };

  // Advance to next question in reel
  const handleNextQuestion = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      // Auto prefetch when remaining queue is small
      if (currentIndex >= questions.length - 3) {
        loadFeed(selectedSubject, currentExamId, false);
      }
    } else {
      // Load more if at the end
      loadFeed(selectedSubject, currentExamId, false);
    }
  }, [currentIndex, questions.length, loadFeed, selectedSubject, currentExamId]);

  // Return to previous question in reel
  const handlePrevQuestion = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  // Touch Swipe Gesture Detection for Insta-Reels feel
  const touchStartYRef = useRef<number | null>(null);
  const touchStartXRef = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartYRef.current = e.touches[0].clientY;
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartYRef.current === null || touchStartXRef.current === null) return;
    const deltaY = e.changedTouches[0].clientY - touchStartYRef.current;
    const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;

    // Must be a predominantly vertical swipe of at least 45px
    if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 45) {
      if (deltaY < 0) {
        // Swipe Up -> Next Reel
        handleNextQuestion();
      } else if (deltaY > 0 && currentIndex > 0) {
        // Swipe Down -> Prev Reel
        handlePrevQuestion();
      }
    }
    touchStartYRef.current = null;
    touchStartXRef.current = null;
  };

  // Mouse Wheel Navigation with 450ms debounce
  const lastWheelTimeRef = useRef<number>(0);
  const handleWheel = (e: React.WheelEvent) => {
    const now = Date.now();
    if (now - lastWheelTimeRef.current < 450) return;
    if (e.deltaY > 40) {
      lastWheelTimeRef.current = now;
      handleNextQuestion();
    } else if (e.deltaY < -40 && currentIndex > 0) {
      lastWheelTimeRef.current = now;
      handlePrevQuestion();
    }
  };

  // Keyboard Navigation (ArrowDown / ArrowUp / PageDown / PageUp)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowDown" || e.key === "PageDown") {
        e.preventDefault();
        handleNextQuestion();
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        handlePrevQuestion();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNextQuestion, handlePrevQuestion]);

  // Hide question
  const handleHideQuestion = async (questionId: string) => {
    try {
      await fetch("/api/questions/hide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId }),
      });
      // Advance to next eligible question immediately
      handleNextQuestion();
    } catch {
      handleNextQuestion();
    }
  };

  const activeQuestion = questions[currentIndex];
  const nextQuestion = questions[currentIndex + 1];
  const activeExam = exams.find((e) => e.id === currentExamId);

  return (
    <div className="flex flex-col min-h-screen pb-24">
      {/* Top Header */}
      <TopHeader
        currentTab="home"
        streakDays={user?.current_streak || 14}
        activeExamName={activeExam?.name || "SSC CGL"}
        user={user}
        onSelectExam={() => setShowExamModal(true)}
      />

      <div className="flex flex-col w-full px-4 pt-2">
        {/* Horizontal Subject Filter Row */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-2 no-scrollbar">
          {SUBJECT_FILTERS.map((f) => {
            const isSelected = selectedSubject === f.slug;
            return (
              <button
                key={f.slug}
                onClick={() => handleSubjectChange(f.slug)}
                className={`px-3.5 py-1.5 rounded-full font-label-md text-label-md transition-all shrink-0 ${
                  isSelected
                    ? "bg-primary-container text-on-primary font-bold shadow-sm scale-[1.02]"
                    : "bg-surface-container text-secondary hover:text-on-surface"
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Loading State */}
        {isLoading && questions.length === 0 && (
          <div className="py-20 flex flex-col items-center justify-center text-center gap-3">
            <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="font-body-sm text-body-sm text-secondary">
              Curating your practice feed...
            </p>
          </div>
        )}

        {/* Error State */}
        {error && questions.length === 0 && (
          <div className="my-10 p-6 rounded-2xl bg-surface-container-low text-center flex flex-col items-center gap-3">
            <span className="material-symbols-outlined text-error text-[36px]">wifi_off</span>
            <p className="font-headline-sm text-headline-sm font-bold text-on-surface">Connection issue</p>
            <p className="font-body-sm text-body-sm text-secondary">{error}</p>
            <button
              onClick={() => loadFeed(selectedSubject, currentExamId, true)}
              className="px-4 py-2 rounded-xl bg-primary text-on-primary font-label-md text-label-md font-bold shadow-sm"
            >
              Retry Feed
            </button>
          </div>
        )}

        {/* Active Question Reel Container with Touch & Scroll Gestures */}
        {activeQuestion && (
          <div
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onWheel={handleWheel}
            className="mt-2 flex flex-col gap-3 relative select-none"
          >
            {/* Quick Reel Navigator Floating Widget */}
            <div className="flex items-center justify-between px-1">
              <span className="text-secondary font-label-sm text-label-sm">
                Question {currentIndex + 1} of {questions.length}
              </span>
              <div className="flex items-center gap-1 bg-surface-container-low border border-surface-container-high/40 px-2 py-0.5 rounded-full text-secondary text-label-sm font-mono">
                <button
                  disabled={currentIndex === 0}
                  onClick={handlePrevQuestion}
                  className="disabled:opacity-25 hover:text-primary transition-opacity flex items-center"
                  title="Previous question (Swipe down)"
                >
                  <span className="material-symbols-outlined text-[16px]">arrow_drop_up</span>
                </button>
                <span>Reel #{currentIndex + 1}</span>
                <button
                  onClick={handleNextQuestion}
                  className="hover:text-primary transition-colors flex items-center"
                  title="Next question (Swipe up)"
                >
                  <span className="material-symbols-outlined text-[16px]">arrow_drop_down</span>
                </button>
              </div>
            </div>

            <QuestionCard
              key={activeQuestion.id}
              question={activeQuestion}
              index={currentIndex + 1}
              isActive={true}
              onAnswerSubmitted={handleAnswerSubmitted}
              onHideQuestion={handleHideQuestion}
              onNextQuestion={handleNextQuestion}
            />

            {/* Peek Card: Cueing Next Question in Vertical Reel */}
            {nextQuestion ? (
              <div
                onClick={handleNextQuestion}
                className="mt-1 relative overflow-hidden rounded-xl bg-surface-container-low border border-surface-container-high/60 p-3.5 cursor-pointer active:scale-[0.99] transition-transform select-none group"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded bg-surface-container-highest text-secondary font-label-sm text-label-sm uppercase tracking-wider font-semibold">
                      {nextQuestion.subject_name || "General"}
                    </span>
                    <span className="text-secondary font-body-sm text-body-sm">
                      · Q.{1401 + currentIndex}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-primary font-label-sm text-label-sm font-bold group-hover:translate-x-0.5 transition-transform">
                    <span>Swipe up</span>
                    <span className="material-symbols-outlined text-[15px] animate-bounce">arrow_upward</span>
                  </div>
                </div>
                <p className="font-body-md text-body-md text-on-surface truncate opacity-75">
                  {nextQuestion.question_text}
                </p>
                {/* Subtle gradient peek shim */}
                <div className="absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-surface-container-low to-transparent pointer-events-none" />
              </div>
            ) : (
              <div className="mt-2 py-3 flex items-center justify-center text-center">
                <button
                  onClick={handleNextQuestion}
                  className="font-label-md text-label-md text-primary font-semibold flex items-center gap-1 hover:underline"
                >
                  <span>Load more questions</span>
                  <span className="material-symbols-outlined text-[16px]">refresh</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Empty State when zero questions left */}
        {!isLoading && questions.length === 0 && !error && (
          <div className="my-12 p-8 rounded-2xl bg-surface-container-low text-center flex flex-col items-center gap-3">
            <span className="material-symbols-outlined text-tertiary text-[44px]">workspace_premium</span>
            <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">All caught up!</h3>
            <p className="font-body-md text-body-md text-secondary max-w-xs">
              You have completed all currently eligible questions in this subject category.
            </p>
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={() => handleSubjectChange("all")}
                className="px-4 py-2 rounded-xl bg-primary text-on-primary font-label-md text-label-md font-bold shadow-sm"
              >
                Switch to All Subjects
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Target Exam Switcher Modal */}
      <ExamSwitchModal
        exams={exams}
        currentExamId={currentExamId}
        isOpen={showExamModal}
        onClose={() => setShowExamModal(false)}
        onSelectExam={handleExamChange}
      />
    </div>
  );
};

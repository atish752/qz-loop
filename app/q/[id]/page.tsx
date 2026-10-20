"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { Question } from "@/types/database";
import { TopHeader } from "@/components/layout/TopHeader";
import { QuestionCard } from "@/components/feed/QuestionCard";
import confetti from "canvas-confetti";

interface SharedQuestionPageProps {
  params: Promise<{ id: string }>;
}

export default function SharedQuestionPage({ params }: SharedQuestionPageProps) {
  const { id } = use(params);
  const [question, setQuestion] = useState<Question | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    fetch(`/api/questions/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.question) {
          setQuestion(data.question);
        } else {
          setError(data.error || "Question not found");
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load question");
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleAnswerSubmitted = (result: {
    questionId: string;
    isCorrect: boolean;
    responseTimeMs: number;
  }) => {
    if (result.isCorrect) {
      confetti({
        particleCount: 30,
        spread: 60,
        origin: { y: 0.7 },
        colors: ["#5300b7", "#006544", "#4edea3", "#ebddff"],
      });
    }
  };

  return (
    <div className="flex flex-col min-h-screen pb-24">
      <TopHeader currentTab="loop" streakDays={14} activeExamName="NEET UG (Medical Entrance)" />

      <main className="flex-1 flex flex-col w-full max-w-[480px] mx-auto px-4 pt-4">
        {/* Breadcrumb & Navigation */}
        <div className="flex items-center justify-between mb-3">
          <Link
            href="/loop"
            className="flex items-center gap-1 text-primary font-label-md text-label-md font-semibold hover:underline"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span>Back to Qz Loop</span>
          </Link>
          <span className="px-2 py-0.5 rounded-full bg-surface-container font-label-sm text-label-sm text-secondary font-semibold">
            Shared Question
          </span>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="py-24 flex flex-col items-center justify-center text-center gap-3">
            <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="font-body-sm text-body-sm text-secondary">Loading question...</p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="my-10 p-6 rounded-2xl bg-surface-container-low text-center flex flex-col items-center gap-3 border border-surface-container-high/60">
            <span className="material-symbols-outlined text-error text-[36px]">error</span>
            <p className="font-headline-sm text-headline-sm font-bold text-on-surface">Question Unavailable</p>
            <p className="font-body-sm text-body-sm text-secondary">{error}</p>
            <Link
              href="/loop"
              className="mt-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary font-label-md text-label-md font-bold shadow-sm"
            >
              Go to Qz Loop Practice Feed
            </Link>
          </div>
        )}

        {/* Active Question Card */}
        {question && !isLoading && (
          <div className="flex flex-col gap-4 animate-in fade-in duration-300">
            <QuestionCard
              question={question}
              index={1}
              isActive={true}
              onAnswerSubmitted={handleAnswerSubmitted}
              onHideQuestion={() => {}}
              onNextQuestion={() => {
                window.location.href = "/";
              }}
            />

            {/* Next Action Box */}
            <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container-high/60 flex items-center justify-between">
              <div className="flex flex-col min-w-0 pr-2">
                <span className="font-label-md text-label-md text-on-surface font-bold truncate">
                  Ready for more questions?
                </span>
                <span className="font-body-sm text-body-sm text-secondary truncate">
                  Practice with infinite Reels scroll for NEET UG
                </span>
              </div>
              <Link
                href="/loop"
                className="px-4 py-2.5 rounded-xl bg-primary text-on-primary font-label-md text-label-md font-bold shrink-0 shadow-xs hover:bg-primary-container active:scale-95 transition-all flex items-center gap-1"
              >
                <span>Enter Qz Loop</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { MatrixStats } from "@/types/database";
import { TopHeader } from "../layout/TopHeader";

export const MatrixView: React.FC = () => {
  const [period, setPeriod] = useState<"today" | "week" | "month" | "lifetime">("week");
  const [stats, setStats] = useState<MatrixStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [shareSuccess, setShareSuccess] = useState<boolean>(false);

  useEffect(() => {
    setIsLoading(true);
    fetch(`/api/matrix?period=${period}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStats(data.stats);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [period]);

  const handleShare = async () => {
    if (!stats) return;
    const shareText = `I solved ${stats.total_solved} questions ${
      period === "today" ? "today" : period === "week" ? "this week" : "recently"
    } with ${stats.accuracy_percentage}% accuracy on Qz Loop! Challenge yourself at ${
      typeof window !== "undefined" ? window.location.origin : "https://qzloop.app"
    }`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "My Qz Loop Practice Record",
          text: shareText,
          url: window.location.origin,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    navigator.clipboard.writeText(shareText);
    setShareSuccess(true);
    setTimeout(() => setShareSuccess(false), 2500);
  };

  const subjectIcons: Record<string, string> = {
    biology: "eco",
    chemistry: "biotech",
    physics: "bolt",
    maths: "calculate",
    reasoning: "psychology",
    english: "spellcheck",
    gk: "public",
  };

  return (
    <div className="flex flex-col min-h-screen pb-24">
      <TopHeader currentTab="matrix" streakDays={14} activeExamName="NEET UG (Medical Entrance)" />

      <div className="flex flex-col w-full px-4 pt-3 pb-6">
        {/* Header & Context */}
        <div className="flex items-center justify-between pb-3">
          <div>
            <h1 className="font-headline-sm text-headline-sm font-bold text-on-surface tracking-tight">
              Personal Matrix
            </h1>
            <p className="font-body-sm text-body-sm text-secondary">
              NEET UG Prep • Real Asia/Kolkata Drill Data
            </p>
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface font-semibold text-label-sm">
            <span className="material-symbols-outlined text-[16px] text-tertiary">bolt</span>
            <span>TOP 5%</span>
          </div>
        </div>

        {/* Time Period Segmented Control */}
        <div className="w-full bg-surface-container rounded-xl p-1 flex items-center justify-between mb-4">
          {(["today", "week", "month", "lifetime"] as const).map((p) => {
            const isSelected = period === p;
            const labels = {
              today: "Today",
              week: "Week",
              month: "Month",
              lifetime: "Lifetime",
            };
            return (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`flex-1 py-1.5 rounded-lg text-center font-label-md text-label-md transition-all ${
                  isSelected
                    ? "bg-primary-container text-on-primary font-bold shadow-sm"
                    : "text-secondary hover:text-on-surface"
                }`}
              >
                {labels[p]}
              </button>
            );
          })}
        </div>

        {/* High-Impact Key Metrics Grid (All 7 required spec metrics) */}
        <div className="grid grid-cols-3 gap-2.5 mb-3">
          {/* 1. Solved */}
          <div className="bg-surface-container-low rounded-xl p-3 flex flex-col justify-between shadow-xs border border-surface-container-high/40">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-semibold">
              Solved
            </span>
            <div className="my-1">
              <span className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-on-surface tracking-tight">
                {isLoading ? "..." : stats?.total_solved || 0}
              </span>
            </div>
            <span className="font-label-sm text-label-sm text-secondary">
              Questions
            </span>
          </div>

          {/* 2. Accuracy */}
          <div className="bg-surface-container-low rounded-xl p-3 flex flex-col justify-between shadow-xs border border-surface-container-high/40">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-semibold">
              Accuracy
            </span>
            <div className="my-1">
              <span className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-tertiary tracking-tight">
                {isLoading ? "..." : `${stats?.accuracy_percentage || 0}%`}
              </span>
            </div>
            <span className="font-label-sm text-label-sm text-secondary truncate">
              {stats?.total_solved && stats.total_solved > 0
                ? `${stats.correct_count} of ${stats.total_solved}`
                : "No attempts"}
            </span>
          </div>

          {/* 3. Correct vs Incorrect Breakdown */}
          <div className="bg-surface-container-low rounded-xl p-3 flex flex-col justify-between shadow-xs border border-surface-container-high/40">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-semibold">
              Results
            </span>
            <div className="my-1 flex items-baseline gap-1">
              <span className="font-headline-sm text-headline-sm font-bold text-tertiary">
                {stats?.correct_count || 0}
              </span>
              <span className="text-secondary text-xs">/</span>
              <span className="font-headline-sm text-headline-sm font-bold text-error">
                {stats?.incorrect_count || 0}
              </span>
            </div>
            <span className="font-label-sm text-label-sm text-secondary truncate">
              Correct / Wrong
            </span>
          </div>
        </div>

        {/* Second Row of Metrics */}
        <div className="grid grid-cols-3 gap-2.5 mb-4">
          {/* 4. Total Time Spent */}
          <div className="bg-surface-container-low rounded-xl p-3 flex flex-col justify-between shadow-xs border border-surface-container-high/40">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-semibold">
              Total Time
            </span>
            <div className="my-1">
              <span className="font-headline-sm text-headline-sm font-bold text-on-surface tracking-tight">
                {isLoading
                  ? "..."
                  : stats?.total_time_seconds
                  ? stats.total_time_seconds >= 60
                    ? `${Math.floor(stats.total_time_seconds / 60)}m ${stats.total_time_seconds % 60}s`
                    : `${stats.total_time_seconds}s`
                  : "0s"}
              </span>
            </div>
            <span className="font-label-sm text-label-sm text-secondary">
              Drill duration
            </span>
          </div>

          {/* 5. Average Speed */}
          <div className="bg-surface-container-low rounded-xl p-3 flex flex-col justify-between shadow-xs border border-surface-container-high/40">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-semibold">
              Avg Time
            </span>
            <div className="my-1">
              <span className="font-headline-sm text-headline-sm font-bold text-primary tracking-tight">
                {isLoading ? "..." : `${stats?.avg_time_seconds || 0}s`}
              </span>
            </div>
            <span className="font-label-sm text-label-sm text-secondary">
              Per question
            </span>
          </div>

          {/* 6. Fastest Correct */}
          <div className="bg-surface-container-low rounded-xl p-3 flex flex-col justify-between shadow-xs border border-surface-container-high/40">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-semibold">
              Fastest
            </span>
            <div className="my-1">
              <span className="font-headline-sm text-headline-sm font-bold text-tertiary tracking-tight">
                {isLoading ? "..." : stats?.fastest_correct_seconds ? `${stats.fastest_correct_seconds}s` : "—"}
              </span>
            </div>
            <span className="font-label-sm text-label-sm text-tertiary flex items-center gap-0.5 truncate">
              <span className="material-symbols-outlined text-[13px]">bolt</span>
              Top recall
            </span>
          </div>
        </div>

        {/* Weekly Consistency Visualizer */}
        <div className="bg-surface-container-low rounded-xl p-3.5 mb-4 shadow-xs border border-surface-container-high/40">
          <div className="flex items-center justify-between mb-2">
            <span className="font-label-md text-label-md text-on-surface font-semibold">
              Past 7 Days Practice Rhythm
            </span>
            <span className="font-label-sm text-label-sm text-secondary">
              Asia/Kolkata cycle
            </span>
          </div>
          <div className="flex items-end justify-between h-14 pt-2 px-1 gap-2">
            {stats?.weekly_activity?.map((w) => {
              const maxCount = Math.max(...(stats?.weekly_activity?.map((x) => x.count) || [1]), 1);
              const heightPercent = Math.max(12, Math.min(100, Math.round((w.count / maxCount) * 100)));
              return (
                <div key={w.day} className="flex flex-col items-center gap-1.5 flex-1 h-full justify-end">
                  <span className="text-[10px] text-secondary font-mono">{w.count}</span>
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-3.5 rounded-full transition-all duration-300 ${
                      w.count > 0 ? "bg-primary-container" : "bg-surface-container-highest"
                    }`}
                  />
                  <span className="font-label-sm text-label-sm text-secondary font-medium">
                    {w.day_label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Subject Breakdown Matrix */}
        <div className="flex items-center justify-between mb-2 px-0.5">
          <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
            Subject Performance Matrix
          </span>
          <span className="font-label-sm text-label-sm text-secondary">
            Tier-1 Subjects
          </span>
        </div>

        <div className="flex flex-col gap-2 mb-2">
          {stats?.subjects.map((subj) => {
            const icon = subjectIcons[subj.subject_slug] || "calculate";

            let pillStyle = "bg-tertiary-fixed text-on-tertiary-fixed border border-tertiary/40";
            let pillIcon = "check_circle";

            if (subj.status === "Practise more") {
              pillStyle = "bg-error-container text-on-error-container border border-error/30";
              pillIcon = "warning";
            } else if (subj.status === "OK") {
              pillStyle = "bg-amber-100 text-amber-900 border border-amber-300";
              pillIcon = "adjust";
            }

            return (
              <div
                key={subj.subject_id}
                className="bg-surface-container-low rounded-xl p-3 flex items-center justify-between shadow-xs border border-surface-container-high/40"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary text-[20px]">
                      {icon}
                    </span>
                  </div>
                  <div className="min-w-0 flex flex-col">
                    <span className="font-label-lg text-label-lg text-on-surface font-semibold truncate">
                      {subj.subject_name}
                    </span>
                    <span className="font-body-sm text-body-sm text-secondary truncate">
                      {subj.attempts > 0
                        ? `${subj.accuracy}% · ${subj.attempts} solved · ${subj.avg_time_seconds}s avg`
                        : "0 questions attempted in this cycle"}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 pl-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-label-sm text-label-sm font-bold ${pillStyle}`}
                  >
                    <span className="material-symbols-outlined text-[13px]">{pillIcon}</span>
                    {subj.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Clear Color Legend (Section 7 Spec Requirement: never communicate status through color alone) */}
        <div className="p-2.5 rounded-xl bg-surface-container-low text-secondary font-label-sm text-label-sm border border-surface-container-high/40 mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px] text-primary shrink-0">info</span>
          <span>
            <strong>Status Guide:</strong> Green = Strong (≥75%) · Amber = Balanced (50–74%) · Red = Needs Practice (&lt;50%)
          </span>
        </div>

        {/* Empty state if 0 questions in period */}
        {!isLoading && stats && stats.total_solved === 0 && (
          <div className="my-3 p-4 rounded-xl bg-surface-container-low border border-surface-container-high/40 text-center flex flex-col items-center gap-2">
            <span className="material-symbols-outlined text-[32px] text-primary">fitness_center</span>
            <p className="font-label-md text-label-md font-bold text-on-surface">No practice attempts yet for this period</p>
            <p className="font-body-sm text-body-sm text-secondary">
              Open the reel feed and solve questions to build your personal performance matrix!
            </p>
          </div>
        )}

        {/* Share Achievements Action */}
        <div className="mt-1">
          <button
            onClick={handleShare}
            className="w-full h-12 rounded-xl bg-primary-fixed text-primary font-label-lg text-label-lg font-bold hover:bg-primary-fixed-dim transition-all flex items-center justify-center gap-2 active:scale-98 shadow-xs"
          >
            <span className="material-symbols-outlined text-[20px]">share</span>
            <span>{shareSuccess ? "Summary Copied to Clipboard!" : "Share Practice Record"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

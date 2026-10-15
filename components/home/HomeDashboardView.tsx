"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { MatrixStats, UserProfile, HabitSettings, Examination } from "@/types/database";
import { TopHeader } from "../layout/TopHeader";
import { ExamSwitchModal } from "../feed/ExamSwitchModal";
import { calculateNetScore, getExamScoringRule } from "@/lib/utils/examScoring";
import { formatWhatsAppScorecard, openWhatsAppShare } from "@/lib/utils/whatsapp";

export const HomeDashboardView: React.FC = () => {
  const [period, setPeriod] = useState<"today" | "week" | "month" | "lifetime">("today");
  const [stats, setStats] = useState<MatrixStats | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [habit, setHabit] = useState<HabitSettings | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [shareSuccess, setShareSuccess] = useState<boolean>(false);
  const [showExamModal, setShowExamModal] = useState<boolean>(false);
  const [showGoalModal, setShowGoalModal] = useState<boolean>(false);
  const [newGoalInput, setNewGoalInput] = useState<number>(25);
  const [targetExamId, setTargetExamId] = useState<string>("exam-ssc-cgl");

  // Load user profile & matrix stats
  useEffect(() => {
    fetch("/api/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setUser(data.user);
          if (data.user?.preferred_examination_id) {
            setTargetExamId(data.user.preferred_examination_id);
          }
          if (data.user?.daily_goal) {
            setNewGoalInput(data.user.daily_goal);
          }
        }
      })
      .catch(() => {});

    fetch("/api/habits")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setHabit(data.settings);
      })
      .catch(() => {});
  }, []);

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
        // Fallback
      }
    }

    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2500);
    }
  };

  const handleSaveGoal = async () => {
    try {
      const res = await fetch("/api/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dailyGoal: Number(newGoalInput) }),
      });
      const data = await res.json();
      if (data.success) {
        setHabit(data.settings);
        setShowGoalModal(false);
      }
    } catch {
      setShowGoalModal(false);
    }
  };

  const scoring = calculateNetScore(
    targetExamId,
    stats?.correct_count || 0,
    stats?.incorrect_count || 0
  );

  const handleSelectExam = async (examOrId: Examination | string) => {
    const examId = typeof examOrId === "string" ? examOrId : examOrId.id;
    const examName = typeof examOrId === "object" ? examOrId.name : undefined;
    setTargetExamId(examId);
    setShowExamModal(false);
    try {
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preferred_examination_id: examId,
          target_exam: examName,
        }),
      });
      const res = await fetch(`/api/matrix?period=${period}`);
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch {
      // optimistic
    }
  };

  const handleWhatsAppScorecard = () => {
    if (!stats) return;
    const cardText = formatWhatsAppScorecard({
      displayName: user?.display_name || "Aspirant",
      username: user?.username || "aspirant",
      targetExam: scoring.scoringRule.shortName,
      solvedCount: stats.total_solved,
      accuracy: stats.accuracy_percentage,
      correctCount: stats.correct_count,
      incorrectCount: stats.incorrect_count,
      avgTimeSec: stats.avg_time_seconds,
      streakDays: user?.current_streak || 14,
      periodLabel:
        period === "today"
          ? "Today"
          : period === "week"
          ? "This Week"
          : period === "month"
          ? "This Month"
          : "Overall",
      netMarks: scoring.netScore,
    });
    openWhatsAppShare(cardText);
  };

  const subjectIcons: Record<string, string> = {
    maths: "calculate",
    reasoning: "psychology",
    english: "spellcheck",
    gk: "public",
  };

  const dailyGoal = habit?.daily_goal || user?.daily_goal || 25;
  const solvedToday = habit?.solved_today || stats?.total_solved || 0;
  const goalProgress = Math.min(100, Math.round((solvedToday / dailyGoal) * 100));

  return (
    <div className="flex flex-col min-h-screen pb-28">
      {/* Top Header */}
      <TopHeader
        currentTab="home"
        streakDays={user?.current_streak || 14}
        activeExamName={scoring.scoringRule.shortName}
        user={user}
        onSelectExam={() => setShowExamModal(true)}
      />

      <div className="flex flex-col w-full px-4 pt-3 pb-6 max-w-[480px] mx-auto">
        {/* 1. Hero Dopamine Banner: Direct CTA to Qz Loop */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary-container to-secondary-container p-5 text-on-primary shadow-md mb-4 group">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                <span>🔥</span>
                <span>Infinite Habit Loop</span>
              </span>
              <span className="text-xs text-white/80 font-medium">Reel Study Mode</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight mb-1">
              Ready for the Quiz Loop?
            </h2>
            <p className="text-sm text-white/90 mb-4 max-w-xs leading-relaxed">
              Dopamine-driven vertical reels for SSC CGL. Swipe questions, master shortcuts, build unstoppable streaks.
            </p>
            <Link
              href="/loop"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-primary font-bold shadow-md hover:bg-white/95 active:scale-95 transition-all text-sm group-hover:shadow-lg"
            >
              <span className="material-symbols-outlined text-[20px] text-primary">play_arrow</span>
              <span>Enter Qz Loop</span>
            </Link>
          </div>
          {/* Aesthetic background glow & watermark */}
          <div className="absolute -right-4 -bottom-6 text-white/10 select-none pointer-events-none">
            <span className="material-symbols-outlined text-[130px]">all_inclusive</span>
          </div>
        </div>

        {/* 2. Habit & Dopamine Engine Widgets: /goal, /schedule, /boost */}
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          {/* A. Daily Goal Widget (/goal) */}
          <div
            onClick={() => setShowGoalModal(true)}
            className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container-high/40 shadow-xs cursor-pointer hover:bg-surface-container transition-colors group"
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 text-secondary">
                <span className="material-symbols-outlined text-[18px] text-primary">flag</span>
                <span className="font-label-sm text-label-sm font-semibold uppercase tracking-wider">Goal</span>
              </div>
              <span className="text-[11px] font-bold text-primary group-hover:underline">Edit</span>
            </div>
            <div className="flex items-baseline gap-1 my-0.5">
              <span className="text-xl font-bold text-on-surface">{solvedToday}</span>
              <span className="text-xs text-secondary">/ {dailyGoal} solved</span>
            </div>
            {/* Goal Progress Bar */}
            <div className="w-full bg-surface-container-highest rounded-full h-2 mt-2 overflow-hidden">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-500"
                style={{ width: `${goalProgress}%` }}
              />
            </div>
          </div>

          {/* B. Dopamine Boost & Streak Widget (/boost) */}
          <Link
            href="/loop"
            className="p-3.5 rounded-xl bg-surface-container-low border border-surface-container-high/40 shadow-xs hover:bg-surface-container transition-colors flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 text-secondary">
                <span className="material-symbols-outlined text-[18px] text-tertiary">bolt</span>
                <span className="font-label-sm text-label-sm font-semibold uppercase tracking-wider">Boost</span>
              </div>
              <span className="px-1.5 py-0.5 rounded bg-tertiary-fixed text-on-tertiary-fixed text-[10px] font-bold">
                2x XP
              </span>
            </div>
            <div>
              <div className="text-sm font-bold text-on-surface flex items-center gap-1">
                <span>🔥 {user?.current_streak || 14}d Streak</span>
              </div>
              <p className="text-[11px] text-secondary mt-0.5">
                Speed streak bonus active
              </p>
            </div>
          </Link>
        </div>

        {/* 3. Performance Matrix Header & Period Control */}
        <div className="flex items-center justify-between pb-2 pt-1">
          <div>
            <h1 className="font-headline-sm text-headline-sm font-bold text-on-surface tracking-tight">
              Study Matrix
            </h1>
            <p className="font-body-sm text-body-sm text-secondary">
              Personal Performance • Real Asia/Kolkata Drill Data
            </p>
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface font-semibold text-label-sm">
            <span className="material-symbols-outlined text-[16px] text-tertiary">military_tech</span>
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

        {/* High-Impact Key Metrics Grid */}
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

        {/* Negative Marking & Net Score Impact Card */}
        <div className="bg-gradient-to-br from-surface-container-low to-surface-container rounded-2xl p-4 mb-4 border border-surface-container-high/60 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">calculate</span>
              <span className="font-label-md text-label-md font-bold text-on-surface">
                Exam Scoring & Negative Marking Impact
              </span>
            </div>
            <button
              onClick={() => setShowExamModal(true)}
              className="text-xs font-bold text-primary hover:underline flex items-center gap-0.5"
            >
              <span>{scoring.scoringRule.shortName}</span>
              <span className="material-symbols-outlined text-[14px]">expand_more</span>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 my-2 text-center">
            <div className="bg-surface-container-lowest/80 p-2.5 rounded-xl border border-surface-container-high/30">
              <div className="text-[10px] uppercase font-bold text-secondary">Gross Earned</div>
              <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                +{scoring.grossMarks}
              </div>
              <div className="text-[10px] text-secondary">+{scoring.scoringRule.marksPerCorrect} / correct</div>
            </div>

            <div className="bg-surface-container-lowest/80 p-2.5 rounded-xl border border-surface-container-high/30">
              <div className="text-[10px] uppercase font-bold text-secondary">Penalty Cut</div>
              <div className="text-base font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                -{scoring.penaltyDeducted}
              </div>
              <div className="text-[10px] text-secondary">-{scoring.scoringRule.penaltyPerWrong} / wrong</div>
            </div>

            <div className="bg-surface-container-lowest/80 p-2.5 rounded-xl border border-primary/30 bg-primary/5">
              <div className="text-[10px] uppercase font-bold text-primary">Net Score</div>
              <div className="text-lg font-bold text-primary mt-0.5">
                {scoring.netScore}
              </div>
              <div className="text-[10px] text-secondary">out of {scoring.maxPossibleMarks}</div>
            </div>
          </div>

          <p className="text-[11px] text-secondary mt-1">
            Official formula: {scoring.scoringRule.description}
          </p>
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

        {/* Clear Color Legend */}
        <div className="p-2.5 rounded-xl bg-surface-container-low text-secondary font-label-sm text-label-sm border border-surface-container-high/40 mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px] text-primary shrink-0">info</span>
          <span>
            <strong>Status Guide:</strong> Green = Strong (≥75%) · Amber = Balanced (50–74%) · Red = Needs Practice (&lt;50%)
          </span>
        </div>

        {/* Share Achievements Actions */}
        <div className="flex flex-col gap-2 mt-1">
          <button
            onClick={handleWhatsAppScorecard}
            className="w-full h-12 rounded-xl bg-[#25D366] text-white font-label-lg text-label-lg font-bold hover:bg-[#20ba59] transition-all flex items-center justify-center gap-2 active:scale-98 shadow-sm"
          >
            <span className="material-symbols-outlined text-[20px]">chat</span>
            <span>Share Scorecard on WhatsApp</span>
          </button>

          <button
            onClick={handleShare}
            className="w-full h-11 rounded-xl bg-surface-container text-on-surface font-label-md text-label-md font-semibold hover:bg-surface-container-high transition-all flex items-center justify-center gap-2 active:scale-98"
          >
            <span className="material-symbols-outlined text-[18px]">share</span>
            <span>{shareSuccess ? "Summary Copied to Clipboard!" : "Copy Practice Record"}</span>
          </button>
        </div>
      </div>

      {/* Target Exam Switcher Modal */}
      <ExamSwitchModal
        exams={[]}
        currentExamId={targetExamId}
        isOpen={showExamModal}
        onClose={() => setShowExamModal(false)}
        onSelectExam={handleSelectExam}
      />

      {/* Edit Daily Goal Modal (/goal) */}
      {showGoalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm bg-surface-container-lowest rounded-2xl p-5 shadow-xl border border-surface-container-high/60 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[24px]">flag</span>
                <h3 className="text-lg font-bold text-on-surface">Daily Practice Goal</h3>
              </div>
              <button
                onClick={() => setShowGoalModal(false)}
                className="p-1 rounded-full text-secondary hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <p className="text-sm text-secondary">
              Commit to a daily target to form an unstoppable study habit.
            </p>
            <div className="grid grid-cols-4 gap-2">
              {[15, 25, 50, 100].map((g) => (
                <button
                  key={g}
                  onClick={() => setNewGoalInput(g)}
                  className={`py-2 rounded-xl text-sm font-bold border transition-all ${
                    newGoalInput === g
                      ? "bg-primary text-on-primary border-primary shadow-sm"
                      : "bg-surface-container border-transparent text-secondary hover:text-on-surface"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setShowGoalModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-surface-container text-secondary font-semibold text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveGoal}
                className="flex-1 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-sm shadow-sm hover:bg-primary-container"
              >
                Save Goal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

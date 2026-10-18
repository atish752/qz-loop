"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { MatrixStats, UserProfile, HabitSettings, Examination } from "@/types/database";
import { TopHeader } from "../layout/TopHeader";
import { ExamSwitchModal } from "../feed/ExamSwitchModal";
import { calculateNetScore, getExamScoringRule } from "@/lib/utils/examScoring";
import { getExamCountdown } from "@/lib/utils/examDates";
import { formatWhatsAppScorecard, openWhatsAppShare, OFFICIAL_WHATSAPP_GROUP_URL } from "@/lib/utils/whatsapp";
import { useAppLanguage } from "@/lib/utils/i18n";

export const HomeDashboardView: React.FC = () => {
  const { lang, t } = useAppLanguage();
  const [period, setPeriod] = useState<"today" | "week" | "month" | "lifetime">("today");
  const [stats, setStats] = useState<MatrixStats | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [habit, setHabit] = useState<HabitSettings | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [shareSuccess, setShareSuccess] = useState<boolean>(false);
  const [showExamModal, setShowExamModal] = useState<boolean>(false);
  const [showGoalModal, setShowGoalModal] = useState<boolean>(false);
  const [newGoalInput, setNewGoalInput] = useState<number>(25);
  const [targetExamId, setTargetExamId] = useState<string>("exam-neet-ug");
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  // Check auth and load user profile & matrix stats
  useEffect(() => {
    const checkAuth = () => {
      if (typeof window !== "undefined") {
        const storedExam = localStorage.getItem("qz_target_exam") || localStorage.getItem("qz_last_exam");
        if (storedExam) {
          setTargetExamId(storedExam);
        }

        const uid = localStorage.getItem("qz_user_id");
        setIsLoggedIn(Boolean(uid));

        const url = uid ? `/api/profile?userId=${encodeURIComponent(uid)}` : "/api/profile";
        fetch(url)
          .then((res) => res.json())
          .then((data) => {
            if (data.success && data.user) {
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
      }
    };

    checkAuth();
    const handleExamChanged = (e: Event) => {
      const customEvent = e as CustomEvent<{ examId?: string }>;
      if (customEvent.detail?.examId) {
        setTargetExamId(customEvent.detail.examId);
      }
    };
    window.addEventListener("qz_exam_changed", handleExamChanged);
    window.addEventListener("qz_auth_changed", checkAuth);
    return () => {
      window.removeEventListener("qz_exam_changed", handleExamChanged);
      window.removeEventListener("qz_auth_changed", checkAuth);
    };
  }, []);

  useEffect(() => {
    fetch("/api/habits")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setHabit(data.settings);
      })
      .catch(() => {});
  }, [isLoggedIn]);

  useEffect(() => {
    setIsLoading(true);
    const uid = typeof window !== "undefined" ? localStorage.getItem("qz_user_id") : null;
    const url = uid
      ? `/api/matrix?period=${period}&userId=${encodeURIComponent(uid)}`
      : `/api/matrix?period=${period}&userId=guest`;
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStats(data.stats);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [period, isLoggedIn]);

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
    if (typeof window !== "undefined") {
      localStorage.setItem("qz_target_exam", examId);
      localStorage.setItem("qz_last_exam", examId);
      window.dispatchEvent(new CustomEvent("qz_exam_changed", { detail: { examId, examName } }));
    }
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
      streakDays: isLoggedIn ? (user?.current_streak ?? 0) : 0,
      periodLabel:
        period === "today"
          ? t.periodToday
          : period === "week"
          ? t.periodWeek
          : period === "month"
          ? t.periodMonth
          : t.periodLifetime,
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
  const solvedToday = isLoggedIn ? (habit?.solved_today || stats?.total_solved || 0) : 0;
  const currentStreak = isLoggedIn ? (user?.current_streak || 0) : 0;
  const goalProgress = Math.min(100, Math.round((solvedToday / dailyGoal) * 100));
  const activeExamId = user?.preferred_examination_id || targetExamId || user?.target_exam || "exam-ssc-cgl";
  const examCountdown = getExamCountdown(activeExamId);

  return (
    <div className="flex flex-col min-h-screen pb-28">
      {/* Top Header */}
      <TopHeader
        currentTab="home"
        streakDays={currentStreak}
        activeExamName={scoring.scoringRule.shortName}
        user={isLoggedIn ? user : null}
        onSelectExam={() => setShowExamModal(true)}
      />

      <div className="flex flex-col w-full px-4 pt-3 pb-6 max-w-[480px] mx-auto">
        {/* Guest Onboarding Banner if not logged in */}
        {!isLoggedIn && (
          <div className="rounded-2xl p-4 bg-surface-container-low border border-primary/20 shadow-xs mb-4 flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-container text-on-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">account_circle</span>
              </div>
              <div className="flex flex-col min-w-0">
                <h3 className="font-bold text-on-surface text-base">{t.welcomeAspirant}</h3>
                <p className="text-xs text-secondary mt-0.5 leading-relaxed">
                  {t.guestHomeBannerDesc}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => {
                  window.dispatchEvent(
                    new CustomEvent("open_auth_modal", {
                      detail: { reason: "Sign in to track your personalized practice streak & rank", mode: "signup" },
                    })
                  );
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-primary text-on-primary font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs hover:bg-primary-container active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-[16px]">login</span>
                <span>{t.signInSignUp}</span>
              </button>
              <Link
                href="/loop"
                className="py-2 px-3 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold text-xs flex items-center gap-1 transition-colors"
              >
                <span>{t.browseLoop}</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
            </div>
          </div>
        )}

        {/* 1. Hero Dopamine Banner: Direct CTA to Qz Loop with Powerful Exam Countdown */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary-container to-secondary-container p-5 text-on-primary shadow-md mb-4 group">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-wider flex items-center gap-1 text-white">
                <span>🔥</span>
                <span>{t.infiniteHabitLoop}</span>
              </span>
              <button
                type="button"
                onClick={() => setShowExamModal(true)}
                className="px-2.5 py-0.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-xs font-bold text-white/95 transition-all flex items-center gap-1 cursor-pointer"
                title="Click to switch target exam"
              >
                <span>Target: {examCountdown.examShortName}</span>
                <span className="material-symbols-outlined text-[13px]">expand_more</span>
              </button>
            </div>

            {/* Large powerful exam countdown highlight */}
            <div className="my-2.5">
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight drop-shadow-sm">
                {lang === "hi" ? examCountdown.headlineHi : examCountdown.headlineEn}
              </h2>
              <p className="text-xs sm:text-sm text-white/90 mt-1 font-medium leading-relaxed max-w-sm">
                {lang === "hi"
                  ? `लक्ष्य ${examCountdown.examDisplayName} — आज का प्रत्येक हल किया गया प्रश्न आपकी अंतिम रैंक तय करेगा।`
                  : `Targeting ${examCountdown.examDisplayName} · Every question you solve today builds your All India Rank.`}
              </p>
            </div>

            <div className="pt-2">
              <Link
                href="/loop"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-primary font-bold shadow-md hover:bg-white/95 active:scale-95 transition-all text-sm group-hover:shadow-lg"
              >
                <span className="material-symbols-outlined text-[20px] text-primary">play_arrow</span>
                <span>{t.enterQzLoop}</span>
              </Link>
            </div>
          </div>
          {/* Aesthetic background glow & watermark */}
          <div className="absolute -right-4 -bottom-6 text-white/10 select-none pointer-events-none">
            <span className="material-symbols-outlined text-[130px]">all_inclusive</span>
          </div>
        </div>

        {/* Aspirants WhatsApp Community Banner */}
        <a
          href={OFFICIAL_WHATSAPP_GROUP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between p-3.5 mb-4 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-emerald-500/10 to-teal-500/15 border border-emerald-500/30 text-emerald-950 dark:text-emerald-100 hover:shadow-md transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#25D366] text-white flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[24px]">group</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-headline-sm text-sm font-bold text-on-surface">
                  {t.joinWhatsAppCommunityBanner}
                </span>
                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-emerald-600 text-white">
                  {t.liveBadge}
                </span>
              </div>
              <p className="text-xs text-secondary mt-0.5">
                {t.communityBannerDesc}
              </p>
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 group-hover:translate-x-0.5 transition-transform">
            <span>{t.joinFree}</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </div>
        </a>

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
                <span className="font-label-sm text-label-sm font-semibold uppercase tracking-wider">{t.goalWidget}</span>
              </div>
              <span className="text-[11px] font-bold text-primary group-hover:underline">{t.editBtn}</span>
            </div>
            <div className="flex items-baseline gap-1 my-0.5">
              <span className="text-xl font-bold text-on-surface">{solvedToday}</span>
              <span className="text-xs text-secondary">/ {dailyGoal} {t.solvedOutOf}</span>
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
                <span className="font-label-sm text-label-sm font-semibold uppercase tracking-wider">{t.boostWidget}</span>
              </div>
              <span className="px-1.5 py-0.5 rounded bg-tertiary-fixed text-on-tertiary-fixed text-[10px] font-bold">
                2x XP
              </span>
            </div>
            <div>
              <div className="text-sm font-bold text-on-surface flex items-center gap-1">
                <span>🔥 {isLoggedIn ? (user?.current_streak ?? 0) : 0}d {t.practiceStreak}</span>
              </div>
              <p className="text-[11px] text-secondary mt-0.5">
                {t.speedStreakBonus}
              </p>
            </div>
          </Link>
        </div>

        {/* 3. Performance Matrix Header & Period Control */}
        <div className="flex items-center justify-between pb-2 pt-1">
          <div>
            <h1 className="font-headline-sm text-headline-sm font-bold text-on-surface tracking-tight">
              {t.studyMatrixTitle}
            </h1>
            <p className="font-body-sm text-body-sm text-secondary">
              {t.studyMatrixSubtitle}
            </p>
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface font-semibold text-label-sm">
            <span className="material-symbols-outlined text-[16px] text-tertiary">military_tech</span>
            <span>{isLoggedIn && (stats?.total_solved || 0) > 0 ? "TOP 5%" : "FRESH 0"}</span>
          </div>
        </div>

        {/* Time Period Segmented Control */}
        <div className="w-full bg-surface-container rounded-xl p-1 flex items-center justify-between mb-4">
          {(["today", "week", "month", "lifetime"] as const).map((p) => {
            const isSelected = period === p;
            const labels = {
              today: t.periodToday,
              week: t.periodWeek,
              month: t.periodMonth,
              lifetime: t.periodLifetime,
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
              {t.metricSolved}
            </span>
            <div className="my-1">
              <span className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-on-surface tracking-tight">
                {isLoading ? "..." : stats?.total_solved || 0}
              </span>
            </div>
            <span className="font-label-sm text-label-sm text-secondary">
              {t.questionsLabel}
            </span>
          </div>

          {/* 2. Accuracy */}
          <div className="bg-surface-container-low rounded-xl p-3 flex flex-col justify-between shadow-xs border border-surface-container-high/40">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-semibold">
              {t.metricAccuracy}
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
              {t.metricResults}
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
              {t.correctWrong}
            </span>
          </div>
        </div>

        {/* Second Row of Metrics */}
        <div className="grid grid-cols-3 gap-2.5 mb-4">
          {/* 4. Total Time Spent */}
          <div className="bg-surface-container-low rounded-xl p-3 flex flex-col justify-between shadow-xs border border-surface-container-high/40">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-semibold">
              {t.metricTotalTime}
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
              {t.drillDuration}
            </span>
          </div>

          {/* 5. Average Speed */}
          <div className="bg-surface-container-low rounded-xl p-3 flex flex-col justify-between shadow-xs border border-surface-container-high/40">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-semibold">
              {t.metricAvgTime}
            </span>
            <div className="my-1">
              <span className="font-headline-sm text-headline-sm font-bold text-primary tracking-tight">
                {isLoading ? "..." : `${stats?.avg_time_seconds || 0}s`}
              </span>
            </div>
            <span className="font-label-sm text-label-sm text-secondary">
              {t.perQuestion}
            </span>
          </div>

          {/* 6. Fastest Correct */}
          <div className="bg-surface-container-low rounded-xl p-3 flex flex-col justify-between shadow-xs border border-surface-container-high/40">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-semibold">
              {t.metricFastest}
            </span>
            <div className="my-1">
              <span className="font-headline-sm text-headline-sm font-bold text-tertiary tracking-tight">
                {isLoading ? "..." : stats?.fastest_correct_seconds ? `${stats.fastest_correct_seconds}s` : "—"}
              </span>
            </div>
            <span className="font-label-sm text-label-sm text-tertiary flex items-center gap-0.5 truncate">
              <span className="material-symbols-outlined text-[13px]">bolt</span>
              {t.topRecall}
            </span>
          </div>
        </div>

        {/* Negative Marking & Net Score Impact Card */}
        <div className="bg-gradient-to-br from-surface-container-low to-surface-container rounded-2xl p-4 mb-4 border border-surface-container-high/60 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">calculate</span>
              <span className="font-label-md text-label-md font-bold text-on-surface">
                {t.examScoringTitle}
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
              <div className="text-[10px] uppercase font-bold text-secondary">{t.grossEarned}</div>
              <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                +{scoring.grossMarks}
              </div>
              <div className="text-[10px] text-secondary">+{scoring.scoringRule.marksPerCorrect} {t.marksPerCorrect}</div>
            </div>

            <div className="bg-surface-container-lowest/80 p-2.5 rounded-xl border border-surface-container-high/30">
              <div className="text-[10px] uppercase font-bold text-secondary">{t.penaltyCut}</div>
              <div className="text-base font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                -{scoring.penaltyDeducted}
              </div>
              <div className="text-[10px] text-secondary">-{scoring.scoringRule.penaltyPerWrong} {t.negativeMarking}</div>
            </div>

            <div className="bg-surface-container-lowest/80 p-2.5 rounded-xl border border-primary/30 bg-primary/5">
              <div className="text-[10px] uppercase font-bold text-primary">{t.netScore}</div>
              <div className="text-lg font-bold text-primary mt-0.5">
                {scoring.netScore}
              </div>
              <div className="text-[10px] text-secondary">{t.outOf} {scoring.maxPossibleMarks}</div>
            </div>
          </div>

          <p className="text-[11px] text-secondary mt-1">
            {t.officialFormula} {scoring.scoringRule.description}
          </p>
        </div>

        {/* Weekly Consistency Visualizer */}
        <div className="bg-surface-container-low rounded-xl p-3.5 mb-4 shadow-xs border border-surface-container-high/40">
          <div className="flex items-center justify-between mb-2">
            <span className="font-label-md text-label-md text-on-surface font-semibold">
              {t.past7DaysRhythm}
            </span>
            <span className="font-label-sm text-label-sm text-secondary">
              {t.asiaKolkataCycle}
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
            {t.subjectMatrix}
          </span>
          <span className="font-label-sm text-label-sm text-secondary">
            {t.tier1Subjects}
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
          <span>{t.statusGuide}</span>
        </div>

        {/* Share Achievements Actions */}
        <div className="flex flex-col gap-2 mt-1">
          <button
            onClick={handleWhatsAppScorecard}
            className="w-full h-12 rounded-xl bg-[#25D366] text-white font-label-lg text-label-lg font-bold hover:bg-[#20ba59] transition-all flex items-center justify-center gap-2 active:scale-98 shadow-sm"
          >
            <span className="material-symbols-outlined text-[20px]">chat</span>
            <span>{t.shareOnWhatsApp}</span>
          </button>

          <button
            onClick={handleShare}
            className="w-full h-11 rounded-xl bg-surface-container text-on-surface font-label-md text-label-md font-semibold hover:bg-surface-container-high transition-all flex items-center justify-center gap-2 active:scale-98"
          >
            <span className="material-symbols-outlined text-[18px]">share</span>
            <span>{shareSuccess ? t.copiedToClipboard : t.copyPracticeRecord}</span>
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
                <h3 className="text-lg font-bold text-on-surface">{t.dailyPracticeGoalModalTitle}</h3>
              </div>
              <button
                onClick={() => setShowGoalModal(false)}
                className="p-1 rounded-full text-secondary hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <p className="text-sm text-secondary">
              {t.commitDailyTarget}
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
                {t.cancel}
              </button>
              <button
                onClick={handleSaveGoal}
                className="flex-1 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-sm shadow-sm hover:bg-primary-container"
              >
                {t.saveGoalBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

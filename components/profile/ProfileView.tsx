"use client";

import React, { useState, useEffect } from "react";
import { UserProfile, Question, Examination } from "@/types/database";
import { TopHeader } from "../layout/TopHeader";
import { ExamSwitchModal } from "../feed/ExamSwitchModal";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export const ProfileView: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [exams, setExams] = useState<Examination[]>([]);
  const [hiddenQuestions, setHiddenQuestions] = useState<Question[]>([]);
  const [showHiddenModal, setShowHiddenModal] = useState<boolean>(false);
  const [showExamModal, setShowExamModal] = useState<boolean>(false);
  const [allProfiles, setAllProfiles] = useState<UserProfile[]>([]);
  const [shareSuccess, setShareSuccess] = useState<boolean>(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);

  useEffect(() => {
    // Fetch profile data
    fetch("/api/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setUser(data.user);
          setExams(data.exams || []);
          setAllProfiles(data.allProfiles || []);
        }
      })
      .catch(() => {});

    // Fetch hidden questions
    fetch("/api/questions/hidden")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setHiddenQuestions(data.questions || []);
        }
      })
      .catch(() => {});

    // PWA beforeinstallprompt event
    window.addEventListener("beforeinstallprompt", (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as unknown as BeforeInstallPromptEvent);
    });

    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    });
  }, []);

  const handleRestoreQuestion = async (questionId: string) => {
    try {
      const res = await fetch("/api/questions/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId }),
      });
      if (res.ok) {
        setHiddenQuestions((prev) => prev.filter((q) => q.id !== questionId));
      }
    } catch {
      // Handled
    }
  };

  const handleSwitchUser = async (newUserId: string) => {
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: newUserId }),
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        // Refresh hidden questions for switched user
        const hidRes = await fetch("/api/questions/hidden");
        const hidData = await hidRes.json();
        if (hidData.success) {
          setHiddenQuestions(hidData.questions || []);
        }
      }
    } catch {
      // Handled
    }
  };

  const handleShareApp = async () => {
    const shareText = "Practice SSC CGL competitive questions with an infinite-scroll feed on Qz Loop! Scroll. Solve. Improve. Repeat.";
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Qz Loop — Competitive Quiz App",
          text: shareText,
          url: window.location.origin,
        });
        return;
      } catch {
        // Handled
      }
    }
    navigator.clipboard.writeText(window.location.origin);
    setShareSuccess(true);
    setTimeout(() => setShareSuccess(false), 2500);
  };

  const handleInstallApp = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setIsInstalled(true);
      }
      setInstallPrompt(null);
    } else {
      alert("To install Qz Loop on your phone, tap your browser's menu (⋮ or Share) and select 'Add to Home screen' or 'Install App'.");
    }
  };

  const activeExam = exams.find((e) => e.id === user?.preferred_examination_id);
  const dailyTarget = user?.daily_goal || 10;
  const todaySolved = user?.today_solved_count || 6;
  const targetPercent = Math.min(100, Math.round((todaySolved / dailyTarget) * 100));

  return (
    <div className="flex flex-col min-h-screen pb-24">
      <TopHeader
        currentTab="profile"
        streakDays={user?.current_streak || 14}
        activeExamName={activeExam?.name || "SSC CGL"}
        user={user}
        onSelectExam={() => setShowExamModal(true)}
      />

      <div className="flex flex-col w-full px-4 pt-3 pb-8">
        {/* Profile Header */}
        <div className="flex items-center gap-3.5 pt-2 pb-4">
          <div className="relative shrink-0">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-primary-fixed flex items-center justify-center shadow-xs border border-surface-container-high">
              {user?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatar_url}
                  alt={user.display_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="material-symbols-outlined text-[32px] text-primary">person</span>
              )}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-tertiary-fixed flex items-center justify-center shadow-xs border-2 border-surface-container-lowest">
              <span className="material-symbols-outlined text-[13px] text-on-tertiary-fixed font-bold">
                verified
              </span>
            </div>
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-on-surface truncate">
                {user?.display_name || "Rahul S."}
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm font-semibold">
                Aspirant
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-secondary truncate mt-0.5">
              Preparing for {activeExam?.name || "SSC CGL"}
            </p>
          </div>
        </div>

        {/* Key Summary Metrics Banner */}
        <div className="bg-surface-container-low rounded-2xl p-4 shadow-xs border border-surface-container-high/40 mb-4">
          <div className="grid grid-cols-3 divide-x divide-surface-container-high/60">
            {/* Streak */}
            <div className="flex flex-col items-center text-center px-1">
              <div className="flex items-center gap-1 text-primary">
                <span className="text-lg">🔥</span>
                <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
                  {user?.current_streak || 14}
                </span>
              </div>
              <span className="font-label-sm text-label-sm text-secondary mt-0.5 font-medium">
                Day Streak
              </span>
            </div>

            {/* Solved */}
            <div className="flex flex-col items-center text-center px-1">
              <div className="flex items-center gap-1 text-primary">
                <span className="material-symbols-outlined text-[20px]">fact_check</span>
                <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
                  {user?.total_questions_answered ?? 0}
                </span>
              </div>
              <span className="font-label-sm text-label-sm text-secondary mt-0.5 font-medium">
                Questions
              </span>
            </div>

            {/* Accuracy */}
            <div className="flex flex-col items-center text-center px-1">
              <div className="flex items-center gap-1 text-tertiary">
                <span className="material-symbols-outlined text-[20px]">target</span>
                <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
                  {user?.overall_accuracy ?? 0}%
                </span>
              </div>
              <span className="font-label-sm text-label-sm text-secondary mt-0.5 font-medium">
                Accuracy
              </span>
            </div>
          </div>
        </div>

        {/* Daily Progress Tracker */}
        <div className="bg-primary-fixed/35 rounded-2xl p-4 mb-4 border border-primary/20 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">flag</span>
              <span className="font-label-md text-label-md font-bold text-on-surface">
                Daily Goal: {todaySolved} / {dailyTarget} solved
              </span>
            </div>
            <span className="font-label-sm text-label-sm font-bold text-primary">
              {targetPercent}%
            </span>
          </div>

          <div className="w-full h-2 rounded-full bg-surface-container-highest overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${targetPercent}%` }}
            />
          </div>
          <p className="font-body-sm text-body-sm text-secondary">
            {todaySolved >= dailyTarget
              ? "Daily goal reached! Keep going to climb the leaderboard."
              : `${dailyTarget - todaySolved} more questions to finish today's target.`}
          </p>
        </div>

        {/* Section Label */}
        <div className="px-1 pb-1">
          <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider font-bold">
            Preferences & Controls
          </span>
        </div>

        {/* Clean Menu List */}
        <div className="flex flex-col bg-surface-container-low rounded-2xl overflow-hidden border border-surface-container-high/40 divide-y divide-surface-container-high/40 mb-4">
          {/* Target Examination Switcher */}
          <button
            onClick={() => setShowExamModal(true)}
            className="w-full flex items-center justify-between p-3.5 hover:bg-surface-container transition-colors text-left"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-primary shrink-0">
                <span className="material-symbols-outlined text-[20px]">school</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-body-lg text-body-lg text-on-surface font-semibold truncate">
                  Target Exam
                </span>
                <span className="font-body-sm text-body-sm text-secondary truncate">
                  {activeExam?.name || "SSC CGL"}
                </span>
              </div>
            </div>
            <span className="material-symbols-outlined text-[20px] text-secondary">chevron_right</span>
          </button>

          {/* Hidden Questions Manager (with count and restore option) */}
          <button
            onClick={() => setShowHiddenModal(true)}
            className="w-full flex items-center justify-between p-3.5 hover:bg-surface-container transition-colors text-left"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant shrink-0">
                <span className="material-symbols-outlined text-[20px]">visibility_off</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-body-lg text-body-lg text-on-surface font-semibold truncate">
                  Hidden questions
                </span>
                <span className="font-body-sm text-body-sm text-secondary truncate">
                  {hiddenQuestions.length} excluded from feed
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {hiddenQuestions.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-surface-container font-label-sm text-label-sm text-primary font-bold">
                  Restore
                </span>
              )}
              <span className="material-symbols-outlined text-[20px] text-secondary">chevron_right</span>
            </div>
          </button>

          {/* Share App */}
          <button
            onClick={handleShareApp}
            className="w-full flex items-center justify-between p-3.5 hover:bg-surface-container transition-colors text-left"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant shrink-0">
                <span className="material-symbols-outlined text-[20px]">share</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-body-lg text-body-lg text-on-surface font-semibold truncate">
                  Share Qz Loop
                </span>
                <span className="font-body-sm text-body-sm text-secondary truncate">
                  {shareSuccess ? "Link copied!" : "Invite friends to compete"}
                </span>
              </div>
            </div>
            <span className="material-symbols-outlined text-[20px] text-secondary">chevron_right</span>
          </button>

          {/* PWA Install Button */}
          {!isInstalled && (
            <button
              onClick={handleInstallApp}
              className="w-full flex items-center justify-between p-3.5 hover:bg-surface-container transition-colors text-left"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-primary-fixed flex items-center justify-center text-primary shrink-0">
                  <span className="material-symbols-outlined text-[20px]">install_mobile</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-body-lg text-body-lg text-primary font-bold truncate">
                    Install App on Device
                  </span>
                  <span className="font-body-sm text-body-sm text-secondary truncate">
                    Fast offline-ready home screen shortcut
                  </span>
                </div>
              </div>
              <span className="material-symbols-outlined text-[20px] text-primary">download</span>
            </button>
          )}
        </div>

        {/* Demo Switcher for Verification & Multi-user Testing */}
        <div className="px-1 pb-1">
          <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider font-bold">
            Switch Demo Aspirant Profile
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          {allProfiles.map((p) => {
            const isCurrent = p.id === user?.id;
            return (
              <button
                key={p.id}
                onClick={() => handleSwitchUser(p.id)}
                className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${
                  isCurrent
                    ? "bg-primary-container text-on-primary border-primary shadow-xs"
                    : "bg-surface-container-low text-on-surface border-surface-container-high/40 hover:bg-surface-container"
                }`}
              >
                <div className="w-7 h-7 rounded-full overflow-hidden bg-surface-container shrink-0">
                  {p.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.avatar_url} alt={p.display_name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="material-symbols-outlined text-[16px]">person</span>
                  )}
                </div>
                <div className="min-w-0 flex flex-col">
                  <span className="font-label-md text-label-md font-bold truncate">{p.display_name}</span>
                  <span className={`font-label-sm text-label-sm truncate ${isCurrent ? "text-on-primary-container" : "text-secondary"}`}>
                    🔥 {p.current_streak}d
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Hidden Questions Drawer / Modal */}
      {showHiddenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/40 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl p-5 shadow-xl border border-surface-container-high/50 flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between pb-3 border-b border-surface-container-high/40">
              <div>
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                  Hidden Questions
                </h3>
                <p className="font-body-sm text-body-sm text-secondary">
                  Questions marked &apos;I Know This · Hide&apos;
                </p>
              </div>
              <button
                onClick={() => setShowHiddenModal(false)}
                className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-secondary"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 flex flex-col gap-2.5">
              {hiddenQuestions.length === 0 ? (
                <div className="py-12 text-center text-secondary flex flex-col items-center gap-2">
                  <span className="material-symbols-outlined text-[36px] text-tertiary">check_circle</span>
                  <p className="font-body-md text-body-md font-medium text-on-surface">No hidden questions</p>
                  <p className="font-body-sm text-body-sm">
                    You can hide easy questions anytime from the practice feed.
                  </p>
                </div>
              ) : (
                hiddenQuestions.map((q) => (
                  <div
                    key={q.id}
                    className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high/40 flex items-center justify-between gap-2"
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="font-label-sm text-label-sm text-secondary uppercase font-bold">
                        {q.subject_name || "General"}
                      </span>
                      <p className="font-body-md text-body-md text-on-surface line-clamp-2">
                        {q.question_text}
                      </p>
                    </div>

                    <button
                      onClick={() => handleRestoreQuestion(q.id)}
                      className="px-3 py-1.5 rounded-lg bg-primary-container text-on-primary font-label-sm text-label-sm font-bold shadow-xs hover:bg-primary transition-all shrink-0 active:scale-95 flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[15px]">undo</span>
                      <span>Restore</span>
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-surface-container-high/40">
              <button
                onClick={() => setShowHiddenModal(false)}
                className="w-full py-2.5 rounded-xl bg-surface-container font-label-md text-label-md text-on-surface hover:bg-surface-container-high transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Target Exam Switcher Modal */}
      <ExamSwitchModal
        exams={exams}
        currentExamId={user?.preferred_examination_id || "exam-ssc-cgl"}
        isOpen={showExamModal}
        onClose={() => setShowExamModal(false)}
        onSelectExam={(exam) => {
          if (user) {
            fetch("/api/profile", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ preferred_examination_id: exam.id }),
            })
              .then((res) => res.json())
              .then((data) => {
                if (data.success) setUser(data.user);
              })
              .catch(() => {});
          }
        }}
      />
    </div>
  );
};

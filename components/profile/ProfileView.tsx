"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { UserProfile, Question, Examination } from "@/types/database";
import { TopHeader } from "../layout/TopHeader";
import { ExamSwitchModal } from "../feed/ExamSwitchModal";
import {
  formatWhatsAppChallenge,
  openWhatsAppShare,
  FOUNDER_NAME,
  FOUNDER_PHONE,
  FOUNDER_EMAIL,
  FOUNDER_WHATSAPP_LINK,
  OFFICIAL_WHATSAPP_GROUP_URL,
} from "@/lib/utils/whatsapp";
import { compressImageClientSide } from "@/lib/utils/imageCompression";
import { setAppLanguage, useAppLanguage } from "@/lib/utils/i18n";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export const ProfileView: React.FC = () => {
  const { lang, t } = useAppLanguage();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [exams, setExams] = useState<Examination[]>([]);
  const [hiddenQuestions, setHiddenQuestions] = useState<Question[]>([]);
  const [showHiddenModal, setShowHiddenModal] = useState<boolean>(false);
  const [showExamModal, setShowExamModal] = useState<boolean>(false);
  const [allProfiles, setAllProfiles] = useState<UserProfile[]>([]);
  const [shareSuccess, setShareSuccess] = useState<boolean>(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);

  const [authoredQuestions, setAuthoredQuestions] = useState<Question[]>([]);
  const [showEditProfileModal, setShowEditProfileModal] = useState<boolean>(false);
  const [editName, setEditName] = useState<string>("");
  const [editUsername, setEditUsername] = useState<string>("");
  const [editExamId, setEditExamId] = useState<string>("");
  const [editEmail, setEditEmail] = useState<string>("");
  const [editAvatarUrl, setEditAvatarUrl] = useState<string>("");
  const [editAvatarSizeKb, setEditAvatarSizeKb] = useState<number | null>(null);
  const [isCompressingEditAvatar, setIsCompressingEditAvatar] = useState<boolean>(false);
  const [editLanguagePref, setEditLanguagePref] = useState<"en" | "hi">("en");
  const editFileInputRef = useRef<HTMLInputElement | null>(null);

  const [usernameStatus, setUsernameStatus] = useState<{
    checking: boolean;
    available: boolean | null;
    message: string;
  }>({ checking: false, available: null, message: "" });
  const [editError, setEditError] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isResettingData, setIsResettingData] = useState<boolean>(false);
  const [resetSuccess, setResetSuccess] = useState<boolean>(false);

  useEffect(() => {
    const checkAuthAndLoad = () => {
      if (typeof window !== "undefined") {
        const uid = localStorage.getItem("qz_user_id");
        setIsLoggedIn(Boolean(uid));

        const url = uid ? `/api/profile?userId=${encodeURIComponent(uid)}` : "/api/profile";
        fetch(url)
          .then((res) => res.json())
          .then((data) => {
            if (data.success && data.user) {
              setUser(data.user);
              setExams(data.exams || []);
              setAllProfiles(data.allProfiles || []);
              setEditName(data.user.display_name || "");
              setEditUsername(data.user.username || "");
              setEditExamId(data.user.preferred_examination_id || "exam-ssc-cgl");
              setEditEmail(data.user.email || "");

              // Onboarding prompt if username has not been chosen yet and user is logged in
              if (uid && !data.user.username) {
                setShowEditProfileModal(true);
              }
            }
          })
          .catch(() => {});
      }
    };

    checkAuthAndLoad();
    window.addEventListener("qz_auth_changed", checkAuthAndLoad);
    return () => window.removeEventListener("qz_auth_changed", checkAuthAndLoad);
  }, []);

  useEffect(() => {
    // Fetch authored questions
    fetch("/api/questions/author")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.questions) {
          setAuthoredQuestions(data.questions);
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

  const openEditProfile = () => {
    if (user) {
      setEditName(user.display_name);
      setEditUsername(user.username || "");
      setEditExamId(user.preferred_examination_id || "exam-railway-ntpc");
      setEditEmail(user.email || "");
      setEditAvatarUrl(user.avatar_url || "");
      setEditAvatarSizeKb(null);
      setEditLanguagePref(user.language_preference || "en");
      setUsernameStatus({ checking: false, available: null, message: "" });
      setEditError(null);
      setShowEditProfileModal(true);
    }
  };

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressingEditAvatar(true);
    setEditError(null);
    try {
      const result = await compressImageClientSide(file, 256, 0.7);
      setEditAvatarUrl(result.dataUrl);
      setEditAvatarSizeKb(result.sizeKb);
    } catch {
      setEditError("Failed to process photo. Please choose another.");
    } finally {
      setIsCompressingEditAvatar(false);
    }
  };

  const handleUsernameChange = (val: string) => {
    const clean = val.toLowerCase().replace(/[^a-z0-9_.]/g, "");
    setEditUsername(clean);
    setEditError(null);

    if (clean.length < 3) {
      setUsernameStatus({ checking: false, available: false, message: "Username must be 3-30 characters" });
      return;
    }
    if (clean.startsWith(".") || clean.endsWith(".") || clean.includes("..")) {
      setUsernameStatus({ checking: false, available: false, message: "Cannot start/end with a dot or have consecutive dots" });
      return;
    }
    if (user && clean === user.username?.toLowerCase()) {
      setUsernameStatus({ checking: false, available: true, message: "Your current username" });
      return;
    }

    setUsernameStatus({ checking: true, available: null, message: "Checking availability..." });
    fetch(`/api/profile?checkUsername=${encodeURIComponent(clean)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          if (d.available) {
            setUsernameStatus({ checking: false, available: true, message: `@${clean} is available!` });
          } else {
            setUsernameStatus({ checking: false, available: false, message: `@${clean} is already taken` });
          }
        }
      })
      .catch(() => {
        setUsernameStatus({ checking: false, available: null, message: "" });
      });
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      setEditError("Name is required");
      return;
    }
    if (!editUsername.trim()) {
      setEditError("Unique username is required");
      return;
    }
    if (editUsername.length < 3) {
      setEditError("Username must be at least 3 characters long");
      return;
    }
    if (editUsername.startsWith(".") || editUsername.endsWith(".") || editUsername.includes("..")) {
      setEditError("Username cannot start or end with a dot, or contain consecutive dots");
      return;
    }
    setIsSavingProfile(true);
    setEditError(null);

    try {
      const selectedExam = exams.find((x) => x.id === editExamId);
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: editName.trim(),
          username: editUsername.trim().toLowerCase(),
          preferred_examination_id: editExamId,
          target_exam: selectedExam?.name || "Railways (RRB NTPC & Group D)",
          avatar_url: editAvatarUrl || undefined,
          email: editEmail.trim() || undefined,
          language_preference: editLanguagePref,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUser(data.user);
        setAppLanguage(editLanguagePref);
        localStorage.setItem("qz_quiz_lang", editLanguagePref);
        window.dispatchEvent(new CustomEvent("qz_auth_changed", { detail: { user: data.user } }));
        setShowEditProfileModal(false);
      } else {
        setEditError(data.error || "Failed to update profile");
      }
    } catch {
      setEditError("Network error while saving profile");
    } finally {
      setIsSavingProfile(false);
    }
  };

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
        if (!data.user.username) {
          setEditName(data.user.display_name || "");
          setEditUsername("");
          setShowEditProfileModal(true);
        }
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

  const handleWhatsAppProfileShare = () => {
    const examName = activeExam?.name || "SSC CGL";
    const streak = isLoggedIn ? (user?.current_streak ?? 0) : 0;
    const text =
      `🎯 *${user?.display_name || "Aspirant"} on Qz Loop*\n` +
      `🔥 *${streak} Day Streak* | 📚 *${user?.total_questions_answered || 0} Questions Solved* | 🎯 *${user?.overall_accuracy || 0}% Accuracy*\n` +
      `🏆 Target Exam: *${examName}*\n\n` +
      `Study and compete with me on Qz Loop: ${typeof window !== "undefined" ? window.location.origin : "https://qzloop.app"}`;
    openWhatsAppShare(text);
  };

  const handleShareQuestionToWhatsApp = (q: Question) => {
    const text = formatWhatsAppChallenge({
      question: q,
      authorUsername: user?.username || user?.display_name?.toLowerCase().replace(/\s+/g, "_"),
      targetExam: q.subject_name || "General",
      language: q.language,
    });
    openWhatsAppShare(text);
  };

  const handleSelectExam = async (examOrId: Examination | string) => {
    const examId = typeof examOrId === "string" ? examOrId : examOrId.id;
    const examName = typeof examOrId === "object" ? examOrId.name : exams.find((e) => e.id === examId)?.name;
    setShowExamModal(false);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preferred_examination_id: examId,
          target_exam: examName,
        }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
      }
    } catch {
      // optimistic
    }
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

  const handleResetData = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to reset all your practice data? Your streak, question attempts, matrix statistics, and saved playlists will be reset to absolute zero."
    );
    if (!confirmed) return;

    setIsResettingData(true);
    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        setResetSuccess(true);
        setTimeout(() => setResetSuccess(false), 3000);
      }
    } catch {
      alert("Failed to reset data. Please try again.");
    } finally {
      setIsResettingData(false);
    }
  };

  const handleSignOut = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("qz_user_id");
      localStorage.removeItem("qz_auth_user");
      setIsLoggedIn(false);
      setUser(null);
      window.dispatchEvent(new CustomEvent("qz_auth_changed", { detail: { user: null } }));
    }
  };

  const activeExam = exams.find((e) => e.id === user?.preferred_examination_id);
  const dailyTarget = user?.daily_goal || 10;
  const todaySolved = isLoggedIn ? (user?.today_solved_count || 0) : 0;
  const targetPercent = Math.min(100, Math.round((todaySolved / dailyTarget) * 100));

  return (
    <div className="flex flex-col min-h-screen pb-24">
      <TopHeader
        currentTab="profile"
        streakDays={isLoggedIn ? (user?.current_streak || 0) : 0}
        activeExamName={user?.target_exam || activeExam?.name || "Railways RRB"}
        user={isLoggedIn ? user : null}
        onSelectExam={() => setShowExamModal(true)}
      />

      <div className="flex flex-col w-full px-4 pt-3 pb-8">
        {resetSuccess && (
          <div className="p-3 mb-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            <span>Your practice data has been reset to absolute fresh 0 scratch!</span>
          </div>
        )}

        {/* Profile Header: Guest vs Logged In */}
        {!isLoggedIn ? (
          <div className="rounded-2xl p-5 bg-surface-container-low border border-primary/20 shadow-xs mb-4 flex flex-col gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center text-secondary shrink-0 border border-surface-container-high">
                <span className="material-symbols-outlined text-[36px]">account_circle</span>
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-on-surface truncate">
                    Guest Aspirant
                  </h1>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm font-semibold">
                    Guest
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="font-label-md text-label-md font-bold text-primary">
                    @guest
                  </span>
                  <span className="text-secondary text-xs">•</span>
                  <span className="font-body-sm text-body-sm text-secondary truncate">
                    {activeExam?.name || "Top 10 Indian Exams"}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs text-secondary leading-relaxed">
              Create your account with your unique username and chosen competitive exam. Start from fresh 0 scratch and build your practice streak!
            </p>

            <button
              onClick={() => {
                window.dispatchEvent(
                  new CustomEvent("open_auth_modal", {
                    detail: { reason: "Sign in or create an account to start your streak", mode: "signup" },
                  })
                );
              }}
              className="w-full py-2.5 rounded-xl bg-primary text-on-primary font-bold text-sm flex items-center justify-center gap-2 shadow-sm hover:bg-primary-container active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">login</span>
              <span>Sign In / Create Account</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3 pt-2 pb-4">
            <div className="flex items-center gap-3.5 min-w-0">
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
                    {user?.display_name || "Aspirant"}
                  </h1>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm font-semibold">
                    Aspirant
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="font-label-md text-label-md font-bold text-primary">
                    @{user?.username || "aspirant"}
                  </span>
                  <span className="text-secondary text-xs">•</span>
                  <span className="font-body-sm text-body-sm text-secondary truncate">
                    {user?.target_exam || activeExam?.name || "SSC CGL"}
                  </span>
                  {user?.email && (
                    <>
                      <span className="text-secondary text-xs">•</span>
                      <span className="font-body-sm text-xs text-secondary truncate">
                        {user.email}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={openEditProfile}
              className="px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-primary font-bold text-xs flex items-center gap-1 shadow-xs transition-colors shrink-0"
              title="Edit Profile & Username"
            >
              <span className="material-symbols-outlined text-[16px]">edit</span>
              <span>Edit</span>
            </button>
          </div>
        )}

        {/* All India Ranks & Standings Prominent Entry */}
        <div className="bg-gradient-to-r from-primary-fixed/60 via-primary-container/25 to-surface-container-low rounded-2xl p-4 mb-4 border border-primary/25 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-primary text-on-primary flex items-center justify-center shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-[24px]">leaderboard</span>
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-headline-sm text-headline-sm font-bold text-on-surface">All India Ranks</span>
                <span className="text-[10px] bg-tertiary text-on-tertiary px-1.5 py-0.5 rounded-full font-bold">AIR</span>
              </div>
              <p className="font-body-sm text-body-sm text-secondary truncate mt-0.5">
                Live rankings, sprint scores & weekly competition
              </p>
            </div>
          </div>
          <Link
            href="/leaderboard"
            className="px-3.5 py-2 rounded-xl bg-primary text-on-primary font-label-md text-label-md font-bold hover:bg-primary-container active:scale-95 transition-all shadow-xs shrink-0 flex items-center gap-1"
          >
            <span>View Ranks</span>
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          </Link>
        </div>

        {/* Key Summary Metrics Banner */}
        <div className="bg-surface-container-low rounded-2xl p-4 shadow-xs border border-surface-container-high/40 mb-4">
          <div className="grid grid-cols-3 divide-x divide-surface-container-high/60">
            {/* Streak */}
            <div className="flex flex-col items-center text-center px-1">
              <div className="flex items-center gap-1 text-primary">
                <span className="text-lg">🔥</span>
                <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
                  {isLoggedIn ? (user?.current_streak ?? 0) : 0}
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
                  {isLoggedIn ? (user?.total_questions_answered ?? 0) : 0}
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
                  {isLoggedIn ? (user?.overall_accuracy ?? 0) : 0}%
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

        {/* My Created Questions Studio Section */}
        <div className="mb-4">
          <div className="flex items-center justify-between pb-2 px-1">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">edit_document</span>
              <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                My Created Questions
              </h2>
            </div>
            <Link
              href="/create"
              className="px-2.5 py-1 rounded-lg bg-primary-fixed text-primary font-bold text-xs hover:bg-primary-fixed-dim transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px]">add</span>
              <span>New</span>
            </Link>
          </div>

          {authoredQuestions.length === 0 ? (
            <div className="p-4 rounded-2xl bg-surface-container-low border border-surface-container-high/40 text-center text-secondary text-xs">
              You haven&apos;t created any practice questions yet. Tap &apos;New&apos; above to publish your first challenge!
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {authoredQuestions.slice(0, 5).map((q) => (
                <div
                  key={q.id}
                  className="p-3.5 rounded-2xl bg-surface-container-low border border-surface-container-high/40 flex flex-col gap-2 shadow-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface text-[10px] font-bold uppercase">
                        {q.subject_name || "General"}
                      </span>
                      {q.syllabus_tag && (
                        <span className="px-2 py-0.5 rounded-full bg-primary-fixed/40 text-primary text-[10px] font-bold">
                          {q.syllabus_tag}
                        </span>
                      )}
                      {q.pyq_info && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-900 dark:text-amber-200 text-[10px] font-bold">
                          {q.pyq_info}
                        </span>
                      )}
                      {q.hindi_question_text && (
                        <span className="px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 text-[9px] font-bold">
                          Bilingual
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-secondary">
                      <span>{q.total_attempts} attempts</span>
                      <span>·</span>
                      <span className="font-bold text-tertiary">
                        {q.total_attempts > 0 ? Math.round((q.correct_attempts / q.total_attempts) * 100) : 0}% acc
                      </span>
                    </div>
                  </div>

                  <p className="text-xs font-medium text-on-surface line-clamp-2 leading-relaxed">
                    {q.question_text}
                  </p>

                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-surface-container-high/30">
                    <button
                      type="button"
                      onClick={() => handleShareQuestionToWhatsApp(q)}
                      className="px-2.5 py-1 rounded-lg bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#25D366] font-bold text-xs flex items-center gap-1 transition-colors"
                      title="Share to WhatsApp study group"
                    >
                      <span className="material-symbols-outlined text-[15px]">chat</span>
                      <span>WhatsApp Challenge</span>
                    </button>

                    <Link
                      href={`/create?edit=${q.id}`}
                      className="px-2.5 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-primary font-bold text-xs flex items-center gap-1 transition-colors"
                      title="Edit question statement, options or solution"
                    >
                      <span className="material-symbols-outlined text-[15px]">edit</span>
                      <span>Edit</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section Label */}
        <div className="px-1 pb-1">
          <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider font-bold">
            Preferences & Controls
          </span>
        </div>

        {/* Clean Menu List */}
        <div className="flex flex-col bg-surface-container-low rounded-2xl overflow-hidden border border-surface-container-high/40 divide-y divide-surface-container-high/40 mb-4">
          {/* All India Ranks & Standings Link */}
          <Link
            href="/leaderboard"
            className="w-full flex items-center justify-between p-3.5 hover:bg-surface-container transition-colors text-left"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-primary shrink-0">
                <span className="material-symbols-outlined text-[20px]">military_tech</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-body-lg text-body-lg text-on-surface font-semibold truncate">
                  All India Ranks & Standings
                </span>
                <span className="font-body-sm text-body-sm text-secondary truncate">
                  View full leaderboard & competitive scores
                </span>
              </div>
            </div>
            <span className="material-symbols-outlined text-[20px] text-secondary">chevron_right</span>
          </Link>

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

          {/* Share Profile on WhatsApp */}
          <button
            onClick={handleWhatsAppProfileShare}
            className="w-full flex items-center justify-between p-3.5 hover:bg-surface-container transition-colors text-left"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-[#25D366]/20 flex items-center justify-center text-[#25D366] shrink-0">
                <span className="material-symbols-outlined text-[20px]">chat</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-body-lg text-body-lg text-[#25D366] font-bold truncate">
                  Share Profile on WhatsApp
                </span>
                <span className="font-body-sm text-body-sm text-secondary truncate">
                  Showcase your streak, questions solved & accuracy
                </span>
              </div>
            </div>
            <span className="material-symbols-outlined text-[20px] text-[#25D366]">chevron_right</span>
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

          {/* Reset Practice Data to Fresh 0 */}
          {isLoggedIn && (
            <button
              onClick={handleResetData}
              disabled={isResettingData}
              className="w-full flex items-center justify-between p-3.5 hover:bg-error-container/20 transition-colors text-left group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-error-container flex items-center justify-center text-error shrink-0">
                  <span className="material-symbols-outlined text-[20px]">restart_alt</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-body-lg text-body-lg text-error font-semibold truncate group-hover:underline">
                    {isResettingData ? "Resetting..." : "Reset Data to Fresh 0"}
                  </span>
                  <span className="font-body-sm text-body-sm text-secondary truncate">
                    Reset streak, attempts and matrix to absolute zero
                  </span>
                </div>
              </div>
              <span className="material-symbols-outlined text-[20px] text-error">chevron_right</span>
            </button>
          )}

          {/* Sign Out / Sign In */}
          {isLoggedIn ? (
            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-between p-3.5 hover:bg-surface-container transition-colors text-left"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-secondary shrink-0">
                  <span className="material-symbols-outlined text-[20px]">logout</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-body-lg text-body-lg text-on-surface font-semibold truncate">
                    Sign Out
                  </span>
                  <span className="font-body-sm text-body-sm text-secondary truncate">
                    Return to guest browsing mode
                  </span>
                </div>
              </div>
              <span className="material-symbols-outlined text-[20px] text-secondary">chevron_right</span>
            </button>
          ) : (
            <button
              onClick={() => {
                window.dispatchEvent(
                  new CustomEvent("open_auth_modal", {
                    detail: { reason: "Sign in to track your practice streak and rank", mode: "signup" },
                  })
                );
              }}
              className="w-full flex items-center justify-between p-3.5 hover:bg-surface-container transition-colors text-left"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center text-on-primary shrink-0">
                  <span className="material-symbols-outlined text-[20px]">login</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-body-lg text-body-lg text-primary font-bold truncate">
                    Sign In / Sign Up
                  </span>
                  <span className="font-body-sm text-body-sm text-secondary truncate">
                    Google Sign-in or create unique handle
                  </span>
                </div>
              </div>
              <span className="material-symbols-outlined text-[20px] text-primary">chevron_right</span>
            </button>
          )}
        </div>

        {/* Founder Direct Feedback & Aspirants WhatsApp Community */}
        <div className="rounded-2xl bg-surface-container-lowest p-4 border border-surface-container-high/60 shadow-xs flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">support_agent</span>
              <h3 className="font-headline-sm text-sm font-bold text-on-surface">Founder Support & Community</h3>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary">
              Direct Contact
            </span>
          </div>
          <p className="text-xs text-secondary leading-relaxed">
            Qz Loop is built with heart by {FOUNDER_NAME} for serious Indian competitive exam aspirants. Have a question, syllabus suggestion, or found a bug? Connect directly!
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {/* WhatsApp Founder Direct */}
            <a
              href={FOUNDER_WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-[#128C7E] dark:text-[#25D366] transition-all font-semibold text-xs"
            >
              <div className="w-7 h-7 rounded-lg bg-[#25D366] text-white flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[16px]">chat</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-bold text-on-surface">WhatsApp Founder</span>
                <span className="text-[10px] text-secondary truncate">{FOUNDER_PHONE}</span>
              </div>
            </a>

            {/* Email Founder Direct */}
            <a
              href={`mailto:${FOUNDER_EMAIL}?subject=Qz%20Loop%20Feedback`}
              className="flex items-center gap-2.5 p-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary transition-all font-semibold text-xs"
            >
              <div className="w-7 h-7 rounded-lg bg-primary text-on-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[16px]">mail</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-bold text-on-surface">Email {FOUNDER_NAME}</span>
                <span className="text-[10px] text-secondary truncate">{FOUNDER_EMAIL}</span>
              </div>
            </a>
          </div>

          {/* Aspirants Official WhatsApp Study Group */}
          <a
            href={OFFICIAL_WHATSAPP_GROUP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/25 text-emerald-800 dark:text-emerald-300 font-bold text-xs transition-all group"
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-[20px]">group</span>
              <div>
                <p className="font-bold text-on-surface text-xs">Join Aspirants WhatsApp Study Group</p>
                <p className="text-[10px] text-secondary font-normal">Daily PYQs, exam updates & peer discussion</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-bold group-hover:scale-105 transition-transform">
              Join Group
            </span>
          </a>
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

      {/* Edit Profile & Unique Username Modal */}
      {showEditProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl p-5 shadow-2xl border border-surface-container-high/60 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-surface-container-high/40">
              <div>
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                  {user?.username ? "Edit Student Profile" : "Set Up Your Username"}
                </h3>
                <p className="font-body-sm text-body-sm text-secondary">
                  Unique handle for social chat & study sharing
                </p>
              </div>
              {user?.username && (
                <button
                  onClick={() => setShowEditProfileModal(false)}
                  className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-secondary"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              )}
            </div>

            <form onSubmit={handleSaveProfile} className="py-4 flex flex-col gap-3.5">
              {/* Profile Photo */}
              <div className="flex items-center gap-3.5 p-2.5 rounded-2xl bg-surface-container-low/70 border border-surface-container-high/50">
                <div className="relative">
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-surface-container-high border-2 border-primary/20 flex items-center justify-center shrink-0">
                    {editAvatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={editAvatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-[28px] text-secondary">account_circle</span>
                    )}
                  </div>
                  {isCompressingEditAvatar && (
                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1 flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-label-sm text-xs font-bold text-on-surface">Profile Picture</span>
                    {editAvatarSizeKb !== null && (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded-full">
                        {editAvatarSizeKb} KB · Compressed
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => editFileInputRef.current?.click()}
                    className="mt-0.5 text-left text-xs font-bold text-primary hover:underline flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[14px]">photo_camera</span>
                    <span>{editAvatarUrl ? "Change Photo" : "Upload Photo (~20 KB)"}</span>
                  </button>
                  <input
                    ref={editFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarFileChange}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Display Name */}
              <div className="flex flex-col gap-1">
                <label className="font-label-sm text-label-sm text-secondary font-bold uppercase tracking-wider">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-surface-container-high/60 text-sm font-medium text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              {/* Unique Username */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="font-label-sm text-label-sm text-secondary font-bold uppercase tracking-wider">
                    Unique Username
                  </label>
                  <span className="text-[11px] text-secondary">Instagram-style handle</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 font-bold text-secondary text-sm">@</span>
                  <input
                    type="text"
                    required
                    value={editUsername}
                    onChange={(e) => handleUsernameChange(e.target.value)}
                    placeholder="username"
                    className={`w-full pl-8 pr-10 py-2.5 rounded-xl bg-surface-container-low border text-sm font-bold tracking-wide focus:outline-none ${
                      usernameStatus.available === true
                        ? "border-emerald-600 text-emerald-950 dark:text-emerald-100"
                        : usernameStatus.available === false
                        ? "border-error text-error"
                        : "border-surface-container-high/60 text-on-surface focus:border-primary"
                    }`}
                  />
                  {usernameStatus.checking && (
                    <div className="absolute right-3.5 top-3 w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  )}
                  {usernameStatus.available === true && (
                    <span className="material-symbols-outlined absolute right-3 top-2.5 text-emerald-600 text-[20px]">
                      check_circle
                    </span>
                  )}
                  {usernameStatus.available === false && (
                    <span className="material-symbols-outlined absolute right-3 top-2.5 text-error text-[20px]">
                      cancel
                    </span>
                  )}
                </div>
                {usernameStatus.message && (
                  <p
                    className={`text-[11px] font-medium mt-0.5 ${
                      usernameStatus.available === true
                        ? "text-emerald-600"
                        : usernameStatus.available === false
                        ? "text-error"
                        : "text-secondary"
                    }`}
                  >
                    {usernameStatus.message}
                  </p>
                )}
              </div>

              {/* Target Exam */}
              <div className="flex flex-col gap-1">
                <label className="font-label-sm text-label-sm text-secondary font-bold uppercase tracking-wider">
                  Target Exam
                </label>
                <select
                  value={editExamId}
                  onChange={(e) => setEditExamId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-surface-container-high/60 text-sm font-semibold text-on-surface focus:outline-none focus:border-primary"
                >
                  {exams.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Email Address */}
              <div className="flex flex-col gap-1">
                <label className="font-label-sm text-label-sm text-secondary font-bold uppercase tracking-wider">
                  {t.emailLabel || "Email Address"} (Optional)
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="aspirant@gmail.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-surface-container-high/60 text-sm font-semibold text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              {/* Study Language Preference */}
              <div className="flex flex-col gap-1.5 p-2.5 rounded-2xl bg-surface-container-low/70 border border-surface-container-high/50">
                <div className="flex items-center justify-between">
                  <label className="font-label-sm text-[11px] text-secondary font-bold uppercase tracking-wider">
                    Study Language Preference
                  </label>
                  <span className="text-[10px] text-secondary">Switch anytime</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditLanguagePref("en")}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border ${
                      editLanguagePref === "en"
                        ? "bg-primary text-on-primary border-primary shadow-xs"
                        : "bg-surface-container-lowest text-secondary border-surface-container-high/60 hover:text-on-surface"
                    }`}
                  >
                    <span>🇬🇧</span>
                    <span>English</span>
                    {editLanguagePref === "en" && <span className="material-symbols-outlined text-[14px]">check</span>}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditLanguagePref("hi")}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border ${
                      editLanguagePref === "hi"
                        ? "bg-primary text-on-primary border-primary shadow-xs"
                        : "bg-surface-container-lowest text-secondary border-surface-container-high/60 hover:text-on-surface"
                    }`}
                  >
                    <span>🇮🇳</span>
                    <span>हिन्दी (Hindi)</span>
                    {editLanguagePref === "hi" && <span className="material-symbols-outlined text-[14px]">check</span>}
                  </button>
                </div>
              </div>

              {editError && (
                <div className="p-2.5 rounded-xl bg-error-container/40 border border-error/20 text-error text-xs font-medium flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">error</span>
                  <span>{editError}</span>
                </div>
              )}

              <div className="pt-2 flex items-center gap-2">
                {user?.username && (
                  <button
                    type="button"
                    onClick={() => setShowEditProfileModal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-surface-container font-label-md text-label-md text-on-surface hover:bg-surface-container-high transition-colors"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isSavingProfile || usernameStatus.available === false}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-on-primary font-label-md text-label-md font-bold shadow-md hover:bg-primary-container disabled:opacity-40 transition-all flex items-center justify-center gap-1.5"
                >
                  {isSavingProfile ? (
                    <div className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>Save Profile</span>
                  )}
                </button>
              </div>
            </form>
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
              body: JSON.stringify({ preferred_examination_id: exam.id, target_exam: exam.name }),
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

"use client";

import React, { useState, useEffect, useRef } from "react";
import { UserProfile, Examination } from "@/types/database";
import { compressImageClientSide } from "@/lib/utils/imageCompression";
import { setAppLanguage, useAppLanguage } from "@/lib/utils/i18n";
import { OFFICIAL_WHATSAPP_GROUP_URL } from "@/lib/utils/whatsapp";

export const UsernameOnboardingModal: React.FC = () => {
  const { lang, t } = useAppLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [exams, setExams] = useState<Examination[]>([]);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [examId, setExamId] = useState("exam-neet-ug");
  const [email, setEmail] = useState("");
  const [languagePref, setLanguagePref] = useState<"en" | "hi">("en");
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [avatarSizeKb, setAvatarSizeKb] = useState<number | null>(null);
  const [isCompressingAvatar, setIsCompressingAvatar] = useState(false);
  const [status, setStatus] = useState<{
    checking: boolean;
    available: boolean | null;
    message: string;
  }>({ checking: false, available: null, message: "" });
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkOnboardingState = () => {
      const uid = localStorage.getItem("qz_user_id");
      if (!uid) {
        setIsOpen(false);
        return;
      }

      const needsUsername = localStorage.getItem("qz_needs_username") === "true";
      // Persistent guard: Stop re-prompting only if details already saved for this specific user
      const completed =
        !needsUsername &&
        (localStorage.getItem("qz_onboarding_completed") === "true" ||
          localStorage.getItem("qz_details_submitted") === "true") &&
        (localStorage.getItem("qz_onboarded_user_id") === uid ||
          localStorage.getItem(`qz_onboarded_${uid}`) === "true");

      if (completed) {
        setIsOpen(false);
        return;
      }

      const url = `/api/profile?userId=${encodeURIComponent(uid)}`;
      const headers: Record<string, string> = { "x-user-id": uid };

      fetch(url, { headers })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.user) {
            setUser(data.user);
            setExams(data.exams || []);
            setName(data.user.display_name || "");
            setExamId(data.user.preferred_examination_id || "exam-neet-ug");
            if (data.user.language_preference) {
              setLanguagePref(data.user.language_preference);
            }
            if (data.user.avatar_url) {
              setAvatarUrl(data.user.avatar_url);
            }
            if (data.user.email) {
              setEmail(data.user.email);
            }

            // Open onboarding if user has not completed onboarding
            if (data.user.onboarding_completed && !needsUsername) {
              localStorage.setItem("qz_onboarding_completed", "true");
              localStorage.setItem("qz_details_submitted", "true");
              localStorage.setItem(`qz_onboarded_${data.user.id}`, "true");
              localStorage.setItem("qz_onboarded_user_id", data.user.id);
              setIsOpen(false);
              return;
            }

            // Force unique username setup for first-time signups
            setIsOpen(true);
          }
        })
        .catch(() => {});
    };

    checkOnboardingState();
    window.addEventListener("qz_auth_changed", checkOnboardingState);
    return () => window.removeEventListener("qz_auth_changed", checkOnboardingState);
  }, []);

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressingAvatar(true);
    setError(null);
    try {
      const result = await compressImageClientSide(file, 256, 0.7);
      setAvatarUrl(result.dataUrl);
      setAvatarSizeKb(result.sizeKb);
    } catch {
      setError("Failed to process photo. Please choose another.");
    } finally {
      setIsCompressingAvatar(false);
    }
  };

  const handleUsernameChange = (val: string) => {
    const clean = val.toLowerCase().replace(/[^a-z0-9_.]/g, "");
    setUsername(clean);
    setError(null);

    if (clean.length < 3) {
      setStatus({ checking: false, available: false, message: "Username must be 3-30 characters" });
      return;
    }
    if (clean.startsWith(".") || clean.endsWith(".") || clean.includes("..")) {
      setStatus({ checking: false, available: false, message: "Cannot start/end with a dot or have consecutive dots" });
      return;
    }

    setStatus({ checking: true, available: null, message: "Checking availability..." });
    fetch(`/api/profile?checkUsername=${encodeURIComponent(clean)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          if (d.available) {
            setStatus({ checking: false, available: true, message: `@${clean} is available!` });
          } else {
            setStatus({ checking: false, available: false, message: `@${clean} is already taken` });
          }
        }
      })
      .catch(() => {
        setStatus({ checking: false, available: null, message: "" });
      });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }
    if (!username.trim() || username.length < 3) {
      setError("Please enter a valid unique username (at least 3 characters)");
      return;
    }
    if (username.startsWith(".") || username.endsWith(".") || username.includes("..")) {
      setError("Username cannot start or end with a dot, or contain consecutive dots");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const selectedExam = exams.find((x) => x.id === examId);
      const uid = user?.id || (typeof window !== "undefined" ? localStorage.getItem("qz_user_id") : null);
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(uid ? { "x-user-id": uid } : {}),
        },
        body: JSON.stringify({
          userId: uid || undefined,
          display_name: name.trim(),
          username: username.trim().toLowerCase(),
          preferred_examination_id: examId,
          target_exam: selectedExam?.name || "NEET UG (Medical Entrance)",
          language_preference: languagePref,
          avatar_url: avatarUrl || undefined,
          email: email.trim() || undefined,
          onboarding_completed: true,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUser(data.user);
        setAppLanguage(languagePref);
        localStorage.setItem("qz_user_id", data.user.id);
        localStorage.setItem("qz_auth_user", JSON.stringify(data.user));
        localStorage.setItem("qz_quiz_lang", languagePref);
        localStorage.removeItem("qz_needs_username");
        localStorage.setItem("qz_onboarding_completed", "true");
        localStorage.setItem("qz_details_submitted", "true");
        localStorage.setItem(`qz_onboarded_${data.user.id}`, "true");
        localStorage.setItem("qz_onboarded_user_id", data.user.id);
        document.cookie = `qz_user_id=${data.user.id}; path=/; max-age=2592000; SameSite=Lax`;
        window.dispatchEvent(new CustomEvent("qz_auth_changed", { detail: { user: data.user } }));
        window.dispatchEvent(new CustomEvent("qz_account_completed", { detail: { user: data.user } }));
        window.dispatchEvent(new CustomEvent("open_onboarding_tour", { detail: { user: data.user } }));
        setIsOpen(false);
      } else {
        setError(data.error || "Failed to save profile. Please choose another username.");
      }
    } catch {
      setError("Network error while creating profile");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-sm max-h-[92vh] overflow-y-auto bg-surface-container-lowest rounded-3xl p-6 shadow-2xl border border-surface-container-high/60 flex flex-col gap-4 animate-in zoom-in-95">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-md border-2 border-primary/20 bg-primary">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.jpg" alt="Qz Loop" className="w-full h-full object-cover" />
          </div>
          <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
            Welcome to Qz Loop!
          </h2>
          <p className="font-body-sm text-xs text-secondary leading-snug">
            Set up your Instagram-style unique username, target exam, and study language preference.
          </p>
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-3 pt-1">
          {/* Avatar Picture */}
          <div className="flex items-center gap-3 p-2 rounded-2xl bg-surface-container-low/70 border border-surface-container-high/50">
            <div className="relative">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-surface-container-high border-2 border-primary/20 flex items-center justify-center shrink-0">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-[24px] text-secondary">account_circle</span>
                )}
              </div>
              {isCompressingAvatar && (
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            <div className="flex flex-col gap-0.5 flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-on-surface">Profile Picture</span>
                {avatarSizeKb !== null && (
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded-full">
                    {avatarSizeKb} KB
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-left text-xs font-bold text-primary hover:underline flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">photo_camera</span>
                <span>{avatarUrl ? "Change Photo" : "Upload Photo (~20 KB)"}</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarFile}
                className="hidden"
              />
            </div>
          </div>

          {/* Full Name */}
          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-[11px] text-secondary font-bold uppercase tracking-wider">
              Your Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container-high/60 text-xs font-medium text-on-surface focus:outline-none focus:border-primary"
            />
          </div>

          {/* Unique Username */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="font-label-sm text-[11px] text-secondary font-bold uppercase tracking-wider">
                Unique Username *
              </label>
              <span className="text-[10px] text-secondary">Instagram-style @handle</span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-2 font-bold text-secondary text-xs">@</span>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                placeholder="choose_username"
                className={`w-full pl-7 pr-8 py-2 rounded-xl bg-surface-container-low border text-xs font-bold tracking-wide focus:outline-none ${
                  status.available === true
                    ? "border-emerald-600 text-emerald-950 dark:text-emerald-100"
                    : status.available === false
                    ? "border-error text-error"
                    : "border-surface-container-high/60 text-on-surface focus:border-primary"
                }`}
              />
              {status.checking && (
                <div className="absolute right-2.5 top-2.5 w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              )}
              {status.available === true && (
                <span className="material-symbols-outlined absolute right-2.5 top-2 text-emerald-600 text-[18px]">
                  check_circle
                </span>
              )}
              {status.available === false && (
                <span className="material-symbols-outlined absolute right-2.5 top-2 text-error text-[18px]">
                  cancel
                </span>
              )}
            </div>
            {status.message && (
              <p
                className={`text-[10px] font-medium mt-0.5 ${
                  status.available === true
                    ? "text-emerald-600"
                    : status.available === false
                    ? "text-error"
                    : "text-secondary"
                }`}
              >
                {status.message}
              </p>
            )}
          </div>

          {/* Target Exam */}
          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-[11px] text-secondary font-bold uppercase tracking-wider">
              Target Examination *
            </label>
            <select
              value={examId}
              onChange={(e) => setExamId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container-high/60 text-xs font-semibold text-on-surface focus:outline-none focus:border-primary"
            >
              {exams.filter((ex) => ex.id === "exam-neet-ug").length > 0 ? (
                exams
                  .filter((ex) => ex.id === "exam-neet-ug")
                  .map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.name}
                    </option>
                  ))
              ) : (
                <option value="exam-neet-ug">NEET UG (Medical Entrance)</option>
              )}
            </select>
          </div>

          {/* Email Address */}
          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-[11px] text-secondary font-bold uppercase tracking-wider">
              {t.emailLabel || "Email Address"} (Optional)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="aspirant@gmail.com"
              className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container-high/60 text-xs font-semibold text-on-surface focus:outline-none focus:border-primary"
            />
          </div>

          {/* Study Language Preference */}
          <div className="flex flex-col gap-1.5 p-2 rounded-2xl bg-surface-container-low/70 border border-surface-container-high/50">
            <div className="flex items-center justify-between">
              <label className="font-label-sm text-[11px] text-secondary font-bold uppercase tracking-wider">
                Study Language Preference *
              </label>
              <span className="text-[10px] text-secondary">Switch anytime</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setLanguagePref("en")}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border ${
                  languagePref === "en"
                    ? "bg-primary text-on-primary border-primary shadow-xs"
                    : "bg-surface-container-lowest text-secondary border-surface-container-high/60 hover:text-on-surface"
                }`}
              >
                <span>🇬🇧</span>
                <span>English</span>
                {languagePref === "en" && <span className="material-symbols-outlined text-[14px]">check</span>}
              </button>
              <button
                type="button"
                onClick={() => setLanguagePref("hi")}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border ${
                  languagePref === "hi"
                    ? "bg-primary text-on-primary border-primary shadow-xs"
                    : "bg-surface-container-lowest text-secondary border-surface-container-high/60 hover:text-on-surface"
                }`}
              >
                <span>🇮🇳</span>
                <span>हिन्दी (Hindi)</span>
                {languagePref === "hi" && <span className="material-symbols-outlined text-[14px]">check</span>}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-2.5 rounded-xl bg-error-container/40 border border-error/20 text-error text-xs font-medium flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">error</span>
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSaving || status.available === false || !username.trim()}
            className="w-full mt-1 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-xs shadow-md hover:bg-primary-container active:scale-95 transition-all disabled:opacity-40"
          >
            {isSaving ? "Saving Profile..." : "Claim Username & Start Practice"}
          </button>
        </form>

        {/* WhatsApp Aspirants Study Group Link */}
        <a
          href={OFFICIAL_WHATSAPP_GROUP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs font-semibold group"
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-[16px]">group</span>
            <span className="text-[11px] font-bold">Join Aspirants WhatsApp Study Group</span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white">
            Join
          </span>
        </a>
      </div>
    </div>
  );
};

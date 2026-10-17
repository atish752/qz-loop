"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { UserProfile } from "@/types/database";
import { useAppLanguage } from "@/lib/utils/i18n";
import { OFFICIAL_WHATSAPP_GROUP_URL } from "@/lib/utils/whatsapp";

interface TopHeaderProps {
  currentTab?: "home" | "matrix" | "create" | "loop" | "social" | "leaderboard" | "profile";
  streakDays?: number;
  activeExamName?: string;
  user?: UserProfile | null;
  onSelectExam?: () => void;
  onOpenAuth?: (reason?: string) => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  currentTab = "home",
  streakDays = 0,
  activeExamName = "Railways (RRB NTPC & Group D)",
  user,
  onSelectExam,
  onOpenAuth,
}) => {
  const { lang, setLanguage, t } = useAppLanguage();
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  // Initialize theme from localStorage or system preference on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("qz_theme");
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const shouldBeDark = savedTheme === "dark" || (!savedTheme && prefersDark);
      setIsDarkMode(shouldBeDark);
      if (shouldBeDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  }, []);

  // Toggle dark mode
  const toggleDarkMode = () => {
    const nextMode = !isDarkMode;
    setIsDarkMode(nextMode);
    if (nextMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("qz_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("qz_theme", "light");
    }
  };

  const handleAuthClick = () => {
    if (onOpenAuth) {
      onOpenAuth("Sign in to track your practice streak, study matrix and All India rank");
    } else {
      window.dispatchEvent(
        new CustomEvent("open_auth_modal", {
          detail: { reason: "Sign in to track your practice streak and rank" },
        })
      );
    }
  };

  return (
    <header className="sticky top-0 w-full z-40 bg-surface-container-lowest/90 backdrop-blur-md border-b border-surface-container-high/40 pt-safe">
      <div className="h-14 px-3 flex items-center justify-between">
        {/* Brand & Exam Chip */}
        <div className="flex items-center gap-2 min-w-0">
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <div className="w-8 h-8 rounded-xl overflow-hidden shrink-0 shadow-xs border border-primary/20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.jpg"
                alt="Qz Loop Logo"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            </div>
            <span className="text-primary font-headline-sm font-bold tracking-tight hidden xs:inline">Qz Loop</span>
          </Link>
          <button
            onClick={onSelectExam}
            className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors text-[11px] font-semibold truncate max-w-[150px] xs:max-w-[190px]"
            title="Switch Target Exam"
          >
            <span className="truncate">{activeExamName}</span>
            <span className="material-symbols-outlined text-[14px] shrink-0">expand_more</span>
          </button>
        </div>

        {/* Right side: Language Switcher + WhatsApp Group + Dark Mode toggle + Streak + Auth / Profile Avatar */}
        <div className="flex items-center gap-1.5 xs:gap-2 shrink-0">
          {/* Top Language Switcher: EN to Hindi & Hindi to EN */}
          <button
            onClick={() => setLanguage(lang === "en" ? "hi" : "en")}
            className="flex items-center gap-1 px-2 py-1 rounded-full bg-surface-container-low hover:bg-surface-container-high border border-surface-container-high/60 text-on-surface transition-all active:scale-95"
            title={lang === "en" ? "हिन्दी में बदलें (Switch to Hindi)" : "Switch to English"}
            aria-label="Switch Language"
          >
            <span className="text-[11px] font-extrabold text-primary">{lang === "en" ? "EN" : "अ"}</span>
            <span className="text-[10px] text-secondary">|</span>
            <span className="text-[11px] font-bold">{lang === "en" ? "हिन्दी" : "Eng"}</span>
          </button>

          {/* Direct WhatsApp Group Button */}
          <a
            href={OFFICIAL_WHATSAPP_GROUP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 rounded-full flex items-center justify-center bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#25D366] transition-all border border-[#25D366]/30 active:scale-95"
            title={t.joinWhatsAppCommunity}
            aria-label="Join Official WhatsApp Group"
          >
            <span className="material-symbols-outlined text-[17px]">groups</span>
          </a>

          {/* Night Mode Moon/Sun Toggle Switch */}
          <button
            onClick={toggleDarkMode}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-surface-container-low hover:bg-surface-container-high text-on-surface transition-colors border border-surface-container-high/40"
            title={isDarkMode ? t.dayMode : t.nightMode}
            aria-label="Toggle Night Mode"
          >
            <span className="material-symbols-outlined text-[18px]">
              {isDarkMode ? "light_mode" : "dark_mode"}
            </span>
          </button>

          {/* User Logged In vs Guest */}
          {user ? (
            <>
              {/* Daily Streak Indicator */}
              <div
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-error-container/80 text-on-error-container shadow-xs animate-pulse-subtle"
                title={`${user.current_streak || streakDays} Day Practice Streak`}
              >
                <span className="text-xs">🔥</span>
                <span className="font-label-md text-xs font-bold">{user.current_streak ?? streakDays}</span>
                <span className="font-label-sm text-[10px] text-error font-medium">d</span>
              </div>

              {/* Profile Avatar */}
              <Link
                href="/profile"
                className={`w-8 h-8 rounded-full overflow-hidden flex items-center justify-center transition-transform active:scale-95 ${
                  currentTab === "profile"
                    ? "ring-2 ring-primary ring-offset-1"
                    : "border border-surface-container-high"
                }`}
                title={`@${user.username || user.display_name}`}
              >
                {user.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatar_url}
                    alt={user.display_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-primary flex items-center justify-center text-on-primary">
                    <span className="material-symbols-outlined text-[16px]">person</span>
                  </div>
                )}
              </Link>
            </>
          ) : (
            /* Guest / Unauthenticated Visitor: Prominent Sign In button */
            <button
              onClick={handleAuthClick}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary text-on-primary hover:bg-primary-container active:scale-95 transition-all text-xs font-bold shadow-xs"
              title="Sign In with Google or Email"
            >
              <span className="material-symbols-outlined text-[15px]">login</span>
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

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
  const { t } = useAppLanguage();
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
        {/* Brand Name Prominently Displayed */}
        <div className="flex items-center gap-2.5 min-w-0">
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <div className="w-8 h-8 rounded-xl overflow-hidden shrink-0 shadow-xs border border-primary/20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.jpg"
                alt="Qz-loop Logo"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            </div>
            <span className="text-primary text-lg xs:text-xl font-black tracking-tight">
              Qz-loop
            </span>
          </Link>
        </div>

        {/* Right side: WhatsApp Group + Dark Mode toggle + Streak (Profile & Language moved to bottom nav / profile) */}
        <div className="flex items-center gap-1.5 xs:gap-2 shrink-0">
          {/* Daily Streak Indicator (if user has active streak) */}
          {(user?.current_streak || streakDays > 0) && (
            <div
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-error-container/80 text-on-error-container shadow-xs animate-pulse-subtle"
              title={`${user?.current_streak || streakDays} Day Practice Streak`}
            >
              <span className="text-xs">🔥</span>
              <span className="font-label-md text-xs font-bold">{user?.current_streak ?? streakDays}</span>
              <span className="font-label-sm text-[10px] text-error font-medium">d</span>
            </div>
          )}

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
        </div>
      </div>
    </header>
  );
};

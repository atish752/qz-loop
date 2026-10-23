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
  activeExamName = "NEET UG (Medical Entrance)",
  user,
  onSelectExam,
  onOpenAuth,
}) => {
  const { t } = useAppLanguage();
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isAppInstalled, setIsAppInstalled] = useState<boolean>(false);
  const [showInstallModal, setShowInstallModal] = useState<boolean>(false);

  // Initialize theme from localStorage on mount (Light mode default for first-time visitors)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("qz_theme");
      const shouldBeDark = savedTheme === "dark";
      setIsDarkMode(shouldBeDark);
      if (shouldBeDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }

      if (window.matchMedia("(display-mode: standalone)").matches) {
        setIsAppInstalled(true);
      }
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);

    const handleThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ isDark: boolean }>;
      if (customEvent.detail && typeof customEvent.detail.isDark === "boolean") {
        setIsDarkMode(customEvent.detail.isDark);
      }
    };
    window.addEventListener("qz_theme_changed", handleThemeChange);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("qz_theme_changed", handleThemeChange);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice?.outcome === "accepted") {
          setIsAppInstalled(true);
        }
        setDeferredPrompt(null);
      } catch {
        setShowInstallModal(true);
      }
    } else {
      setShowInstallModal(true);
    }
  };

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
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("qz_theme_changed", { detail: { isDark: nextMode } }));
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
          <Link
            href="/"
            onClick={() => {
              if (typeof window !== "undefined" && sessionStorage.getItem("qz_loop_is_active") === "true") {
                sessionStorage.removeItem("qz_loop_is_active");
                sessionStorage.removeItem("qz_loop_cached_questions");
                sessionStorage.removeItem("qz_loop_active_question_id");
                sessionStorage.removeItem("qz_loop_answered_records");
                sessionStorage.removeItem("qz_last_loop_index");
                window.dispatchEvent(new CustomEvent("qz_leave_quiz_loop"));
              }
            }}
            className="flex items-center gap-2 group shrink-0"
          >
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

          {/* PWA Install / Download Webapp Button beside WhatsApp */}
          <button
            type="button"
            onClick={handleInstallClick}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-primary/10 hover:bg-primary/20 text-primary transition-all border border-primary/25 active:scale-95 shadow-2xs cursor-pointer"
            title={isAppInstalled ? "App Installed" : "Install / Download Qz-loop App"}
            aria-label="Install or Download Webapp"
          >
            <span className="material-symbols-outlined text-[17px]">
              {isAppInstalled ? "check_circle" : "download_for_offline"}
            </span>
          </button>

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

      {/* PWA Installation Guidance Modal */}
      {showInstallModal && (
        <div
          data-no-swipe="true"
          onClick={() => setShowInstallModal(false)}
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-surface-container-lowest rounded-3xl p-5 shadow-2xl border border-surface-container-high/60 flex flex-col gap-4 animate-in zoom-in-95 duration-200 text-left"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-surface-container-high/40">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl overflow-hidden border border-primary/20 shadow-xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logo.jpg" alt="Qz Loop" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-on-surface">Install Qz-loop App</h3>
                  <p className="text-[11px] text-secondary">Fast, offline-ready practice webapp</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowInstallModal(false)}
                className="w-7 h-7 rounded-full hover:bg-surface-container flex items-center justify-center text-secondary hover:text-on-surface cursor-pointer"
                title="Close"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Platform Guides */}
            <div className="flex flex-col gap-2.5 text-xs text-on-surface">
              <div className="p-3 rounded-2xl bg-surface-container-low border border-surface-container-high/40 flex items-start gap-2.5">
                <span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5">phone_android</span>
                <div>
                  <p className="font-bold text-xs">Android (Chrome / Brave)</p>
                  <p className="text-[11px] text-secondary mt-0.5">
                    Tap the <strong>3 dots (⋮)</strong> menu at the top-right, then select <strong>&quot;Install app&quot;</strong> or <strong>&quot;Add to Home screen&quot;</strong>.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-surface-container-low border border-surface-container-high/40 flex items-start gap-2.5">
                <span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5">phone_iphone</span>
                <div>
                  <p className="font-bold text-xs">iOS / iPhone (Safari)</p>
                  <p className="text-[11px] text-secondary mt-0.5">
                    Tap the <strong>Share</strong> icon (square with arrow up) at the bottom, then choose <strong>&quot;Add to Home Screen&quot; (+)</strong>.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-surface-container-low border border-surface-container-high/40 flex items-start gap-2.5">
                <span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5">laptop</span>
                <div>
                  <p className="font-bold text-xs">Desktop / PC</p>
                  <p className="text-[11px] text-secondary mt-0.5">
                    Click the <strong>Install</strong> icon on the right side of your browser address bar.
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 pt-1">
              {deferredPrompt && (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      deferredPrompt.prompt();
                      const choice = await deferredPrompt.userChoice;
                      if (choice?.outcome === "accepted") {
                        setIsAppInstalled(true);
                      }
                      setDeferredPrompt(null);
                      setShowInstallModal(false);
                    } catch {}
                  }}
                  className="w-full py-3 rounded-xl bg-primary text-on-primary font-bold text-xs shadow-md hover:bg-primary-container transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">download</span>
                  <span>Install App Now</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowInstallModal(false)}
                className="w-full py-2.5 rounded-xl border border-surface-container-high text-secondary hover:text-on-surface hover:bg-surface-container text-xs font-bold transition-colors cursor-pointer"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

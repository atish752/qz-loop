"use client";

import React, { useState, useEffect } from "react";
import { useAppLanguage } from "@/lib/utils/i18n";

export const InteractiveOnboardingModal: React.FC = () => {
  const { t } = useAppLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    // Check if user has already completed onboarding
    if (typeof window !== "undefined") {
      const isCompleted = localStorage.getItem("qz_onboarding_completed");
      const hasJustSignedUp = localStorage.getItem("qz_just_signed_up");
      if (hasJustSignedUp === "true" && isCompleted !== "true") {
        setIsOpen(true);
        localStorage.removeItem("qz_just_signed_up");
      }
    }

    const handleOpenTour = () => {
      setCurrentSlide(0);
      setIsOpen(true);
    };

    const handleAccountCompleted = () => {
      setCurrentSlide(0);
      setIsOpen(true);
    };

    window.addEventListener("open_onboarding_tour", handleOpenTour);
    window.addEventListener("qz_account_completed", handleAccountCompleted);
    return () => {
      window.removeEventListener("open_onboarding_tour", handleOpenTour);
      window.removeEventListener("qz_account_completed", handleAccountCompleted);
    };
  }, []);

  const handleClose = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("qz_onboarding_completed", "true");
    }
    setIsOpen(false);
  };

  const handleNext = () => {
    if (currentSlide < 3) {
      setCurrentSlide((prev) => prev + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide((prev) => prev - 1);
    }
  };

  if (!isOpen) return null;

  const slides = [
    {
      title: t.onboardingSlide1Title,
      description: t.onboardingSlide1Desc,
      icon: "all_inclusive",
      gradient: "from-purple-500/20 via-primary/10 to-transparent",
      badge: "Dopamine Learning Loop",
      visual: (
        <div className="w-full p-4 rounded-2xl bg-surface-container-low border border-surface-container-high/60 shadow-xs flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-secondary">
            <span className="px-2 py-0.5 rounded-full bg-primary-fixed text-primary text-[10px]">NEET Biology · Cell Cycle</span>
            <span className="text-emerald-500 flex items-center gap-1 font-bold">
              <span className="material-symbols-outlined text-[14px]">bolt</span>
              Instant Proof
            </span>
          </div>
          <p className="text-xs font-semibold text-on-surface line-clamp-2">
            During which stage of meiosis does crossing over between non-sister chromatids take place?
          </p>
          <div className="grid grid-cols-2 gap-1.5 pt-1">
            <div className="p-2 rounded-xl bg-surface-container text-[11px] font-medium text-secondary">A. Leptotene</div>
            <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500 text-[11px] font-bold text-emerald-950 dark:text-emerald-200 flex items-center justify-between">
              <span>B. Pachytene</span>
              <span className="material-symbols-outlined text-[14px] text-emerald-500">check_circle</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: t.onboardingSlide2Title,
      description: t.onboardingSlide2Desc,
      icon: "speed",
      gradient: "from-blue-500/20 via-sky-500/10 to-transparent",
      badge: "Long-Term Retention",
      visual: (
        <div className="w-full flex flex-col gap-2.5 p-3.5 rounded-2xl bg-surface-container-low border border-surface-container-high/60 shadow-xs">
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2 rounded-xl bg-surface-container flex items-center justify-between">
              <span className="text-secondary">Attempts</span>
              <span className="font-bold text-on-surface">1,420</span>
            </div>
            <div className="p-2 rounded-xl bg-surface-container flex items-center justify-between">
              <span className="text-secondary">Accuracy</span>
              <span className="font-bold text-tertiary">78%</span>
            </div>
            <div className="p-2 rounded-xl bg-surface-container flex items-center justify-between">
              <span className="text-secondary">Avg Speed</span>
              <span className="font-bold text-on-surface">11.4s</span>
            </div>
            <div className="p-2 rounded-xl bg-surface-container flex items-center justify-between">
              <span className="text-secondary">Fastest</span>
              <span className="font-bold text-emerald-500">3.2s</span>
            </div>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-surface-container-high/40 text-[10px] text-secondary font-semibold">
            <span>Repeat intervals:</span>
            <div className="flex items-center gap-1">
              <span className="px-2 py-0.5 rounded-md bg-primary-fixed text-primary font-bold">&lt; 1 Day</span>
              <span className="px-2 py-0.5 rounded-md bg-surface-container font-medium">&lt; 1 Week</span>
              <span className="px-2 py-0.5 rounded-md bg-surface-container font-medium">&lt; 1 Month</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: t.onboardingSlide3Title,
      description: t.onboardingSlide3Desc,
      icon: "groups",
      gradient: "from-emerald-500/20 via-teal-500/10 to-transparent",
      badge: "Compete & Study Together",
      visual: (
        <div className="w-full flex flex-col gap-2 p-3.5 rounded-2xl bg-surface-container-low border border-surface-container-high/60 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white text-[10px] font-bold">
                AIR
              </div>
              <div>
                <span className="text-xs font-bold text-on-surface block">All India Leaderboard</span>
                <span className="text-[10px] text-secondary">Live sprint rankings for your target exam</span>
              </div>
            </div>
            <span className="text-xs font-extrabold text-primary">#14</span>
          </div>
          <div className="p-2 rounded-xl bg-[#25D366]/15 border border-[#25D366]/30 flex items-center justify-between text-xs font-bold text-[#128C7E] dark:text-[#25D366]">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">chat</span>
              <span>WhatsApp Challenge Ready</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#25D366] text-white">Share</span>
          </div>
        </div>
      ),
    },
    {
      title: t.onboardingSlide4Title,
      description: t.onboardingSlide4Desc,
      icon: "edit_document",
      gradient: "from-amber-500/20 via-orange-500/10 to-transparent",
      badge: "Creator Studio & Collections",
      visual: (
        <div className="w-full flex flex-col gap-2 p-3.5 rounded-2xl bg-surface-container-low border border-surface-container-high/60 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">bookmarks</span>
              <span className="text-xs font-bold text-on-surface">Instagram-Style Playlists</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-fixed text-primary">
              Multi-save
            </span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            <span className="px-2.5 py-1 rounded-lg bg-surface-container text-xs font-semibold text-on-surface whitespace-nowrap">
              📁 High-Yield Biology (14)
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-surface-container text-xs font-semibold text-on-surface whitespace-nowrap">
              📁 Genetics & Biotechnology (9)
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-primary-fixed text-primary text-xs font-bold whitespace-nowrap">
              + New Playlist
            </span>
          </div>
        </div>
      ),
    },
  ];

  const current = slides[currentSlide];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-[420px] bg-surface-container-lowest rounded-3xl p-6 shadow-2xl border border-surface-container-high/70 flex flex-col gap-4 animate-in zoom-in-95 relative overflow-hidden">
        {/* Top bar with skip button */}
        <div className="flex items-center justify-between pb-1 border-b border-surface-container-high/40">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary-fixed text-primary uppercase tracking-wider">
              {current.badge}
            </span>
          </div>
          <button
            onClick={handleClose}
            className="text-xs font-bold text-secondary hover:text-on-surface px-2 py-1 rounded-lg transition-colors"
          >
            {t.onboardingSkip}
          </button>
        </div>

        {/* Slide Visual Graphic */}
        <div className={`p-3 rounded-2xl bg-gradient-to-b ${current.gradient} flex flex-col items-center justify-center min-h-[170px]`}>
          {current.visual}
        </div>

        {/* Slide Content */}
        <div className="flex flex-col gap-1.5 text-center px-1">
          <div className="w-10 h-10 rounded-2xl bg-primary text-on-primary flex items-center justify-center mx-auto shadow-sm mb-1">
            <span className="material-symbols-outlined text-[22px]">{current.icon}</span>
          </div>
          <h2 className="font-headline-sm text-base sm:text-lg font-bold text-on-surface">
            {current.title}
          </h2>
          <p className="font-body-sm text-xs text-secondary leading-relaxed px-2">
            {current.description}
          </p>
        </div>

        {/* Slide Dots */}
        <div className="flex items-center justify-center gap-1.5 py-1">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-1.5 rounded-full transition-all ${
                currentSlide === idx ? "w-6 bg-primary" : "w-1.5 bg-surface-container-high hover:bg-secondary"
              }`}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center gap-2 pt-1">
          {currentSlide > 0 && (
            <button
              onClick={handlePrev}
              className="py-2.5 px-4 rounded-xl border border-surface-container-high bg-surface-container hover:bg-surface-container-high text-xs font-bold text-on-surface transition-all active:scale-95"
            >
              {t.onboardingPrev}
            </button>
          )}

          <button
            onClick={handleNext}
            className="flex-1 py-3 px-4 rounded-xl bg-primary text-on-primary font-bold text-xs shadow-md hover:bg-primary-container active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            <span>{currentSlide === 3 ? t.onboardingFinish : t.onboardingNext}</span>
            <span className="material-symbols-outlined text-[16px]">
              {currentSlide === 3 ? "rocket_launch" : "arrow_forward"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

"use client";

import React from "react";
import Link from "next/link";
import { UserProfile } from "@/types/database";

interface TopHeaderProps {
  currentTab?: "home" | "matrix" | "create" | "loop" | "social" | "leaderboard" | "profile";
  streakDays?: number;
  activeExamName?: string;
  user?: UserProfile | null;
  onSelectExam?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  currentTab = "home",
  streakDays = 14,
  activeExamName = "SSC CGL",
  user,
  onSelectExam,
}) => {
  return (
    <header className="sticky top-0 w-full z-40 bg-surface-container-lowest/90 backdrop-blur-md border-b border-surface-container-high/40 pt-safe">
      <div className="h-14 px-4 flex items-center justify-between">
        {/* Brand & Exam Chip */}
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-xl overflow-hidden shrink-0 shadow-xs border border-primary/20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.jpg"
                alt="Qz Loop Logo"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            </div>
            <span className="text-primary font-headline-sm font-bold tracking-tight">Qz Loop</span>
          </Link>
          <button
            onClick={onSelectExam}
            className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors text-label-sm font-semibold"
            title="Switch Target Exam"
          >
            <span>{activeExamName}</span>
            <span className="material-symbols-outlined text-[14px]">expand_more</span>
          </button>
        </div>

        {/* Right side: Streak and Profile Avatar */}
        <div className="flex items-center gap-2.5">
          {/* Daily Streak Indicator */}
          <div
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-error-container/80 text-on-error-container shadow-xs animate-pulse-subtle"
            title={`${streakDays} Day Practice Streak`}
          >
            <span className="text-sm">🔥</span>
            <span className="font-label-md text-label-md font-bold">{streakDays}</span>
            <span className="font-label-sm text-label-sm text-error font-medium">d</span>
          </div>

          {/* Profile Avatar */}
          <Link
            href="/profile"
            className={`w-8 h-8 rounded-full overflow-hidden flex items-center justify-center transition-transform active:scale-95 ${
              currentTab === "profile"
                ? "ring-2 ring-primary ring-offset-1"
                : "border border-surface-container-high"
            }`}
            title="My Profile"
          >
            {user?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatar_url}
                alt={user.display_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-primary flex items-center justify-center text-on-primary">
                <span className="material-symbols-outlined text-[18px]">person</span>
              </div>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
};

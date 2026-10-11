"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export const BottomNav: React.FC = () => {
  const pathname = usePathname();

  const isHome = pathname === "/" || pathname === "/feed";
  const isMatrix = pathname === "/matrix" || pathname === "/stats";
  const isCreate = pathname === "/create" || pathname === "/add";
  const isLeaderboard = pathname === "/leaderboard" || pathname === "/ranking";
  const isProfile = pathname === "/profile" || pathname === "/me";

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none flex justify-center pb-safe">
      <div className="w-full max-w-[480px] bg-surface-container-lowest/95 backdrop-blur-xl border-t border-surface-container-high/60 shadow-[0_-2px_12px_rgba(0,0,0,0.04)] pointer-events-auto">
        <div className="h-16 px-2 flex items-center justify-around">
          {/* 1. Home */}
          <Link
            href="/"
            className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] transition-colors gap-0.5 ${
              isHome ? "text-primary font-bold" : "text-secondary hover:text-on-surface font-medium"
            }`}
          >
            <span
              className="material-symbols-outlined text-[24px]"
              style={isHome ? { fontVariationSettings: "'FILL' 1" } : {}}
            >
              home
            </span>
            <span className="font-label-sm text-label-sm">Home</span>
          </Link>

          {/* 2. Matrix (Personal Performance) */}
          <Link
            href="/matrix"
            className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] transition-colors gap-0.5 ${
              isMatrix ? "text-primary font-bold" : "text-secondary hover:text-on-surface font-medium"
            }`}
          >
            <span
              className="material-symbols-outlined text-[24px]"
              style={isMatrix ? { fontVariationSettings: "'FILL' 1" } : {}}
            >
              bar_chart
            </span>
            <span className="font-label-sm text-label-sm">Matrix</span>
          </Link>

          {/* 3. Add Question (+) Prominent Center Action */}
          <Link
            href="/create"
            className="flex items-center justify-center min-w-[52px] min-h-[52px] -mt-3 group"
            title="Create Question"
          >
            <div
              className={`w-[50px] h-[50px] rounded-full flex items-center justify-center shadow-md transition-transform duration-150 active:scale-95 ${
                isCreate
                  ? "bg-primary text-on-primary ring-4 ring-primary-fixed"
                  : "bg-primary-container text-on-primary hover:bg-primary shadow-sm"
              }`}
            >
              <span className="material-symbols-outlined text-[26px]">add</span>
            </div>
          </Link>

          {/* 4. Leaderboard */}
          <Link
            href="/leaderboard"
            className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] transition-colors gap-0.5 ${
              isLeaderboard ? "text-primary font-bold" : "text-secondary hover:text-on-surface font-medium"
            }`}
          >
            <span
              className="material-symbols-outlined text-[24px]"
              style={isLeaderboard ? { fontVariationSettings: "'FILL' 1" } : {}}
            >
              leaderboard
            </span>
            <span className="font-label-sm text-label-sm">Ranks</span>
          </Link>

          {/* 5. Profile */}
          <Link
            href="/profile"
            className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] transition-colors gap-0.5 ${
              isProfile ? "text-primary font-bold" : "text-secondary hover:text-on-surface font-medium"
            }`}
          >
            <span
              className="material-symbols-outlined text-[24px]"
              style={isProfile ? { fontVariationSettings: "'FILL' 1" } : {}}
            >
              person
            </span>
            <span className="font-label-sm text-label-sm">Profile</span>
          </Link>
        </div>
      </div>
    </nav>
  );
};

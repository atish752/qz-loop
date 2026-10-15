"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export const BottomNav: React.FC = () => {
  const pathname = usePathname();

  const isHome = pathname === "/" || pathname === "/home";
  const isCreate = pathname === "/create" || pathname === "/add";
  const isLoop = pathname === "/loop" || pathname === "/qzloop" || pathname === "/feed";
  const isSocial = pathname === "/social" || pathname.startsWith("/social");
  const isProfile = pathname === "/profile" || pathname === "/me";

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none flex justify-center pb-safe">
      <div className="w-full max-w-[480px] bg-surface-container-lowest/95 backdrop-blur-xl border-t border-surface-container-high/60 shadow-[0_-2px_12px_rgba(0,0,0,0.04)] pointer-events-auto">
        <div className="h-16 px-2 flex items-center justify-around">
          {/* 1. Home (Performance Matrix & Daily Study Dashboard) */}
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

          {/* 2. Plus / Create (Second Tab) */}
          <Link
            href="/create"
            className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] transition-colors gap-0.5 ${
              isCreate ? "text-primary font-bold" : "text-secondary hover:text-on-surface font-medium"
            }`}
          >
            <span
              className="material-symbols-outlined text-[24px]"
              style={isCreate ? { fontVariationSettings: "'FILL' 1" } : {}}
            >
              add_circle
            </span>
            <span className="font-label-sm text-label-sm">Create</span>
          </Link>

          {/* 3. Center Highlight: Qz Loop (Purple Background Main Highlight with Brand Icon) */}
          <Link
            href="/loop"
            className="flex flex-col items-center justify-center min-w-[56px] min-h-[56px] -mt-5 group"
            title="Qz Loop Reels"
          >
            <div
              className={`w-[54px] h-[54px] rounded-full flex items-center justify-center shadow-lg transition-all duration-200 active:scale-95 p-0.5 ${
                isLoop
                  ? "bg-gradient-to-tr from-primary to-[#8338ec] ring-4 ring-primary-fixed shadow-primary/30"
                  : "bg-gradient-to-tr from-primary to-[#7209b7] hover:shadow-primary/25 shadow-md"
              }`}
            >
              <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-primary border-2 border-white/20">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo.jpg"
                  alt="Qz Loop"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>
            </div>
            <span
              className={`font-label-sm text-[10px] tracking-tight mt-0.5 font-bold transition-colors ${
                isLoop ? "text-primary" : "text-secondary group-hover:text-on-surface"
              }`}
            >
              qz loop
            </span>
          </Link>

          {/* 4. Social (Chat & Friends) - Replaced Ranks */}
          <Link
            href="/social"
            className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] transition-colors gap-0.5 ${
              isSocial ? "text-primary font-bold" : "text-secondary hover:text-on-surface font-medium"
            }`}
          >
            <span
              className="material-symbols-outlined text-[24px]"
              style={isSocial ? { fontVariationSettings: "'FILL' 1" } : {}}
            >
              forum
            </span>
            <span className="font-label-sm text-label-sm">Social</span>
          </Link>

          {/* 5. Profile (with entry to Ranks / Leaderboard) */}
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

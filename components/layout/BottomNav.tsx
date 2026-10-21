"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppLanguage } from "@/lib/utils/i18n";
import { UserProfile } from "@/types/database";

export const BottomNav: React.FC = () => {
  const pathname = usePathname();
  const { t } = useAppLanguage();
  const [user, setUser] = useState<UserProfile | null>(null);

  const [incomingRequestsCount, setIncomingRequestsCount] = useState<number>(0);

  useEffect(() => {
    const checkUser = () => {
      if (typeof window !== "undefined") {
        const uid = localStorage.getItem("qz_user_id");
        if (uid) {
          const cached = localStorage.getItem("qz_auth_user");
          if (cached) {
            try {
              setUser(JSON.parse(cached));
            } catch {
              // ignore
            }
          }
          fetch(`/api/profile?userId=${encodeURIComponent(uid)}`)
            .then((r) => r.json())
            .then((d) => {
              if (d.success && d.user) setUser(d.user);
            })
            .catch(() => {});
        } else {
          setUser(null);
        }
      }
    };
    checkUser();
    window.addEventListener("qz_auth_changed", checkUser);
    return () => window.removeEventListener("qz_auth_changed", checkUser);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchIncomingRequests = () => {
      if (typeof window === "undefined") return;
      let uid = localStorage.getItem("qz_user_id");
      if (!uid || uid === "guest") {
        const match = document.cookie.match(/(?:^|;\s*)qz_user_id=([^;]+)/);
        if (match && match[1] && match[1] !== "guest") {
          uid = decodeURIComponent(match[1]);
        }
      }
      if (!uid || uid === "guest") {
        try {
          const cached = localStorage.getItem("qz_auth_user");
          if (cached) {
            const u = JSON.parse(cached);
            if (u?.id && u.id !== "guest") uid = u.id;
          }
        } catch {}
      }
      if (!uid || uid === "guest") {
        if (isMounted) setIncomingRequestsCount(0);
        return;
      }
      fetch(`/api/friends?userId=${encodeURIComponent(uid)}`)
        .then((r) => r.json())
        .then((d) => {
          if (!isMounted) return;
          if (d.success && Array.isArray(d.friends)) {
            const count = d.friends.filter(
              (f: any) => f.status === "pending_incoming" || f.status === "request_received"
            ).length;
            setIncomingRequestsCount(count);
          }
        })
        .catch(() => {});
    };

    fetchIncomingRequests();
    const interval = setInterval(fetchIncomingRequests, 4000);
    window.addEventListener("qz_friends_changed", fetchIncomingRequests);
    window.addEventListener("qz_auth_changed", fetchIncomingRequests);
    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener("qz_friends_changed", fetchIncomingRequests);
      window.removeEventListener("qz_auth_changed", fetchIncomingRequests);
    };
  }, []);

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
            <span className="font-label-sm text-label-sm">{t.navHome}</span>
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
            <span className="font-label-sm text-label-sm">{t.navCreate}</span>
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
            className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] transition-colors gap-0.5 relative ${
              isSocial ? "text-primary font-bold" : "text-secondary hover:text-on-surface font-medium"
            }`}
          >
            <div className="relative flex items-center justify-center">
              <span
                className="material-symbols-outlined text-[24px]"
                style={isSocial ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                forum
              </span>
              {incomingRequestsCount > 0 && (
                <span className="absolute -top-1 -right-2.5 min-w-[17px] h-[17px] px-1 bg-red-600 text-white text-[10px] font-black rounded-full flex items-center justify-center ring-2 ring-surface shadow-xs animate-pulse">
                  {incomingRequestsCount > 9 ? "9+" : incomingRequestsCount}
                </span>
              )}
            </div>
            <span className="font-label-sm text-label-sm">{t.navSocial}</span>
          </Link>

          {/* 5. Profile (with uploaded photo in circular cutout if signed in, or default icon) */}
          <Link
            href="/profile"
            className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] transition-colors gap-0.5 ${
              isProfile ? "text-primary font-bold" : "text-secondary hover:text-on-surface font-medium"
            }`}
          >
            {user?.avatar_url ? (
              <div
                className={`w-6 h-6 rounded-full overflow-hidden border transition-all ${
                  isProfile
                    ? "ring-2 ring-primary border-transparent shadow-xs"
                    : "border-surface-container-high opacity-85 hover:opacity-100"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={user.avatar_url}
                  alt={user.display_name || "Profile"}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <span
                className="material-symbols-outlined text-[24px]"
                style={isProfile ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                person
              </span>
            )}
            <span className="font-label-sm text-label-sm">{t.navProfile}</span>
          </Link>
        </div>
      </div>
    </nav>
  );
};

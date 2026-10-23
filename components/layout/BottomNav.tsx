"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAppLanguage } from "@/lib/utils/i18n";
import { UserProfile } from "@/types/database";

export const BottomNav: React.FC = () => {
  const pathname = usePathname();
  const { t, lang } = useAppLanguage();
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

  const router = useRouter();
  const isHome = pathname === "/" || pathname === "/home";
  const isCreate = pathname === "/create" || pathname === "/add";
  const isLoop = pathname === "/loop" || pathname === "/qzloop" || pathname === "/feed";
  const isSocial = pathname === "/social" || pathname.startsWith("/social");
  const isProfile = pathname === "/profile" || pathname === "/me";

  const [showLeaveConfirmation, setShowLeaveConfirmation] = useState<boolean>(false);
  const [pendingTargetHref, setPendingTargetHref] = useState<string>("");
  const [pendingTargetLabel, setPendingTargetLabel] = useState<string>("");

  const handleTabClick = (e: React.MouseEvent, targetHref: string, tabLabel: string) => {
    const isLoopActive =
      (pathname === "/loop" || pathname === "/qzloop" || pathname === "/feed") &&
      typeof window !== "undefined" &&
      sessionStorage.getItem("qz_loop_is_active") === "true";

    if (targetHref === "/loop" || targetHref === "/qzloop" || targetHref === "/feed") {
      if (isLoop) {
        e.preventDefault();
        return;
      }
      // Note: sessionStorage.setItem("qz_loop_is_active", "true") is only set by QuizLoopContainer when user clicks Start Qz Loop
      router.push(targetHref);
      return;
    }

    if (isLoopActive) {
      e.preventDefault();
      setPendingTargetHref(targetHref);
      setPendingTargetLabel(tabLabel);
      setShowLeaveConfirmation(true);
      return;
    }

    router.push(targetHref);
  };

  const handleConfirmLeave = () => {
    setShowLeaveConfirmation(false);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("qz_loop_is_active");
      sessionStorage.removeItem("qz_loop_cached_questions");
      sessionStorage.removeItem("qz_loop_active_question_id");
      sessionStorage.removeItem("qz_loop_answered_records");
      sessionStorage.removeItem("qz_last_loop_index");
      window.dispatchEvent(new CustomEvent("qz_leave_quiz_loop"));
    }
    if (pendingTargetHref) {
      router.push(pendingTargetHref);
      setPendingTargetHref("");
      setPendingTargetLabel("");
    }
  };

  const handleCancelLeave = () => {
    setShowLeaveConfirmation(false);
    setPendingTargetHref("");
    setPendingTargetLabel("");
  };

  return (
    <>
      <nav
        data-no-swipe="true"
        style={{ touchAction: "none", overscrollBehavior: "none" }}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        className="fixed bottom-0 left-0 right-0 z-[100] pointer-events-none flex justify-center select-none"
      >
        <div className="w-full max-w-[480px] bg-surface-container-lowest/95 backdrop-blur-xl border-t border-surface-container-high/60 shadow-[0_-2px_12px_rgba(0,0,0,0.04)] pointer-events-auto touch-manipulation pb-safe">
          <div className="h-16 px-2 flex items-center justify-around">
            {/* 1. Home (Performance Matrix & Daily Study Dashboard) */}
            <Link
              href="/"
              onClick={(e) => handleTabClick(e, "/", t.navHome || "Home")}
              data-no-swipe="true"
              className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] transition-colors gap-0.5 cursor-pointer ${
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
              onClick={(e) => handleTabClick(e, "/create", t.navCreate || "Create")}
              data-no-swipe="true"
              className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] transition-colors gap-0.5 cursor-pointer ${
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
              onClick={(e) => handleTabClick(e, "/loop", "Qz Loop")}
              data-no-swipe="true"
              className="flex flex-col items-center justify-center min-w-[56px] min-h-[56px] -mt-5 group cursor-pointer"
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
              onClick={(e) => handleTabClick(e, "/social", t.navSocial || "Social")}
              data-no-swipe="true"
              className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] transition-colors gap-0.5 relative cursor-pointer ${
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
              onClick={(e) => handleTabClick(e, "/profile", t.navProfile || "Profile")}
              data-no-swipe="true"
              className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] transition-colors gap-0.5 cursor-pointer ${
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

      {/* Leave Quiz Loop Confirmation Dialog */}
      {showLeaveConfirmation && (
        <div
          data-no-swipe="true"
          onClick={handleCancelLeave}
          className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150 select-text pointer-events-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-surface-container-lowest rounded-2xl p-5 shadow-2xl border border-surface-container-high/60 flex flex-col gap-4 text-center animate-in zoom-in-95 duration-150"
          >
            <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-600 mx-auto flex items-center justify-center">
              <span className="material-symbols-outlined text-[28px]">logout</span>
            </div>

            <div>
              <h3 className="font-bold text-on-surface text-base">
                {lang === "hi" ? "क्विज़ लूप छोड़ें?" : "Leave Quiz Loop?"}
              </h3>
              <p className="text-xs text-secondary mt-1.5 leading-relaxed">
                {lang === "hi"
                  ? `आपका वर्तमान अभ्यास सत्र समाप्त हो जाएगा। क्या आप उत्तर देना रोककर ${pendingTargetLabel} पर जाना चाहते हैं?`
                  : `Your current practice session will end. Stop answering and switch to the ${pendingTargetLabel || "selected"} tab?`}
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                onClick={handleConfirmLeave}
                className="w-full py-2.5 rounded-xl bg-primary text-on-primary font-bold text-xs shadow-sm hover:bg-primary-container active:scale-[0.99] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>{lang === "hi" ? "छोड़ें और जाएं" : "Confirm & Leave"}</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>

              <button
                type="button"
                onClick={handleCancelLeave}
                className="w-full py-2 text-xs text-secondary hover:text-on-surface font-semibold transition-colors cursor-pointer"
              >
                {t.cancel || "Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

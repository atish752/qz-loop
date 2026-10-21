"use client";

import React, { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Global Authentication Synchronizer
 * Guarantees 100% live synchronization between Supabase OAuth sessions,
 * secure HTTP cookies, and client localStorage.
 */
export const AuthSync: React.FC = () => {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Purge any stale needs_username flag for returning / existing users
    if (localStorage.getItem("qz_just_signed_up") !== "true") {
      localStorage.removeItem("qz_needs_username");
    }

    // 1. Cookie-to-LocalStorage Recovery
    const syncFromCookie = () => {
      const match = document.cookie.match(/(?:^|;\s*)qz_user_id=([^;]+)/);
      const cookieUid = match ? decodeURIComponent(match[1]) : null;
      const localUid = localStorage.getItem("qz_user_id");

      if (cookieUid && !localUid) {
        localStorage.setItem("qz_user_id", cookieUid);
        fetch(`/api/profile?userId=${encodeURIComponent(cookieUid)}`)
          .then((r) => r.json())
          .then((d) => {
            if (d.success && d.user) {
              localStorage.setItem("qz_auth_user", JSON.stringify(d.user));
              const hasCustomHandle =
                Boolean(d.user.username) &&
                !d.user.username.startsWith("aspirant_") &&
                d.user.username.length >= 3;
              const isAlreadyComplete =
                Boolean(d.user.onboarding_completed) ||
                hasCustomHandle ||
                localStorage.getItem("qz_onboarded_user_id") === d.user.id ||
                localStorage.getItem(`qz_onboarded_${d.user.id}`) === "true";

              if (isAlreadyComplete) {
                localStorage.setItem("qz_onboarding_completed", "true");
                localStorage.setItem("qz_details_submitted", "true");
                localStorage.setItem(`qz_onboarded_${d.user.id}`, "true");
                localStorage.setItem("qz_onboarded_user_id", d.user.id);
                localStorage.removeItem("qz_needs_username");
              } else if (localStorage.getItem("qz_just_signed_up") === "true") {
                localStorage.setItem("qz_needs_username", "true");
              } else {
                localStorage.removeItem("qz_needs_username");
              }
              window.dispatchEvent(
                new CustomEvent("qz_auth_changed", { detail: { user: d.user } })
              );
            }
          })
          .catch(() => {});
      }
    };

    syncFromCookie();

    // 2. Supabase Live Session Bridge
    const supabase = createClient();
    if (!supabase) return;

    // Check existing active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const localUid = localStorage.getItem("qz_user_id");
        if (!localUid || localUid !== session.user.id) {
          localStorage.setItem("qz_user_id", session.user.id);
          document.cookie = `qz_user_id=${session.user.id}; path=/; max-age=2592000; SameSite=Lax`;

          fetch(`/api/profile?userId=${encodeURIComponent(session.user.id)}`)
            .then((r) => r.json())
            .then((d) => {
              if (d.success && d.user) {
                localStorage.setItem("qz_auth_user", JSON.stringify(d.user));
                const hasCustomHandle =
                  Boolean(d.user.username) &&
                  !d.user.username.startsWith("aspirant_") &&
                  d.user.username.length >= 3;
                const isAlreadyComplete =
                  Boolean(d.user.onboarding_completed) ||
                  hasCustomHandle ||
                  localStorage.getItem("qz_onboarded_user_id") === d.user.id ||
                  localStorage.getItem(`qz_onboarded_${d.user.id}`) === "true";

                if (isAlreadyComplete) {
                  localStorage.setItem("qz_onboarding_completed", "true");
                  localStorage.setItem("qz_details_submitted", "true");
                  localStorage.setItem(`qz_onboarded_${d.user.id}`, "true");
                  localStorage.setItem("qz_onboarded_user_id", d.user.id);
                  localStorage.removeItem("qz_needs_username");
                } else if (localStorage.getItem("qz_just_signed_up") === "true") {
                  localStorage.setItem("qz_needs_username", "true");
                } else {
                  localStorage.removeItem("qz_needs_username");
                }
                window.dispatchEvent(
                  new CustomEvent("qz_auth_changed", { detail: { user: d.user } })
                );
              }
            })
            .catch(() => {});
        }
      }
    });

    // Listen to real-time auth events (e.g. OAuth sign-in complete, token refresh, sign-out)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") && session?.user) {
        localStorage.setItem("qz_user_id", session.user.id);
        document.cookie = `qz_user_id=${session.user.id}; path=/; max-age=2592000; SameSite=Lax`;

        fetch(`/api/profile?userId=${encodeURIComponent(session.user.id)}`)
          .then((r) => r.json())
          .then((d) => {
            if (d.success && d.user) {
              localStorage.setItem("qz_auth_user", JSON.stringify(d.user));
              const hasCustomHandle =
                Boolean(d.user.username) &&
                !d.user.username.startsWith("aspirant_") &&
                d.user.username.length >= 3;
              const isAlreadyComplete =
                Boolean(d.user.onboarding_completed) ||
                hasCustomHandle ||
                localStorage.getItem("qz_onboarded_user_id") === d.user.id ||
                localStorage.getItem(`qz_onboarded_${d.user.id}`) === "true";

              if (isAlreadyComplete) {
                localStorage.setItem("qz_onboarding_completed", "true");
                localStorage.setItem("qz_details_submitted", "true");
                localStorage.setItem(`qz_onboarded_${d.user.id}`, "true");
                localStorage.setItem("qz_onboarded_user_id", d.user.id);
                localStorage.removeItem("qz_needs_username");
                localStorage.removeItem("qz_just_signed_up");
              } else if (localStorage.getItem("qz_just_signed_up") === "true") {
                localStorage.setItem("qz_needs_username", "true");
              } else {
                localStorage.removeItem("qz_needs_username");
              }
              window.dispatchEvent(
                new CustomEvent("qz_auth_changed", { detail: { user: d.user } })
              );
            }
          })
          .catch(() => {});
      } else if (event === "SIGNED_OUT") {
        localStorage.removeItem("qz_user_id");
        localStorage.removeItem("qz_auth_user");
        localStorage.removeItem("qz_onboarding_completed");
        localStorage.removeItem("qz_details_submitted");
        document.cookie = "qz_user_id=; path=/; max-age=0; SameSite=Lax";
        window.dispatchEvent(
          new CustomEvent("qz_auth_changed", { detail: { user: null } })
        );
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return null;
};

"use client";

import React, { useState, useEffect } from "react";
import { getAuthorEmoji, getAuthorFallbackUsername } from "@/lib/utils/authorEmoji";
import { useAppLanguage } from "@/lib/utils/i18n";

interface AuthorModalProps {
  authorName: string;
  authorAvatar?: string;
  authorUsername?: string;
  authorId?: string;
  targetExam?: string;
  questionsCount?: number;
  isOpen: boolean;
  onClose: () => void;
}

export const AuthorModal: React.FC<AuthorModalProps> = ({
  authorName,
  authorAvatar,
  authorUsername,
  authorId,
  targetExam = "SSC CGL / RRB NTPC",
  questionsCount,
  isOpen,
  onClose,
}) => {
  const { lang, t } = useAppLanguage();
  const [resolvedUsername, setResolvedUsername] = useState<string>(
    authorUsername || getAuthorFallbackUsername(authorName, authorId)
  );
  const [publishedCount, setPublishedCount] = useState<number>(questionsCount ?? 1);
  const [examName, setExamName] = useState<string>(targetExam);
  const [isFollowing, setIsFollowing] = useState<boolean>(false);

  const emoji = getAuthorEmoji(authorId || authorName);

  useEffect(() => {
    if (isOpen && authorId) {
      // Fetch live author details
      fetch(`/api/profile?userId=${encodeURIComponent(authorId)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.user) {
            if (data.user.username) setResolvedUsername(data.user.username);
            if (data.user.target_exam) setExamName(data.user.target_exam);
          }
        })
        .catch(() => {});

      // Fetch live author question count
      fetch(`/api/questions/author?authorId=${encodeURIComponent(authorId)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && typeof data.count === "number") {
            setPublishedCount(data.count);
          }
        })
        .catch(() => {});
    }
  }, [isOpen, authorId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-xs bg-surface-container-lowest rounded-3xl p-5 shadow-2xl border border-surface-container-high/60 flex flex-col items-center text-center gap-3.5 animate-in zoom-in-95 duration-150">
        {/* Aspirant Emoji Circle Avatar */}
        <div className="relative">
          <div className="w-18 h-18 rounded-full bg-gradient-to-br from-primary-fixed via-primary-container/20 to-secondary-fixed border-3 border-surface-container-lowest shadow-md flex items-center justify-center text-3xl select-none">
            {emoji}
          </div>
          <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs text-xs font-bold" title="Verified Aspirant Contributor">
            ✓
          </span>
        </div>

        {/* Aspirant Name & Username */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1.5">
            <h3 className="font-bold text-lg text-on-surface">{authorName || "Aspirant Contributor"}</h3>
            <span className="material-symbols-outlined text-primary text-[18px]">verified</span>
          </div>
          <span className="text-xs font-mono font-bold text-primary mt-0.5">
            @{resolvedUsername}
          </span>
          <span className="text-[11px] text-secondary mt-1 font-medium px-2 py-0.5 rounded-full bg-surface-container">
            {examName} Aspirant
          </span>
        </div>

        {/* Aspirant Statistics: Published Questions & Community Accuracy */}
        <div className="w-full grid grid-cols-2 gap-2 bg-surface-container-low rounded-2xl p-3 border border-surface-container-high/40">
          <div className="flex flex-col items-center p-1">
            <span className="font-headline-sm text-lg font-black text-primary">
              {publishedCount}
            </span>
            <span className="text-[11px] font-semibold text-secondary mt-0.5">
              {lang === "hi" ? "प्रकाशित प्रश्न" : "Questions Published"}
            </span>
          </div>
          <div className="flex flex-col items-center p-1 border-l border-surface-container-high/50">
            <span className="font-headline-sm text-lg font-black text-tertiary">
              88%
            </span>
            <span className="text-[11px] font-semibold text-secondary mt-0.5">
              {lang === "hi" ? "सटीकता दर" : "Solve Accuracy"}
            </span>
          </div>
        </div>

        {/* Action Buttons: Follow Aspirant & Close */}
        <div className="w-full flex flex-col gap-2 pt-1">
          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined" && !localStorage.getItem("qz_user_id")) {
                window.dispatchEvent(
                  new CustomEvent("open_auth_modal", {
                    detail: { reason: "Sign in required to follow question authors", mode: "signup" },
                  })
                );
                return;
              }
              setIsFollowing((prev) => !prev);
            }}
            className={`w-full py-2.5 rounded-xl font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 ${
              isFollowing
                ? "bg-surface-container text-on-surface"
                : "bg-primary text-on-primary hover:bg-primary-container"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">
              {isFollowing ? "check" : "person_add"}
            </span>
            <span>{isFollowing ? (lang === "hi" ? "फॉलो कर रहे हैं" : "Following") : (lang === "hi" ? "फॉलो करें" : "Follow Aspirant")}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 rounded-xl text-secondary hover:text-on-surface text-xs font-semibold hover:bg-surface-container transition-colors"
          >
            {t.cancel || "Close"}
          </button>
        </div>
      </div>
    </div>
  );
};

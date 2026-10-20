"use client";

import React, { useState } from "react";
import { Question } from "@/types/database";
import { useAppLanguage } from "@/lib/utils/i18n";

interface SuggestionModalProps {
  question: Question;
  isOpen: boolean;
  onClose: () => void;
}

export const SuggestionModal: React.FC<SuggestionModalProps> = ({
  question,
  isOpen,
  onClose,
}) => {
  const { t } = useAppLanguage();
  const [suggestionText, setSuggestionText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suggestionText.trim()) return;

    setIsSubmitting(true);
    setError(null);

    const currentUid = typeof window !== "undefined" ? localStorage.getItem("qz_user_id") : null;
    const authorId = question.author_id || "user-1";

    try {
      const messageBody = `💡 Correction / Suggestion for Question: "${question.question_text.slice(0, 80)}...":\n\n${suggestionText.trim()}`;

      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromUserId: currentUid || "user-current",
          toUserId: authorId,
          text: messageBody,
          questionId: question.id,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
        setTimeout(() => {
          setSubmitted(false);
          setSuggestionText("");
          onClose();
        }, 2200);
      } else {
        setError(data.error || "Failed to send suggestion");
      }
    } catch {
      setError("Network issue while sending suggestion.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-surface-container-lowest rounded-3xl p-5 shadow-2xl border border-surface-container-high/60 flex flex-col gap-3 animate-in zoom-in-95">
        <div className="flex items-center justify-between pb-2 border-b border-surface-container-high/40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary-container text-on-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[18px]">rate_review</span>
            </div>
            <div>
              <h3 className="font-bold text-on-surface text-sm">
                {t.suggestionModalTitle || "Suggest Correction to Creator"}
              </h3>
              <p className="text-[11px] text-secondary">
                Author: {question.author_name || "Rahul S."}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-secondary hover:text-on-surface hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {submitted ? (
          <div className="py-6 flex flex-col items-center text-center gap-2 animate-in fade-in">
            <span className="material-symbols-outlined text-[36px] text-emerald-500">check_circle</span>
            <p className="text-xs font-bold text-on-surface">
              {t.suggestionSentSuccess || "Suggestion sent directly to the creator! Thank you for keeping Qz Loop accurate."}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <p className="text-xs text-secondary leading-relaxed">
              {t.suggestionModalDesc || "Found a mistake in the question, options, or solution? Write it down and it will go directly to the creator's social lounge."}
            </p>

            <textarea
              required
              rows={4}
              value={suggestionText}
              onChange={(e) => setSuggestionText(e.target.value)}
              placeholder={t.suggestionPlaceholder || "e.g. In Option B, crossing over occurs in Pachytene instead of Diplotene because..."}
              className="w-full p-3 rounded-xl bg-surface-container-low border border-surface-container-high/60 text-xs text-on-surface placeholder:text-secondary focus:outline-none focus:border-primary resize-none"
            />

            {error && (
              <p className="text-xs text-error font-medium">{error}</p>
            )}

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 rounded-xl bg-surface-container font-semibold text-xs text-on-surface hover:bg-surface-container-high transition-colors"
              >
                {t.cancel || "Cancel"}
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !suggestionText.trim()}
                className="px-4 py-2 rounded-xl bg-primary text-on-primary font-bold text-xs shadow-sm hover:bg-primary-container active:scale-95 transition-all disabled:opacity-40"
              >
                {isSubmitting ? (t.loading || "Sending...") : (t.sendSuggestion || "Send Suggestion")}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

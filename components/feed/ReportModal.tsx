"use client";

import React, { useState } from "react";

interface ReportModalProps {
  questionId: string;
  isOpen: boolean;
  onClose: () => void;
  onReportSubmitted: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  questionId,
  isOpen,
  onClose,
  onReportSubmitted,
}) => {
  const [reason, setReason] = useState<string>("incorrect_answer");
  const [details, setDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/questions/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, reason, details }),
      });
      if (res.ok) {
        setSubmitted(true);
        setTimeout(() => {
          setSubmitted(false);
          onReportSubmitted();
          onClose();
        }, 1200);
      }
    } catch {
      // Handled
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/40 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-sm bg-surface-container-lowest rounded-2xl p-5 shadow-xl border border-surface-container-high/50 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-error text-[22px]">flag</span>
            <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Report Question</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-secondary transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {submitted ? (
          <div className="py-6 flex flex-col items-center justify-center text-center gap-2">
            <span className="material-symbols-outlined text-tertiary text-[40px]">check_circle</span>
            <p className="font-label-md text-label-md text-on-surface font-semibold">Report Received</p>
            <p className="font-body-sm text-body-sm text-secondary">
              Our review moderators will verify this question.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <label className="font-label-md text-label-md text-secondary">Reason for report</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-surface-container-low border border-surface-container-high text-on-surface font-body-md focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="incorrect_answer">Incorrect answer or formula</option>
              <option value="duplicate">Duplicate question already exists</option>
              <option value="misleading">Misleading or ambiguous wording</option>
              <option value="offensive">Abusive or inappropriate text</option>
              <option value="other">Other issue</option>
            </select>

            <label className="font-label-md text-label-md text-secondary mt-1">Additional details (optional)</label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Explain what is wrong with this question..."
              rows={3}
              className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container-high text-on-surface font-body-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
            />

            <div className="flex items-center justify-end gap-2 mt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl font-label-md text-secondary hover:bg-surface-container transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-error text-on-error font-label-md hover:bg-error/90 active:scale-95 transition-all shadow-sm"
              >
                {isSubmitting ? "Submitting..." : "Submit Report"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

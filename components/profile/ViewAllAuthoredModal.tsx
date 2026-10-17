"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Question } from "@/types/database";
import { useAppLanguage } from "@/lib/utils/i18n";
import { formatWhatsAppChallenge, openWhatsAppShare } from "@/lib/utils/whatsapp";

interface ViewAllAuthoredModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: Question[];
  authorUsername?: string;
  onDeleteQuestion: (id: string) => void;
}

export const ViewAllAuthoredModal: React.FC<ViewAllAuthoredModalProps> = ({
  isOpen,
  onClose,
  questions,
  authorUsername = "aspirant",
  onDeleteQuestion,
}) => {
  const { lang, t } = useAppLanguage();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDelete = async (qId: string) => {
    const confirmText = t.deleteConfirm || "Are you sure you want to delete this question? This cannot be undone.";
    if (!window.confirm(confirmText)) return;

    setDeletingId(qId);
    setStatusMsg(null);
    try {
      const res = await fetch(`/api/questions/${encodeURIComponent(qId)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onDeleteQuestion(qId);
        setStatusMsg(lang === "hi" ? "प्रश्न सफलतापूर्वक हटा दिया गया" : "Question deleted successfully");
        setTimeout(() => setStatusMsg(null), 2500);
      } else {
        alert(data.error || "Failed to delete question");
      }
    } catch {
      alert("Network error while deleting question.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleShareWhatsApp = (q: Question) => {
    const text = formatWhatsAppChallenge({
      question: q,
      authorUsername,
      targetExam: q.subject_name || "General",
      language: q.language,
    });
    openWhatsAppShare(text);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-lg bg-surface-container-lowest rounded-3xl p-5 sm:p-6 shadow-2xl border border-surface-container-high/70 flex flex-col max-h-[90vh] animate-in zoom-in-95">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-surface-container-high/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary text-on-primary flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[20px]">edit_document</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-headline-sm text-base font-bold text-on-surface">
                  {t.allAuthoredModalTitle || "All Your Created Questions"}
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-primary-fixed text-primary text-[11px] font-bold">
                  {questions.length}
                </span>
              </div>
              <p className="text-[11px] text-secondary">
                {t.createdQuestionsSubtitle || "Manage, edit, or delete questions and view detailed attempt statistics"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-secondary hover:text-on-surface hover:bg-surface-container-high/60 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {statusMsg && (
          <div className="mt-2 p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px]">check_circle</span>
            <span>{statusMsg}</span>
          </div>
        )}

        {/* Scrollable Questions List */}
        <div className="flex-1 overflow-y-auto no-scrollbar py-3 flex flex-col gap-3">
          {questions.length === 0 ? (
            <div className="py-12 text-center text-secondary text-xs flex flex-col items-center gap-2">
              <span className="material-symbols-outlined text-[36px] text-primary/40">note_add</span>
              <p>{t.noAuthoredQuestions || "You haven't created any practice questions yet."}</p>
              <Link
                href="/create"
                onClick={onClose}
                className="mt-1 px-4 py-2 rounded-xl bg-primary text-on-primary font-bold text-xs shadow-xs"
              >
                + {t.createQuestionTitle || "Create New Question"}
              </Link>
            </div>
          ) : (
            questions.map((q) => {
              const accuracy = q.total_attempts > 0 ? Math.round((q.correct_attempts / q.total_attempts) * 100) : 0;
              const avgSpeed = q.total_attempts > 0 ? (q.total_time_ms / q.total_attempts / 1000).toFixed(1) + "s" : "--";

              return (
                <div
                  key={q.id}
                  className="p-3.5 rounded-2xl bg-surface-container-low border border-surface-container-high/50 flex flex-col gap-2.5 shadow-xs"
                >
                  {/* Badges & Metrics Row */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md bg-surface-container-high text-on-surface text-[10px] font-bold uppercase">
                        {q.subject_name || "General"}
                      </span>
                      {q.syllabus_tag && (
                        <span className="px-2 py-0.5 rounded-md bg-primary-fixed/50 text-primary text-[10px] font-bold">
                          {q.syllabus_tag}
                        </span>
                      )}
                      {q.pyq_info && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-900 dark:text-amber-200 text-[10px] font-bold">
                          {q.pyq_info}
                        </span>
                      )}
                      {q.hindi_question_text && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 text-[9px] font-bold">
                          Bilingual
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] font-medium bg-surface-container px-2.5 py-1 rounded-xl">
                      <span title="Total student attempts" className="text-secondary">
                        <strong className="text-on-surface">{q.total_attempts}</strong> {t.attempts}
                      </span>
                      <span className="text-secondary/40">·</span>
                      <span title="Student accuracy" className="text-tertiary font-bold">
                        {accuracy}% {t.accuracy}
                      </span>
                      <span className="text-secondary/40">·</span>
                      <span title="Average response speed" className="text-secondary">
                        ⏱️ <strong className="text-on-surface">{avgSpeed}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Question Text */}
                  <p className="text-xs font-semibold text-on-surface leading-relaxed">
                    {q.question_text}
                  </p>

                  {/* Actions Row */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-surface-container-high/40">
                    <button
                      type="button"
                      onClick={() => handleShareWhatsApp(q)}
                      className="px-2.5 py-1.5 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#128C7E] dark:text-[#25D366] font-bold text-xs flex items-center gap-1 transition-colors"
                      title="Share to WhatsApp study group"
                    >
                      <span className="material-symbols-outlined text-[15px]">chat</span>
                      <span>{t.whatsAppChallenge || "WhatsApp"}</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <Link
                        href={`/create?edit=${q.id}`}
                        onClick={onClose}
                        className="px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-primary font-bold text-xs flex items-center gap-1 transition-colors"
                        title="Edit question statement, choices or solution"
                      >
                        <span className="material-symbols-outlined text-[15px]">edit</span>
                        <span>{t.editQuestion || "Edit"}</span>
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleDelete(q.id)}
                        disabled={deletingId === q.id}
                        className="px-3 py-1.5 rounded-xl bg-error-container/40 hover:bg-error-container text-error font-bold text-xs flex items-center gap-1 transition-colors disabled:opacity-50"
                        title="Delete question permanently"
                      >
                        <span className="material-symbols-outlined text-[15px]">delete</span>
                        <span>{deletingId === q.id ? "..." : (t.delete || "Delete")}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-surface-container-high/40 flex items-center justify-between">
          <Link
            href="/create"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-primary text-on-primary font-bold text-xs shadow-xs hover:bg-primary-container transition-all flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>{t.createQuestionTitle || "Create New Question"}</span>
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-bold text-xs transition-colors"
          >
            {t.done || "Done"}
          </button>
        </div>
      </div>
    </div>
  );
};

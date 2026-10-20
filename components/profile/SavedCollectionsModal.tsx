"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Question, QuestionCollection } from "@/types/database";
import { useAppLanguage } from "@/lib/utils/i18n";

interface PopulatedCollection extends QuestionCollection {
  questions?: Question[];
}

interface SavedCollectionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SavedCollectionsModal: React.FC<SavedCollectionsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { lang, t } = useAppLanguage();
  const [collections, setCollections] = useState<PopulatedCollection[]>([]);
  const [activeCollectionId, setActiveCollectionId] = useState<string>("all");
  const [newCollectionName, setNewCollectionName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadCollections();
    }
  }, [isOpen]);

  const loadCollections = async () => {
    setIsLoading(true);
    try {
      const currentUid = typeof window !== "undefined" ? localStorage.getItem("qz_user_id") : null;
      const url = currentUid
        ? `/api/collections?includeQuestions=true&userId=${encodeURIComponent(currentUid)}`
        : "/api/collections?includeQuestions=true";
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && data.collections) {
        setCollections(data.collections);
      }
    } catch {
      // Handled
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollectionName.trim()) return;

    setIsCreating(true);
    try {
      const currentUid = typeof window !== "undefined" ? localStorage.getItem("qz_user_id") : null;
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUid || undefined,
          collectionName: newCollectionName.trim(),
          action: "create_only",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNewCollectionName("");
        loadCollections();
        setToastMsg(lang === "hi" ? "कलेक्शन बनाया गया! ✨" : "Collection created! ✨");
        setTimeout(() => setToastMsg(null), 2000);
      }
    } catch {
      // Handled
    } finally {
      setIsCreating(false);
    }
  };

  const handleRemoveQuestion = async (questionId: string, collectionName: string) => {
    try {
      const currentUid = typeof window !== "undefined" ? localStorage.getItem("qz_user_id") : null;
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUid || undefined,
          questionId,
          collectionName,
          action: "remove",
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCollections((prev) =>
          prev.map((col) => {
            if (col.name.toLowerCase() === collectionName.toLowerCase()) {
              return {
                ...col,
                question_ids: col.question_ids.filter((id) => id !== questionId),
                questions: (col.questions || []).filter((q) => q.id !== questionId),
              };
            }
            return col;
          })
        );
        setToastMsg(lang === "hi" ? "प्रश्न संग्रह से हटाया गया" : "Removed from collection");
        setTimeout(() => setToastMsg(null), 2000);
      }
    } catch {
      // Handled
    }
  };

  if (!isOpen) return null;

  // Compute displayed questions based on active collection
  let displayedQuestions: { question: Question; collectionName: string }[] = [];
  if (activeCollectionId === "all") {
    const seen = new Set<string>();
    collections.forEach((col) => {
      (col.questions || []).forEach((q) => {
        if (!seen.has(q.id)) {
          seen.add(q.id);
          displayedQuestions.push({ question: q, collectionName: col.name });
        }
      });
    });
  } else {
    const selected = collections.find((c) => c.id === activeCollectionId);
    if (selected) {
      (selected.questions || []).forEach((q) => {
        displayedQuestions.push({ question: q, collectionName: selected.name });
      });
    }
  }

  const totalSavedCount = collections.reduce((acc, col) => acc + (col.question_ids?.length || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-lg bg-surface-container-lowest rounded-3xl p-5 sm:p-6 shadow-2xl border border-surface-container-high/70 flex flex-col max-h-[90vh] animate-in zoom-in-95">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-surface-container-high/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary text-on-primary flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[20px]">bookmarks</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-headline-sm text-base font-bold text-on-surface">
                  {t.savedCollectionsTitle || "Saved Questions & Collections"}
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-primary-fixed text-primary text-[11px] font-bold">
                  {displayedQuestions.length}
                </span>
              </div>
              <p className="text-[11px] text-secondary">
                {t.savedQuestionsDesc || "Access bookmarked questions by playlist & collection"}
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

        {toastMsg && (
          <div className="mt-2 p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px]">check_circle</span>
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Collection Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-2.5 border-b border-surface-container-high/30">
          <button
            onClick={() => setActiveCollectionId("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              activeCollectionId === "all"
                ? "bg-primary text-on-primary shadow-xs"
                : "bg-surface-container-low text-secondary hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">apps</span>
            <span>{t.allSavedQuestions || "All Saved"}</span>
          </button>

          {collections.map((col) => (
            <button
              key={col.id}
              onClick={() => setActiveCollectionId(col.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                activeCollectionId === col.id
                  ? "bg-primary text-on-primary shadow-xs"
                  : "bg-surface-container-low text-secondary hover:text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">folder</span>
              <span>{col.name}</span>
              <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]">
                {col.question_ids?.length || 0}
              </span>
            </button>
          ))}
        </div>

        {/* Inline Create Collection Form */}
        <form onSubmit={handleCreateCollection} className="flex items-center gap-2 pt-2 pb-1">
          <input
            type="text"
            value={newCollectionName}
            onChange={(e) => setNewCollectionName(e.target.value)}
            placeholder={t.newCollectionPlaceholder || "e.g. NEET Biology Notes, High-Yield PYQs..."}
            className="flex-1 px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container-high/60 text-xs text-on-surface focus:outline-none focus:border-primary"
          />
          <button
            type="submit"
            disabled={isCreating || !newCollectionName.trim()}
            className="px-3 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-primary font-bold text-xs transition-colors disabled:opacity-40 shrink-0 flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[15px]">add</span>
            <span>{t.createNewCollection || "New"}</span>
          </button>
        </form>

        {/* Question List */}
        <div className="flex-1 overflow-y-auto no-scrollbar py-2 flex flex-col gap-2.5">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-center gap-2">
              <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-secondary">{t.loading || "Loading..."}</p>
            </div>
          ) : displayedQuestions.length === 0 ? (
            <div className="py-12 text-center text-secondary text-xs flex flex-col items-center gap-2">
              <span className="material-symbols-outlined text-[36px] text-primary/40">bookmark_border</span>
              <p>{t.noSavedQuestions || "No questions saved in this collection yet."}</p>
              <p className="text-[11px] text-secondary/80">
                {t.browseAndSave || "Save questions from Qz Loop to practice them anytime!"}
              </p>
              <Link
                href="/loop"
                onClick={onClose}
                className="mt-1 px-4 py-2 rounded-xl bg-primary text-on-primary font-bold text-xs shadow-xs"
              >
                {t.startQuiz || "Start Qz Loop 🚀"}
              </Link>
            </div>
          ) : (
            displayedQuestions.map(({ question: q, collectionName }) => (
              <div
                key={`${collectionName}-${q.id}`}
                className="p-3 rounded-2xl bg-surface-container-low border border-surface-container-high/50 flex flex-col gap-2 shadow-xs"
              >
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
                    <span className="px-1.5 py-0.5 rounded bg-surface-container text-secondary text-[10px] font-semibold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">folder</span>
                      <span>{collectionName}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] text-secondary font-medium">
                    <span>{q.total_attempts} {t.attempts}</span>
                    <span>·</span>
                    <span className="text-tertiary font-bold">
                      {q.total_attempts > 0 ? Math.round((q.correct_attempts / q.total_attempts) * 100) : 0}% {t.accuracy}
                    </span>
                  </div>
                </div>

                <p className="text-xs font-semibold text-on-surface line-clamp-2 leading-relaxed">
                  {q.question_text}
                </p>

                <div className="flex items-center justify-between gap-2 pt-1 border-t border-surface-container-high/30">
                  <button
                    type="button"
                    onClick={() => handleRemoveQuestion(q.id, collectionName)}
                    className="text-xs text-error font-medium hover:underline flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[14px]">delete</span>
                    <span>{t.removeFromCollection || "Remove"}</span>
                  </button>

                  <Link
                    href={`/loop?q=${q.id}`}
                    onClick={onClose}
                    className="px-3 py-1.5 rounded-xl bg-primary text-on-primary font-bold text-xs flex items-center gap-1 shadow-xs hover:bg-primary-container transition-all"
                  >
                    <span className="material-symbols-outlined text-[15px]">play_arrow</span>
                    <span>{t.practiceInLoop || "Practice in Loop"}</span>
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-surface-container-high/40 flex items-center justify-between">
          <span className="text-xs text-secondary">
            {totalSavedCount} total bookmarks
          </span>
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

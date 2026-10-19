"use client";

import React, { useState, useEffect } from "react";
import { Question, QuestionCollection } from "@/types/database";
import { useAppLanguage } from "@/lib/utils/i18n";

interface SavePlaylistModalProps {
  question: Question;
  isOpen: boolean;
  onClose: () => void;
  onSavedChange?: (savedCollections: string[]) => void;
}

export const SavePlaylistModal: React.FC<SavePlaylistModalProps> = ({
  question,
  isOpen,
  onClose,
  onSavedChange,
}) => {
  const { t } = useAppLanguage();
  const [collections, setCollections] = useState<QuestionCollection[]>([]);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const currentUid = typeof window !== "undefined" ? localStorage.getItem("qz_user_id") : null;
      const url = currentUid ? `/api/collections?userId=${encodeURIComponent(currentUid)}` : "/api/collections";
      fetch(url)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.collections) {
            setCollections(data.collections);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Independent quick save (default "Saved Questions")
  const defaultCollection = collections.find(
    (c) => c.name.toLowerCase() === "saved questions"
  );
  const isSavedIndependently = defaultCollection?.question_ids.includes(question.id);

  const handleToggleIndependent = async () => {
    const action = isSavedIndependently ? "remove" : "save";
    try {
      setToastMsg(
        isSavedIndependently
          ? "Removed from Saved Questions"
          : "Saved independently to Quick Revision! ✨"
      );
      setTimeout(() => setToastMsg(null), 2200);

      // Optimistic collection update for instant 0ms visual responsiveness
      setCollections((prev) => {
        const hasDefault = prev.some((c) => c.name.toLowerCase() === "saved questions");
        let list = prev;
        if (!hasDefault) {
          list = [
            ...prev,
            {
              id: `col-default-${Date.now()}`,
              user_id: "",
              name: "Saved Questions",
              question_ids: [],
              created_at: new Date().toISOString(),
            },
          ];
        }
        return list.map((c) => {
          if (c.name.toLowerCase() === "saved questions") {
            const newIds = isSavedIndependently
              ? c.question_ids.filter((id) => id !== question.id)
              : [...c.question_ids, question.id];
            return { ...c, question_ids: newIds };
          }
          return c;
        });
      });

      if (onSavedChange) {
        onSavedChange(action === "save" ? ["Saved Questions"] : []);
      }

      const currentUid = typeof window !== "undefined" ? localStorage.getItem("qz_user_id") : null;
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUid || undefined,
          questionId: question.id,
          collectionName: "Saved Questions",
          action,
        }),
      });
      const data = await res.json();
      if (data.success && data.collections) {
        setCollections(data.collections);
        const activeNames = data.collections
          .filter((c: QuestionCollection) => c.question_ids.includes(question.id))
          .map((c: QuestionCollection) => c.name);
        if (onSavedChange) onSavedChange(activeNames);
      }
    } catch {
      // Handled
    }
  };

  const handleToggleCollection = async (collection: QuestionCollection) => {
    const isCurrentlySaved = collection.question_ids.includes(question.id);
    const action = isCurrentlySaved ? "remove" : "save";

    try {
      const updated = collections.map((c) => {
        if (c.id === collection.id) {
          const newIds = isCurrentlySaved
            ? c.question_ids.filter((id) => id !== question.id)
            : [...c.question_ids, question.id];
          return { ...c, question_ids: newIds };
        }
        return c;
      });
      setCollections(updated);

      const activeNames = updated
        .filter((c) => c.question_ids.includes(question.id))
        .map((c) => c.name);
      if (onSavedChange) onSavedChange(activeNames);

      setToastMsg(
        isCurrentlySaved
          ? `Removed from '${collection.name}'`
          : `Saved to '${collection.name}'! ✨`
      );
      setTimeout(() => setToastMsg(null), 2000);

      const currentUid = typeof window !== "undefined" ? localStorage.getItem("qz_user_id") : null;
      await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUid || undefined,
          questionId: question.id,
          collectionName: collection.name,
          action,
        }),
      });
    } catch {
      // Handled
    }
  };

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollectionName.trim()) return;

    setIsLoading(true);
    try {
      const currentUid = typeof window !== "undefined" ? localStorage.getItem("qz_user_id") : null;
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUid || undefined,
          questionId: question.id,
          collectionName: newCollectionName.trim(),
          action: "save",
        }),
      });
      const data = await res.json();
      if (data.success && data.collections) {
        setCollections(data.collections);
        const activeNames = data.collections
          .filter((c: QuestionCollection) => c.question_ids.includes(question.id))
          .map((c: QuestionCollection) => c.name);
        if (onSavedChange) onSavedChange(activeNames);
        setToastMsg(`Created and saved to '${newCollectionName.trim()}'! ✨`);
        setTimeout(() => setToastMsg(null), 2000);
        setNewCollectionName("");
      }
    } catch {
      // Handled
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-surface-container-lowest rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl border border-surface-container-high/60 flex flex-col max-h-[85vh] animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-surface-container-high/40">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[24px]">bookmark</span>
            <div>
              <h3 className="font-bold text-on-surface text-base">
                {t.saveToCollection || "Save to Playlist / Collection"}
              </h3>
              <p className="text-xs text-secondary">
                {t.savedQuestionsDesc || "Access bookmarked questions by playlist & collection"}
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

        {/* Toast confirmation */}
        {toastMsg && (
          <div className="my-2 p-2 rounded-xl bg-primary text-on-primary text-xs font-bold text-center animate-in fade-in">
            {toastMsg}
          </div>
        )}

        {/* Option 1: Quick Save Independently */}
        <div className="py-2.5">
          <button
            type="button"
            onClick={handleToggleIndependent}
            className={`w-full p-3 rounded-2xl flex items-center justify-between transition-all border ${
              isSavedIndependently
                ? "bg-primary-fixed/40 border-primary text-on-surface shadow-xs font-bold"
                : "bg-surface-container-low hover:bg-surface-container border-surface-container-high/50 text-on-surface"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  isSavedIndependently
                    ? "bg-primary text-on-primary"
                    : "bg-surface-container text-primary"
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {isSavedIndependently ? "bookmark_added" : "bookmark"}
                </span>
              </div>
              <div className="text-left min-w-0">
                <span className="font-bold text-xs block text-on-surface">
                  {t.quickSaveIndependent || "Quick Save Independently"}
                </span>
                <span className="text-[10px] text-secondary">
                  {t.savedIndependentDesc || "Saved directly to your private revision list"}
                </span>
              </div>
            </div>
            <div className="shrink-0 pl-2">
              <span
                className={`w-5 h-5 rounded-full border flex items-center justify-center text-[11px] font-bold ${
                  isSavedIndependently
                    ? "bg-primary border-primary text-on-primary"
                    : "border-secondary/40 text-transparent"
                }`}
              >
                ✓
              </span>
            </div>
          </button>
        </div>

        {/* Section title: Or add to a collection */}
        <div className="px-1 py-1 flex items-center justify-between">
          <span className="text-[11px] font-bold text-secondary uppercase tracking-wider">
            {t.existingCollections || "Your Collections"}
          </span>
          <span className="text-[10px] text-primary font-semibold">
            Instagram Reels Style
          </span>
        </div>

        {/* Existing Collections list */}
        <div className="flex-1 overflow-y-auto no-scrollbar py-1 flex flex-col gap-2 max-h-[220px]">
          {collections
            .filter((c) => c.name.toLowerCase() !== "saved questions")
            .map((col) => {
              const isSaved = col.question_ids.includes(question.id);
              return (
                <button
                  key={col.id}
                  onClick={() => handleToggleCollection(col)}
                  className={`w-full p-2.5 rounded-xl flex items-center justify-between text-left transition-all border ${
                    isSaved
                      ? "bg-primary-container/20 border-primary text-on-surface font-bold"
                      : "bg-surface-container-low hover:bg-surface-container border-surface-container-high/40 text-on-surface"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                        isSaved ? "bg-primary text-on-primary" : "bg-surface-container text-secondary"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {isSaved ? "check" : "folder"}
                      </span>
                    </div>
                    <div className="min-w-0 flex flex-col">
                      <span className="font-semibold text-xs truncate">{col.name}</span>
                      <span className="text-[10px] text-secondary truncate">
                        {col.question_ids.length} questions
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 pl-2">
                    <span
                      className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] font-bold ${
                        isSaved
                          ? "bg-primary border-primary text-on-primary"
                          : "border-secondary/40 text-transparent"
                      }`}
                    >
                      ✓
                    </span>
                  </div>
                </button>
              );
            })}
        </div>

        {/* Create New Collection Input */}
        <form onSubmit={handleCreateCollection} className="mt-3 pt-3 border-t border-surface-container-high/40">
          <label className="text-[11px] font-bold text-secondary uppercase tracking-wider block mb-1">
            + {t.newBtn || "New"} Collection / Playlist
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder={t.newCollectionPlaceholder || "e.g. Maths Formulas, Hard PYQs..."}
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container-high/60 text-xs text-on-surface placeholder:text-secondary focus:outline-none focus:border-primary"
            />
            <button
              type="submit"
              disabled={isLoading || !newCollectionName.trim()}
              className="px-3.5 py-2 rounded-xl bg-primary text-on-primary font-bold text-xs disabled:opacity-40 hover:bg-primary-container active:scale-95 transition-all shrink-0"
            >
              {isLoading ? "Saving..." : t.createAndSave || "Create & Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

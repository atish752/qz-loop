"use client";

import React, { useState, useEffect } from "react";
import { Question, QuestionCollection } from "@/types/database";

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
  const [collections, setCollections] = useState<QuestionCollection[]>([]);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetch("/api/collections")
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

  const handleToggleCollection = async (collection: QuestionCollection) => {
    const isCurrentlySaved = collection.question_ids.includes(question.id);
    const action = isCurrentlySaved ? "remove" : "save";

    try {
      // Optimistic update
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

      await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-surface-container-lowest rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl border border-surface-container-high/60 flex flex-col max-h-[85vh] animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-surface-container-high/40">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[24px]">bookmark</span>
            <div>
              <h3 className="font-bold text-on-surface text-base">Save to Playlist</h3>
              <p className="text-xs text-secondary">Organize practice questions into collections</p>
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

        {/* Existing Playlists */}
        <div className="flex-1 overflow-y-auto no-scrollbar py-2 flex flex-col gap-2 max-h-[260px]">
          {collections.map((col) => {
            const isSaved = col.question_ids.includes(question.id);
            return (
              <button
                key={col.id}
                onClick={() => handleToggleCollection(col)}
                className={`w-full p-3 rounded-xl flex items-center justify-between text-left transition-all border ${
                  isSaved
                    ? "bg-primary-container/20 border-primary text-on-surface"
                    : "bg-surface-container-low hover:bg-surface-container border-surface-container-high/30 text-on-surface"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
                      isSaved ? "bg-primary text-on-primary" : "bg-surface-container text-secondary"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {isSaved ? "check" : "folder"}
                    </span>
                  </div>
                  <div className="min-w-0 flex flex-col">
                    <span className="font-bold text-xs truncate">{col.name}</span>
                    <span className="text-[10px] text-secondary truncate">
                      {col.question_ids.length} questions
                      {col.description ? ` · ${col.description}` : ""}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 pl-2">
                  <span
                    className={`w-5 h-5 rounded-full border flex items-center justify-center text-[12px] font-bold ${
                      isSaved
                        ? "bg-primary border-primary text-on-primary"
                        : "border-secondary/50 text-transparent"
                    }`}
                  >
                    ✓
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Create New Playlist Input */}
        <form onSubmit={handleCreateCollection} className="mt-3 pt-3 border-t border-surface-container-high/40">
          <label className="text-[11px] font-bold text-secondary uppercase tracking-wider block mb-1">
            + New Collection / Playlist
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="e.g. Maths Tricks, Formulas, PYQs..."
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container-high/50 text-xs text-on-surface placeholder:text-secondary focus:outline-none focus:border-primary"
            />
            <button
              type="submit"
              disabled={isLoading || !newCollectionName.trim()}
              className="px-4 py-2 rounded-xl bg-primary text-on-primary font-bold text-xs disabled:opacity-40 hover:bg-primary-container active:scale-95 transition-all shrink-0"
            >
              {isLoading ? "Saving..." : "Create & Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

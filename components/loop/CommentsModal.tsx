"use client";

import React, { useState, useEffect } from "react";
import { Question, QuestionComment } from "@/types/database";

interface CommentsModalProps {
  question: Question;
  isOpen: boolean;
  onClose: () => void;
}

export const CommentsModal: React.FC<CommentsModalProps> = ({
  question,
  isOpen,
  onClose,
}) => {
  const [comments, setComments] = useState<QuestionComment[]>([]);
  const [newCommentText, setNewCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentUid, setCurrentUid] = useState<string | null>(null);

  const getEffectiveUid = (): string | null => {
    if (typeof window === "undefined") return null;
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
    return uid && uid !== "guest" ? uid : null;
  };

  useEffect(() => {
    const syncAuth = () => {
      const effUid = getEffectiveUid();
      setCurrentUid(effUid);
      if (effUid && typeof window !== "undefined") {
        const pending = sessionStorage.getItem(`qz_pending_comment_${question.id}`);
        if (pending && !newCommentText) {
          setNewCommentText(pending);
        }
      }
    };
    syncAuth();
    window.addEventListener("qz_auth_changed", syncAuth);
    return () => window.removeEventListener("qz_auth_changed", syncAuth);
  }, [question.id, newCommentText]);

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      const uid = getEffectiveUid();
      fetch(`/api/comments?questionId=${encodeURIComponent(question.id)}`, {
        headers: uid ? { "x-user-id": uid } : {},
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.comments) {
            setComments(data.comments);
          }
        })
        .catch(() => {});
    }
  }, [isOpen, question.id]);

  if (!isOpen) return null;

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    setErrorMessage(null);

    const uid = getEffectiveUid();
    if (!uid) {
      if (typeof window !== "undefined") {
        sessionStorage.setItem(`qz_pending_comment_${question.id}`, newCommentText.trim());
        window.dispatchEvent(
          new CustomEvent("open_auth_modal", {
            detail: {
              reason: "Sign in to post your shortcut or mnemonic",
              mode: "signup",
            },
          })
        );
      }
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": uid,
        },
        body: JSON.stringify({
          questionId: question.id,
          text: newCommentText.trim(),
          userId: uid,
        }),
      });
      const data = await res.json();
      if (data.success && data.comment) {
        setComments((prev) => [data.comment, ...prev]);
        setNewCommentText("");
        if (typeof window !== "undefined") {
          sessionStorage.removeItem(`qz_pending_comment_${question.id}`);
          window.dispatchEvent(
            new CustomEvent("qz_comment_added", {
              detail: { questionId: question.id },
            })
          );
        }
      } else {
        if (res.status === 401 || data.error?.toLowerCase().includes("sign in") || data.error?.toLowerCase().includes("unauthorized")) {
          if (typeof window !== "undefined") {
            sessionStorage.setItem(`qz_pending_comment_${question.id}`, newCommentText.trim());
            window.dispatchEvent(
              new CustomEvent("open_auth_modal", {
                detail: {
                  reason: "Sign in to post your shortcut or mnemonic",
                  mode: "signup",
                },
              })
            );
          }
        }
        setErrorMessage(data.error || "Failed to post comment. Please try again.");
      }
    } catch {
      setErrorMessage("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVoteComment = async (commentId: string) => {
    const uid = getEffectiveUid();
    if (!uid) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("open_auth_modal", {
            detail: {
              reason: "Sign in to upvote shortcuts",
              mode: "signup",
            },
          })
        );
      }
      return;
    }

    try {
      // Optimistic increment
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, likes_count: (c.likes_count || 0) + 1 } : c))
      );
      const res = await fetch("/api/comments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commentId,
          userId: currentUid,
        }),
      });
      const data = await res.json();
      if (data.success && data.comment) {
        setComments((prev) =>
          prev.map((c) => (c.id === commentId ? data.comment : c))
        );
      }
    } catch {
      // Handled optimistically
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-surface-container-lowest rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl border border-surface-container-high/60 flex flex-col max-h-[85vh] animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-surface-container-high/40">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[24px]">chat</span>
            <div>
              <h3 className="font-bold text-on-surface text-base">Shortcuts & Discussion</h3>
              <p className="text-xs text-secondary">{comments.length} aspirant insights</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-secondary hover:text-on-surface hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Comments Feed */}
        <div className="flex-1 overflow-y-auto no-scrollbar py-3 flex flex-col gap-3 min-h-[200px] max-h-[340px]">
          {comments.length > 0 ? (
            comments.map((cmt) => (
              <div key={cmt.id} className="flex gap-2.5 items-start text-left">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-primary-fixed shrink-0 border border-surface-container-high">
                  {cmt.user_avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={cmt.user_avatar}
                      alt={cmt.user_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-primary text-xs">
                      {cmt.user_name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex-1 bg-surface-container-low p-2.5 rounded-xl border border-surface-container-high/40">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-on-surface">{cmt.user_name}</span>
                    <button
                      type="button"
                      onClick={() => handleVoteComment(cmt.id)}
                      className="text-[10px] text-secondary flex items-center gap-1 hover:text-primary transition-colors bg-surface-container/80 hover:bg-surface-container px-2 py-0.5 rounded-full cursor-pointer active:scale-95"
                      title="Upvote shortcut / trick"
                    >
                      <span>👍</span>
                      <span className="font-bold">{cmt.likes_count || 0}</span>
                    </button>
                  </div>
                  <p className="text-xs text-on-surface leading-relaxed">{cmt.comment_text}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-xs text-secondary flex flex-col items-center gap-1.5">
              <span className="material-symbols-outlined text-[28px] text-primary">lightbulb</span>
              <p>Be the first to share a trick or mnemonic for this question!</p>
            </div>
          )}
        </div>

        {/* Error Feedback */}
        {errorMessage && (
          <div className="mb-2 p-2 rounded-xl bg-error-container/30 border border-error/30 text-error text-[11px] font-semibold flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[15px]">error</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Guest Sign-In Notice */}
        {!currentUid && (
          <div className="mb-2 p-2.5 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="material-symbols-outlined text-primary text-[18px]">lock</span>
              <p className="text-[11px] text-on-surface truncate font-medium">Sign in to post tips & mnemonics</p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.dispatchEvent(
                    new CustomEvent("open_auth_modal", {
                      detail: {
                        reason: "Sign in to post your shortcut or mnemonic",
                        mode: "signup",
                      },
                    })
                  );
                }
              }}
              className="px-2.5 py-1 bg-primary text-on-primary rounded-lg text-xs font-bold hover:bg-primary-container shrink-0 shadow-xs active:scale-95 transition-all"
            >
              Sign In
            </button>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handlePostComment} className="pt-2 border-t border-surface-container-high/40 flex items-center gap-2">
          <input
            type="text"
            placeholder="Share shortcut, tip, or formula..."
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            className="flex-1 px-3 py-2.5 rounded-xl bg-surface-container-low border border-surface-container-high/50 text-xs text-on-surface placeholder:text-secondary focus:outline-none focus:border-primary"
          />
          <button
            type="submit"
            disabled={isSubmitting || !newCommentText.trim()}
            className="px-4 py-2.5 rounded-xl bg-primary text-on-primary font-bold text-xs disabled:opacity-40 hover:bg-primary-container active:scale-95 transition-all"
          >
            {isSubmitting ? "..." : "Post"}
          </button>
        </form>
      </div>
    </div>
  );
};

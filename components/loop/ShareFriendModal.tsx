"use client";

import React, { useState, useEffect } from "react";
import { Question, FriendUser } from "@/types/database";
import { formatWhatsAppChallenge, openWhatsAppShare } from "@/lib/utils/whatsapp";

interface ShareFriendModalProps {
  question: Question;
  isOpen: boolean;
  onClose: () => void;
  onOpenChatWithFriend?: (friend: FriendUser) => void;
}

export const ShareFriendModal: React.FC<ShareFriendModalProps> = ({
  question,
  isOpen,
  onClose,
  onOpenChatWithFriend,
}) => {
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [sentMap, setSentMap] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [addFriendInput, setAddFriendInput] = useState("");
  const [addStatusMsg, setAddStatusMsg] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [shareToast, setShareToast] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const currentUid = typeof window !== "undefined" ? localStorage.getItem("qz_user_id") : null;
      const url = currentUid ? `/api/friends?userId=${encodeURIComponent(currentUid)}` : "/api/friends";
      const headers: Record<string, string> = currentUid ? { "x-user-id": currentUid } : {};
      fetch(url, { headers })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.friends) {
            setFriends(data.friends);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSendToFriend = async (friend: FriendUser) => {
    const currentUid = typeof window !== "undefined" ? localStorage.getItem("qz_user_id") : null;
    if (!currentUid) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("open_auth_modal", {
            detail: {
              reason: "Sign in required to send questions to study partners",
              mode: "signup",
            },
          })
        );
      }
      return;
    }

    try {
      setSentMap((prev) => ({ ...prev, [friend.id]: true }));
      setShareToast(`Question sent to ${friend.display_name}! 🚀`);
      setTimeout(() => setShareToast(null), 2500);

      await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": currentUid,
        },
        body: JSON.stringify({
          fromUserId: currentUid,
          toUserId: friend.id,
          text: `Check out this ${question.subject_name || "General"} question on Qz Loop: "${question.question_text.substring(0, 60)}..."`,
          questionId: question.id,
        }),
      });
    } catch {
      // Sent optimistic
    }
  };

  const handleSendFriendRequest = async () => {
    if (!addFriendInput.trim()) return;
    const currentUid = typeof window !== "undefined" ? localStorage.getItem("qz_user_id") : null;
    if (!currentUid) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("open_auth_modal", {
            detail: {
              reason: "Sign in required to connect with study friends",
              mode: "signup",
            },
          })
        );
      }
      return;
    }

    setIsAdding(true);
    setAddStatusMsg(null);
    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": currentUid,
        },
        body: JSON.stringify({
          target: addFriendInput.trim(),
          userId: currentUid,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAddStatusMsg(data.message || "Friend request sent!");
        setAddFriendInput("");
        if (data.friend) {
          setFriends((prev) => [data.friend, ...prev.filter((f) => f.id !== data.friend.id)]);
        }
      } else {
        setAddStatusMsg(data.error || "Could not add user");
      }
    } catch {
      setAddStatusMsg("Network error");
    } finally {
      setIsAdding(false);
    }
  };

  const copyToClipboard = (text: string) => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).catch(() => {
        fallbackCopy(text);
      });
      return true;
    }
    return fallbackCopy(text);
  };

  const fallbackCopy = (text: string): boolean => {
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand("copy");
      document.body.removeChild(textArea);
      return successful;
    } catch {
      return false;
    }
  };

  const handleCopyLink = () => {
    const url = typeof window !== "undefined" ? `${window.location.origin}/q/${question.id}` : "";
    copyToClipboard(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppShare = () => {
    const challengeText = formatWhatsAppChallenge({
      question,
      authorUsername: question.author_name?.toLowerCase().replace(/\s+/g, "_"),
      targetExam: question.subject_name || "NEET UG",
      language: question.language,
    });
    openWhatsAppShare(challengeText);
  };

  const handleCopyFormattedText = () => {
    const challengeText = formatWhatsAppChallenge({
      question,
      authorUsername: question.author_name?.toLowerCase().replace(/\s+/g, "_"),
      targetExam: question.subject_name || "NEET UG",
      language: question.language,
    });
    copyToClipboard(challengeText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const filteredFriends = friends.filter(
    (f) =>
      f.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.username && f.username.toLowerCase().includes(searchQuery.toLowerCase().replace(/^@/, ""))) ||
      f.target_exam.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-surface-container-lowest rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl border border-surface-container-high/60 flex flex-col max-h-[88vh] animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-surface-container-high/40">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[24px]">send</span>
            <div>
              <h3 className="font-bold text-on-surface text-base">Share Question</h3>
              <p className="text-xs text-secondary">Challenge peers & post to study groups</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-secondary hover:text-on-surface hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Share Confirmation Toast */}
        {shareToast && (
          <div className="my-2 p-2 rounded-xl bg-primary text-on-primary text-xs font-bold text-center animate-in fade-in flex items-center justify-center gap-1.5 shadow-sm">
            <span className="material-symbols-outlined text-[16px]">check_circle</span>
            <span>{shareToast}</span>
          </div>
        )}

        {/* 1-Click WhatsApp Viral Challenge Card (Top Priority for Indian Students) */}
        <div className="mt-3 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-emerald-600/5 to-surface-container-low border border-emerald-500/30 flex flex-col gap-2.5 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-xs">
                <span className="material-symbols-outlined text-[18px]">chat</span>
              </div>
              <div>
                <span className="text-xs font-bold text-on-surface flex items-center gap-1">
                  <span>WhatsApp Study Group Challenge</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-1.5 py-0.2 rounded font-bold">VIRAL</span>
                </span>
                <p className="text-[11px] text-secondary">Pre-formatted MCQ text with speed hook & instant link</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleWhatsAppShare}
              className="py-2.5 px-3 rounded-xl bg-[#25D366] hover:bg-[#20ba59] active:scale-95 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all"
            >
              <span className="material-symbols-outlined text-[17px]">share</span>
              <span>Send to WhatsApp</span>
            </button>
            <button
              onClick={handleCopyFormattedText}
              className="py-2.5 px-3 rounded-xl bg-surface-container hover:bg-surface-container-high active:scale-95 text-on-surface font-semibold text-xs border border-surface-container-high/60 flex items-center justify-center gap-1.5 transition-all"
            >
              <span className="material-symbols-outlined text-[17px] text-primary">content_copy</span>
              <span>{copiedText ? "Copied Text!" : "Copy Post Text"}</span>
            </button>
          </div>
        </div>

        {/* Question Preview Snippet */}
        <div className="my-2.5 p-3 rounded-xl bg-surface-container-low border border-surface-container-high/40 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-surface-container-highest text-secondary">
                {question.subject_name || "Question"}
              </span>
              {question.pyq_info && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-tertiary-fixed/30 text-tertiary">
                  {question.pyq_info}
                </span>
              )}
            </div>
            <p className="text-xs text-on-surface font-medium truncate mt-1">
              {question.question_text}
            </p>
          </div>
          <button
            onClick={handleCopyLink}
            className="shrink-0 px-2.5 py-1.5 rounded-lg bg-surface-container text-xs font-bold text-primary hover:bg-surface-container-high transition-colors flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[14px]">link</span>
            <span>{copied ? "Copied!" : "Copy Link"}</span>
          </button>
        </div>

        {/* Friend Search Bar */}
        <div className="relative mb-3">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-secondary text-[18px]">
            search
          </span>
          <input
            type="text"
            placeholder="Search study friends by name or @username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-container-low border border-surface-container-high/50 text-xs text-on-surface placeholder:text-secondary focus:outline-none focus:border-primary"
          />
        </div>

        {/* Friends List with Direct Send */}
        <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col gap-2 min-h-[160px] max-h-[240px]">
          {filteredFriends.length > 0 ? (
            filteredFriends.map((friend) => {
              const isSent = sentMap[friend.id];
              return (
                <div
                  key={friend.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-low/60 hover:bg-surface-container-low border border-surface-container-high/30 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-primary-fixed shrink-0 border border-surface-container-high">
                      {friend.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={friend.avatar_url}
                          alt={friend.display_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold text-primary text-xs">
                          {friend.display_name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-on-surface text-xs truncate">
                          {friend.display_name}
                        </span>
                        <span className="text-[10px] text-primary font-bold">
                          @{friend.username || friend.display_name.toLowerCase().replace(/\s+/g, "_")}
                        </span>
                        <span className="text-[10px] text-tertiary font-semibold">
                          🔥 {friend.streak_days}d
                        </span>
                      </div>
                      <span className="text-[10px] text-secondary truncate">
                        {friend.target_exam}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 pl-2">
                    <button
                      onClick={() => handleSendToFriend(friend)}
                      disabled={isSent}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        isSent
                          ? "bg-tertiary-fixed text-on-tertiary-fixed"
                          : "bg-primary text-on-primary hover:bg-primary-container active:scale-95 shadow-xs"
                      }`}
                    >
                      {isSent ? "Sent ✓" : "Send"}
                    </button>
                    {onOpenChatWithFriend && (
                      <button
                        onClick={() => {
                          onClose();
                          onOpenChatWithFriend(friend);
                        }}
                        className="p-1.5 rounded-lg bg-surface-container text-secondary hover:text-primary transition-colors"
                        title="Open study chat"
                      >
                        <span className="material-symbols-outlined text-[16px]">chat</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-6 text-center text-xs text-secondary">
              No matching study partners found
            </div>
          )}
        </div>

        {/* Add Friend / Connect Aspirant */}
        <div className="mt-3 pt-3 border-t border-surface-container-high/40">
          <label className="text-[11px] font-bold text-secondary uppercase tracking-wider block mb-1">
            Send Friend Request
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Enter unique @username (e.g. @priya_neet)..."
              value={addFriendInput}
              onChange={(e) => setAddFriendInput(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container-high/50 text-xs text-on-surface placeholder:text-secondary focus:outline-none focus:border-primary"
            />
            <button
              onClick={handleSendFriendRequest}
              disabled={isAdding || !addFriendInput.trim()}
              className="px-3.5 py-2 rounded-xl bg-primary text-on-primary font-bold text-xs disabled:opacity-40 hover:bg-primary-container active:scale-95 transition-all shrink-0"
            >
              {isAdding ? "Adding..." : "Add"}
            </button>
          </div>
          {addStatusMsg && (
            <p className="text-[11px] text-primary font-medium mt-1">{addStatusMsg}</p>
          )}
        </div>
      </div>
    </div>
  );
};

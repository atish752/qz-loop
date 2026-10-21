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

  const cleanHandle = (username?: string | null, id?: string | null): string => {
    if (!username && !id) return "aspirant";
    const raw = (username || "").replace(/^@/, "").trim();
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(raw) ||
      (raw.length >= 24 && raw.includes("-")) ||
      (raw.length >= 30 && !raw.includes(" "));
    if (isUuid || !raw) {
      const seed = (id || raw).replace(/[^0-9a-zA-Z]/g, "").slice(0, 6) || "peer";
      return `aspirant_${seed}`;
    }
    return raw.replace(/^user-/, "aspirant_");
  };

  const cleanDisplayName = (name?: string | null, rawUsername?: string | null, id?: string | null): string => {
    if (name && name.trim()) {
      const trimmed = name.trim();
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed);
      if (!isUuid && trimmed !== "Study Partner" && trimmed !== "User") return trimmed;
    }
    const handle = cleanHandle(rawUsername, id);
    return `Aspirant ${handle.replace(/^aspirant_/, "").slice(0, 4).toUpperCase() || "Study"}`;
  };

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
    if (isOpen) {
      const currentUid = getEffectiveUid();
      let myUsername = "";
      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem("qz_auth_user");
          if (raw) myUsername = JSON.parse(raw)?.username?.toLowerCase() || "";
        } catch {}
      }
      const url = currentUid ? `/api/friends?userId=${encodeURIComponent(currentUid)}` : "/api/friends";
      const headers: Record<string, string> = currentUid ? { "x-user-id": currentUid } : {};
      fetch(url, { headers })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.friends) {
            // Strictly accepted friends only, excluding current user by ID and username
            const accepted = data.friends.filter(
              (f: FriendUser) =>
                f.status === "friend" &&
                f.id !== currentUid &&
                (!myUsername || f.username?.toLowerCase() !== myUsername)
            );
            setFriends(accepted);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSendToFriend = async (friend: FriendUser) => {
    const currentUid = getEffectiveUid();
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
      setShareToast(`Sent to @${friend.username || friend.display_name}! 🚀`);
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
          text: `Can you solve this ${question.subject_name || "Quiz"} question? Check your speed!`,
          questionId: question.id,
        }),
      });
    } catch {
      // Sent optimistic
    }
  };


  const handleSendFriendRequest = async () => {
    if (!addFriendInput.trim()) return;
    const currentUid = getEffectiveUid();
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
        if (data.friend && data.friend.status === "friend") {
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
        {/* Top Drag Indicator (Instagram Sheet Style) */}
        <div className="w-12 h-1.5 rounded-full bg-surface-container-high mx-auto mb-3" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-surface-container-high/40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">send</span>
            </div>
            <div>
              <h3 className="font-bold text-on-surface text-base">Share Question</h3>
              <p className="text-xs text-secondary">Challenge friends directly in study chat</p>
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

        {/* Quick Search Bar */}
        <div className="relative mt-3 mb-2">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-secondary text-[18px]">
            search
          </span>
          <input
            type="text"
            placeholder="Search study friends by name or @username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-container border border-surface-container-high/50 text-xs text-on-surface placeholder:text-secondary focus:outline-none focus:border-primary"
          />
        </div>

        {/* Friends List with Direct 1-Tap Send Pill */}
        <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col gap-2 min-h-[160px] max-h-[260px] py-1">
          {filteredFriends.length > 0 ? (
            filteredFriends.map((friend) => {
              const isSent = sentMap[friend.id];
              const dispName = cleanDisplayName(friend.display_name, friend.username, friend.id);
              const handle = cleanHandle(friend.username, friend.id);
              return (
                <div
                  key={friend.id}
                  className="flex items-center justify-between p-2.5 rounded-2xl bg-surface-container-low/70 hover:bg-surface-container-low border border-surface-container-high/30 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-primary-fixed border border-surface-container-high">
                        {friend.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={friend.avatar_url}
                            alt={dispName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-primary text-xs">
                            {dispName.charAt(0)}
                          </div>
                        )}
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-surface-container-lowest" />
                    </div>
                    <div className="min-w-0 flex flex-col">
                      <span className="font-bold text-on-surface text-xs truncate">
                        {dispName}
                      </span>
                      <span className="text-[11px] text-primary font-bold truncate">
                        @{handle}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 pl-2">
                    <button
                      onClick={() => handleSendToFriend(friend)}
                      disabled={isSent}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all shadow-xs ${
                        isSent
                          ? "bg-emerald-600 text-white"
                          : "bg-primary text-on-primary hover:bg-primary-container active:scale-95"
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
                        className="p-1.5 rounded-xl bg-surface-container text-secondary hover:text-primary transition-colors"
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
            <div className="py-8 text-center text-xs text-secondary flex flex-col items-center gap-1.5">
              <span className="material-symbols-outlined text-[28px] text-primary/50">groups</span>
              <p>No study friends found.</p>
              <p className="text-[11px]">Send a friend request below or in the Social lounge.</p>
            </div>
          )}
        </div>

        {/* 1-Click WhatsApp & Copy Link Bar */}
        <div className="pt-2.5 border-t border-surface-container-high/40 grid grid-cols-2 gap-2">
          <button
            onClick={handleWhatsAppShare}
            className="py-2 px-3 rounded-xl bg-[#25D366] hover:bg-[#20ba59] active:scale-95 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">share</span>
            <span>WhatsApp Challenge</span>
          </button>
          <button
            onClick={handleCopyLink}
            className="py-2 px-3 rounded-xl bg-surface-container hover:bg-surface-container-high active:scale-95 text-on-surface font-semibold text-xs border border-surface-container-high/60 flex items-center justify-center gap-1.5 transition-all"
          >
            <span className="material-symbols-outlined text-[16px] text-primary">link</span>
            <span>{copied ? "Copied Link!" : "Copy Quiz Link"}</span>
          </button>
        </div>

        {/* Send Friend Request Quick Action */}
        <div className="mt-2.5 pt-2 border-t border-surface-container-high/40 flex items-center gap-2">
          <input
            type="text"
            placeholder="Send request: Enter @username..."
            value={addFriendInput}
            onChange={(e) => setAddFriendInput(e.target.value)}
            className="flex-1 px-3 py-1.5 rounded-xl bg-surface-container border border-surface-container-high/50 text-xs text-on-surface placeholder:text-secondary focus:outline-none focus:border-primary"
          />
          <button
            onClick={handleSendFriendRequest}
            disabled={isAdding || !addFriendInput.trim()}
            className="px-3 py-1.5 rounded-xl bg-primary-container text-on-primary font-bold text-xs disabled:opacity-40 hover:bg-primary transition-all shrink-0"
          >
            {isAdding ? "Sending..." : "Send Request"}
          </button>
        </div>
        {addStatusMsg && (
          <p className="text-[11px] text-primary font-medium mt-1">{addStatusMsg}</p>
        )}
      </div>
    </div>
  );
};


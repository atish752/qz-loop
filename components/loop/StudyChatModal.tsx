"use client";

import React, { useState, useEffect, useRef } from "react";
import { FriendUser, DirectMessage } from "@/types/database";

interface StudyChatModalProps {
  friend: FriendUser | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectSharedQuestion?: (questionId: string) => void;
}

export const StudyChatModal: React.FC<StudyChatModalProps> = ({
  friend,
  isOpen,
  onClose,
  onSelectSharedQuestion,
}) => {
  const [peerProfile, setPeerProfile] = useState<FriendUser | null>(friend);
  const [messages, setMessages] = useState<(DirectMessage & { question?: any })[]>([]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setPeerProfile(friend);
  }, [friend]);

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

  useEffect(() => {
    if (!isOpen || !friend) return;

    let isMounted = true;
    const fetchChatThread = () => {
      const currentUid = typeof window !== "undefined" ? localStorage.getItem("qz_user_id") : null;
      const url = currentUid
        ? `/api/messages?friendId=${friend.id}&userId=${encodeURIComponent(currentUid)}`
        : `/api/messages?friendId=${friend.id}`;
      fetch(url)
        .then((res) => res.json())
        .then((data) => {
          if (!isMounted) return;
          if (data.success && data.messages) {
            setMessages((prev) => {
              const serverMsgs = data.messages || [];
              const pendingOptimistic = prev.filter(
                (m) =>
                  m.id.startsWith("temp-") &&
                  Date.now() - Number(m.id.replace("temp-", "")) < 20000 &&
                  !serverMsgs.some((sm: any) => sm.id === m.id)
              );
              const combined = [...serverMsgs, ...pendingOptimistic];
              const uniqueMap = new Map<string, any>();
              for (const m of combined) {
                if (!uniqueMap.has(m.id)) {
                  uniqueMap.set(m.id, m);
                }
              }
              const next = Array.from(uniqueMap.values()).sort(
                (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
              );
              if (
                prev.length === next.length &&
                prev.every((m, idx) => m.id === next[idx]?.id && m.text === next[idx]?.text)
              ) {
                return prev;
              }
              return next;
            });
            if (data.peers && data.peers[friend.id]) {
              const p = data.peers[friend.id];
              setPeerProfile((prev) => ({
                ...(prev || friend),
                display_name: p.display_name || prev?.display_name || friend.display_name,
                username: p.username || prev?.username || friend.username,
                avatar_url: p.avatar_url || prev?.avatar_url || friend.avatar_url,
                target_exam: p.target_exam || prev?.target_exam || friend.target_exam,
                streak_days: p.current_streak || prev?.streak_days || friend.streak_days,
              }));
            }
          }
        })
        .catch(() => {});
    };

    fetchChatThread();
    const interval = setInterval(fetchChatThread, 1200);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isOpen, friend]);

  const prevMsgCountRef = useRef(0);
  useEffect(() => {
    if (chatBottomRef.current && messages.length > prevMsgCountRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
    prevMsgCountRef.current = messages.length;
  }, [messages.length]);

  if (!isOpen || !friend) return null;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSending) return;

    const currentUid = (typeof window !== "undefined" ? localStorage.getItem("qz_user_id") : null) || "user-current";
    const text = inputText.trim();
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: DirectMessage = {
      id: tempId,
      from_user_id: currentUid,
      to_user_id: friend.id,
      text,
      created_at: new Date().toISOString(),
    };

    // Instant optimistic update
    setMessages((prev) => [...prev, optimisticMsg]);
    setInputText("");
    setIsSending(true);

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(currentUid && currentUid !== "user-current" ? { "x-user-id": currentUid } : {}),
        },
        body: JSON.stringify({
          fromUserId: currentUid,
          toUserId: friend.id,
          text,
        }),
      });
      const data = await res.json();
      if (data.success && data.message) {
        setMessages((prev) => {
          const map = new Map<string, any>();
          for (const m of prev) {
            const finalMsg = m.id === tempId ? data.message : m;
            map.set(finalMsg.id, finalMsg);
          }
          return Array.from(map.values()).sort(
            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        });
      }
    } catch {
      // Handled
    } finally {
      setIsSending(false);
    }
  };

  const currentPeer = peerProfile || friend;
  const peerDispName = cleanDisplayName(currentPeer.display_name, currentPeer.username, currentPeer.id);
  const peerHandle = cleanHandle(currentPeer.username, currentPeer.id);
  const peerAvatar = currentPeer.avatar_url;
  const peerStreak = currentPeer.streak_days || 1;
  const peerExam = currentPeer.target_exam || currentPeer.last_active || "Study Partner";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-surface-container-lowest rounded-t-3xl sm:rounded-2xl p-4 shadow-2xl border border-surface-container-high/60 flex flex-col h-[90vh] sm:h-[650px] animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-surface-container-high/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full overflow-hidden bg-primary-fixed shrink-0 border border-surface-container-high">
              {peerAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={peerAvatar}
                  alt={peerDispName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-primary text-xs">
                  {peerDispName.charAt(0)}
                </div>
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-on-surface text-sm truncate">{peerDispName}</h3>
                <span className="text-[11px] font-bold text-primary">@{peerHandle}</span>
                <span className="text-[10px] text-tertiary font-bold">🔥 {peerStreak}d</span>
              </div>
              <p className="text-[10px] text-secondary truncate">
                {peerExam}
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

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto no-scrollbar py-3 flex flex-col gap-3">
          {messages.map((m) => {
            const currentUid = typeof window !== "undefined" ? localStorage.getItem("qz_user_id") : null;
            const isMe = currentUid ? m.from_user_id === currentUid : m.from_user_id === "user-current";
            return (
              <div
                key={m.id}
                className={`flex flex-col max-w-[85%] ${
                  isMe ? "ml-auto items-end" : "mr-auto items-start"
                }`}
              >
                {/* Embedded Question Card if message contains shared question */}
                {m.question && (
                  <div
                    onClick={() => {
                      if (onSelectSharedQuestion && m.question_id) {
                        onSelectSharedQuestion(m.question_id);
                        onClose();
                      }
                    }}
                    className="p-3 mb-1.5 rounded-2xl bg-surface-container border border-surface-container-high/60 shadow-xs cursor-pointer hover:bg-surface-container-high transition-colors w-full"
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-primary-fixed text-primary">
                        Shared Question
                      </span>
                      <span className="text-[10px] text-primary font-bold flex items-center gap-0.5">
                        <span>Solve</span>
                        <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
                      </span>
                    </div>
                    <p className="text-xs font-medium text-on-surface line-clamp-2">
                      {m.question.question_text}
                    </p>
                  </div>
                )}

                {/* Text Bubble */}
                {m.text && (
                  <div
                    className={`px-3.5 py-2 rounded-2xl text-xs leading-relaxed ${
                      isMe
                        ? "bg-primary text-on-primary rounded-br-xs shadow-xs"
                        : "bg-surface-container-high text-on-surface rounded-bl-xs"
                    }`}
                  >
                    {m.text}
                  </div>
                )}
                <span className="text-[9px] text-secondary mt-0.5 px-1">
                  {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            );
          })}
          <div ref={chatBottomRef} />
        </div>

        {/* Input Field */}
        <form onSubmit={handleSendMessage} className="pt-2 border-t border-surface-container-high/40 flex items-center gap-2">
          <input
            type="text"
            placeholder={`Message ${peerDispName}...`}
            value={inputText}
            disabled={isSending}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container-high/50 text-xs text-on-surface placeholder:text-secondary focus:outline-none focus:border-primary disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isSending || !inputText.trim()}
            className="p-2 rounded-xl bg-primary text-on-primary font-bold text-xs disabled:opacity-40 hover:bg-primary-container active:scale-95 transition-all shrink-0 flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-[18px]">send</span>
          </button>
        </form>
      </div>
    </div>
  );
};

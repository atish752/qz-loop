"use client";

import React, { useState, useEffect } from "react";
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
  const [messages, setMessages] = useState<(DirectMessage & { question?: any })[]>([]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (isOpen && friend) {
      fetch(`/api/messages?friendId=${friend.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.messages) {
            setMessages(data.messages);
          }
        })
        .catch(() => {});
    }
  }, [isOpen, friend]);

  if (!isOpen || !friend) return null;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setIsSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toUserId: friend.id,
          text: inputText.trim(),
        }),
      });
      const data = await res.json();
      if (data.success && data.message) {
        setMessages((prev) => [...prev, data.message]);
        setInputText("");
      }
    } catch {
      // Handled
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-surface-container-lowest rounded-t-3xl sm:rounded-2xl p-4 shadow-2xl border border-surface-container-high/60 flex flex-col h-[90vh] sm:h-[650px] animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-surface-container-high/40">
          <div className="flex items-center gap-2.5">
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
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-on-surface text-sm">{friend.display_name}</h3>
                <span className="text-[10px] text-tertiary font-bold">🔥 {friend.streak_days}d</span>
              </div>
              <p className="text-[10px] text-secondary">{friend.last_active || "Study Partner"}</p>
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
            const isMe = m.from_user_id === "user-current";
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
        </div>

        {/* Input Field */}
        <form onSubmit={handleSendMessage} className="pt-2 border-t border-surface-container-high/40 flex items-center gap-2">
          <input
            type="text"
            placeholder={`Message ${friend.display_name}...`}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 px-3 py-2 rounded-xl bg-surface-container-low border border-surface-container-high/50 text-xs text-on-surface placeholder:text-secondary focus:outline-none focus:border-primary"
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

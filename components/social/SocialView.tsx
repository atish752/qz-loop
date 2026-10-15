"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { UserProfile, FriendUser, DirectMessage, Question } from "@/types/database";
import { TopHeader } from "../layout/TopHeader";
import { ExamSwitchModal } from "../feed/ExamSwitchModal";
import confetti from "canvas-confetti";

export const SocialView: React.FC = () => {
  // Sub-tabs: "chat" (default) or "friends"
  const [activeTab, setActiveTab] = useState<"chat" | "friends">("chat");

  // User & Exam state
  const [user, setUser] = useState<UserProfile | null>(null);
  const [exams, setExams] = useState<any[]>([]);
  const [showExamModal, setShowExamModal] = useState<boolean>(false);

  // Friends state
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<(UserProfile & { isFriend: boolean; friendStatus?: string })[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  // Direct add friend input & status
  const [addInput, setAddInput] = useState<string>("");
  const [addStatus, setAddStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isAdding, setIsAdding] = useState<boolean>(false);

  // Chat conversation state
  const [selectedFriend, setSelectedFriend] = useState<FriendUser | null>(null);
  const [messages, setMessages] = useState<(DirectMessage & { question?: Question })[]>([]);
  const [allMessages, setAllMessages] = useState<(DirectMessage & { question?: Question })[]>([]);
  const [chatInputText, setChatInputText] = useState<string>("");
  const [isSendingMessage, setIsSendingMessage] = useState<boolean>(false);
  const [isLoadingChat, setIsLoadingChat] = useState<boolean>(false);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Quick Share Question Modal inside Chat
  const [showQuickShareModal, setShowQuickShareModal] = useState<boolean>(false);
  const [feedQuestions, setFeedQuestions] = useState<Question[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState<boolean>(false);

  // Practice Shared Quiz Modal (Exact Quiz Loop experience)
  const [practiceQuestion, setPracticeQuestion] = useState<Question | null>(null);
  const [practiceElapsedSeconds, setPracticeElapsedSeconds] = useState<number>(0);
  const [practiceSelectedOption, setPracticeSelectedOption] = useState<string | null>(null);
  const [practiceIsAnswered, setPracticeIsAnswered] = useState<boolean>(false);
  const [practiceIsCorrect, setPracticeIsCorrect] = useState<boolean | null>(null);
  const [practiceCorrectOptionId, setPracticeCorrectOptionId] = useState<string | null>(null);
  const [practiceExplanation, setPracticeExplanation] = useState<string | undefined>(undefined);
  const [practiceMetrics, setPracticeMetrics] = useState<any>(null);
  const [isSubmittingPractice, setIsSubmittingPractice] = useState<boolean>(false);
  const practiceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const practiceStartTimeRef = useRef<number | null>(null);

  // Load User Profile
  useEffect(() => {
    fetch("/api/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setUser(data.user);
          setExams(data.exams || []);
        }
      })
      .catch(() => {});
  }, []);

  // Load Friends List & All Messages
  const loadFriendsAndMessages = () => {
    setIsLoadingFriends(true);
    fetch("/api/friends")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.friends) {
          setFriends(data.friends);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoadingFriends(false));

    fetch("/api/messages")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.messages) {
          setAllMessages(data.messages);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadFriendsAndMessages();
  }, []);

  // Load Chat thread when a friend is selected
  useEffect(() => {
    if (selectedFriend) {
      setIsLoadingChat(true);
      fetch(`/api/messages?friendId=${selectedFriend.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.messages) {
            setMessages(data.messages);
          }
        })
        .catch(() => {})
        .finally(() => setIsLoadingChat(false));
    }
  }, [selectedFriend]);

  // Scroll to bottom of chat on new message
  useEffect(() => {
    if (selectedFriend && chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, selectedFriend]);

  // Search Users by unique username
  const handleSearchUsers = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setHasSearched(true);
    try {
      const res = await fetch(`/api/friends?search=${encodeURIComponent(searchQuery.trim())}`);
      const data = await res.json();
      if (data.success) {
        setSearchResults(data.users || []);
      }
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Direct add friend request by username or ID
  const handleSendFriendRequest = async (targetUsernameOrName: string) => {
    if (!targetUsernameOrName.trim()) return;
    setIsAdding(true);
    setAddStatus(null);

    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: targetUsernameOrName.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setAddStatus({ type: "success", message: data.message || "Friend added successfully!" });
        setAddInput("");
        loadFriendsAndMessages();
        // Update search results if relevant
        setSearchResults((prev) =>
          prev.map((u) =>
            u.username.toLowerCase() === targetUsernameOrName.trim().toLowerCase().replace(/^@/, "")
              ? { ...u, isFriend: true, friendStatus: "friend" }
              : u
          )
        );
      } else {
        setAddStatus({ type: "error", message: data.error || "Failed to add friend" });
      }
    } catch {
      setAddStatus({ type: "error", message: "Network error. Please try again." });
    } finally {
      setIsAdding(false);
    }
  };

  // Send Direct Chat Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInputText.trim() || !selectedFriend) return;

    const text = chatInputText.trim();
    setChatInputText("");
    setIsSendingMessage(true);

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toUserId: selectedFriend.id,
          text,
        }),
      });
      const data = await res.json();
      if (data.success && data.message) {
        setMessages((prev) => [...prev, data.message]);
        setAllMessages((prev) => [...prev, data.message]);
      }
    } catch {
      // optimistic error recovery
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Open Quick Share Modal to pick a quiz to share into chat
  const handleOpenQuickShare = async () => {
    setShowQuickShareModal(true);
    setIsLoadingQuestions(true);
    try {
      const res = await fetch("/api/feed?subjects=all&limit=8");
      const data = await res.json();
      if (data.success && data.questions) {
        setFeedQuestions(data.questions);
      }
    } catch {
      // Handled
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  // Send Shared Quiz into Chat
  const handleShareQuizToFriend = async (question: Question) => {
    if (!selectedFriend) return;
    setShowQuickShareModal(false);

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toUserId: selectedFriend.id,
          text: `Can you solve this ${question.subject_name || "General"} quiz? Check your speed!`,
          questionId: question.id,
        }),
      });
      const data = await res.json();
      if (data.success && data.message) {
        const fullMessage = { ...data.message, question };
        setMessages((prev) => [...prev, fullMessage]);
        setAllMessages((prev) => [...prev, fullMessage]);
      }
    } catch {
      // Handled
    }
  };

  // Launch Practice of Shared Quiz (Normal Quiz Loop Mode)
  const handleOpenPracticeQuiz = (question: Question) => {
    setPracticeQuestion(question);
    setPracticeElapsedSeconds(0);
    setPracticeSelectedOption(null);
    setPracticeIsAnswered(false);
    setPracticeIsCorrect(null);
    setPracticeCorrectOptionId(null);
    setPracticeExplanation(undefined);
    setPracticeMetrics({
      attempts: question.total_attempts,
      correctAttempts: question.correct_attempts,
      avgTimeSec: question.total_attempts > 0 ? Math.round(question.total_time_ms / question.total_attempts / 1000) : 15,
      fastestSec: question.fastest_correct_ms ? Number((question.fastest_correct_ms / 1000).toFixed(1)) : null,
    });

    // Start practice timer immediately!
    practiceStartTimeRef.current = Date.now();
    if (practiceTimerRef.current) clearInterval(practiceTimerRef.current);
    practiceTimerRef.current = setInterval(() => {
      if (practiceStartTimeRef.current) {
        setPracticeElapsedSeconds(Math.floor((Date.now() - practiceStartTimeRef.current) / 1000));
      }
    }, 1000);
  };

  // Close / Ignore Practice Quiz
  const handleClosePracticeQuiz = () => {
    if (practiceTimerRef.current) {
      clearInterval(practiceTimerRef.current);
      practiceTimerRef.current = null;
    }
    setPracticeQuestion(null);
    setPracticeIsAnswered(false);
    setPracticeSelectedOption(null);
  };

  // Submit Answer in Practice Quiz
  const handleSubmitPracticeOption = async (optionId: string) => {
    if (!practiceQuestion || practiceIsAnswered || isSubmittingPractice) return;

    if (practiceTimerRef.current) {
      clearInterval(practiceTimerRef.current);
      practiceTimerRef.current = null;
    }

    const elapsedMs = practiceStartTimeRef.current
      ? Math.max(800, Date.now() - practiceStartTimeRef.current)
      : practiceElapsedSeconds * 1000;

    setPracticeSelectedOption(optionId);
    setIsSubmittingPractice(true);

    try {
      const res = await fetch("/api/questions/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: practiceQuestion.id,
          selectedOptionId: optionId,
          responseTimeMs: elapsedMs,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setPracticeIsAnswered(true);
        setPracticeIsCorrect(data.isCorrect);
        setPracticeCorrectOptionId(data.correctOptionId);
        if (data.explanation) {
          setPracticeExplanation(data.explanation);
        }
        setPracticeMetrics({
          attempts: data.updatedMetrics.total_attempts,
          correctAttempts: data.updatedMetrics.correct_attempts,
          avgTimeSec: data.updatedMetrics.avg_time_seconds,
          fastestSec: data.updatedMetrics.fastest_correct_seconds,
        });

        if (data.isCorrect) {
          confetti({
            particleCount: 35,
            spread: 60,
            origin: { y: 0.7 },
            colors: ["#5300b7", "#006544", "#4edea3", "#ebddff"],
          });
        }
      }
    } catch {
      // Handled
    } finally {
      setIsSubmittingPractice(false);
    }
  };

  const activeExam = exams.find((e) => e.id === user?.preferred_examination_id);

  return (
    <div className="flex flex-col min-h-screen pb-24 bg-surface">
      <TopHeader
        currentTab="social"
        streakDays={user?.current_streak || 14}
        activeExamName={user?.target_exam || activeExam?.name || "SSC CGL"}
        user={user}
        onSelectExam={() => setShowExamModal(true)}
      />

      <div className="flex flex-col w-full px-4 pt-3 pb-6 max-w-[480px] mx-auto">
        {/* Header Title */}
        <div className="flex items-center justify-between pb-3">
          <div>
            <h1 className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-on-surface">
              Social Lounge
            </h1>
            <p className="font-body-sm text-body-sm text-secondary">
              Chat with aspirants, share quizzes & study together
            </p>
          </div>
          <span className="flex items-center gap-1 font-label-sm text-label-sm bg-primary-fixed/50 text-primary px-2.5 py-1 rounded-full font-bold">
            <span className="material-symbols-outlined text-[16px]">groups</span>
            <span>Study Hub</span>
          </span>
        </div>

        {/* 2 Primary Sub-Tabs: Chat (Default) and Friends */}
        <div className="flex items-center p-1 bg-surface-container-high rounded-xl gap-1 mb-4">
          <button
            onClick={() => {
              setActiveTab("chat");
              setAddStatus(null);
            }}
            className={`flex-1 py-2 rounded-lg font-label-md text-label-md text-center transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "chat"
                ? "bg-primary-container text-on-primary shadow-sm font-bold"
                : "text-secondary hover:text-on-surface font-medium"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">forum</span>
            <span>Chat</span>
            {allMessages.length > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${activeTab === "chat" ? "bg-white/20 text-white" : "bg-surface-container text-secondary"}`}>
                {friends.length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab("friends");
              setAddStatus(null);
            }}
            className={`flex-1 py-2 rounded-lg font-label-md text-label-md text-center transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "friends"
                ? "bg-primary-container text-on-primary shadow-sm font-bold"
                : "text-secondary hover:text-on-surface font-medium"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">group</span>
            <span>Friends</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${activeTab === "friends" ? "bg-white/20 text-white" : "bg-surface-container text-secondary"}`}>
              {friends.length}
            </span>
          </button>
        </div>

        {/* ============================================================== */}
        {/* SUB-TAB 1: CHAT (Default) */}
        {/* ============================================================== */}
        {activeTab === "chat" && (
          <div className="flex flex-col flex-1">
            {/* View A: Selected Friend Chat Thread */}
            {selectedFriend ? (
              <div className="flex flex-col bg-surface-container-low rounded-2xl border border-surface-container-high/50 overflow-hidden shadow-xs">
                {/* Chat Header */}
                <div className="p-3 bg-surface-container flex items-center justify-between border-b border-surface-container-high/50">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button
                      onClick={() => setSelectedFriend(null)}
                      className="p-1 rounded-lg text-secondary hover:text-on-surface hover:bg-surface-container-high transition-colors"
                      title="Back to conversations"
                    >
                      <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                    </button>
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-primary-fixed shrink-0 border border-surface-container-high">
                      {selectedFriend.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={selectedFriend.avatar_url}
                          alt={selectedFriend.display_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold text-primary text-xs">
                          {selectedFriend.display_name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-on-surface text-sm truncate">
                          {selectedFriend.display_name}
                        </span>
                        <span className="text-[11px] font-bold text-primary">
                          @{selectedFriend.username}
                        </span>
                        <span className="text-[10px] text-tertiary font-bold">
                          🔥 {selectedFriend.streak_days}d
                        </span>
                      </div>
                      <span className="text-[10px] text-secondary truncate">
                        {selectedFriend.target_exam}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleOpenQuickShare}
                    className="px-2.5 py-1 rounded-xl bg-primary text-on-primary font-bold text-xs flex items-center gap-1 hover:bg-primary-container active:scale-95 transition-all shadow-xs"
                    title="Share a Quiz with this Friend"
                  >
                    <span className="material-symbols-outlined text-[15px]">send</span>
                    <span>Share Quiz</span>
                  </button>
                </div>

                {/* Message Stream */}
                <div className="p-3 flex-1 overflow-y-auto no-scrollbar flex flex-col gap-3 min-h-[350px] max-h-[460px] bg-surface-container-lowest/70">
                  {isLoadingChat ? (
                    <div className="py-16 flex flex-col items-center justify-center text-center gap-2">
                      <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <p className="text-xs text-secondary">Loading study messages...</p>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="py-12 flex flex-col items-center justify-center text-center gap-2 text-secondary">
                      <span className="material-symbols-outlined text-[32px] text-primary/40">chat</span>
                      <p className="text-xs font-medium text-on-surface">No messages yet with @{selectedFriend.username}</p>
                      <p className="text-[11px]">Send a greeting or challenge them to practice a quiz!</p>
                      <button
                        onClick={handleOpenQuickShare}
                        className="mt-2 px-3 py-1.5 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-xs hover:bg-primary-container"
                      >
                        Send Quiz Challenge
                      </button>
                    </div>
                  ) : (
                    messages.map((m) => {
                      const isMe = m.from_user_id === user?.id || m.from_user_id === "user-current";
                      return (
                        <div
                          key={m.id}
                          className={`flex flex-col max-w-[85%] ${isMe ? "self-end items-end" : "self-start items-start"}`}
                        >
                          <div
                            className={`p-3 rounded-2xl text-xs ${
                              isMe
                                ? "bg-primary text-on-primary rounded-br-xs shadow-xs"
                                : "bg-surface-container border border-surface-container-high/60 text-on-surface rounded-bl-xs"
                            }`}
                          >
                            {m.text && <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>}

                            {/* Shared Quiz Card inside message */}
                            {m.question && (
                              <div
                                className={`mt-2 p-2.5 rounded-xl border flex flex-col gap-1.5 ${
                                  isMe
                                    ? "bg-black/15 border-white/20 text-white"
                                    : "bg-surface-container-low border-primary/20 text-on-surface"
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase bg-primary-fixed/30 text-primary">
                                    <span className="material-symbols-outlined text-[11px]">quiz</span>
                                    {m.question.subject_name || "Quiz"} Challenge
                                  </span>
                                  <span className="text-[10px] opacity-75 font-medium">Reel Practice</span>
                                </div>

                                <p className="font-semibold text-xs line-clamp-2">
                                  {m.question.question_text}
                                </p>

                                <div className="mt-1 flex items-center gap-1.5">
                                  <button
                                    onClick={() => handleOpenPracticeQuiz(m.question!)}
                                    className={`flex-1 py-1.5 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-xs ${
                                      isMe
                                        ? "bg-white text-primary hover:bg-white/90"
                                        : "bg-primary text-on-primary hover:bg-primary-container"
                                    }`}
                                  >
                                    <span className="material-symbols-outlined text-[15px]">play_arrow</span>
                                    <span>Practice Question Now</span>
                                  </button>
                                  <Link
                                    href={`/loop?q=${m.question.id}`}
                                    className={`py-1.5 px-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1 transition-all ${
                                      isMe
                                        ? "bg-white/20 text-white hover:bg-white/30"
                                        : "bg-surface-container hover:bg-surface-container-high text-primary"
                                    }`}
                                    title="Open directly in Quiz Loop full screen"
                                  >
                                    <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                                  </Link>
                                </div>
                              </div>
                            )}
                          </div>
                          <span className="text-[9px] text-secondary mt-1 px-1">
                            {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      );
                    })
                  )}
                  <div ref={chatBottomRef} />
                </div>

                {/* Input Form */}
                <form onSubmit={handleSendMessage} className="p-2.5 bg-surface-container border-t border-surface-container-high/40 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleOpenQuickShare}
                    className="p-2 rounded-xl text-primary hover:bg-surface-container-high transition-colors shrink-0"
                    title="Share a Quiz"
                  >
                    <span className="material-symbols-outlined text-[20px]">add_circle</span>
                  </button>
                  <input
                    type="text"
                    value={chatInputText}
                    onChange={(e) => setChatInputText(e.target.value)}
                    placeholder="Type study message or formula..."
                    className="flex-1 px-3 py-2 rounded-xl bg-surface-container-lowest border border-surface-container-high/60 text-xs text-on-surface focus:outline-none focus:border-primary"
                  />
                  <button
                    type="submit"
                    disabled={isSendingMessage || !chatInputText.trim()}
                    className="p-2 rounded-xl bg-primary text-on-primary disabled:opacity-40 hover:bg-primary-container active:scale-95 transition-all shrink-0"
                    title="Send"
                  >
                    <span className="material-symbols-outlined text-[18px]">send</span>
                  </button>
                </form>
              </div>
            ) : (
              /* View B: Active Conversations List */
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between px-1">
                  <span className="font-label-sm text-label-sm text-secondary uppercase font-bold tracking-wider">
                    Recent Study Chats
                  </span>
                  <button
                    onClick={() => setActiveTab("friends")}
                    className="text-xs text-primary font-bold flex items-center gap-0.5 hover:underline"
                  >
                    <span>Find Aspirants</span>
                    <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </button>
                </div>

                {isLoadingFriends ? (
                  <div className="py-16 text-center text-secondary text-xs">
                    Loading conversations...
                  </div>
                ) : friends.length === 0 ? (
                  <div className="p-8 rounded-2xl bg-surface-container-low text-center flex flex-col items-center gap-2 border border-surface-container-high/40">
                    <span className="material-symbols-outlined text-[36px] text-primary/40">forum</span>
                    <p className="font-bold text-sm text-on-surface">No conversations yet</p>
                    <p className="text-xs text-secondary max-w-xs">
                      Switch to the Friends tab to search unique usernames and connect with study peers!
                    </p>
                    <button
                      onClick={() => setActiveTab("friends")}
                      className="mt-2 px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-xs hover:bg-primary-container"
                    >
                      Search Friends by Username
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {friends.map((friend) => {
                      // Find last message with this friend
                      const friendMsgs = allMessages.filter(
                        (m) =>
                          (m.from_user_id === friend.id && m.to_user_id === (user?.id || "user-current")) ||
                          (m.from_user_id === (user?.id || "user-current") && m.to_user_id === friend.id)
                      );
                      const lastMsg = friendMsgs[friendMsgs.length - 1];

                      return (
                        <div
                          key={friend.id}
                          onClick={() => setSelectedFriend(friend)}
                          className="p-3 rounded-2xl bg-surface-container-low hover:bg-surface-container border border-surface-container-high/40 cursor-pointer transition-all flex items-center justify-between gap-3 shadow-xs active:scale-[0.99]"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="relative shrink-0">
                              <div className="w-11 h-11 rounded-full overflow-hidden bg-primary-fixed border border-surface-container-high">
                                {friend.avatar_url ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={friend.avatar_url}
                                    alt={friend.display_name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center font-bold text-primary text-sm">
                                    {friend.display_name.charAt(0)}
                                  </div>
                                )}
                              </div>
                              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-surface-container-lowest" />
                            </div>

                            <div className="flex flex-col min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-on-surface text-sm truncate">
                                  {friend.display_name}
                                </span>
                                <span className="text-xs text-primary font-bold">
                                  @{friend.username}
                                </span>
                              </div>
                              <p className="text-xs text-secondary truncate mt-0.5">
                                {lastMsg ? (
                                  lastMsg.question_id ? (
                                    <span className="text-primary font-semibold flex items-center gap-1">
                                      <span className="material-symbols-outlined text-[13px]">quiz</span>
                                      Shared Quiz Challenge
                                    </span>
                                  ) : (
                                    lastMsg.text
                                  )
                                ) : (
                                  `Target: ${friend.target_exam}`
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-col items-end shrink-0 gap-1">
                            <span className="text-[10px] text-tertiary font-bold">
                              🔥 {friend.streak_days}d
                            </span>
                            <span className="text-[10px] text-secondary">
                              {friend.last_active || "Active"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* SUB-TAB 2: FRIENDS */}
        {/* ============================================================== */}
        {activeTab === "friends" && (
          <div className="flex flex-col gap-4">
            {/* Search by Unique Username Box */}
            <div className="bg-surface-container-low p-4 rounded-2xl border border-surface-container-high/40 flex flex-col gap-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="font-label-md text-label-md font-bold text-on-surface">
                  Find Aspirants by Unique Username
                </span>
                <span className="text-[11px] text-primary font-semibold">@username search</span>
              </div>

              <form onSubmit={handleSearchUsers} className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-secondary text-[18px]">
                    search
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by unique username (e.g. @amit_ssc)..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-container border border-surface-container-high/60 text-xs text-on-surface placeholder:text-secondary focus:outline-none focus:border-primary"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSearching || !searchQuery.trim()}
                  className="px-3.5 py-2 rounded-xl bg-primary text-on-primary font-bold text-xs disabled:opacity-40 hover:bg-primary-container active:scale-95 transition-all shadow-xs"
                >
                  {isSearching ? "Searching..." : "Search"}
                </button>
              </form>

              {/* Direct Add Friend quick action */}
              <div className="pt-2 border-t border-surface-container-high/40 flex items-center gap-2">
                <input
                  type="text"
                  value={addInput}
                  onChange={(e) => setAddInput(e.target.value)}
                  placeholder="Direct connect: Enter @username..."
                  className="flex-1 px-3 py-1.5 rounded-xl bg-surface-container border border-surface-container-high/50 text-xs text-on-surface placeholder:text-secondary focus:outline-none focus:border-primary"
                />
                <button
                  onClick={() => handleSendFriendRequest(addInput)}
                  disabled={isAdding || !addInput.trim()}
                  className="px-3 py-1.5 rounded-xl bg-primary-container text-on-primary font-bold text-xs disabled:opacity-40 hover:bg-primary transition-all shrink-0"
                >
                  {isAdding ? "Adding..." : "Send Request"}
                </button>
              </div>

              {addStatus && (
                <div
                  className={`p-2 rounded-xl text-xs font-medium flex items-center gap-1.5 ${
                    addStatus.type === "success"
                      ? "bg-emerald-500/15 text-emerald-900 dark:text-emerald-200 border border-emerald-500/20"
                      : "bg-error-container/40 text-error border border-error/20"
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {addStatus.type === "success" ? "check_circle" : "error"}
                  </span>
                  <span>{addStatus.message}</span>
                </div>
              )}
            </div>

            {/* Search Results Display */}
            {hasSearched && (
              <div className="flex flex-col gap-2">
                <span className="font-label-sm text-label-sm text-secondary uppercase font-bold tracking-wider px-1">
                  Search Results ({searchResults.length})
                </span>

                {searchResults.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-surface-container-low text-center text-xs text-secondary border border-surface-container-high/40">
                    No aspirants found with username &quot;{searchQuery}&quot;. Try searching another handle.
                  </div>
                ) : (
                  searchResults.map((usr) => (
                    <div
                      key={usr.id}
                      className="p-3 rounded-2xl bg-surface-container-low border border-surface-container-high/40 flex items-center justify-between gap-3 shadow-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-primary-fixed border border-surface-container-high shrink-0">
                          {usr.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={usr.avatar_url} alt={usr.display_name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-bold text-primary text-xs">
                              {usr.display_name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-sm text-on-surface truncate">
                            {usr.display_name}
                          </span>
                          <span className="text-xs text-primary font-bold">
                            @{usr.username}
                          </span>
                          <span className="text-[11px] text-secondary truncate">
                            Target: {usr.target_exam || "SSC CGL"} • 🔥 {usr.current_streak}d
                          </span>
                        </div>
                      </div>

                      {usr.isFriend ? (
                        <button
                          onClick={() => {
                            const friendObj = friends.find(
                              (f) =>
                                f.id === usr.id ||
                                f.username?.toLowerCase() === usr.username.toLowerCase()
                            );
                            if (friendObj) {
                              setSelectedFriend(friendObj);
                            } else {
                              setSelectedFriend({
                                id: usr.id,
                                display_name: usr.display_name,
                                username: usr.username,
                                avatar_url: usr.avatar_url,
                                streak_days: usr.current_streak,
                                target_exam: usr.target_exam || "SSC CGL Aspirant",
                                status: "friend",
                              });
                            }
                            setActiveTab("chat");
                          }}
                          className="px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-primary font-bold text-xs flex items-center gap-1 shadow-xs shrink-0"
                        >
                          <span className="material-symbols-outlined text-[15px]">chat</span>
                          <span>Chat</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSendFriendRequest(usr.username)}
                          disabled={isAdding}
                          className="px-3 py-1.5 rounded-xl bg-primary text-on-primary font-bold text-xs hover:bg-primary-container active:scale-95 transition-all shadow-xs shrink-0 flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[15px]">person_add</span>
                          <span>Add Friend</span>
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* My Friends List */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between px-1">
                <span className="font-label-sm text-label-sm text-secondary uppercase font-bold tracking-wider">
                  My Study Friends ({friends.length})
                </span>
                <span className="text-[11px] text-secondary font-medium">Verified Aspirants</span>
              </div>

              {friends.length === 0 ? (
                <div className="p-8 rounded-2xl bg-surface-container-low text-center text-xs text-secondary border border-surface-container-high/40">
                  You have not connected with any friends yet. Use the username search above!
                </div>
              ) : (
                friends.map((friend) => (
                  <div
                    key={friend.id}
                    className="p-3.5 rounded-2xl bg-surface-container-low border border-surface-container-high/40 flex items-center justify-between gap-3 shadow-xs hover:bg-surface-container transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-full overflow-hidden bg-primary-fixed border border-surface-container-high shrink-0">
                        {friend.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={friend.avatar_url} alt={friend.display_name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-primary text-sm">
                            {friend.display_name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-sm text-on-surface truncate">
                            {friend.display_name}
                          </span>
                          <span className="text-[10px] text-tertiary font-bold">
                            🔥 {friend.streak_days}d
                          </span>
                        </div>
                        <span className="text-xs text-primary font-bold">
                          @{friend.username}
                        </span>
                        <span className="text-[11px] text-secondary truncate mt-0.5">
                          {friend.target_exam}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          setSelectedFriend(friend);
                          setActiveTab("chat");
                        }}
                        className="px-3 py-1.5 rounded-xl bg-primary text-on-primary font-bold text-xs hover:bg-primary-container active:scale-95 transition-all shadow-xs flex items-center gap-1"
                        title="Start Chat with friend"
                      >
                        <span className="material-symbols-outlined text-[15px]">chat</span>
                        <span>Chat</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* QUICK SHARE QUIZ MODAL (Pick a quiz to share into chat) */}
      {/* ============================================================== */}
      {showQuickShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl p-5 shadow-2xl border border-surface-container-high/60 flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between pb-3 border-b border-surface-container-high/40">
              <div>
                <h3 className="font-bold text-sm text-on-surface">Share Quiz to @{selectedFriend?.username}</h3>
                <p className="text-xs text-secondary">Challenge your friend to solve it in Quiz Loop!</p>
              </div>
              <button
                onClick={() => setShowQuickShareModal(false)}
                className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-secondary"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar py-3 flex flex-col gap-2.5">
              {isLoadingQuestions ? (
                <div className="py-12 text-center text-xs text-secondary">Loading questions...</div>
              ) : (
                feedQuestions.map((q) => (
                  <div
                    key={q.id}
                    className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high/40 flex items-center justify-between gap-2.5"
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] font-bold text-secondary uppercase">
                        {q.subject_name || "General"}
                      </span>
                      <p className="text-xs font-semibold text-on-surface line-clamp-2 mt-0.5">
                        {q.question_text}
                      </p>
                    </div>
                    <button
                      onClick={() => handleShareQuizToFriend(q)}
                      className="px-3 py-1.5 rounded-lg bg-primary text-on-primary font-bold text-xs shrink-0 shadow-xs hover:bg-primary-container active:scale-95 transition-all flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[14px]">send</span>
                      <span>Send</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* PRACTICE SHARED QUIZ MODAL (Exact Normal Quiz Loop Experience) */}
      {/* Timer starts, options A, B, C, D clickable, or option to ignore */}
      {/* ============================================================== */}
      {practiceQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-surface-container-lowest rounded-3xl p-5 shadow-2xl border border-surface-container-high/60 flex flex-col max-h-[92vh] overflow-y-auto no-scrollbar">
            {/* Top Bar: Subject, Active Live Timer, and Ignore Button */}
            <div className="flex items-center justify-between pb-3 border-b border-surface-container-high/40">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase bg-primary-fixed text-primary">
                  {practiceQuestion.subject_name || "General"}
                </span>
                <span className="text-xs text-secondary">•</span>
                <span className="text-xs text-secondary font-medium">Shared Quiz</span>
              </div>

              {/* Active Timer (Ticks immediately as in normal quiz loop!) */}
              <div className="flex items-center gap-2">
                <div
                  className={`flex items-center gap-1 px-3 py-1 rounded-full font-bold text-xs shadow-xs ${
                    practiceIsAnswered
                      ? "bg-surface-container text-secondary"
                      : "bg-error-container/80 text-on-error-container animate-pulse-subtle"
                  }`}
                  title="Practice Timer"
                >
                  <span className="material-symbols-outlined text-[15px]">timer</span>
                  <span>{practiceElapsedSeconds}s</span>
                </div>

                {/* Option to Ignore / Dismiss without answering */}
                <button
                  onClick={handleClosePracticeQuiz}
                  className="px-2.5 py-1 rounded-full bg-surface-container hover:bg-surface-container-high text-secondary hover:text-on-surface text-xs font-semibold transition-colors"
                  title="Ignore / Close quiz"
                >
                  Ignore
                </button>
              </div>
            </div>

            {/* Author Credit */}
            <div className="pt-3 pb-2 flex items-center gap-2">
              <span className="text-xs text-secondary">
                Question by <strong className="font-semibold text-on-surface">{practiceQuestion.author_name || "Qz Loop Expert"}</strong>
              </span>
            </div>

            {/* Question Text */}
            <div className="py-2">
              <h2 className="text-base sm:text-lg font-bold text-on-surface leading-snug">
                {practiceQuestion.question_text}
              </h2>
            </div>

            {/* Community Metrics */}
            {practiceMetrics && (
              <div className="flex items-center gap-2 text-secondary text-[11px] py-1.5 px-3 rounded-xl bg-surface-container-low border border-surface-container-high/40 my-2">
                <span className="font-medium text-on-surface">{practiceMetrics.attempts} attempts</span>
                <span>·</span>
                <span className="font-medium text-tertiary">
                  {practiceMetrics.attempts > 0 ? Math.round((practiceMetrics.correctAttempts / practiceMetrics.attempts) * 100) : 0}% acc
                </span>
                <span>·</span>
                <span>{practiceMetrics.avgTimeSec}s avg</span>
                {practiceMetrics.fastestSec && (
                  <>
                    <span>·</span>
                    <span className="font-bold text-tertiary">⚡ {practiceMetrics.fastestSec}s fastest</span>
                  </>
                )}
              </div>
            )}

            {/* Options Area (Answer Choices A, B, C, D) */}
            <div className="flex flex-col gap-2.5 my-3">
              {practiceQuestion.options.map((opt) => {
                const isSelected = practiceSelectedOption === opt.id;
                const isTheCorrectOne = practiceCorrectOptionId === opt.id;

                let btnStyle = "bg-surface-container-low hover:bg-surface-container border border-surface-container-high/50 text-on-surface";
                let badgeStyle = "bg-surface-container text-on-surface";
                let statusIcon = "";

                if (practiceIsAnswered) {
                  if (isTheCorrectOne) {
                    btnStyle = "bg-emerald-500/20 text-emerald-950 dark:text-emerald-100 border-2 border-emerald-600 font-bold";
                    badgeStyle = "bg-emerald-600 text-white";
                    statusIcon = "check";
                  } else if (isSelected && !practiceIsCorrect) {
                    btnStyle = "bg-red-500/20 text-red-950 dark:text-red-100 border-2 border-red-600 font-bold";
                    badgeStyle = "bg-red-600 text-white";
                    statusIcon = "close";
                  } else {
                    btnStyle = "opacity-50 bg-surface-container-low border border-surface-container-high/30";
                  }
                }

                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSubmitPracticeOption(opt.id)}
                    disabled={practiceIsAnswered || isSubmittingPractice}
                    className={`w-full p-3 rounded-2xl flex items-center justify-between text-left transition-all ${btnStyle}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${badgeStyle}`}>
                        {opt.id}
                      </span>
                      <span className="font-medium text-xs leading-relaxed">{opt.text}</span>
                    </div>
                    {statusIcon && (
                      <span className="material-symbols-outlined text-[20px] shrink-0 ml-2">
                        {statusIcon}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Post-Answer Feedback & Quick Proof Explanation */}
            {practiceIsAnswered && (
              <div className="mt-2 p-4 rounded-2xl bg-surface-container-low border border-surface-container-high/50 animate-in fade-in">
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className={`material-symbols-outlined text-[20px] ${
                      practiceIsCorrect ? "text-emerald-600" : "text-error"
                    }`}
                  >
                    {practiceIsCorrect ? "check_circle" : "cancel"}
                  </span>
                  <span className="font-bold text-sm text-on-surface">
                    {practiceIsCorrect ? "Correct Solution!" : `Incorrect — Correct Option is ${practiceCorrectOptionId}`}
                  </span>
                  <span className="text-[11px] text-secondary ml-auto font-medium">
                    Time: {practiceElapsedSeconds}s
                  </span>
                </div>

                {practiceExplanation && (
                  <div className="mt-2 text-xs text-secondary leading-relaxed bg-surface-container p-2.5 rounded-xl border border-surface-container-high/40">
                    <strong className="text-on-surface block mb-1">Quick Proof:</strong>
                    {practiceExplanation}
                  </div>
                )}

                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={handleClosePracticeQuiz}
                    className="flex-1 py-2 rounded-xl bg-primary text-on-primary font-bold text-xs shadow-xs hover:bg-primary-container"
                  >
                    Back to Study Chat
                  </button>
                  <Link
                    href="/loop"
                    className="py-2 px-3 rounded-xl bg-surface-container hover:bg-surface-container-high text-primary font-bold text-xs flex items-center gap-1 shrink-0"
                  >
                    <span>More in Quiz Loop</span>
                    <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </Link>
                </div>
              </div>
            )}

            {/* Bottom Actions if not answered */}
            {!practiceIsAnswered && (
              <div className="mt-2 pt-3 border-t border-surface-container-high/40 flex items-center justify-between">
                <span className="text-xs text-secondary">
                  Tap an option to answer, or choose Ignore.
                </span>
                <button
                  onClick={handleClosePracticeQuiz}
                  className="text-xs text-error font-bold hover:underline"
                >
                  Ignore Question
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Target Exam Switcher Modal */}
      <ExamSwitchModal
        exams={exams}
        currentExamId={user?.preferred_examination_id || "exam-ssc-cgl"}
        isOpen={showExamModal}
        onClose={() => setShowExamModal(false)}
        onSelectExam={(exam) => {
          if (user) {
            fetch("/api/profile", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ preferred_examination_id: exam.id, target_exam: exam.name }),
            })
              .then((res) => res.json())
              .then((data) => {
                if (data.success) setUser(data.user);
              })
              .catch(() => {});
          }
        }}
      />
    </div>
  );
};

"use client";

import React, { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import {
  Zap,
  CheckCircle2,
  XCircle,
  RotateCw,
  Flame,
  Clock,
  Share2,
  ChevronUp,
  Brain,
  Award,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
} from "lucide-react";
import { APP_LOOP_URL } from "./LandingNavbar";

interface QuestionDemo {
  id: string;
  exam: string;
  subject: string;
  question: string;
  options: { id: string; label: string; text: string }[];
  correctId: string;
  explanation: string;
  negativePenalty: string;
}

const DEMO_QUESTIONS: QuestionDemo[] = [
  {
    id: "q1",
    exam: "SSC CGL (Tier-1) · 2024 PYQ",
    subject: "General Awareness",
    question: "Which Article of the Indian Constitution guarantees the 'Right to Constitutional Remedies'?",
    options: [
      { id: "A", label: "A", text: "Article 21" },
      { id: "B", label: "B", text: "Article 32" },
      { id: "C", label: "C", text: "Article 19" },
      { id: "D", label: "D", text: "Article 44" },
    ],
    correctId: "B",
    explanation: "Dr. B.R. Ambedkar called Article 32 the 'Heart and Soul' of the Constitution.",
    negativePenalty: "-0.50",
  },
  {
    id: "q2",
    exam: "RRB NTPC (Stage 1) · 2024 PYQ",
    subject: "General Intelligence & Reasoning",
    question: "If CLOUD is coded as 59, and RAIN is coded as 42, what will be the code for STORM?",
    options: [
      { id: "A", label: "A", text: "87" },
      { id: "B", label: "B", text: "89" },
      { id: "C", label: "C", text: "91" },
      { id: "D", label: "D", text: "94" },
    ],
    correctId: "C",
    explanation: "Sum of reverse positional alphabet values: S(8) + T(7) + O(12) + R(9) + M(14) = 50 + 41 = 91.",
    negativePenalty: "-0.33",
  },
  {
    id: "q3",
    exam: "NEET UG · Biology PYQ",
    subject: "Cell Biology",
    question: "Which cellular organelle is directly responsible for synthesizing ribosomal RNA (rRNA)?",
    options: [
      { id: "A", label: "A", text: "Nucleolus" },
      { id: "B", label: "B", text: "Golgi apparatus" },
      { id: "C", label: "C", text: "Centrosome" },
      { id: "D", label: "D", text: "Lysosome" },
    ],
    correctId: "A",
    explanation: "The nucleolus is the primary site for active rRNA transcription and ribosome assembly.",
    negativePenalty: "-1.00",
  },
];

export function DeviceMockupInteractive() {
  const [activeTab, setActiveTab] = useState<"loop" | "matrix" | "duel">("loop");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [timerProgress, setTimerProgress] = useState(100);
  const [streak, setStreak] = useState(5);
  const [autoRotate, setAutoRotate] = useState(false);

  const currentQ = DEMO_QUESTIONS[questionIndex];

  // 15-second countdown timer simulation for Reel solving
  useEffect(() => {
    if (activeTab !== "loop" || isAnswered) return;

    setTimerProgress(100);
    const interval = setInterval(() => {
      setTimerProgress((prev) => {
        if (prev <= 0) {
          clearInterval(interval);
          return 0;
        }
        return prev - 2;
      });
    }, 300);

    return () => clearInterval(interval);
  }, [questionIndex, isAnswered, activeTab]);

  const handleSelectOption = (optId: string) => {
    if (isAnswered) return;
    setSelectedOption(optId);
    setIsAnswered(true);

    if (optId === currentQ.correctId) {
      setStreak((s) => s + 1);
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 },
        colors: ["#10b981", "#a855f7", "#38bdf8"],
      });
    } else {
      setStreak(0);
    }
  };

  const nextQuestion = () => {
    setSelectedOption(null);
    setIsAnswered(false);
    setQuestionIndex((prev) => (prev + 1) % DEMO_QUESTIONS.length);
  };

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center">
      {/* Tab Switcher Selector */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-full bg-slate-900/90 border border-white/10 backdrop-blur-xl mb-6 shadow-xl shadow-purple-950/20">
        <button
          onClick={() => setActiveTab("loop")}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
            activeTab === "loop"
              ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/40"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-emerald-300" />
          <span>The Loop Feed</span>
        </button>

        <button
          onClick={() => setActiveTab("matrix")}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
            activeTab === "matrix"
              ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/40"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Brain className="w-3.5 h-3.5 text-purple-300" />
          <span>Spaced Matrix</span>
        </button>

        <button
          onClick={() => setActiveTab("duel")}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
            activeTab === "duel"
              ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/40"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Share2 className="w-3.5 h-3.5 text-emerald-300" />
          <span>1v1 WhatsApp Duel</span>
        </button>
      </div>

      {/* Titanium iPhone Device Frame */}
      <div className="relative w-full max-w-[340px] sm:max-w-[380px] aspect-[9/18.5] rounded-[52px] p-3.5 bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 shadow-[0_25px_80px_-15px_rgba(0,0,0,0.8),0_0_50px_rgba(168,85,247,0.25)] border-[3px] border-slate-600/60 ring-1 ring-white/10 group">
        {/* Outer Laser Sweep Glow Line */}
        <div className="absolute inset-0 rounded-[50px] overflow-hidden pointer-events-none">
          <div className="w-full h-24 bg-gradient-to-b from-transparent via-purple-500/15 to-transparent absolute -top-24 left-0 animate-laser-sweep" />
        </div>

        {/* Screen Bezel */}
        <div className="relative w-full h-full rounded-[40px] bg-[#090d16] overflow-hidden flex flex-col border border-white/10 text-white select-none">
          {/* Dynamic Island / Status Bar */}
          <div className="pt-3 px-6 pb-2 flex items-center justify-between z-20">
            <span className="text-[11px] font-semibold tracking-tight text-slate-300">
              09:41
            </span>
            {/* Dynamic Island Pill */}
            <div className="w-24 h-5 rounded-full bg-black border border-white/10 flex items-center justify-center gap-2 px-2 shadow-inner">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[9px] font-mono font-bold text-emerald-300 tracking-wider">
                QZ-LIVE
              </span>
            </div>
            {/* Icons */}
            <div className="flex items-center gap-1.5 text-[10px] text-slate-300">
              <span>5G</span>
              <div className="w-4 h-2 rounded-[2px] border border-slate-300 p-[1px] flex items-center">
                <div className="w-full h-full bg-emerald-400 rounded-[1px]" />
              </div>
            </div>
          </div>

          {/* TAB 1: THE LOOP FEED (REEL PRACTICE) */}
          {activeTab === "loop" && (
            <div className="flex-1 flex flex-col justify-between p-4 relative overflow-hidden animate-in fade-in duration-300">
              {/* Question Meta Header */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {currentQ.subject}
                  </span>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[11px] font-bold">
                    <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>Streak {streak}x</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 font-medium mb-1.5 flex items-center gap-1">
                  <span>{currentQ.exam}</span>
                </div>

                {/* Question Statement */}
                <h4 className="text-sm sm:text-base font-bold text-slate-100 leading-snug tracking-tight mb-2">
                  {currentQ.question}
                </h4>

                {/* 15-second Timer countdown bar */}
                <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden mb-3 border border-white/5">
                  <div
                    className={`h-full transition-all duration-300 ${
                      timerProgress > 40
                        ? "bg-gradient-to-r from-emerald-400 to-indigo-500"
                        : "bg-gradient-to-r from-amber-400 to-red-500"
                    }`}
                    style={{ width: `${timerProgress}%` }}
                  />
                </div>
              </div>

              {/* Clickable Options */}
              <div className="space-y-2 my-auto">
                {currentQ.options.map((opt) => {
                  const isSelected = selectedOption === opt.id;
                  const isCorrect = opt.id === currentQ.correctId;

                  let optStyles =
                    "bg-white/[0.04] border-white/10 text-slate-200 hover:bg-white/[0.08] hover:border-purple-500/40";

                  if (isAnswered) {
                    if (isCorrect) {
                      optStyles =
                        "bg-emerald-500/20 border-emerald-400 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.3)]";
                    } else if (isSelected) {
                      optStyles =
                        "bg-red-500/20 border-red-500 text-red-200 shadow-[0_0_15px_rgba(239,68,68,0.3)]";
                    } else {
                      optStyles = "opacity-40 bg-white/[0.02] border-white/5 text-slate-400";
                    }
                  }

                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleSelectOption(opt.id)}
                      disabled={isAnswered}
                      className={`w-full text-left p-2.5 rounded-xl border text-xs sm:text-sm font-medium transition-all duration-200 flex items-center justify-between ${optStyles}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-lg bg-black/40 flex items-center justify-center font-bold text-xs text-slate-300 border border-white/10">
                          {opt.label}
                        </span>
                        <span className="font-medium">{opt.text}</span>
                      </div>
                      {isAnswered && isCorrect && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                      {isAnswered && isSelected && !isCorrect && (
                        <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Instant Verification Feedback Card */}
              {isAnswered && (
                <div
                  className={`mt-2 p-2.5 rounded-xl border text-xs animate-in slide-in-from-bottom-2 duration-200 ${
                    selectedOption === currentQ.correctId
                      ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                      : "bg-red-950/40 border-red-500/40 text-red-300"
                  }`}
                >
                  <div className="flex items-center justify-between font-bold text-[11px] mb-1">
                    <span>
                      {selectedOption === currentQ.correctId
                        ? "✓ Correct (+2.00 Marks)"
                        : `✗ Wrong (${currentQ.negativePenalty} Negative)`}
                    </span>
                    <span className="text-[10px] text-slate-400">TCS Pattern</span>
                  </div>
                  <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                    {currentQ.explanation}
                  </p>
                </div>
              )}

              {/* Swipe Up for Next Question */}
              <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                  <Clock className="w-3 h-3 text-purple-400" />
                  <span>15s Micro-Sprint</span>
                </span>

                <button
                  onClick={nextQuestion}
                  className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-emerald-500 hover:from-purple-500 hover:to-emerald-400 text-white text-[11px] font-bold flex items-center gap-1 shadow-md shadow-purple-500/30 transition-all"
                >
                  <span>Next Question</span>
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: SPACED MATRIX (RETENTION & HEATMAP) */}
          {activeTab === "matrix" && (
            <div className="flex-1 flex flex-col justify-between p-4 animate-in fade-in duration-300">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h5 className="font-extrabold text-sm text-slate-100">
                      Syllabus Mastery Radar
                    </h5>
                    <p className="text-[10px] text-slate-400">
                      Spaced Repetition Algorithm (Asia/Kolkata)
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                    <Brain className="w-4 h-4 text-purple-300" />
                  </div>
                </div>

                {/* Progress bars */}
                <div className="space-y-3 my-4">
                  <div>
                    <div className="flex justify-between text-[11px] font-medium mb-1">
                      <span className="text-slate-300">General Awareness</span>
                      <span className="text-emerald-400 font-bold">84% Accuracy</span>
                    </div>
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-400 rounded-full w-[84%]" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] font-medium mb-1">
                      <span className="text-slate-300">General Intelligence (Reasoning)</span>
                      <span className="text-purple-400 font-bold">92% Accuracy</span>
                    </div>
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-400 rounded-full w-[92%]" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] font-medium mb-1">
                      <span className="text-slate-300">Quantitative Aptitude</span>
                      <span className="text-amber-400 font-bold">68% (Weakness)</span>
                    </div>
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full w-[68%]" />
                    </div>
                  </div>
                </div>

                {/* Re-queue Diagnostic Alert */}
                <div className="p-3 rounded-xl bg-purple-900/30 border border-purple-500/30 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-purple-200 mb-1">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span>Spaced Repetition Triggered</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-snug">
                    3 questions failed in Profit & Loss re-queued to your feed in 24 hours.
                    Active recall locked.
                  </p>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block">Today's Solved</span>
                  <span className="text-base font-extrabold text-white">48 Questions</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Net Mock Score</span>
                  <span className="text-base font-extrabold text-emerald-400">+88.50</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: 1V1 PEER DUEL (WHATSAPP DUEL) */}
          {activeTab === "duel" && (
            <div className="flex-1 flex flex-col justify-between p-4 animate-in fade-in duration-300">
              <div>
                <div className="text-center mb-4">
                  <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 inline-flex items-center gap-1 mb-2">
                    <Award className="w-3 h-3" />
                    <span>WhatsApp Speed Duel</span>
                  </span>
                  <h5 className="font-extrabold text-base text-slate-100">
                    Live Aspirant Challenge
                  </h5>
                  <p className="text-[11px] text-slate-400">
                    Send 5 questions to your library study partner
                  </p>
                </div>

                {/* Duel Matchup Card */}
                <div className="p-3 rounded-2xl bg-gradient-to-b from-purple-900/30 to-slate-900/40 border border-purple-500/30 space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center">
                        YOU
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white block">You</span>
                        <span className="text-[10px] text-emerald-400 font-semibold">
                          4/5 Correct · 38s
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-black text-emerald-400">WINNER 🏆</span>
                  </div>

                  <div className="w-full h-[1px] bg-white/10" />

                  <div className="flex items-center justify-between opacity-80">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-purple-600 text-white font-black text-xs flex items-center justify-center">
                        RK
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white block">
                          Rahul (Patna)
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold">
                          3/5 Correct · 49s
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-400">-0.50 Penalty</span>
                  </div>
                </div>
              </div>

              {/* Share Duel Button */}
              <a
                href={APP_LOOP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-slate-950 text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
              >
                <Share2 className="w-4 h-4" />
                <span>Create & Share Duel on WhatsApp</span>
              </a>
            </div>
          )}

          {/* Device Bottom Home Bar */}
          <div className="pb-2 pt-1 flex justify-center">
            <div className="w-28 h-1 rounded-full bg-slate-600/80" />
          </div>
        </div>
      </div>

      {/* Direct CTA shortcut under mockup */}
      <div className="mt-6 flex flex-col items-center">
        <a
          href={APP_LOOP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors group"
        >
          <span>Open Full Real-Time WebApp at qz-loop.vercel.app</span>
          <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </a>
        <span className="text-[11px] text-slate-400 mt-1">
          No sign up required to test the first 25 questions
        </span>
      </div>
    </div>
  );
}

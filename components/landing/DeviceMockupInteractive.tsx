"use client";

import React, { useState, useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import {
  Zap,
  CheckCircle2,
  XCircle,
  Flame,
  Clock,
  Share2,
  ChevronUp,
  Brain,
  Award,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  RotateCw,
  Calculator,
  ShieldCheck,
  Check,
  X,
  BookOpen,
} from "lucide-react";
import { APP_LOOP_URL } from "./LandingNavbar";

interface QuestionDemo {
  id: string;
  exam: string;
  category: "NEET" | "JEE" | "UPSC" | "SSC";
  subject: string;
  question: string;
  options: { id: string; label: string; text: string }[];
  correctId: string;
  explanation: string;
  negativePenalty: string;
  marksAwarded: string;
}

const DEMO_QUESTIONS: QuestionDemo[] = [
  {
    id: "q1",
    exam: "NEET UG · Biology",
    category: "NEET",
    subject: "Cell Biology",
    question: "Which cellular organelle is directly responsible for synthesizing ribosomal RNA (rRNA)?",
    options: [
      { id: "A", label: "A", text: "Nucleolus" },
      { id: "B", label: "B", text: "Golgi apparatus" },
      { id: "C", label: "C", text: "Centrosome" },
      { id: "D", label: "D", text: "Lysosome" },
    ],
    correctId: "A",
    explanation: "NCERT Class 11 Biology: The nucleolus is the dense non-membrane bound site within the nucleus where active rRNA transcription and ribosomal subunit assembly occurs.",
    negativePenalty: "-1.00",
    marksAwarded: "+4.00",
  },
  {
    id: "q2",
    exam: "JEE Main · Physics",
    category: "JEE",
    subject: "Electrostatics",
    question: "What is the dimensional formula of Electric Potential (V)?",
    options: [
      { id: "A", label: "A", text: "[M L² T⁻³ A⁻¹]" },
      { id: "B", label: "B", text: "[M L T⁻² A⁻¹]" },
      { id: "C", label: "C", text: "[M L² T⁻² A]" },
      { id: "D", label: "D", text: "[M L³ T⁻³ A⁻¹]" },
    ],
    correctId: "A",
    explanation: "Potential V = Work / Charge = [M L² T⁻²] / [A T] = [M L² T⁻³ A⁻¹]. Repeatedly tested formula in JEE Main Session 1.",
    negativePenalty: "-1.00",
    marksAwarded: "+4.00",
  },
  {
    id: "q3",
    exam: "UPSC CSE · Indian Polity",
    category: "UPSC",
    subject: "Constitution & Polity",
    question: "Which Constitutional Amendment Act added the 'Right to Education' under Article 21A?",
    options: [
      { id: "A", label: "A", text: "44th Amendment Act" },
      { id: "B", label: "B", text: "86th Amendment Act, 2002" },
      { id: "C", label: "C", text: "73rd Amendment Act" },
      { id: "D", label: "D", text: "91st Amendment Act" },
    ],
    correctId: "B",
    explanation: "The 86th Constitutional Amendment Act, 2002 inserted Article 21A, providing free and compulsory education to children aged 6 to 14.",
    negativePenalty: "-0.66",
    marksAwarded: "+2.00",
  },
  {
    id: "q4",
    exam: "SSC CGL · Quantitative Aptitude",
    category: "SSC",
    subject: "Quant & Arithmetic",
    question: "If A completes work in 12 days and B in 24 days, in how many days can they finish it together?",
    options: [
      { id: "A", label: "A", text: "6 Days" },
      { id: "B", label: "B", text: "8 Days" },
      { id: "C", label: "C", text: "10 Days" },
      { id: "D", label: "D", text: "16 Days" },
    ],
    correctId: "B",
    explanation: "Combined efficiency = 1/12 + 1/24 = 3/24 = 1/8. Total time = 8 days. Essential speed shortcut for SSC CGL Tier-1.",
    negativePenalty: "-0.50",
    marksAwarded: "+2.00",
  },
];

export function DeviceMockupInteractive() {
  const [activeTab, setActiveTab] = useState<"loop" | "converter" | "duel">("loop");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [timerProgress, setTimerProgress] = useState(100);
  const [streak, setStreak] = useState(7);
  const [isAnimatingNext, setIsAnimatingNext] = useState(false);
  const [shakeScreen, setShakeScreen] = useState(false);
  const [screenTimeMinutes, setScreenTimeMinutes] = useState(45);
  const [showExplanation, setShowExplanation] = useState(false);

  // Swipe gesture tracking
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartY = useRef(0);

  // 3D perspective mouse tilt
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const deviceRef = useRef<HTMLDivElement>(null);

  const currentQ = DEMO_QUESTIONS[questionIndex];

  // 15-second countdown timer simulation
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
        particleCount: 50,
        spread: 70,
        origin: { y: 0.65 },
        colors: ["#10b981", "#a855f7", "#38bdf8", "#f59e0b"],
      });
    } else {
      setStreak(0);
      setShakeScreen(true);
      setTimeout(() => setShakeScreen(false), 500);
    }
  };

  const nextQuestion = () => {
    setIsAnimatingNext(true);
    setDragY(0);
    setTimeout(() => {
      setSelectedOption(null);
      setIsAnswered(false);
      setShowExplanation(false);
      setQuestionIndex((prev) => (prev + 1) % DEMO_QUESTIONS.length);
      setIsAnimatingNext(false);
    }, 220);
  };

  // Swipe drag gestures (Touch & Mouse)
  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    touchStartY.current = clientY;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging) return;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const delta = clientY - touchStartY.current;
    if (delta < 0) {
      // Swiping upward
      setDragY(Math.max(-120, delta));
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (dragY < -35) {
      // Completed upward swipe
      nextQuestion();
    } else {
      setDragY(0);
    }
  };

  // Wheel scroll gesture over mockup
  const handleWheel = (e: React.WheelEvent) => {
    if (activeTab === "loop" && e.deltaY > 25 && !isAnimatingNext) {
      nextQuestion();
    }
  };

  // Subtle 3D perspective mouse tilt
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!deviceRef.current) return;
    const rect = deviceRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -5;
    const rotateY = ((x - centerX) / centerX) * 5;
    setTilt({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    if (isDragging) handleTouchEnd();
  };

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center">
      {/* Tab Switcher Selector */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-full bg-slate-900/90 border border-white/10 backdrop-blur-xl mb-6 shadow-xl shadow-purple-950/20 max-w-full overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab("loop")}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 ${
            activeTab === "loop"
              ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/40"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-emerald-300" />
          <span>Interactive Reel</span>
        </button>

        <button
          onClick={() => setActiveTab("converter")}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 ${
            activeTab === "converter"
              ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/40"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Calculator className="w-3.5 h-3.5 text-purple-300" />
          <span>Screen-Time Converter</span>
        </button>

        <button
          onClick={() => setActiveTab("duel")}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 ${
            activeTab === "duel"
              ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/40"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Share2 className="w-3.5 h-3.5 text-[#25D366]" />
          <span>WhatsApp Duel</span>
        </button>
      </div>

      {/* Titanium iPhone Device Frame with 3D perspective */}
      <div
        ref={deviceRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onWheel={handleWheel}
        style={{
          transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transition: isDragging ? "none" : "transform 0.15s ease-out",
        }}
        className={`relative w-full max-w-[340px] sm:max-w-[380px] aspect-[9/18.5] rounded-[52px] p-3.5 bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 shadow-[0_25px_80px_-15px_rgba(0,0,0,0.8),0_0_50px_rgba(168,85,247,0.25)] border-[3px] border-slate-600/60 ring-1 ring-white/10 group ${
          shakeScreen ? "animate-shake" : ""
        }`}
      >
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
            <div className="w-24 h-5 rounded-full bg-black border border-white/10 flex items-center justify-center gap-2 px-2 shadow-inner">
              <div className="w-2 rounded-full h-2 bg-emerald-400 animate-pulse" />
              <span className="text-[9px] font-mono font-bold text-emerald-300 tracking-wider">
                QZ-LIVE
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-300 font-mono">
              <span>5G</span>
              <div className="w-4 h-2 rounded-[2px] border border-slate-300 p-[1px] flex items-center">
                <div className="w-full h-full bg-emerald-400 rounded-[1px]" />
              </div>
            </div>
          </div>

          {/* TAB 1: THE INTERACTIVE REEL FEED (WITH REAL DRAG SWIPE) */}
          {activeTab === "loop" && (
            <div
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onMouseDown={handleTouchStart}
              onMouseMove={handleTouchMove}
              onMouseUp={handleTouchEnd}
              className={`flex-1 flex flex-col justify-between p-4 relative overflow-hidden transition-all duration-200 cursor-grab active:cursor-grabbing ${
                isAnimatingNext ? "-translate-y-8 opacity-0" : ""
              }`}
              style={{
                transform: !isAnimatingNext ? `translateY(${dragY}px)` : undefined,
                opacity: !isAnimatingNext ? 1 - Math.abs(dragY) / 180 : undefined,
              }}
            >
              {/* Question Meta Header & Exam Switcher */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    {DEMO_QUESTIONS.map((q, idx) => (
                      <button
                        key={q.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setQuestionIndex(idx);
                          setSelectedOption(null);
                          setIsAnswered(false);
                          setShowExplanation(false);
                        }}
                        className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md transition-all ${
                          idx === questionIndex
                            ? "bg-purple-600 text-white shadow-sm"
                            : "bg-white/5 text-slate-400 hover:text-white"
                        }`}
                      >
                        {q.category}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] font-bold">
                    <Flame className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span>Streak {streak}x</span>
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 font-medium mb-1 flex items-center justify-between">
                  <span>{currentQ.exam}</span>
                  <span className="text-emerald-400 font-mono text-[9px]">{currentQ.marksAwarded} / {currentQ.negativePenalty}</span>
                </div>

                {/* Question Statement */}
                <h4 className="text-xs sm:text-sm font-bold text-slate-100 leading-snug tracking-tight mb-2">
                  {currentQ.question}
                </h4>

                {/* 15-second Timer countdown bar */}
                <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden mb-2 border border-white/5">
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
              <div className="space-y-1.5 my-auto">
                {currentQ.options.map((opt) => {
                  const isSelected = selectedOption === opt.id;
                  const isCorrect = opt.id === currentQ.correctId;

                  let optStyles =
                    "bg-white/[0.04] border-white/10 text-slate-200 hover:bg-white/[0.08] hover:border-purple-500/40";

                  if (isAnswered) {
                    if (isCorrect) {
                      optStyles =
                        "bg-emerald-500/25 border-emerald-400 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.35)]";
                    } else if (isSelected) {
                      optStyles =
                        "bg-rose-500/25 border-rose-500 text-rose-200 shadow-[0_0_15px_rgba(244,63,94,0.35)]";
                    } else {
                      optStyles = "opacity-35 bg-white/[0.02] border-white/5 text-slate-400";
                    }
                  }

                  return (
                    <button
                      key={opt.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectOption(opt.id);
                      }}
                      disabled={isAnswered}
                      className={`w-full text-left p-2 rounded-xl border text-xs font-medium transition-all duration-200 flex items-center justify-between ${optStyles}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-lg bg-black/40 flex items-center justify-center font-bold text-[10px] text-slate-300 border border-white/10 shrink-0">
                          {opt.label}
                        </span>
                        <span className="leading-tight">{opt.text}</span>
                      </div>
                      {isAnswered && isCorrect && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                      {isAnswered && isSelected && !isCorrect && (
                        <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Instant Verification Feedback Card */}
              {isAnswered && (
                <div
                  className={`mt-1.5 p-2 rounded-xl border text-xs animate-in slide-in-from-bottom-2 duration-200 ${
                    selectedOption === currentQ.correctId
                      ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                      : "bg-rose-950/40 border-rose-500/40 text-rose-300"
                  }`}
                >
                  <div className="flex items-center justify-between font-bold text-[10px] mb-1">
                    <span className="flex items-center gap-1">
                      {selectedOption === currentQ.correctId ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Correct ({currentQ.marksAwarded} Marks)</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5 text-rose-400" />
                          <span>Wrong ({currentQ.negativePenalty} Penalty)</span>
                        </>
                      )}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowExplanation((prev) => !prev);
                      }}
                      className="text-[9px] underline text-slate-300 hover:text-white"
                    >
                      {showExplanation ? "Hide Proof" : "View Proof"}
                    </button>
                  </div>
                  {showExplanation && (
                    <p className="text-[10px] text-slate-300 leading-snug animate-in fade-in pt-1 border-t border-white/10">
                      {currentQ.explanation}
                    </p>
                  )}
                </div>
              )}

              {/* Swipe Up Gesture Cue & Next Button */}
              <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                <span className="text-[9px] text-slate-400 flex items-center gap-1 font-medium">
                  <ChevronUp className="w-3.5 h-3.5 text-purple-400 animate-bounce" />
                  <span>Swipe up for next</span>
                </span>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    nextQuestion();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-emerald-500 hover:from-purple-500 hover:to-emerald-400 text-white text-[10px] font-bold flex items-center gap-1 shadow-md shadow-purple-500/30 transition-all active:scale-95"
                >
                  <span>Next Reel</span>
                  <ChevronUp className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: SCREEN-TIME TO MCQ CONVERTER */}
          {activeTab === "converter" && (
            <div className="flex-1 flex flex-col justify-between p-4 animate-in fade-in duration-300">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase">
                    Habit Calculator
                  </span>
                  <span className="text-[10px] text-slate-400">Doomscroll Converter</span>
                </div>

                <h4 className="text-sm font-extrabold text-white mb-1">
                  How much do you scroll?
                </h4>
                <p className="text-[10px] text-slate-400 mb-3">
                  Convert daily Instagram Reels or YouTube Shorts into high-yield PYQs.
                </p>

                {/* Slider */}
                <div className="p-3 rounded-2xl bg-slate-900/60 border border-white/10 mb-3">
                  <div className="flex justify-between items-center text-xs mb-2">
                    <span className="text-slate-300 font-medium text-[11px]">Daily Screen Time:</span>
                    <span className="font-mono font-bold text-emerald-400 text-xs">
                      {screenTimeMinutes} Minutes
                    </span>
                  </div>
                  <input
                    type="range"
                    min={15}
                    max={120}
                    step={15}
                    value={screenTimeMinutes}
                    onChange={(e) => setScreenTimeMinutes(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                  <div className="flex justify-between text-[9px] text-slate-500 font-mono mt-1">
                    <span>15m (Chai Break)</span>
                    <span>60m</span>
                    <span>120m (Hostel Scroll)</span>
                  </div>
                </div>

                {/* Converted Stats */}
                <div className="grid grid-cols-2 gap-2 text-center mb-3">
                  <div className="p-2.5 rounded-xl bg-purple-950/30 border border-purple-500/20">
                    <span className="text-[9px] text-slate-400 block mb-0.5">Daily Solved</span>
                    <span className="text-sm font-black text-purple-300 font-mono">
                      {screenTimeMinutes * 4} MCQs
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/20">
                    <span className="text-[9px] text-slate-400 block mb-0.5">Yearly PYQs</span>
                    <span className="text-sm font-black text-emerald-300 font-mono">
                      {(screenTimeMinutes * 4 * 365).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[10px] leading-snug">
                  ✨ <strong>National Cutoff Impact:</strong> Solving {(screenTimeMinutes * 4).toLocaleString()} questions daily puts you in the <strong>Top 0.5%</strong> of aspirants nationwide.
                </div>
              </div>

              <a
                href={APP_LOOP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-purple-600/30 transition-all"
              >
                <span>Practice 25 Questions Free</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {/* TAB 3: 1V1 PEER DUEL (WHATSAPP DUEL) */}
          {activeTab === "duel" && (
            <div className="flex-1 flex flex-col justify-between p-4 animate-in fade-in duration-300">
              <div>
                <div className="text-center mb-3">
                  <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 inline-flex items-center gap-1 mb-1.5">
                    <Award className="w-3 h-3" />
                    <span>WhatsApp Speed Duel</span>
                  </span>
                  <h5 className="font-extrabold text-xs sm:text-sm text-slate-100">
                    Hostel & Library Challenge
                  </h5>
                  <p className="text-[10px] text-slate-400">
                    Challenge your study partner with 5 timed NCERT questions
                  </p>
                </div>

                {/* Duel Matchup Card */}
                <div className="p-3 rounded-2xl bg-gradient-to-b from-purple-900/30 to-slate-900/40 border border-purple-500/30 space-y-2 mb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 font-black text-[10px] flex items-center justify-center">
                        YOU
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-white block">You</span>
                        <span className="text-[9px] text-emerald-400 font-semibold">
                          4/5 Correct · +15 Marks
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-black text-emerald-400">FASTER 🏆</span>
                  </div>

                  <div className="w-full h-[1px] bg-white/10" />

                  <div className="flex items-center justify-between opacity-80">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-purple-600 text-white font-black text-[10px] flex items-center justify-center">
                        SP
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-white block">
                          Study Partner
                        </span>
                        <span className="text-[9px] text-slate-400 font-semibold">
                          3/5 Correct · +11 Marks
                        </span>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold text-rose-400">-1.00 Penalty</span>
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-slate-900 border border-white/5 text-[10px] text-slate-400 leading-snug">
                  Friends click and answer directly on WhatsApp with zero app installation needed!
                </div>
              </div>

              {/* Share Duel Button */}
              <a
                href={APP_LOOP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-slate-950 text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Create WhatsApp Duel</span>
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
      <div className="mt-6 flex flex-col items-center text-center">
        <a
          href={APP_LOOP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors group"
        >
          <span>Open Full Practice Feed at qz-loop.vercel.app</span>
          <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </a>
        <span className="text-[11px] text-slate-400 mt-1">
          No sign up required to test the first 25 questions
        </span>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import {
  Flame,
  CheckCircle2,
  XCircle,
  ChevronUp,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import { OFFICIAL_PLAYSTORE_URL } from "./LandingNavbar";

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
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [timerProgress, setTimerProgress] = useState(100);
  const [streak, setStreak] = useState(7);
  const [isAnimatingNext, setIsAnimatingNext] = useState(false);
  const [shakeScreen, setShakeScreen] = useState(false);
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
    if (isAnswered) return;

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
  }, [questionIndex, isAnswered]);

  const handleSelectOption = (optId: string) => {
    if (isAnswered) return;
    setSelectedOption(optId);
    setIsAnswered(true);

    if (optId === currentQ.correctId) {
      setStreak((s) => s + 1);
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.6 },
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
    }, 200);
  };

  // Swipe drag gestures
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
      setDragY(Math.max(-100, delta));
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (dragY < -30) {
      nextQuestion();
    } else {
      setDragY(0);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.deltaY > 25 && !isAnimatingNext) {
      nextQuestion();
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!deviceRef.current) return;
    const rect = deviceRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -4;
    const rotateY = ((x - centerX) / centerX) * 4;
    setTilt({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    if (isDragging) handleTouchEnd();
  };

  return (
    <div className="w-full max-w-sm sm:max-w-md mx-auto flex flex-col items-center">
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
        className={`relative w-full max-w-[320px] sm:max-w-[350px] aspect-[9/18.5] rounded-[48px] p-3 bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 shadow-[0_25px_70px_-15px_rgba(0,0,0,0.85),0_0_40px_rgba(168,85,247,0.2)] border-[3px] border-slate-600/50 ring-1 ring-white/10 ${
          shakeScreen ? "animate-shake" : ""
        }`}
      >
        {/* Outer Laser Sweep Glow Line */}
        <div className="absolute inset-0 rounded-[46px] overflow-hidden pointer-events-none">
          <div className="w-full h-20 bg-gradient-to-b from-transparent via-purple-500/10 to-transparent absolute -top-20 left-0 animate-laser-sweep" />
        </div>

        {/* Screen Bezel */}
        <div className="relative w-full h-full rounded-[38px] bg-[#07090e] overflow-hidden flex flex-col border border-white/10 text-white select-none">
          {/* Dynamic Island / Status Bar */}
          <div className="pt-2.5 px-5 pb-1 flex items-center justify-between z-20">
            <span className="text-[10px] font-semibold text-slate-300">09:41</span>
            <div className="w-20 h-4 rounded-full bg-black border border-white/10 flex items-center justify-center gap-1.5 px-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[8px] font-mono font-bold text-emerald-300 tracking-wider">
                QZ-LIVE
              </span>
            </div>
            <div className="flex items-center gap-1 text-[9px] text-slate-300 font-mono">
              <span>5G</span>
              <div className="w-3.5 h-1.5 rounded-[2px] border border-slate-300 p-[1px] flex items-center">
                <div className="w-full h-full bg-emerald-400 rounded-[1px]" />
              </div>
            </div>
          </div>

          {/* Interactive Reel Feed */}
          <div
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleTouchStart}
            onMouseMove={handleTouchMove}
            onMouseUp={handleTouchEnd}
            className={`flex-1 flex flex-col justify-between p-3.5 relative overflow-hidden transition-all duration-200 cursor-grab active:cursor-grabbing ${
              isAnimatingNext ? "-translate-y-8 opacity-0" : ""
            }`}
            style={{
              transform: !isAnimatingNext ? `translateY(${dragY}px)` : undefined,
              opacity: !isAnimatingNext ? 1 - Math.abs(dragY) / 160 : undefined,
            }}
          >
            {/* Header: Exam Switcher & Streak */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1">
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
                      className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded transition-all ${
                        idx === questionIndex
                          ? "bg-purple-600 text-white"
                          : "bg-white/5 text-slate-400 hover:text-white"
                      }`}
                    >
                      {q.category}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/20 text-amber-300 text-[9px] font-bold">
                  <Flame className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                  <span>{streak}x</span>
                </div>
              </div>

              <div className="text-[9px] text-slate-400 font-medium mb-1 flex items-center justify-between">
                <span>{currentQ.exam}</span>
                <span className="text-emerald-400 font-mono text-[8px] font-bold">
                  {currentQ.marksAwarded} / {currentQ.negativePenalty}
                </span>
              </div>

              {/* Question Statement */}
              <h4 className="text-xs font-bold text-slate-100 leading-snug tracking-tight mb-2">
                {currentQ.question}
              </h4>

              {/* 15-second Timer countdown bar */}
              <div className="w-full bg-slate-800/80 rounded-full h-1 overflow-hidden mb-2 border border-white/5">
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
            <div className="space-y-1 my-auto">
              {currentQ.options.map((opt) => {
                const isSelected = selectedOption === opt.id;
                const isCorrect = opt.id === currentQ.correctId;

                let optStyles =
                  "bg-white/[0.04] border-white/10 text-slate-200 hover:bg-white/[0.08]";

                if (isAnswered) {
                  if (isCorrect) {
                    optStyles =
                      "bg-emerald-500/25 border-emerald-400 text-emerald-200 shadow-[0_0_12px_rgba(16,185,129,0.3)]";
                  } else if (isSelected) {
                    optStyles =
                      "bg-rose-500/25 border-rose-500 text-rose-200 shadow-[0_0_12px_rgba(244,63,94,0.3)]";
                  } else {
                    optStyles = "opacity-30 bg-white/[0.02] border-white/5 text-slate-400";
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
                    className={`w-full text-left p-1.5 rounded-xl border text-[11px] font-medium transition-all duration-150 flex items-center justify-between ${optStyles}`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-md bg-black/40 flex items-center justify-center font-bold text-[9px] text-slate-300 border border-white/10 shrink-0">
                        {opt.label}
                      </span>
                      <span className="leading-tight">{opt.text}</span>
                    </div>
                    {isAnswered && isCorrect && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    )}
                    {isAnswered && isSelected && !isCorrect && (
                      <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Instant Verification Feedback Card */}
            {isAnswered && (
              <div
                className={`p-1.5 rounded-xl border text-[10px] animate-in slide-in-from-bottom-1 duration-150 ${
                  selectedOption === currentQ.correctId
                    ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                    : "bg-rose-950/40 border-rose-500/40 text-rose-300"
                }`}
              >
                <div className="flex items-center justify-between font-bold text-[9px]">
                  <span className="flex items-center gap-1">
                    {selectedOption === currentQ.correctId ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>Correct ({currentQ.marksAwarded} Marks)</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3 text-rose-400" />
                        <span>Wrong ({currentQ.negativePenalty} Penalty)</span>
                      </>
                    )}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowExplanation((prev) => !prev);
                    }}
                    className="underline text-slate-300 hover:text-white"
                  >
                    {showExplanation ? "Hide" : "Proof"}
                  </button>
                </div>
                {showExplanation && (
                  <p className="text-[9px] text-slate-300 leading-tight pt-1 mt-1 border-t border-white/10">
                    {currentQ.explanation}
                  </p>
                )}
              </div>
            )}

            {/* Swipe Up Gesture Cue & Next Button */}
            <div className="pt-1.5 border-t border-white/10 flex items-center justify-between">
              <span className="text-[8px] text-slate-400 flex items-center gap-0.5">
                <ChevronUp className="w-3 h-3 text-purple-400 animate-bounce" />
                <span>Swipe up</span>
              </span>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  nextQuestion();
                }}
                className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-purple-600 to-emerald-500 hover:from-purple-500 hover:to-emerald-400 text-white text-[9px] font-bold flex items-center gap-1 shadow transition-all active:scale-95"
              >
                <span>Next Reel</span>
                <ChevronUp className="w-2.5 h-2.5" />
              </button>
            </div>
          </div>

          {/* Device Bottom Home Bar */}
          <div className="pb-1.5 pt-0.5 flex justify-center">
            <div className="w-24 h-1 rounded-full bg-slate-600/80" />
          </div>
        </div>
      </div>

      {/* Google Play Store link */}
      <div className="mt-4 text-center">
        <a
          href={OFFICIAL_PLAYSTORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors"
        >
          <span>Available exclusively on Android &bull; Get on Google Play</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}

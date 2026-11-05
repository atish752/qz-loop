"use client";

import React, { useState, useEffect } from "react";
import { Target, Calendar, Zap, CheckCircle2, XCircle, RotateCcw } from "lucide-react";

export function LandingHabitEngine() {
  // Boost 15s trial state
  const [boostTimer, setBoostTimer] = useState(15);
  const [boostAnswered, setBoostAnswered] = useState<"correct" | "wrong" | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (boostAnswered === null && boostTimer > 0) {
      interval = setInterval(() => {
        setBoostTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [boostAnswered, boostTimer]);

  const resetBoost = () => {
    setBoostTimer(15);
    setBoostAnswered(null);
  };

  return (
    <section id="habit-engine" className="py-20 md:py-28 relative overflow-hidden bg-[#05070c]">
      {/* Radiant ambient aura */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-r from-purple-700/15 via-indigo-600/10 to-emerald-500/15 rounded-full blur-[140px] pointer-events-none -z-10" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Apple-Style Section Header */}
        <div className="text-center max-w-xl mx-auto mb-14">
          <span className="text-[11px] font-mono font-bold text-purple-400 uppercase tracking-widest block mb-2">
            The Science of Consistency
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-[1.08]">
            The Habit Engine. <br />
            <span className="bg-gradient-to-r from-purple-400 via-indigo-200 to-emerald-400 bg-clip-text text-transparent">
              /goal · /plan · /boost
            </span>
          </h2>
        </div>

        {/* 3 Pillar Bento Grid with Pictorial SVGs & Minimal Words */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Pillar 1: /goal */}
          <div className="p-7 sm:p-8 rounded-3xl bg-white/[0.02] border border-white/10 hover:border-purple-500/40 transition-all duration-300 flex flex-col justify-between group shadow-xl">
            <div>
              <div className="flex items-center justify-between mb-5">
                <span className="font-mono text-xs font-bold text-purple-400 tracking-wider">
                  /goal
                </span>
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                  <Target className="w-4 h-4 text-purple-400" />
                </div>
              </div>

              <h3 className="text-xl sm:text-2xl font-black text-white mb-2 tracking-tight">
                The 10-Minute Loop
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
                25 high-yield questions during tea or transit. 9,125 PYQs conquered every year.
              </p>

              {/* Pictorial SVG: Radial Habit Progress Ring */}
              <div className="py-2 flex flex-col items-center justify-center">
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      className="text-slate-800"
                      strokeWidth="8"
                      stroke="currentColor"
                      fill="transparent"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      className="text-purple-500"
                      strokeWidth="8"
                      strokeDasharray={251.2}
                      strokeDashoffset={25.1} // ~90% complete
                      strokeLinecap="round"
                      stroke="url(#purpleGradient)"
                      fill="transparent"
                    />
                    <defs>
                      <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#a855f7" />
                        <stop offset="100%" stopColor="#38bdf8" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute text-center">
                    <span className="text-2xl font-black text-white font-mono block">25/25</span>
                    <span className="text-[10px] text-slate-400 uppercase font-mono">Questions</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-5 border-t border-white/5 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Target</span>
              <span className="font-bold text-purple-300">Daily Streak Unlocked</span>
            </div>
          </div>

          {/* Pillar 2: /plan */}
          <div className="p-7 sm:p-8 rounded-3xl bg-white/[0.02] border border-white/10 hover:border-emerald-500/40 transition-all duration-300 flex flex-col justify-between group shadow-xl">
            <div>
              <div className="flex items-center justify-between mb-5">
                <span className="font-mono text-xs font-bold text-emerald-400 tracking-wider">
                  /plan
                </span>
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-emerald-400" />
                </div>
              </div>

              <h3 className="text-xl sm:text-2xl font-black text-white mb-2 tracking-tight">
                Spaced Recall
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
                Missed questions resurface at 24h, 3d, and 7d. Never waste time on duplicates.
              </p>

              {/* Pictorial SVG: Memory Retention Curve */}
              <div className="py-2 flex flex-col items-center justify-center">
                <div className="w-full max-w-[220px] h-32 relative flex items-center justify-center">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 200 100">
                    {/* Gridlines */}
                    <line x1="10" y1="90" x2="190" y2="90" stroke="#334155" strokeWidth="1" />
                    <line x1="10" y1="10" x2="10" y2="90" stroke="#334155" strokeWidth="1" />

                    {/* Fading curve without spaced recall (red dashed) */}
                    <path
                      d="M 10 20 Q 50 85, 190 88"
                      fill="none"
                      stroke="#f43f5e"
                      strokeWidth="1.5"
                      strokeDasharray="4 4"
                      className="opacity-40"
                    />

                    {/* Qz-Loop Spaced repetition curve (luminous emerald) */}
                    <path
                      d="M 10 20 Q 35 45, 60 20 Q 95 38, 120 18 Q 155 30, 190 15"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2.5"
                    />

                    {/* Spaced intervals nodes */}
                    <circle cx="60" cy="20" r="4" fill="#10b981" />
                    <circle cx="120" cy="18" r="4" fill="#10b981" />
                    <circle cx="190" cy="15" r="4" fill="#10b981" />

                    {/* Labels */}
                    <text x="50" y="36" fill="#94a3b8" fontSize="8" fontFamily="monospace">24h</text>
                    <text x="110" y="34" fill="#94a3b8" fontSize="8" fontFamily="monospace">3d</text>
                    <text x="175" y="32" fill="#34d399" fontSize="8" fontFamily="monospace" fontWeight="bold">7d</text>
                  </svg>
                </div>
              </div>
            </div>

            <div className="pt-5 border-t border-white/5 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Retention</span>
              <span className="font-bold text-emerald-300">95% Long-Term Lock</span>
            </div>
          </div>

          {/* Pillar 3: /boost */}
          <div className="p-7 sm:p-8 rounded-3xl bg-white/[0.02] border border-white/10 hover:border-indigo-500/40 transition-all duration-300 flex flex-col justify-between group shadow-xl">
            <div>
              <div className="flex items-center justify-between mb-5">
                <span className="font-mono text-xs font-bold text-indigo-400 tracking-wider">
                  /boost
                </span>
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-indigo-400" />
                </div>
              </div>

              <h3 className="text-xl sm:text-2xl font-black text-white mb-2 tracking-tight">
                15s Real Pressure
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
                Official NTA negative penalty (+4 / -1). Eliminates reckless guesswork.
              </p>

              {/* Interactive Mini Boost Trial */}
              <div className="p-3 rounded-2xl bg-[#090d16] border border-indigo-500/20">
                <div className="flex justify-between items-center text-xs mb-2">
                  <span className="text-slate-400 text-[11px]">Speed of sound in dry air:</span>
                  <span className="font-mono font-bold text-indigo-400 text-xs">{boostTimer}s</span>
                </div>

                <div className="grid grid-cols-2 gap-1.5 text-[11px] mb-2">
                  <button
                    onClick={() => setBoostAnswered("wrong")}
                    disabled={boostAnswered !== null}
                    className={`p-1.5 rounded-lg border text-left font-medium transition-all ${
                      boostAnswered === "wrong"
                        ? "bg-rose-500/20 border-rose-500 text-rose-300"
                        : "bg-white/5 border-white/5 text-slate-300 hover:bg-white/10"
                    }`}
                  >
                    300 m/s
                  </button>
                  <button
                    onClick={() => setBoostAnswered("correct")}
                    disabled={boostAnswered !== null}
                    className={`p-1.5 rounded-lg border text-left font-medium transition-all ${
                      boostAnswered === "correct"
                        ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                        : "bg-white/5 border-white/5 text-slate-300 hover:bg-white/10"
                    }`}
                  >
                    343 m/s
                  </button>
                </div>

                {boostAnswered && (
                  <div className="flex items-center justify-between text-[10px] font-bold">
                    {boostAnswered === "correct" ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Correct (+4.00 Marks)</span>
                      </span>
                    ) : (
                      <span className="text-rose-400 flex items-center gap-1">
                        <XCircle className="w-3 h-3" />
                        <span>Penalty (-1.00 Mark)</span>
                      </span>
                    )}
                    <button
                      onClick={resetBoost}
                      className="text-slate-400 hover:text-white flex items-center gap-1 font-mono text-[9px]"
                    >
                      <RotateCcw className="w-2.5 h-2.5" />
                      <span>Retry</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-5 border-t border-white/5 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Scoring</span>
              <span className="font-bold text-indigo-300">+4.00 / -1.00 NTA</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

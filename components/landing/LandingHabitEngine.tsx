"use client";

import React, { useState, useEffect } from "react";
import {
  Target,
  Calendar,
  Flame,
  Zap,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

export function LandingHabitEngine() {
  const [activeTab, setActiveTab] = useState<"goal" | "plan" | "boost">("goal");
  const [dailyGoalSlider, setDailyGoalSlider] = useState(25);

  // Boost interactive trial state
  const [boostTimer, setBoostTimer] = useState(15);
  const [isBoostRunning, setIsBoostRunning] = useState(false);
  const [boostResult, setBoostResult] = useState<"correct" | "wrong" | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isBoostRunning && boostTimer > 0) {
      interval = setInterval(() => {
        setBoostTimer((prev) => {
          if (prev <= 1) {
            setIsBoostRunning(false);
            setBoostResult("wrong");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isBoostRunning, boostTimer]);

  const startBoostTrial = () => {
    setBoostTimer(15);
    setBoostResult(null);
    setIsBoostRunning(true);
  };

  return (
    <section id="habit-engine" className="py-24 md:py-32 relative overflow-hidden bg-[#07090e]">
      {/* Radiant ambient aura */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[400px] bg-gradient-to-r from-purple-700/15 via-indigo-600/10 to-emerald-500/15 rounded-full blur-[150px] pointer-events-none -z-10" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Apple-Style Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[11px] font-bold uppercase tracking-wider mb-4">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>The Science of Daily Retention</span>
          </div>

          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.08]">
            The Habit Engine. <br />
            <span className="bg-gradient-to-r from-purple-400 via-indigo-200 to-emerald-400 bg-clip-text text-transparent">
              /goal · /plan · /boost
            </span>
          </h2>

          <p className="text-sm sm:text-base text-slate-400 mt-4 font-normal">
            Willpower runs out by 6 PM. Habits survive through exam day.
          </p>
        </div>

        {/* 3 Pillar Interactive Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: /goal */}
          <div className="p-7 sm:p-8 rounded-3xl bg-white/[0.03] border border-white/10 hover:border-purple-500/40 transition-all duration-300 flex flex-col justify-between group shadow-xl">
            <div>
              <div className="flex items-center justify-between mb-6">
                <span className="font-mono text-xs font-bold text-purple-400 tracking-wider">
                  COMMAND /goal
                </span>
                <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                  <Target className="w-5 h-5 text-purple-400" />
                </div>
              </div>

              <h3 className="text-2xl font-black text-white mb-2 tracking-tight">
                The 10-Minute Transit
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
                Solve 25 questions while waiting for tea or on the bus. Reach 70% to keep your multi-week streak alive.
              </p>

              {/* Interactive Target Slider */}
              <div className="p-4 rounded-2xl bg-[#090d16] border border-white/5 space-y-3 mb-6">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Daily Target:</span>
                  <span className="font-mono font-bold text-white text-sm">{dailyGoalSlider} Qs / Day</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={100}
                  step={5}
                  value={dailyGoalSlider}
                  onChange={(e) => setDailyGoalSlider(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>10 Qs</span>
                  <span className="text-purple-300 font-bold">25 Qs (Sweet Spot)</span>
                  <span>100 Qs</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Annual Practice</span>
              <span className="font-bold text-purple-300">{(dailyGoalSlider * 365).toLocaleString()} PYQs</span>
            </div>
          </div>

          {/* Card 2: /plan */}
          <div className="p-7 sm:p-8 rounded-3xl bg-white/[0.03] border border-white/10 hover:border-emerald-500/40 transition-all duration-300 flex flex-col justify-between group shadow-xl">
            <div>
              <div className="flex items-center justify-between mb-6">
                <span className="font-mono text-xs font-bold text-emerald-400 tracking-wider">
                  COMMAND /plan
                </span>
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-emerald-400" />
                </div>
              </div>

              <h3 className="text-2xl font-black text-white mb-2 tracking-tight">
                Spaced Recall Curve
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
                Questions you miss or hesitate on automatically resurface at optimal memory intervals. Zero repeat duplicates.
              </p>

              {/* Memory Curve Visual Chips */}
              <div className="grid grid-cols-3 gap-2 text-center mb-6">
                <div className="p-2.5 rounded-xl bg-[#090d16] border border-white/5">
                  <span className="text-[10px] text-slate-400 block font-mono">Missed</span>
                  <span className="text-xs font-bold text-rose-400 font-mono">24 Hours</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#090d16] border border-white/5">
                  <span className="text-[10px] text-slate-400 block font-mono">Hesitated</span>
                  <span className="text-xs font-bold text-amber-400 font-mono">3 Days</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#090d16] border border-white/5">
                  <span className="text-[10px] text-slate-400 block font-mono">Mastered</span>
                  <span className="text-xs font-bold text-emerald-400 font-mono">7 Days</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Trigram Guard</span>
              <span className="font-bold text-emerald-300">0% Repeat Waste</span>
            </div>
          </div>

          {/* Card 3: /boost */}
          <div className="p-7 sm:p-8 rounded-3xl bg-white/[0.03] border border-white/10 hover:border-indigo-500/40 transition-all duration-300 flex flex-col justify-between group shadow-xl">
            <div>
              <div className="flex items-center justify-between mb-6">
                <span className="font-mono text-xs font-bold text-indigo-400 tracking-wider">
                  COMMAND /boost
                </span>
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-indigo-400" />
                </div>
              </div>

              <h3 className="text-2xl font-black text-white mb-2 tracking-tight">
                15s Exam Pressure
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
                Real NTA negative marking (+4 / -1). Trains your nervous system to stay calm under the clock.
              </p>

              {/* Interactive Mini Boost Trial */}
              <div className="p-3.5 rounded-2xl bg-[#090d16] border border-indigo-500/20 mb-6">
                <div className="flex justify-between items-center text-xs mb-2">
                  <span className="text-slate-400 font-medium">Test sound speed in air:</span>
                  <span className="font-mono font-bold text-indigo-400">{boostTimer}s</span>
                </div>

                <div className="grid grid-cols-2 gap-1.5 text-[11px] mb-2.5">
                  <button
                    onClick={() => {
                      setIsBoostRunning(false);
                      setBoostResult("wrong");
                    }}
                    disabled={!isBoostRunning}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-left transition-colors font-medium disabled:opacity-50"
                  >
                    A) 300 m/s
                  </button>
                  <button
                    onClick={() => {
                      setIsBoostRunning(false);
                      setBoostResult("correct");
                    }}
                    disabled={!isBoostRunning}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-left transition-colors font-medium disabled:opacity-50"
                  >
                    B) 343 m/s
                  </button>
                </div>

                {boostResult && (
                  <div className="text-[11px] font-bold mb-2">
                    {boostResult === "correct" && (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Correct (+4.00 Marks)</span>
                      </span>
                    )}
                    {boostResult === "wrong" && (
                      <span className="text-rose-400 flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Penalty (-1.00 Mark)</span>
                      </span>
                    )}
                  </div>
                )}

                <button
                  onClick={startBoostTrial}
                  className="w-full py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
                >
                  <Play className="w-3 h-3" />
                  <span>{isBoostRunning ? "Restart 15s Trial" : "Try 15s Timer"}</span>
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Decision Window</span>
              <span className="font-bold text-indigo-300">15s Active Recall</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

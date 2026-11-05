"use client";

import React, { useState, useEffect } from "react";
import {
  Target,
  Calendar,
  Flame,
  Zap,
  ShieldCheck,
  ArrowRight,
  Check,
  Award,
  RotateCcw,
  Clock,
  Sparkles,
  TrendingUp,
  Brain,
  AlertCircle,
  Play,
  RotateCw,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { APP_LOOP_URL } from "./LandingNavbar";

export function LandingHabitEngine() {
  const [activeHabitTab, setActiveHabitTab] = useState<"goal" | "plan" | "boost">("goal");
  const [dailyGoalSlider, setDailyGoalSlider] = useState(25);

  // Boost interactive trial state
  const [boostTimer, setBoostTimer] = useState(15);
  const [isBoostRunning, setIsBoostRunning] = useState(false);
  const [boostResult, setBoostResult] = useState<"correct" | "wrong" | "skipped" | null>(null);

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
    <section id="habit-engine" className="py-24 relative overflow-hidden bg-[#07090e]">
      {/* Radiant ambient aura */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-r from-purple-600/20 via-indigo-600/15 to-emerald-500/20 rounded-full blur-[140px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-bold mb-4 shadow-sm">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>The Science of Daily Retention</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            The 3-Pillar Habit Engine: <br />
            <span className="bg-gradient-to-r from-purple-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent">
              /goal · /plan · /boost
            </span>
          </h2>
          <p className="text-sm sm:text-base text-slate-300 mt-4 leading-relaxed">
            Willpower runs out by 6 PM in a hostel room. Habits survive through exam day. Qz Loop replaces discipline burnout with a lightweight 3-pillar behavioral loop.
          </p>
        </div>

        {/* Pillar Switcher Tabs */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex items-center p-1.5 rounded-2xl bg-slate-900/90 border border-white/10 backdrop-blur-xl shadow-xl shadow-purple-950/20 max-w-full overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveHabitTab("goal")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
                activeHabitTab === "goal"
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-600/40"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Target className="w-4 h-4 text-purple-300" />
              <span>/goal · Daily Target</span>
            </button>

            <button
              onClick={() => setActiveHabitTab("plan")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
                activeHabitTab === "plan"
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/40"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Calendar className="w-4 h-4 text-emerald-300" />
              <span>/plan · Spaced Curve</span>
            </button>

            <button
              onClick={() => setActiveHabitTab("boost")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
                activeHabitTab === "boost"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/40"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Zap className="w-4 h-4 text-indigo-300" />
              <span>/boost · 15s Pressure</span>
            </button>
          </div>
        </div>

        {/* Tab Content Display */}
        <div className="max-w-4xl mx-auto">
          {/* TAB 1: /goal */}
          {activeHabitTab === "goal" && (
            <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/10 backdrop-blur-xl animate-in fade-in duration-300">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                <div className="md:col-span-7">
                  <span className="text-xs font-mono font-bold text-purple-400 uppercase tracking-widest block mb-2">
                    Command /goal · Micro-Targeting
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-black text-white mb-4">
                    The 10-Minute Transit Rule
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed mb-6">
                    A 200-question mock feels intimidating. 25 questions in 10 minutes while waiting for the coaching bus or sipping tea feels effortless. Reach 70% of your daily goal to preserve your multi-week flame streak unbroken.
                  </p>

                  <div className="space-y-4 pt-4 border-t border-white/10">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-medium">Daily Question Goal:</span>
                      <span className="font-extrabold text-white text-sm font-mono">{dailyGoalSlider} Questions / Day</span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={100}
                      step={5}
                      value={dailyGoalSlider}
                      onChange={(e) => setDailyGoalSlider(Number(e.target.value))}
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                    />
                    <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                      <span>10 Qs (Chai Break)</span>
                      <span>25 Qs (Sweet Spot)</span>
                      <span>100 Qs (Hardcore)</span>
                    </div>
                  </div>
                </div>

                {/* Right Interactive Card */}
                <div className="md:col-span-5 p-6 rounded-2xl bg-[#0c101c] border border-purple-500/30 flex flex-col items-center text-center shadow-lg shadow-purple-900/20">
                  <div className="w-20 h-20 rounded-full border-4 border-purple-500/30 border-t-purple-400 flex items-center justify-center mb-4 relative">
                    <Flame className="w-8 h-8 text-amber-400" />
                    <span className="absolute -bottom-2 px-2 py-0.5 rounded-full bg-purple-600 text-white text-[10px] font-black">
                      70% RULE
                    </span>
                  </div>
                  <h4 className="font-extrabold text-white text-base mb-1">
                    Streak Preservation
                  </h4>
                  <p className="text-xs text-slate-400 mb-4">
                    Solve at least {Math.ceil(dailyGoalSlider * 0.7)} questions today to keep your streak intact on busy test days.
                  </p>
                  <div className="w-full py-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-bold font-mono">
                    Annual Practice: {(dailyGoalSlider * 365).toLocaleString()} PYQs
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: /plan */}
          {activeHabitTab === "plan" && (
            <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/10 backdrop-blur-xl animate-in fade-in duration-300">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                <div className="md:col-span-7">
                  <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest block mb-2">
                    Command /plan · Automated Memory Curve
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-black text-white mb-4">
                    Crush The Ebbinghaus Curve
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed mb-6">
                    Aspirants forget 75% of formulas within 48 hours without active recall. Our automated scheduler flags questions you miss or hesitate on, re-inserting them at 24 hours, 3 days, and 7 days.
                  </p>

                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-3 rounded-xl bg-slate-900 border border-white/5">
                      <span className="text-[10px] text-slate-400 uppercase font-mono block mb-1">Step 1</span>
                      <span className="font-extrabold text-xs sm:text-sm text-rose-400 block mb-0.5">24 Hours</span>
                      <span className="text-[10px] text-slate-400">Failed PYQs</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900 border border-white/5">
                      <span className="text-[10px] text-slate-400 uppercase font-mono block mb-1">Step 2</span>
                      <span className="font-extrabold text-xs sm:text-sm text-amber-400 block mb-0.5">3 Days</span>
                      <span className="text-[10px] text-slate-400">Slow Solves</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-900 border border-white/5">
                      <span className="text-[10px] text-slate-400 uppercase font-mono block mb-1">Step 3</span>
                      <span className="font-extrabold text-xs sm:text-sm text-emerald-400 block mb-0.5">7 Days</span>
                      <span className="text-[10px] text-slate-400">Locked Memory</span>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-5 p-6 rounded-2xl bg-[#0c101c] border border-emerald-500/30 flex flex-col justify-between shadow-lg shadow-emerald-900/20">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                      <RotateCcw className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-xs">pg_trgm Trigram Guard</h4>
                      <span className="text-[10px] text-slate-400">Zero duplicate questions</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed mb-4">
                    Database-level trigram similarity scoring prevents exact repeat questions, so every 15-second swipe introduces fresh conceptual variations.
                  </p>
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold text-center">
                    Permanent Synaptic Retention
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: /boost (WITH INTERACTIVE 15S TRIAL) */}
          {activeHabitTab === "boost" && (
            <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/10 backdrop-blur-xl animate-in fade-in duration-300">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                <div className="md:col-span-7">
                  <span className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-widest block mb-2">
                    Command /boost · Pressure Conditioning
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-black text-white mb-4">
                    Real Exam Hall Adrenaline
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed mb-6">
                    In the exam hall, the ticking clock causes cortisol spikes, leading to silly arithmetic and reading errors. Qz Loop trains your nervous system to stay laser-calm under rapid 15-second decision windows.
                  </p>

                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#090d16] border border-white/10">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center font-mono font-black text-indigo-300 text-lg">
                      15s
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">Active Viewport Stopwatch</span>
                      <span className="text-[11px] text-slate-400 leading-snug block">
                        Timer counts ONLY while question card is in viewport. No cheating.
                      </span>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-5 p-6 rounded-2xl bg-[#0c101c] border border-indigo-500/30 flex flex-col justify-between shadow-lg shadow-indigo-900/20">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-300">Live 15s Timer Simulator</span>
                    <span className="text-xs font-mono font-bold text-indigo-400">{boostTimer}s Remaining</span>
                  </div>

                  {/* Interactive Mini-Quiz Box */}
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-white/5 mb-3">
                    <div className="text-[11px] text-slate-200 font-semibold mb-2">
                      Trial: Speed of sound in air at 20°C is approx?
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                      <button
                        onClick={() => {
                          setIsBoostRunning(false);
                          setBoostResult("wrong");
                        }}
                        disabled={!isBoostRunning}
                        className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-slate-300 transition-colors text-left"
                      >
                        A) 300 m/s
                      </button>
                      <button
                        onClick={() => {
                          setIsBoostRunning(false);
                          setBoostResult("correct");
                        }}
                        disabled={!isBoostRunning}
                        className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-slate-300 transition-colors text-left"
                      >
                        B) 343 m/s
                      </button>
                    </div>

                    {boostResult && (
                      <div className="mt-2 text-[10px] font-bold">
                        {boostResult === "correct" && (
                          <span className="text-emerald-400 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Correct (+4.00 Marks)</span>
                          </span>
                        )}
                        {boostResult === "wrong" && (
                          <span className="text-rose-400 inline-flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Penalty (-1.00 Mark)</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={startBoostTrial}
                    className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-indigo-600/30"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>{isBoostRunning ? "Restart 15s Trial" : "Start 15s Trial"}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

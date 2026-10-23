"use client";

import React from "react";
import {
  Flame,
  ShieldAlert,
  Repeat,
  Share2,
  Brain,
  Sparkles,
  Zap,
  Clock,
  ArrowRight,
} from "lucide-react";
import { APP_LOOP_URL } from "./LandingNavbar";

export function LandingBentoFeatures() {
  return (
    <section id="features" className="py-24 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[130px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 left-0 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[130px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Behavioral Psychology × Competitive Exams</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Designed to replace social media addiction with exam mastery
          </h2>
          <p className="text-base text-slate-400 mt-4 leading-relaxed">
            Every feature in Qz Loop leverages behavioral conditioning to transform mindless habits into competitive exam cutoffs.
          </p>
        </div>

        {/* Bento Grid Layout (Apple Pro aesthetic) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Card 1: Virtuous Doomscroll (Large 7 Cols) */}
          <div className="md:col-span-7 rounded-3xl bg-gradient-to-b from-white/[0.05] to-white/[0.01] border border-white/10 p-8 sm:p-10 relative overflow-hidden flex flex-col justify-between group hover:border-purple-500/40 transition-all duration-300">
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-purple-600/20 rounded-full blur-[60px] pointer-events-none" />

            <div>
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-purple-300" />
              </div>
              <span className="text-xs font-mono font-bold text-purple-400 tracking-wider uppercase block mb-2">
                Pillar 01 · Variable Reinforcement
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-4">
                The Virtuous Doomscroll
              </h3>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-6">
                Social media exploits the Skinner Box to keep you hooked on passive videos. Qz Loop
                re-engineers this mechanism: each question card is an unpredictable 15-second challenge.
                You get the rapid dopamine hit of social media, but step away feeling sharp, proud, and accomplished.
              </p>
            </div>

            {/* Interactive Preview pill mockup */}
            <div className="p-4 rounded-2xl bg-[#090d16] border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center font-bold text-purple-300">
                  15s
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">Active Viewport Timer</span>
                  <span className="text-[11px] text-slate-400">Stopwatch ticks ONLY when card is in focus</span>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                Anti-Cheat Ready
              </span>
            </div>
          </div>

          {/* Card 2: Authentic Negative Marking (5 Cols) */}
          <div className="md:col-span-5 rounded-3xl bg-gradient-to-b from-white/[0.05] to-white/[0.01] border border-white/10 p-8 sm:p-10 relative overflow-hidden flex flex-col justify-between group hover:border-red-500/40 transition-all duration-300">
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-red-600/20 rounded-full blur-[60px] pointer-events-none" />

            <div>
              <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center mb-6">
                <ShieldAlert className="w-6 h-6 text-red-300" />
              </div>
              <span className="text-xs font-mono font-bold text-red-400 tracking-wider uppercase block mb-2">
                Pillar 02 · Loss Aversion
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-4">
                Real Negative Marking
              </h3>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-6">
                Gamified quiz apps reward random guessing. Qz Loop conditions against it. We enforce the exact official penalty rules: <span className="text-red-400 font-bold">-0.50</span> for SSC, <span className="text-red-400 font-bold">-0.33</span> for Railways, and <span className="text-red-400 font-bold">-1.00</span> for NEET.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#090d16] border border-red-500/20 text-xs">
              <div className="flex justify-between items-center text-red-300 font-bold mb-1">
                <span>SSC CGL Scoring Formula</span>
                <span>+2.00 / -0.50</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Eliminates reckless guesses before your real exam hall pressure.
              </p>
            </div>
          </div>

          {/* Card 3: Spaced Repetition & Trigram Engine (5 Cols) */}
          <div className="md:col-span-5 rounded-3xl bg-gradient-to-b from-white/[0.05] to-white/[0.01] border border-white/10 p-8 sm:p-10 relative overflow-hidden flex flex-col justify-between group hover:border-emerald-500/40 transition-all duration-300">
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-600/20 rounded-full blur-[60px] pointer-events-none" />

            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mb-6">
                <Repeat className="w-6 h-6 text-emerald-300" />
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400 tracking-wider uppercase block mb-2">
                Pillar 03 · Spaced Recall
              </span>
              <h3 className="text-2xl font-extrabold text-white tracking-tight mb-4">
                Zero Duplicates, Spaced Recall
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed mb-6">
                Our pg_trgm similarity guard prevents identical repeat questions. Failed questions automatically resurface after 24 hours, locking the concept into permanent memory.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-xl bg-slate-900 border border-white/5">
                <span className="text-[10px] text-slate-400 block">Failed</span>
                <span className="font-extrabold text-red-400">24 Hours</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-white/5">
                <span className="text-[10px] text-slate-400 block">Slow Correct</span>
                <span className="font-extrabold text-amber-400">3 Days</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-white/5">
                <span className="text-[10px] text-slate-400 block">Fast Correct</span>
                <span className="font-extrabold text-emerald-400">7 Days</span>
              </div>
            </div>
          </div>

          {/* Card 4: WhatsApp Peer Challenges (7 Cols) */}
          <div className="md:col-span-7 rounded-3xl bg-gradient-to-b from-white/[0.05] to-white/[0.01] border border-white/10 p-8 sm:p-10 relative overflow-hidden flex flex-col justify-between group hover:border-[#25D366]/40 transition-all duration-300">
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#25D366]/15 rounded-full blur-[60px] pointer-events-none" />

            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#25D366]/20 border border-[#25D366]/30 flex items-center justify-center mb-6">
                <Share2 className="w-6 h-6 text-[#25D366]" />
              </div>
              <span className="text-xs font-mono font-bold text-[#25D366] tracking-wider uppercase block mb-2">
                Pillar 04 · Social Peer Accountability
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-4">
                1-Click WhatsApp Duels
              </h3>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-6">
                Studying alone in a PG room gets lonely. Qz Loop lets you generate a 5-question speed duel and dispatch it directly to your study group or library friends on WhatsApp. See who solves faster with fewer penalties.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#090d16] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#25D366]/20 flex items-center justify-center">
                  <Share2 className="w-5 h-5 text-[#25D366]" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">Real-time Scorecards</span>
                  <span className="text-[11px] text-slate-400">Shareable WhatsApp preview card with rank badges</span>
                </div>
              </div>
              <a
                href={APP_LOOP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-[#25D366] text-slate-950 font-bold text-xs flex items-center gap-1.5 shrink-0"
              >
                <span>Try a Duel</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

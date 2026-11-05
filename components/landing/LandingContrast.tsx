"use client";

import React, { useState } from "react";
import { Sparkles, XCircle, CheckCircle2, Zap, ShieldAlert, ArrowRight } from "lucide-react";
import { OFFICIAL_PLAYSTORE_URL } from "./LandingNavbar";

export function LandingContrast() {
  const [activeMode, setActiveMode] = useState<"compare" | "reels" | "qzloop">("compare");

  return (
    <section id="contrast" className="py-24 md:py-32 bg-[#07090e] border-y border-white/[0.06] relative overflow-hidden">
      {/* Dynamic ambient auroras */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[600px] h-[350px] bg-rose-950/20 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[600px] h-[350px] bg-emerald-950/25 rounded-full blur-[140px] pointer-events-none -z-10" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Apple-Style Ultra-Lean Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-slate-300 text-[11px] font-bold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>The Reality Check</span>
          </div>

          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.08]">
            Same thumb flick. <br />
            <span className="bg-gradient-to-r from-purple-400 via-pink-300 to-emerald-400 bg-clip-text text-transparent">
              Opposite destiny.
            </span>
          </h2>

          <p className="text-sm sm:text-base text-slate-400 mt-4 font-normal">
            You don't lack discipline. You were just feeding the reflex with the wrong fuel.
          </p>
        </div>

        {/* 2-Card Apple-Grade Visual Contrast */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {/* Card 1: Social Reels (The Brainrot Trap) */}
          <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-b from-rose-950/20 to-black/40 border border-rose-500/20 relative overflow-hidden flex flex-col justify-between group hover:border-rose-500/40 transition-all duration-300 shadow-xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px] font-bold uppercase tracking-wider mb-6">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                <span>60 Mins on Social Reels</span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-black text-white mb-6 tracking-tight">
                Passive Dopamine Drain
              </h3>

              <div className="space-y-4 text-sm text-slate-300 mb-8">
                <div className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <span><strong>240 passive videos:</strong> Zero formulas or concepts retained.</span>
                </div>
                <div className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <span><strong>Receptor hijack:</strong> The illusion of relaxing while bedtime panic sets in.</span>
                </div>
                <div className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <span><strong>Post-scroll guilt:</strong> Another evening lost with the exam in weeks.</span>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-rose-500/15 flex items-center justify-between text-xs font-mono font-bold">
              <span className="text-rose-400">Mental State: Guilty</span>
              <span className="px-3 py-1 rounded-lg bg-rose-500/15 text-rose-300 border border-rose-500/20">
                0 Marks Added
              </span>
            </div>
          </div>

          {/* Card 2: Qz Loop (The Virtuous Micro-Sprint) */}
          <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-b from-emerald-950/25 via-[#09141c]/50 to-black/40 border border-emerald-500/30 relative overflow-hidden flex flex-col justify-between group hover:border-emerald-500/60 transition-all duration-300 shadow-[0_0_50px_rgba(16,185,129,0.12)]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold uppercase tracking-wider mb-6">
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                <span>10 Mins on Qz-Loop</span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-black text-white mb-6 tracking-tight">
                Active Recall Sprint
              </h3>

              <div className="space-y-4 text-sm text-slate-200 mb-8">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>25 high-yield PYQs:</strong> 15-second timed decisions on authentic NCERT.</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Real NTA negative penalty:</strong> Trains your brain to avoid reckless guesswork.</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Zero guilt:</strong> Step away feeling sharp, accomplished, and exam-ready.</span>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-emerald-500/20 flex items-center justify-between text-xs font-mono font-bold">
              <span className="text-emerald-400">Mental State: Confident</span>
              <span className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                +100 Marks Practiced
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

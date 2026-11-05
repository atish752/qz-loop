"use client";

import React from "react";
import { X, Check } from "lucide-react";

export function LandingContrast() {
  return (
    <section id="contrast" className="py-20 md:py-28 bg-[#05070c] border-y border-white/[0.06] relative overflow-hidden">
      {/* Dynamic ambient auroras */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[300px] bg-rose-950/20 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[500px] h-[300px] bg-emerald-950/25 rounded-full blur-[140px] pointer-events-none -z-10" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Apple-Style Ultra-Lean Section Header */}
        <div className="text-center max-w-xl mx-auto mb-14">
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-[1.08]">
            Same thumb flick. <br />
            <span className="bg-gradient-to-r from-purple-400 via-pink-300 to-emerald-400 bg-clip-text text-transparent">
              Opposite destiny.
            </span>
          </h2>
        </div>

        {/* 2-Card Apple-Grade Visual Contrast */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          {/* Card 1: Social Reels (The Drain) */}
          <div className="p-8 sm:p-10 rounded-3xl bg-white/[0.02] border border-rose-500/20 relative overflow-hidden flex flex-col justify-between group hover:border-rose-500/40 transition-all duration-300 shadow-xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />

            <div>
              <span className="text-[11px] font-mono font-bold text-rose-400 uppercase tracking-widest block mb-2">
                Social Doomscroll
              </span>

              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-5xl sm:text-6xl font-black text-white tracking-tight font-mono">
                  60
                </span>
                <span className="text-base font-bold text-slate-400">minutes lost</span>
              </div>

              {/* Minimal Pictorial Graphic */}
              <div className="h-2 w-full rounded-full bg-slate-900 overflow-hidden mb-6">
                <div className="h-full w-full bg-gradient-to-r from-rose-950 to-rose-600/60 rounded-full" />
              </div>

              <div className="space-y-3 text-xs sm:text-sm text-slate-300 mb-8">
                <div className="flex items-center gap-2.5">
                  <X className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>240 passive brainrot clips</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <X className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>0 concepts or formulas retained</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <X className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Bedtime panic & exam guilt</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-rose-500/15 flex items-center justify-between text-xs font-mono font-bold">
              <span className="text-slate-400">Outcome</span>
              <span className="px-3 py-1 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20">
                0 Marks Added
              </span>
            </div>
          </div>

          {/* Card 2: Qz Loop (The Sprint) */}
          <div className="p-8 sm:p-10 rounded-3xl bg-white/[0.03] border border-emerald-500/30 relative overflow-hidden flex flex-col justify-between group hover:border-emerald-500/60 transition-all duration-300 shadow-[0_0_40px_rgba(16,185,129,0.1)]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

            <div>
              <span className="text-[11px] font-mono font-bold text-emerald-400 uppercase tracking-widest block mb-2">
                Qz-Loop Micro-Sprint
              </span>

              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-5xl sm:text-6xl font-black text-white tracking-tight font-mono">
                  10
                </span>
                <span className="text-base font-bold text-emerald-400">minutes invested</span>
              </div>

              {/* Minimal Pictorial Graphic */}
              <div className="h-2 w-full rounded-full bg-slate-900 overflow-hidden mb-6">
                <div className="h-full w-full bg-gradient-to-r from-emerald-500 to-indigo-400 rounded-full animate-pulse" />
              </div>

              <div className="space-y-3 text-xs sm:text-sm text-slate-200 mb-8">
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>25 high-yield authentic PYQs</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>15-second active recall decisions</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Sharp, confident exam composure</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-emerald-500/20 flex items-center justify-between text-xs font-mono font-bold">
              <span className="text-slate-400">Outcome</span>
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                +100 Marks Practiced
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

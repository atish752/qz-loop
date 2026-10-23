"use client";

import React from "react";
import { ArrowRight, Sparkles, Zap, ShieldCheck } from "lucide-react";
import { APP_LOOP_URL } from "./LandingNavbar";

export function LandingCtaBanner() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Radiant Glowing Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#090d16] via-purple-950/40 to-[#07090e] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-r from-purple-600/30 via-indigo-600/20 to-emerald-500/30 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <div className="p-8 sm:p-14 rounded-[36px] bg-white/[0.03] border border-white/10 backdrop-blur-2xl shadow-[0_20px_70px_rgba(0,0,0,0.6)]">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold mb-6">
            <Zap className="w-3.5 h-3.5" />
            <span>Turn Idle Chai Breaks Into Exam Ranks</span>
          </div>

          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight mb-6">
            Stop scrolling trash. <br />
            <span className="bg-gradient-to-r from-purple-400 via-pink-300 to-emerald-400 bg-clip-text text-transparent">
              Start cracking cutoffs.
            </span>
          </h2>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
            Your competition is currently scrolling Reels. In 10 minutes on Qz Loop, you can solve 25 high-probability Previous Year Questions with authentic negative marking.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={APP_LOOP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto relative inline-flex items-center justify-center p-[2px] overflow-hidden rounded-2xl font-black group shadow-[0_0_40px_rgba(168,85,247,0.5)] hover:shadow-[0_0_60px_rgba(52,211,153,0.7)] transition-all duration-300"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-purple-500 via-emerald-400 to-indigo-500 rounded-2xl animate-border-shimmer" />
              <span className="w-full sm:w-auto relative px-9 py-4 transition-all ease-out bg-[#07090e] rounded-2xl group-hover:bg-[#05060b] flex items-center justify-center gap-3 text-base text-white">
                <span>Launch Qz Loop Now</span>
                <ArrowRight className="w-5 h-5 text-emerald-400 group-hover:translate-x-1.5 transition-transform" />
              </span>
            </a>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              100% Free Aspirant Access
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              No App Installation Required
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Instant Browser Play
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

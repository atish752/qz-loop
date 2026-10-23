"use client";

import React from "react";
import { ArrowRight, Sparkles, Flame, Shield, CheckCircle2, Play } from "lucide-react";
import { APP_LOOP_URL, APP_ORIGINAL_URL } from "./LandingNavbar";
import { DeviceMockupInteractive } from "./DeviceMockupInteractive";

export function LandingHero() {
  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
      {/* Ambient Radial Glowing Auroras */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-purple-700/25 via-indigo-600/20 to-emerald-500/20 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-1/3 -left-48 w-96 h-96 bg-purple-600/15 rounded-full blur-[100px] pointer-events-none -z-10" />
      <div className="absolute top-1/2 -right-48 w-96 h-96 bg-emerald-600/15 rounded-full blur-[100px] pointer-events-none -z-10" />

      {/* Background Dot Pattern */}
      <div className="absolute inset-0 bg-dot-grid opacity-40 pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: High-Impact Typography & CTAs */}
          <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left">
            {/* Apple-style Glowing Eyebrow Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/10 backdrop-blur-xl mb-6 shadow-lg shadow-purple-900/20 hover:border-purple-500/30 transition-all">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-bold text-slate-200 tracking-wide">
                ⚡ INDIA'S 1ST REELS-STYLE NEET UG PRACTICE APP
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.08] mb-6">
              Don't fight the doomscroll.{" "}
              <span className="bg-gradient-to-r from-purple-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent">
                Weaponize it for NEET.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed mb-8 font-normal">
              NEET aspirants spend <strong className="text-white font-semibold">4 to 7 hours daily</strong> on
              social media reels. Qz Loop converts that reflexive thumb flick into
              15-second active recall micro-sprints on NCERT Biology, Chemistry & Physics.
              25 PYQs in 10 minutes. <span className="text-emerald-400 font-semibold">Zero post-scroll guilt.</span> Authentic
              NTA negative marking (-1.00).
            </p>

            {/* High-Impact CTA Buttons */}
            <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-4 mb-8">
              {/* Primary Glowing Action Button */}
              <a
                href={APP_LOOP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto relative inline-flex items-center justify-center p-[1.5px] overflow-hidden rounded-2xl font-bold group shadow-[0_0_35px_rgba(168,85,247,0.45)] hover:shadow-[0_0_50px_rgba(52,211,153,0.6)] transition-all duration-300"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-purple-500 via-emerald-400 to-indigo-500 rounded-2xl animate-border-shimmer" />
                <span className="w-full sm:w-auto relative px-8 py-4 transition-all ease-out bg-[#090d16] rounded-2xl group-hover:bg-[#06080e] flex items-center justify-center gap-3 text-base text-white">
                  <span>Start Solving NEET PYQs (Free)</span>
                  <ArrowRight className="w-5 h-5 text-emerald-400 group-hover:translate-x-1.5 transition-transform" />
                </span>
              </a>

              {/* Secondary Demo Button */}
              <a
                href="#the-loop"
                className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 text-slate-200 text-sm font-semibold flex items-center justify-center gap-2 backdrop-blur-md transition-all"
              >
                <Play className="w-4 h-4 text-purple-400 fill-purple-400/20" />
                <span>Play Live Simulator</span>
              </a>
            </div>

            {/* Truthful Product Highlights (No Fake Numbers) */}
            <div className="pt-5 border-t border-white/10 flex flex-wrap items-center gap-3 text-xs text-slate-300">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Exclusively for NEET UG 2025–2027
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/25 text-purple-300 font-semibold">
                100% NCERT Biology, Physics & Chemistry
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-white/10 text-slate-300 font-medium">
                Official NTA Scoring (+4 / -1)
              </span>
            </div>
          </div>

          {/* Right Column: Live Interactive Device Frame */}
          <div id="the-loop" className="lg:col-span-5 flex justify-center">
            <DeviceMockupInteractive />
          </div>
        </div>
      </div>
    </section>
  );
}

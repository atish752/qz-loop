"use client";

import React from "react";
import { ArrowRight, Download, Play } from "lucide-react";
import Link from "next/link";
import { OFFICIAL_PLAYSTORE_URL } from "./LandingNavbar";
import { DeviceMockupInteractive } from "./DeviceMockupInteractive";

export function LandingHero() {
  return (
    <section className="relative pt-24 pb-16 md:pt-36 md:pb-24 overflow-hidden bg-[#05070c]">
      {/* Ambient Radial Glowing Auroras */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-gradient-to-tr from-purple-700/20 via-indigo-600/15 to-emerald-500/15 rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* Subtle background dot grid */}
      <div className="absolute inset-0 bg-dot-grid opacity-20 pointer-events-none -z-10" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          {/* Left Column: Apple-Grade Typography & Direct Value */}
          <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left">
            {/* Live Indicator Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 backdrop-blur-xl mb-6">
              <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-bold text-slate-300 tracking-wider uppercase">
                15-Second MCQ Reels · NEET · JEE · UPSC · SSC
              </span>
            </div>

            {/* Main Headline — Apple-style, giant, razor-sharp */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.04] mb-5">
              Doomscroll less. <br />
              <span className="bg-gradient-to-r from-purple-400 via-indigo-200 to-emerald-400 bg-clip-text text-transparent">
                Crack exams.
              </span>
            </h1>

            {/* Subtitle — Razor-sharp, curiosity-inducing */}
            <p className="text-base sm:text-lg text-slate-300 max-w-lg leading-relaxed mb-8 font-normal">
              High-yield past paper reels for India's toughest competitive exams. Active recall under real negative marking.
            </p>

            {/* CTAs */}
            <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-3">
              {/* Primary Google Play Install Button */}
              <a
                href={OFFICIAL_PLAYSTORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-white text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 hover:bg-slate-200 transition-all shadow-[0_0_25px_rgba(255,255,255,0.2)] hover:scale-102"
              >
                <Download className="w-4 h-4 text-purple-700" />
                <span>Get on Google Play</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>

              {/* Interactive Demo Scroll Trigger */}
              <a
                href="#the-loop"
                className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all"
              >
                <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                <span>Live App Simulator</span>
              </a>
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

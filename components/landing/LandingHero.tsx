"use client";

import React from "react";
import { ArrowRight, Download, MessageCircle, Sparkles, Shield, Flame } from "lucide-react";
import { OFFICIAL_PLAYSTORE_URL, OFFICIAL_WHATSAPP_GROUP_URL } from "./LandingNavbar";
import { DeviceMockupInteractive } from "./DeviceMockupInteractive";

export function LandingHero() {
  return (
    <section className="relative pt-28 pb-16 md:pt-36 md:pb-24 overflow-hidden">
      {/* Ambient Radial Glowing Auroras */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-tr from-purple-700/20 via-indigo-600/15 to-emerald-500/15 rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* Subtle background dot grid */}
      <div className="absolute inset-0 bg-dot-grid opacity-25 pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Apple-Grade Typography & Direct Value */}
          <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left">
            {/* Live Indicator Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/10 backdrop-blur-xl mb-6 shadow-sm hover:border-purple-500/30 transition-all">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[11px] font-bold text-slate-300 tracking-wide uppercase">
                15-Second MCQ Reels · NEET · JEE · UPSC · SSC
              </span>
            </div>

            {/* Main Headline — Apple-style, giant, razor-sharp */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.05] mb-6">
              Stop scrolling trash. <br />
              <span className="bg-gradient-to-r from-purple-400 via-indigo-200 to-emerald-400 bg-clip-text text-transparent">
                Start cracking exams.
              </span>
            </h1>

            {/* Subtitle — Short, punchy, curiosity-inducing */}
            <p className="text-base sm:text-xl text-slate-300 max-w-xl leading-relaxed mb-8 font-normal">
              Your thumb already swipes 200 times a day. We turned every flick into a 15-second active recall sprint on real PYQs.
            </p>

            {/* CTAs */}
            <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-3.5 mb-8">
              {/* Primary Google Play Install Button */}
              <a
                href={OFFICIAL_PLAYSTORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white text-slate-950 font-black text-sm flex items-center justify-center gap-2.5 hover:bg-slate-200 transition-all shadow-[0_0_30px_rgba(255,255,255,0.25)] hover:scale-102"
              >
                <Download className="w-4 h-4 text-purple-700" />
                <span>Get on Google Play</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              {/* Secondary WhatsApp Group Button */}
              <a
                href={OFFICIAL_WHATSAPP_GROUP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-[#25D366] text-sm font-bold flex items-center justify-center gap-2 transition-all"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Join WhatsApp Group</span>
              </a>
            </div>

            {/* Micro-Trust Badges */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 text-xs text-slate-400 font-medium">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.03] border border-white/5">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                100% Free & Ad-Free
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.03] border border-white/5">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                Daily Streak System
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.03] border border-white/5">
                Official NTA (+4 / -1) Rule
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

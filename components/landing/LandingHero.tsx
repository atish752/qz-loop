"use client";

import React from "react";
import { ArrowRight, Flame, Shield, CheckCircle2, Download, MessageCircle, Play, Star } from "lucide-react";
import { OFFICIAL_PLAYSTORE_URL, OFFICIAL_WHATSAPP_GROUP_URL } from "./LandingNavbar";
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
          {/* Left Column: Minimal Apple-Grade Typography & CTAs */}
          <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left">
            {/* Apple-style Glowing Eyebrow Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/10 backdrop-blur-xl mb-6 shadow-lg shadow-purple-900/20 hover:border-purple-500/30 transition-all">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-bold text-slate-200 tracking-wide">
                ⚡ REELS-FORMAT COMPETITIVE EXAM PRACTICE
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.08] mb-6">
              Don't fight the doomscroll.{" "}
              <span className="bg-gradient-to-r from-purple-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent">
                Weaponize it for your exam.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed mb-8 font-normal">
              Aspirants spend <strong className="text-white font-semibold">4 to 7 hours daily</strong> on
              social media reels. Qz-loop converts that reflexive thumb flick into
              15-second active recall micro-sprints on genuine PYQs for NEET, JEE, UPSC, SSC & Banking.
              Solve 25 questions in 10 minutes. <span className="text-emerald-400 font-semibold">Zero post-scroll guilt.</span>
            </p>

            {/* Two Powerful CTAs: Play Store & WhatsApp */}
            <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-4 mb-8">
              {/* Primary Google Play Install Button */}
              <a
                href={OFFICIAL_PLAYSTORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto relative inline-flex items-center justify-center p-[1.5px] overflow-hidden rounded-2xl font-bold group shadow-[0_0_35px_rgba(168,85,247,0.45)] hover:shadow-[0_0_50px_rgba(168,85,247,0.7)] transition-all duration-300"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-purple-500 via-indigo-500 to-emerald-400 rounded-2xl animate-border-shimmer" />
                <span className="w-full sm:w-auto relative px-8 py-4 transition-all ease-out bg-[#0c101c] rounded-2xl group-hover:bg-[#07090e] flex items-center justify-center gap-3 text-base text-white">
                  <Download className="w-5 h-5 text-purple-400" />
                  <span>Download on Google Play</span>
                  <ArrowRight className="w-5 h-5 text-emerald-400 group-hover:translate-x-1.5 transition-transform" />
                </span>
              </a>

              {/* Secondary WhatsApp Group Button */}
              <a
                href={OFFICIAL_WHATSAPP_GROUP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/40 text-[#25D366] text-sm font-bold flex items-center justify-center gap-2.5 backdrop-blur-md transition-all shadow-lg shadow-[#25D366]/10"
              >
                <MessageCircle className="w-5 h-5 fill-[#25D366]/20" />
                <span>Join Official WhatsApp Group</span>
              </a>
            </div>

            {/* Trust and Safety Badges */}
            <div className="pt-5 border-t border-white/10 flex flex-wrap items-center gap-3 text-xs text-slate-300">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 font-semibold">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                100% Free & DPDP Act 2023 Compliant
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/25 text-purple-300 font-semibold">
                🔥 70% Daily Goal Streak Rule
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-white/10 text-slate-300 font-medium">
                10 Competitive Exams Pan-India
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

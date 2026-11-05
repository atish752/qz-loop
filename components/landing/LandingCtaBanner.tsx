"use client";

import React from "react";
import { ArrowRight, Download, MessageCircle, ShieldCheck, Zap, ArrowUpRight } from "lucide-react";
import { OFFICIAL_PLAYSTORE_URL, OFFICIAL_WHATSAPP_GROUP_URL, APP_LOOP_URL } from "./LandingNavbar";

export function LandingCtaBanner() {
  return (
    <section className="py-28 relative overflow-hidden bg-[#07090e]">
      {/* Radiant Glowing Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#090d16] via-purple-950/40 to-[#07090e] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-r from-purple-600/30 via-indigo-600/20 to-emerald-500/30 rounded-full blur-[130px] pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <div className="p-8 sm:p-16 rounded-[40px] bg-white/[0.03] border border-white/15 backdrop-blur-2xl shadow-[0_25px_80px_rgba(0,0,0,0.7)]">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold mb-6 shadow-sm">
            <Zap className="w-3.5 h-3.5" />
            <span>Turn Idle Screen Time Into Exam Ranks</span>
          </div>

          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight mb-6">
            Stop scrolling trash. <br />
            <span className="bg-gradient-to-r from-purple-400 via-pink-300 to-emerald-400 bg-clip-text text-transparent">
              Start cracking cutoffs.
            </span>
          </h2>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
            Your peers will scroll reels tonight in their hostels. In just 10 minutes on Qz-loop, you can solve 25 high-yield MCQs with genuine negative marking and lock in your daily streak. Install the official Android app or join our WhatsApp study group today.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
            {/* Play Store Button */}
            <a
              href={OFFICIAL_PLAYSTORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto relative inline-flex items-center justify-center p-[2px] overflow-hidden rounded-2xl font-black group shadow-[0_0_40px_rgba(168,85,247,0.5)] hover:shadow-[0_0_65px_rgba(168,85,247,0.85)] transition-all duration-300"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-purple-500 via-indigo-500 to-emerald-400 rounded-2xl animate-border-shimmer" />
              <span className="w-full sm:w-auto relative px-9 py-4 transition-all ease-out bg-[#07090e] rounded-2xl group-hover:bg-[#05060b] flex items-center justify-center gap-3 text-base text-white">
                <Download className="w-5 h-5 text-purple-400" />
                <span>Install on Google Play</span>
                <ArrowRight className="w-5 h-5 text-emerald-400 group-hover:translate-x-1.5 transition-transform" />
              </span>
            </a>

            {/* WhatsApp Group Button */}
            <a
              href={OFFICIAL_WHATSAPP_GROUP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/40 text-[#25D366] font-bold text-sm flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-[#25D366]/10"
            >
              <MessageCircle className="w-5 h-5 fill-[#25D366]/20" />
              <span>Join WhatsApp Study Group</span>
            </a>
          </div>

          {/* Browser shortcut link */}
          <div className="mb-8">
            <a
              href={APP_LOOP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-emerald-400 transition-colors"
            >
              <span>Or start practice instantly in web browser</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Trust and compliance badges */}
          <div className="pt-6 border-t border-white/10 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              100% Free Aspirant Access
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Google Play Verified
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              India DPDP Act 2023 Protected
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

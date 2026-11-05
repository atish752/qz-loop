"use client";

import React from "react";
import { ArrowRight, Download, MessageCircle, ShieldCheck } from "lucide-react";
import { OFFICIAL_PLAYSTORE_URL, OFFICIAL_WHATSAPP_GROUP_URL } from "./LandingNavbar";

export function LandingCtaBanner() {
  return (
    <section className="py-24 md:py-32 relative overflow-hidden bg-[#07090e]">
      {/* Radiant Glowing Background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[750px] h-[350px] bg-gradient-to-r from-purple-700/20 via-indigo-600/15 to-emerald-500/20 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <div className="p-8 sm:p-14 rounded-[36px] bg-white/[0.02] border border-white/10 backdrop-blur-2xl shadow-2xl">
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.08] mb-4">
            Your next 15 seconds <br />
            <span className="bg-gradient-to-r from-purple-400 via-indigo-200 to-emerald-400 bg-clip-text text-transparent">
              start right now.
            </span>
          </h2>

          <p className="text-sm sm:text-base text-slate-300 max-w-lg mx-auto mb-8 font-normal">
            Install the official Android app or join our WhatsApp study group today.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-8">
            {/* Play Store Button */}
            <a
              href={OFFICIAL_PLAYSTORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white text-slate-950 font-black text-sm flex items-center justify-center gap-2 hover:bg-slate-200 transition-all shadow-[0_0_25px_rgba(255,255,255,0.25)] hover:scale-102"
            >
              <Download className="w-4 h-4 text-purple-700" />
              <span>Install on Google Play</span>
              <ArrowRight className="w-4 h-4" />
            </a>

            {/* WhatsApp Group Button */}
            <a
              href={OFFICIAL_WHATSAPP_GROUP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-[#25D366] font-bold text-sm flex items-center justify-center gap-2 transition-all"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Join WhatsApp Group</span>
            </a>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-5 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              100% Free
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Google Play Verified
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              DPDP Act 2023 Compliant
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

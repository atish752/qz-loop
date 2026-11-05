"use client";

import React from "react";
import { ArrowRight, Download, Play } from "lucide-react";
import Link from "next/link";
import { OFFICIAL_PLAYSTORE_URL, OFFICIAL_WHATSAPP_GROUP_URL } from "./LandingNavbar";

export function LandingCtaBanner() {
  return (
    <section className="py-20 md:py-28 relative overflow-hidden bg-[#05070c]">
      {/* Radiant Glowing Background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[300px] bg-gradient-to-r from-purple-700/20 via-indigo-600/15 to-emerald-500/20 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <div className="p-8 sm:p-12 rounded-[36px] bg-white/[0.02] border border-white/10 backdrop-blur-2xl shadow-2xl">
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-[1.08] mb-4">
            Your next 15 seconds <br />
            <span className="bg-gradient-to-r from-purple-400 via-indigo-200 to-emerald-400 bg-clip-text text-transparent">
              start right now.
            </span>
          </h2>

          <p className="text-sm sm:text-base text-slate-300 max-w-md mx-auto mb-8 font-normal">
            Replace mindless scrolling with daily rank-building sprints on Android.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
            {/* Play Store Button */}
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

            {/* Official WhatsApp Group */}
            <a
              href={OFFICIAL_WHATSAPP_GROUP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-300 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all"
            >
              <span>Join Aspirants Group</span>
            </a>
          </div>

          <div className="flex items-center justify-center gap-4 text-xs font-mono text-slate-400">
            <span>100% Free</span>
            <span>·</span>
            <span>Zero Ads</span>
            <span>·</span>
            <span>DPDP Compliant</span>
          </div>
        </div>
      </div>
    </section>
  );
}

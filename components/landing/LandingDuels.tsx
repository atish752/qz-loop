"use client";

import React from "react";
import { Share2, ArrowRight, MessageCircle, Trophy, Users } from "lucide-react";
import { OFFICIAL_WHATSAPP_GROUP_URL, APP_LOOP_URL } from "./LandingNavbar";

export function LandingDuels() {
  return (
    <section className="py-20 md:py-28 relative overflow-hidden bg-[#07090e]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-[#0d161a]/70 via-[#0a111a]/50 to-[#07090e] border border-[#25D366]/20 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#25D366]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-xl text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#25D366]/10 border border-[#25D366]/25 text-[#25D366] text-[11px] font-bold uppercase tracking-wider mb-4">
              <Share2 className="w-3.5 h-3.5" />
              <span>Social Accountability</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight mb-3">
              Study together. <br />
              <span className="text-[#25D366]">1 tap on WhatsApp.</span>
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
              Studying in a hostel room gets lonely. Dispatch 5-question speed duels directly to your study group or library friends. Instant rank scorecards.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-3 w-full md:w-auto shrink-0">
            <a
              href={OFFICIAL_WHATSAPP_GROUP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3.5 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] text-slate-950 font-black text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#25D366]/20"
            >
              <MessageCircle className="w-4 h-4 fill-slate-950" />
              <span>Join WhatsApp Group</span>
            </a>

            <a
              href={APP_LOOP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all"
            >
              <span>Challenge a Friend</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

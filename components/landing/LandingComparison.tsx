"use client";

import React from "react";
import { Sparkles, ArrowRight, ShieldCheck, Zap, X, Minus, CheckCircle2, XCircle } from "lucide-react";
import { APP_LOOP_URL } from "./LandingNavbar";

const COMPARISON_ROWS = [
  {
    feature: "Session Initiation Friction",
    category: "Habit",
    doomscroll: "Zero (Instant compulsive open)",
    traditional: "Severe (Requires 2–3 hr uninterrupted desk block)",
    qzloop: "Zero (Instant 15-second high-yield micro-sprint)",
  },
  {
    feature: "Chai & Bus Break Usability",
    category: "Lifestyle",
    doomscroll: "High (Opens automatically during dead time)",
    traditional: "Impossible (Cannot open a 200-question test on a bus)",
    qzloop: "Ideal (Solve 20 NCERT questions in 5 minutes)",
  },
  {
    feature: "Post-Session Mental State",
    category: "Psychology",
    doomscroll: "Acute guilt, self-reproach & exam anxiety",
    traditional: "Mental exhaustion, eye strain & burnout",
    qzloop: "Energized & proud (Zero post-scroll guilt)",
  },
  {
    feature: "Active Synaptic Recall",
    category: "Retention",
    doomscroll: "None (100% passive video consumption)",
    traditional: "Very low in 90-minute one-way video lectures",
    qzloop: "100% active timed decision under clock pressure",
  },
  {
    feature: "Authentic Negative Marking",
    category: "Exam Hall",
    doomscroll: "N/A",
    traditional: "Revealed only at the end of a 3-hour mock",
    qzloop: "Instant (+4.00 / -1.00 NTA) feedback per question",
  },
  {
    feature: "Spaced Repetition Recovery",
    category: "Mastery",
    doomscroll: "N/A",
    traditional: "Student must manually remember to review",
    qzloop: "Automated (Missed PYQs resurface at 24 hours)",
  },
];

export function LandingComparison() {
  return (
    <section id="comparison" className="py-28 bg-[#090d16]/70 border-t border-white/[0.06] relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-purple-900/10 rounded-full blur-[140px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold mb-3 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>The Paradigm Shift</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Why Traditional EdTech & Social Media Fail Aspirants
          </h2>
          <p className="text-sm sm:text-base text-slate-400 mt-4 leading-relaxed">
            If you have 10 minutes between study sessions or on your coaching commute, you will never open a 3-hour 200-question mock test. You open Instagram. Qz Loop fixes this behavioral leak.
          </p>
        </div>

        {/* High-Contrast Comparison Matrix */}
        <div className="overflow-x-auto no-scrollbar">
          <div className="min-w-[760px] rounded-3xl border border-white/10 bg-slate-900/50 backdrop-blur-2xl overflow-hidden p-6 sm:p-8 shadow-2xl">
            {/* Header Row */}
            <div className="grid grid-cols-12 pb-5 border-b border-white/10 text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-300">
              <div className="col-span-4 text-slate-400">Parameter</div>
              <div className="col-span-2 sm:col-span-3 text-rose-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                <span>Instagram / Reels</span>
              </div>
              <div className="col-span-2 sm:col-span-2 text-slate-400 flex items-center gap-1.5">
                <span>Coaching Mocks</span>
              </div>
              <div className="col-span-4 sm:col-span-3 text-emerald-400 flex items-center gap-2 font-black">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Qz Loop Micro-Reels</span>
              </div>
            </div>

            {/* Comparison Rows */}
            <div className="divide-y divide-white/[0.05]">
              {COMPARISON_ROWS.map((row, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-12 py-5 text-xs sm:text-sm items-center hover:bg-white/[0.02] transition-colors rounded-xl px-2"
                >
                  <div className="col-span-4 font-bold text-slate-200">
                    <span className="text-[10px] font-mono text-purple-400 block uppercase tracking-wider mb-0.5">
                      {row.category}
                    </span>
                    <span>{row.feature}</span>
                  </div>
                  <div className="col-span-2 sm:col-span-3 text-slate-400 pr-2">
                    <span className="inline-flex items-center gap-1.5 text-xs text-rose-300/80">
                      <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span>{row.doomscroll}</span>
                    </span>
                  </div>
                  <div className="col-span-2 sm:col-span-2 text-slate-400 pr-2">
                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                      <Minus className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{row.traditional}</span>
                    </span>
                  </div>
                  <div className="col-span-4 sm:col-span-3 font-bold">
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs font-bold shadow-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{row.qzloop}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile Swipe Cue */}
        <div className="mt-3 text-center sm:hidden text-[11px] text-slate-500 font-mono">
          ← Swipe horizontally to see full comparison →
        </div>

        {/* Bottom Banner inside comparison */}
        <div className="mt-10 text-center">
          <a
            href={APP_LOOP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-bold text-emerald-400 hover:text-emerald-300 transition-colors group"
          >
            <span>Experience the 15-second difference for free</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
      </div>
    </section>
  );
}

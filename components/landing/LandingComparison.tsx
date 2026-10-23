"use client";

import React from "react";
import { Check, X, Minus, Sparkles, ArrowRight } from "lucide-react";
import { APP_LOOP_URL } from "./LandingNavbar";

const COMPARISON_ROWS = [
  {
    feature: "Session Friction",
    doomscroll: "Zero (Instant click)",
    traditional: "High (Requires 60–180 mins block)",
    qzloop: "Zero (Instant 15s questions)",
  },
  {
    feature: "Chai & Bus Break Usability",
    doomscroll: "High (Opens automatically)",
    traditional: "Impossible (Can't open full mock on a bus)",
    qzloop: "Perfect (Solve 10 questions in 3 minutes)",
  },
  {
    feature: "Post-Session Mental State",
    doomscroll: "Acute guilt & anxiety",
    traditional: "Mental fatigue & burnout",
    qzloop: "Accomplished & energized (Guilt-Free)",
  },
  {
    feature: "Active Synaptic Recall",
    doomscroll: "None (Passive consumption)",
    traditional: "Low in 90-min video lectures",
    qzloop: "100% Active Timed Decisions",
  },
  {
    feature: "Real Exam Negative Marking",
    doomscroll: "N/A",
    traditional: "Only at end of 2-hour mock",
    qzloop: "Instant (-0.50 / -0.33) feedback per question",
  },
  {
    feature: "Spaced Repetition Recovery",
    doomscroll: "N/A",
    traditional: "Student must manually review notes",
    qzloop: "Automated (Resurfaces failed PYQs at 24h)",
  },
];

export function LandingComparison() {
  return (
    <section id="comparison" className="py-24 bg-[#090d16]/70 border-t border-white/[0.06] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>The Paradigm Shift</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Why Traditional EdTech & Doomscrolling Fail Aspirants
          </h2>
          <p className="text-sm sm:text-base text-slate-400 mt-4">
            If you have 5 minutes between chores or on your commute, you will never open a 200-question mock test. You open Instagram. Qz Loop fixes the behavioral leak.
          </p>
        </div>

        {/* Comparison Table */}
        <div className="overflow-x-auto">
          <div className="min-w-[680px] rounded-3xl border border-white/10 bg-slate-900/40 backdrop-blur-xl overflow-hidden p-6 sm:p-8">
            <div className="grid grid-cols-12 pb-6 border-b border-white/10 text-sm font-bold text-slate-300">
              <div className="col-span-4 text-slate-400">Parameter</div>
              <div className="col-span-2 sm:col-span-3 text-red-400 flex items-center gap-1.5">
                <span>Instagram / Shorts</span>
              </div>
              <div className="col-span-2 sm:col-span-2 text-slate-400">
                <span>Full Mock Tests</span>
              </div>
              <div className="col-span-4 sm:col-span-3 text-emerald-400 flex items-center gap-1.5 font-extrabold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Qz Loop</span>
              </div>
            </div>

            <div className="divide-y divide-white/[0.06]">
              {COMPARISON_ROWS.map((row, idx) => (
                <div key={idx} className="grid grid-cols-12 py-4 text-xs sm:text-sm items-center hover:bg-white/[0.02] transition-colors rounded-xl px-2">
                  <div className="col-span-4 font-semibold text-slate-200">
                    {row.feature}
                  </div>
                  <div className="col-span-2 sm:col-span-3 text-slate-400">
                    {row.doomscroll}
                  </div>
                  <div className="col-span-2 sm:col-span-2 text-slate-400">
                    {row.traditional}
                  </div>
                  <div className="col-span-4 sm:col-span-3 text-emerald-300 font-bold flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{row.qzloop}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Banner inside comparison */}
        <div className="mt-8 text-center">
          <a
            href={APP_LOOP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <span>Experience the difference for 60 seconds</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  );
}

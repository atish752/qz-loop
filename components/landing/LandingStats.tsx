"use client";

import React from "react";
import { Clock, BookOpen, ShieldAlert, Award } from "lucide-react";

const STATS = [
  {
    value: "15s",
    label: "Active Recall Window",
    subtext: "Neural retrieval under pressure",
    accent: "text-purple-400",
  },
  {
    value: "+4 / -1",
    label: "Authentic NTA Penalty",
    subtext: "Eliminates reckless blind guesses",
    accent: "text-rose-400",
  },
  {
    value: "25 Qs",
    label: "10-Minute Daily Loop",
    subtext: "9,125 high-yield PYQs per year",
    accent: "text-emerald-400",
  },
  {
    value: "0%",
    label: "Post-Scroll Guilt",
    subtext: "Every thumb flick builds rank",
    accent: "text-amber-400",
  },
];

export function LandingStats() {
  return (
    <section className="py-20 border-y border-white/[0.06] bg-[#07090e] relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {STATS.map((stat, i) => (
            <div
              key={i}
              className="p-6 sm:p-8 rounded-3xl bg-white/[0.02] border border-white/5 flex flex-col justify-between hover:border-white/10 transition-colors"
            >
              <div>
                <span className={`text-3xl sm:text-5xl font-black ${stat.accent} tracking-tight block font-mono mb-2`}>
                  {stat.value}
                </span>
                <span className="text-sm sm:text-base font-bold text-white block mb-1">
                  {stat.label}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-2 font-normal">
                {stat.subtext}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

"use client";

import React from "react";

const STATS = [
  {
    value: "15s",
    label: "Active Recall",
    subtext: "Decision under pressure",
    accent: "text-purple-400",
  },
  {
    value: "+4 / -1",
    label: "Official Rules",
    subtext: "Strict negative penalty",
    accent: "text-rose-400",
  },
  {
    value: "25 Qs",
    label: "Daily Loop",
    subtext: "9,125 PYQs per year",
    accent: "text-emerald-400",
  },
  {
    value: "0%",
    label: "Guilt",
    subtext: "Pure productive focus",
    accent: "text-amber-400",
  },
];

export function LandingStats() {
  return (
    <section className="py-20 border-y border-white/[0.06] bg-[#05070c] relative overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {STATS.map((stat, i) => (
            <div
              key={i}
              className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 flex flex-col justify-between"
            >
              <div>
                <span className={`text-4xl sm:text-5xl font-black ${stat.accent} tracking-tight block font-mono mb-2`}>
                  {stat.value}
                </span>
                <span className="text-sm font-bold text-white block">
                  {stat.label}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-2 font-mono">
                {stat.subtext}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

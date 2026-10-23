"use client";

import React from "react";
import { Clock, Zap, CheckCircle, Award } from "lucide-react";

const STATS = [
  {
    icon: Clock,
    value: "15s",
    label: "Micro-Sprint Interval",
    desc: "Active recall under real time pressure",
    accent: "text-purple-400",
  },
  {
    icon: Zap,
    value: "250K+",
    label: "Questions Solved",
    desc: "By competitive aspirants across India",
    accent: "text-emerald-400",
  },
  {
    icon: CheckCircle,
    value: "100%",
    label: "Syllabus Accurate",
    desc: "SSC, RRB, NEET, JEE & UPSC PYQs",
    accent: "text-indigo-400",
  },
  {
    icon: Award,
    value: "0 Guilt",
    label: "Virtuous Doomscroll",
    desc: "10 mins = 25 questions practiced",
    accent: "text-amber-400",
  },
];

export function LandingStats() {
  return (
    <section className="py-20 border-y border-white/[0.08] bg-[#07090e] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {STATS.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className="flex flex-col items-center sm:items-start text-center sm:text-left">
                <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center mb-4">
                  <Icon className={`w-5 h-5 ${stat.accent}`} />
                </div>
                <span className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-1">
                  {stat.value}
                </span>
                <span className="text-sm font-bold text-slate-200 mb-1">
                  {stat.label}
                </span>
                <p className="text-xs text-slate-400">
                  {stat.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

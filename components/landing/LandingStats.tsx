"use client";

import React from "react";
import { Clock, BookOpen, ShieldAlert, Award, Flame, Zap, CheckCircle2 } from "lucide-react";

const STATS = [
  {
    icon: Clock,
    value: "15s",
    label: "Micro-Sprint Interval",
    subtext: "Active Synaptic Recall",
    desc: "Timed decision pressure forces neural retrieval, unlike passive 90-minute lectures.",
    accent: "text-purple-400",
    border: "group-hover:border-purple-500/40",
    bg: "bg-purple-500/10",
  },
  {
    icon: BookOpen,
    value: "NCERT",
    label: "100% Line-by-Line PYQs",
    subtext: "Direct Syllabus Alignment",
    desc: "Strictly verified questions across Botany, Zoology, Organic Chemistry & Physics.",
    accent: "text-emerald-400",
    border: "group-hover:border-emerald-500/40",
    bg: "bg-emerald-500/10",
  },
  {
    icon: ShieldAlert,
    value: "-1.00",
    label: "Authentic NTA Negative",
    subtext: "Penalties for Careless Guesswork",
    desc: "Conditions your brain against gambling on ambiguous choices in the exam hall.",
    accent: "text-rose-400",
    border: "group-hover:border-rose-500/40",
    bg: "bg-rose-500/10",
  },
  {
    icon: Award,
    value: "0 Guilt",
    label: "Virtuous Doomscroll",
    subtext: "10 Mins = 25 Solved PYQs",
    desc: "Every thumb flick leads to measurable syllabus progress with zero wasted evenings.",
    accent: "text-amber-400",
    border: "group-hover:border-amber-500/40",
    bg: "bg-amber-500/10",
  },
];

export function LandingStats() {
  return (
    <section className="py-20 border-y border-white/[0.08] bg-[#07090e] relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[250px] bg-purple-900/15 rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {STATS.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div
                key={i}
                className={`p-6 sm:p-8 rounded-3xl bg-white/[0.03] border border-white/10 ${stat.border} transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1`}
              >
                <div>
                  <div className={`w-12 h-12 rounded-2xl ${stat.bg} border border-white/5 flex items-center justify-center mb-6`}>
                    <Icon className={`w-6 h-6 ${stat.accent}`} />
                  </div>
                  <span className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-2 block font-mono">
                    {stat.value}
                  </span>
                  <span className="text-sm font-extrabold text-slate-100 block mb-1">
                    {stat.label}
                  </span>
                  <span className={`text-xs font-semibold ${stat.accent} block mb-3`}>
                    {stat.subtext}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed border-t border-white/5 pt-3">
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

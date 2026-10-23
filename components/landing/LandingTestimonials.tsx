"use client";

import React from "react";
import { Brain, Flame, ShieldAlert, Sparkles } from "lucide-react";

const PAIN_POINTS = [
  {
    icon: Flame,
    title: "The Post-Scroll Guilt Cycle",
    problem: "Losing 2 to 3 hours every evening scrolling mindless reels in your hostel or PG room, followed by acute self-reproach.",
    solution: "Replaces entertainment reels with 15-second NCERT question cards. 10 minutes equals 25 questions practiced with zero guilt.",
    accent: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
  },
  {
    icon: Brain,
    title: "Passive Reading vs Active Recall",
    problem: "Re-reading NCERT Biology gives a false illusion of mastery, but in the exam hall, confusing options trigger negative marks.",
    solution: "Forces active synaptic retrieval under a 15-second countdown timer. Locks concepts into long-term memory.",
    accent: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
  },
  {
    icon: ShieldAlert,
    title: "The -1.00 Guesswork Trap",
    problem: "Careless guessing ruins borderline ranks in NEET UG. Most quiz apps reward random taps with cheap points.",
    solution: "Enforces authentic NTA negative marking (-1.00 per error), conditioning you to eliminate reckless guesses.",
    accent: "text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
  },
];

export function LandingTestimonials() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Targeting The Real NEET Prep Bottleneck</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Built Directly Around NEET Aspirant Psychology
          </h2>
          <p className="text-sm text-slate-400 mt-3">
            Traditional coaching solves the syllabus. Qz Loop solves the daily screen habit that sabotages your ranks.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PAIN_POINTS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-8 rounded-3xl bg-white/[0.03] border border-white/10 hover:border-purple-500/40 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className={`w-12 h-12 rounded-2xl ${item.bg} border ${item.border} flex items-center justify-center mb-6`}>
                    <Icon className={`w-6 h-6 ${item.accent}`} />
                  </div>
                  <h3 className="font-extrabold text-lg text-white mb-3">
                    {item.title}
                  </h3>
                  <div className="mb-4">
                    <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider block mb-1">
                      The Problem
                    </span>
                    <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                      {item.problem}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                    The Qz Loop Solution
                  </span>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                    {item.solution}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

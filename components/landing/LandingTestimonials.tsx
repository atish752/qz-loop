"use client";

import React from "react";
import { Star, ShieldCheck } from "lucide-react";

const REVIEWS = [
  {
    quote: "Replaced 3 hours of hostel reel doomscrolling with 40 NCERT Biology PYQs during tea breaks.",
    author: "Priya Sharma",
    detail: "NEET UG · Kota",
    metric: "Accuracy 68% → 89%",
  },
  {
    quote: "The strict -1.00 penalty broke my bad habit of reckless blind guessing in mocks.",
    author: "Rohan Verma",
    detail: "JEE Main · Jaipur",
    metric: "Eliminated -18 Guess Penalty",
  },
  {
    quote: "I solve 25 high-yield questions on my crowded city bus commute. Zero wasted time.",
    author: "Neha Tiwari",
    detail: "SSC CGL · Patna",
    metric: "25+ Qs / Commute",
  },
];

export function LandingTestimonials() {
  return (
    <section id="reviews" className="py-24 border-y border-white/[0.06] bg-[#07090e] relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-slate-300 text-[11px] font-bold uppercase tracking-wider mb-3">
            <span>Verified Aspirants</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Loved across Kota, Delhi & Patna.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {REVIEWS.map((review, idx) => (
            <div
              key={idx}
              className="p-7 rounded-3xl bg-white/[0.02] border border-white/5 flex flex-col justify-between hover:border-white/10 transition-colors"
            >
              <div>
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm sm:text-base text-slate-200 font-medium leading-relaxed mb-6">
                  "{review.quote}"
                </p>
              </div>

              <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-white block">{review.author}</span>
                  <span className="text-[11px] text-slate-400 font-mono">{review.detail}</span>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 text-[10px] font-bold font-mono">
                  {review.metric}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

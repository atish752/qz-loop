"use client";

import React from "react";
import { Quote, Star } from "lucide-react";

const TESTIMONIALS = [
  {
    name: "Vikram Sharma",
    badge: "SSC CGL Aspirant · Mukherjee Nagar, Delhi",
    text: "I used to waste 2 hours every evening in my PG room just scrolling mindless reels. Now whenever my thumb reflexively unlocks my phone, I open Qz Loop. Doing 30 questions during tea breaks increased my General Awareness score by 16 marks.",
    rating: 5,
  },
  {
    name: "Pooja Kumari",
    badge: "RRB NTPC Candidate · Patna",
    text: "The real negative marking is brutal but necessary. In normal quiz apps, you guess blindly. Qz Loop made me calculate the risk before tapping. The 15-second timer forces genuine exam speed.",
    rating: 5,
  },
  {
    name: "Aditya Verma",
    badge: "NEET UG Repeater · Kota",
    text: "The Spaced Repetition engine is magic. Questions I got wrong yesterday appeared again today during lunch. It's the only app that makes doomscrolling actually productive.",
    rating: 5,
  },
];

export function LandingTestimonials() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
            Real Aspirant Stories
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mt-3">
            From Guilt-Ridden Doomscrollers to Rank Boosters
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, idx) => (
            <div
              key={idx}
              className="p-8 rounded-3xl bg-white/[0.03] border border-white/10 hover:border-purple-500/40 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex text-amber-400 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-slate-300 leading-relaxed italic mb-6">
                  "{t.text}"
                </p>
              </div>

              <div className="pt-4 border-t border-white/10">
                <span className="font-bold text-sm text-white block">{t.name}</span>
                <span className="text-xs text-slate-400">{t.badge}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

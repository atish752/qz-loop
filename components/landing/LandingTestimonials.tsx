"use client";

import React from "react";
import { Star, ShieldCheck, Sparkles, MessageCircle, Quote } from "lucide-react";

interface AspirantReview {
  name: string;
  handle: string;
  exam: string;
  location: string;
  date: string;
  title: string;
  comment: string;
  scoreHighlight: string;
}

const REVIEWS: AspirantReview[] = [
  {
    name: "Priya Sharma",
    handle: "priya_neet_kota",
    exam: "NEET UG Medical Aspirant",
    location: "Kota, Rajasthan (Allen Classroom)",
    date: "Jan 18, 2026",
    title: "Replaced 3 hours of hostel reel doomscrolling",
    comment:
      "I used to spend 2 to 3 hours every night in my Kota hostel room scrolling mindless Instagram reels, followed by unbearable guilt. Qz-loop tapped into that exact same thumb habit. Now, instead of brainrot, I solve 40 NCERT Biology PYQs during chai breaks. My Botany practice accuracy went from 68% to 89%.",
    scoreHighlight: "Botany Accuracy 68% → 89%",
  },
  {
    name: "Rohan Verma",
    handle: "rohan_jee_topper",
    exam: "JEE Main (Engineering)",
    location: "Jaipur, Rajasthan",
    date: "Dec 29, 2025",
    title: "Negative marking conditioning saved my borderline cutoff",
    comment:
      "In coaching mocks, I always bled marks to reckless blind guessing. Other quiz apps reward random tapping with fake points, which ruins your exam habits. Qz-loop's strict -1.00 NTA penalty conditions you to skip smartly. The 15-second timer eliminated my exam hall freeze.",
    scoreHighlight: "Eliminated -18 Guess Penalty",
  },
  {
    name: "Aditya Kumar",
    handle: "aditya_upsc_aspirant",
    exam: "UPSC CSE Prelims GS-1",
    location: "Old Rajinder Nagar, New Delhi",
    date: "Jan 4, 2026",
    title: "1v1 WhatsApp duels make solitary prep competitive again",
    comment:
      "Studying alone in a small 10x10 room in Rajinder Nagar was draining my motivation. My study partner and I now send 5-question speed duels on WhatsApp every morning before newspaper reading. It sparks instant active recall and debate over NCERT Polity & Modern History proofs.",
    scoreHighlight: "Daily Morning Duel Habit",
  },
  {
    name: "Neha Tiwari",
    handle: "neha_ssc_cgl",
    exam: "SSC CGL (Tier 1 & 2)",
    location: "Patna, Bihar",
    date: "Jan 22, 2026",
    title: "Perfect for the 35-minute crowded bus commute",
    comment:
      "You cannot open a thick Quant book or a 200-question test series on a crowded Patna city bus. But with Qz-loop, I solve 25 high-yield Arithmetic and Static GK reels effortlessly with one thumb. Dead transit time turned into pure rank mastery.",
    scoreHighlight: "30+ PYQs per Commute",
  },
];

export function LandingTestimonials() {
  return (
    <section id="reviews" className="py-28 relative overflow-hidden bg-[#07090e]">
      {/* Subtle ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[350px] bg-purple-900/10 rounded-full blur-[140px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-bold mb-3 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Verified Aspirant Community</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Loved by Aspirants Across Kota, Delhi & Patna
          </h2>
          <p className="text-sm sm:text-base text-slate-400 mt-4 leading-relaxed">
            Real stories from students who broke their social media doomscroll loop and converted it into daily rank-building streaks.
          </p>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {REVIEWS.map((review, idx) => (
            <div
              key={idx}
              className="p-7 sm:p-8 rounded-3xl bg-white/[0.03] border border-white/10 hover:border-purple-500/40 transition-all duration-300 flex flex-col justify-between group shadow-xl"
            >
              <div>
                {/* Header: Stars & Date */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="text-[11px] font-mono text-slate-500">{review.date}</span>
                </div>

                {/* Review Title */}
                <h3 className="font-extrabold text-base sm:text-lg text-white mb-2 leading-snug">
                  "{review.title}"
                </h3>

                {/* Review Body */}
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6 font-normal">
                  {review.comment}
                </p>
              </div>

              {/* Footer: Student Profile & Badge */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-emerald-400 p-[1.5px] shrink-0">
                    <div className="w-full h-full rounded-full bg-[#090d16] flex items-center justify-center font-black text-white text-xs">
                      {review.name.split(" ").map(n => n[0]).join("")}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white block">{review.name}</span>
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono block">
                      {review.exam} · {review.location}
                    </span>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[10px] font-bold font-mono shrink-0">
                  {review.scoreHighlight}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

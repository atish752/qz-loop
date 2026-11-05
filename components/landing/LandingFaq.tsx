"use client";

import React, { useState } from "react";
import { ChevronDown, HelpCircle, Sparkles } from "lucide-react";

interface FaqItem {
  q: string;
  a: string;
}

const FAQS: FaqItem[] = [
  {
    q: "How does Qz Loop replace my social media reel addiction?",
    a: "Social media exploits the Skinner Box to keep you swiping through 30-second videos. Qz Loop maps onto that exact thumb reflex: each 15-second card presents a high-yield exam PYQ. You get the rapid dopamine of social scrolling, but finish your break with 25 questions solved, verified NCERT proofs, and zero post-scroll guilt.",
  },
  {
    q: "What is the '/goal · /plan · /boost' habit system?",
    a: "It is our 3-part behavioral framework: (1) /goal sets a realistic 25-question daily target with a 70% streak safety net; (2) /plan runs automated spaced repetition at 24 hours, 3 days, and 7 days to eliminate the forgetting curve; (3) /boost simulates real exam hall adrenaline with a 15-second active viewport timer.",
  },
  {
    q: "Why does Qz Loop enforce authentic NTA negative marking (-1.00)?",
    a: "Most gamified quiz apps give positive points for blind guesses, which conditions dangerous habits for the actual exam hall. In competitive exams like NEET UG and JEE Main, careless mistakes cost ranks. Qz Loop immediately deducts -1.00 mark per error, training you to identify when to solve and when to smartly skip.",
  },
  {
    q: "Do I need to install an app or can I practice on the web?",
    a: "Both! You can install the official native Android app from the Google Play Store for offline caching and push reminders, or practice instantly on your browser at qz-loop.vercel.app with zero signup required for the first 25 questions.",
  },
  {
    q: "How do 1v1 WhatsApp Speed Duels work?",
    a: "Studying in isolation can feel lonely and demotivating. Qz Loop allows you to generate a 5-question speed duel challenge and send the direct link to your study partner or WhatsApp group. Your friends can answer directly on their phone, generating an instant competitive rank scorecard.",
  },
  {
    q: "Is Qz Loop free to use for competitive exam aspirants?",
    a: "Yes! The core micro-practice feed, daily spaced repetition matrix, 15-second sprint timer, and WhatsApp peer duels are 100% free for all competitive aspirants.",
  },
];

export function LandingFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (i: number) => {
    setOpenIndex(openIndex === i ? null : i);
  };

  return (
    <section id="faq" className="py-28 bg-[#090d16]/70 border-t border-white/[0.06] relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-bold mb-3 shadow-sm">
            <HelpCircle className="w-4 h-4" />
            <span>Frequently Asked Questions</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Everything You Need to Know
          </h2>
          <p className="text-sm sm:text-base text-slate-400 mt-3">
            How Qz Loop turns dead screen time into your competitive exam secret weapon.
          </p>
        </div>

        <div className="space-y-3.5">
          {FAQS.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={i}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isOpen
                    ? "border-purple-500/40 bg-white/[0.04] shadow-lg shadow-purple-950/20"
                    : "border-white/10 bg-white/[0.02] hover:border-white/20"
                }`}
              >
                <button
                  onClick={() => toggle(i)}
                  className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 transition-colors"
                >
                  <span className="font-extrabold text-sm sm:text-base text-slate-100">
                    {item.q}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                      isOpen ? "rotate-180 text-emerald-400" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 sm:px-6 pb-6 pt-1 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-white/5 animate-in fade-in duration-200">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

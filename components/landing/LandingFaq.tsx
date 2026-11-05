"use client";

import React, { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

interface FaqItem {
  q: string;
  a: string;
}

const FAQS: FaqItem[] = [
  {
    q: "How does Qz Loop replace my social media scrolling?",
    a: "It maps onto your existing thumb reflex. Instead of 30-second brainrot videos, each swipe presents a 15-second high-yield exam PYQ with instant NTA feedback. You get the same fast pace with zero post-scroll guilt.",
  },
  {
    q: "What is '/goal · /plan · /boost'?",
    a: "Our core behavioral engine: /goal sets a realistic 25-question transit target; /plan runs automated spaced repetition at 24h, 3d, and 7d; /boost trains your nerves with a live 15-second exam stopwatch.",
  },
  {
    q: "Why enforce real negative marking (-1.00)?",
    a: "Standard quiz apps reward random tapping, which creates fatal habits in real exam halls. Qz Loop enforces authentic penalties to train you when to solve and when to skip.",
  },
  {
    q: "Is Qz Loop free for aspirants?",
    a: "Yes. The core micro-practice feed, daily spaced repetition matrix, 15-second sprint timer, and WhatsApp peer duels are 100% free.",
  },
];

export function LandingFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (i: number) => {
    setOpenIndex(openIndex === i ? null : i);
  };

  return (
    <section id="faq" className="py-24 bg-[#07090e] border-t border-white/[0.06] relative">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-slate-300 text-[11px] font-bold uppercase tracking-wider mb-3">
            <HelpCircle className="w-3.5 h-3.5 text-purple-400" />
            <span>Questions</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Direct answers.
          </h2>
        </div>

        <div className="space-y-3">
          {FAQS.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={i}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isOpen
                    ? "border-purple-500/30 bg-white/[0.03]"
                    : "border-white/5 bg-white/[0.01] hover:border-white/10"
                }`}
              >
                <button
                  onClick={() => toggle(i)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 transition-colors"
                >
                  <span className="font-bold text-sm sm:text-base text-white">
                    {item.q}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                      isOpen ? "rotate-180 text-emerald-400" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-white/5 pt-2 animate-in fade-in duration-200">
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

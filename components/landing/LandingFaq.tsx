"use client";

import React, { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

interface FaqItem {
  q: string;
  a: string;
}

const FAQS: FaqItem[] = [
  {
    q: "Do I need to download an app from the Play Store?",
    a: "No! Qz Loop is a progressive, ultra-fast web application. Simply click 'Launch WebApp' or visit qz-loop.vercel.app directly on your mobile or desktop browser. You can even tap 'Add to Home Screen' for an instant full-screen native app experience without taking storage.",
  },
  {
    q: "How does the 'Reels' doomscroll replacement work?",
    a: "Instead of mindlessly swiping 30-second dance videos, Qz Loop presents 15-second, syllabus-accurate multiple choice questions. You swipe up to solve the next challenge. 10 minutes of scrolling equals 25 exam PYQs solved with instant verification, locking in dopamine with zero post-study guilt.",
  },
  {
    q: "How does the real exam negative marking work?",
    a: "Unlike superficial quiz games that give positive points for guesses, Qz Loop conditions you for the real NTA exam hall. In NEET UG, correct answers award +4.00 marks, while wrong answers deduct -1.00 mark. You immediately see whether your guess was mathematically worth the risk.",
  },
  {
    q: "What examinations are currently included?",
    a: "Currently, Qz Loop is live and exclusively tailored for NEET UG (NCERT Biology, Chemistry & Physics). Other examinations (JEE Main, SSC CGL, Railways RRB, and UPSC CSAT) are in development and will be rolled out in upcoming releases.",
  },
  {
    q: "How does the Spaced Repetition Matrix help me remember?",
    a: "When you miss a question or take too long, our spaced repetition algorithm marks that concept. It automatically re-injects that question or a similar variant into your feed after 24 hours, then again at 3 days, ensuring permanent retention in long-term memory.",
  },
  {
    q: "Is Qz Loop free to use?",
    a: "Yes! The core micro-practice feed, daily spaced repetition matrix, and WhatsApp peer challenge duels are 100% free for all competitive aspirants.",
  },
];

export function LandingFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (i: number) => {
    setOpenIndex(openIndex === i ? null : i);
  };

  return (
    <section id="faq" className="py-24 bg-[#090d16]/60 border-t border-white/[0.06] relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold mb-3">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Got Questions?</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            Everything you need to know about switching from doomscrolling to active recall.
          </p>
        </div>

        <div className="space-y-3">
          {FAQS.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={i}
                className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden transition-all duration-200"
              >
                <button
                  onClick={() => toggle(i)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 hover:bg-white/[0.03] transition-colors"
                >
                  <span className="font-bold text-sm sm:text-base text-slate-100">
                    {item.q}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                      isOpen ? "rotate-180 text-emerald-400" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-300 leading-relaxed animate-in fade-in duration-200 border-t border-white/5">
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

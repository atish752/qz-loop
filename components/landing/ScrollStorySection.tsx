"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Sparkles,
  ArrowDown,
  Brain,
  Zap,
  Clock,
  ShieldAlert,
  Award,
  ChevronDown,
  XCircle,
  CheckCircle2,
  Flame,
  TrendingUp,
} from "lucide-react";

export function ScrollStorySection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);
  const [activeStage, setActiveStage] = useState(0);

  // Measure element visibility relative to the viewport center
  const [itemProgress, setItemProgress] = useState<number[]>([1, 0.2, 0.2, 0.2, 0.2]);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Overall progress through this section (0 to 1)
      const totalDist = rect.height;
      const currentPos = windowHeight - rect.top;
      const overall = Math.min(1, Math.max(0, currentPos / (totalDist + windowHeight * 0.5)));
      setScrollY(overall);

      // Measure child sections
      const elements = containerRef.current.querySelectorAll<HTMLElement>("[data-story-step]");
      const progresses: number[] = [];
      elements.forEach((el, idx) => {
        const elRect = el.getBoundingClientRect();
        // Element is fully active when its center is near the viewport middle
        const elCenter = elRect.top + elRect.height / 2;
        const viewportCenter = windowHeight * 0.5;
        const distFromCenter = Math.abs(elCenter - viewportCenter);
        const maxDist = windowHeight * 0.45;

        if (distFromCenter < maxDist) {
          const p = 1 - (distFromCenter / maxDist) * 0.75;
          progresses.push(Math.min(1, Math.max(0.2, p)));
        } else if (elCenter < viewportCenter) {
          // Already scrolled past: stay bright
          progresses.push(0.9);
        } else {
          // Yet to enter center: dim
          progresses.push(0.2);
        }
      });

      if (progresses.length > 0) {
        setItemProgress(progresses);
        // Determine active stage
        const maxVal = Math.max(...progresses);
        const activeIdx = progresses.indexOf(maxVal);
        if (activeIdx !== -1) setActiveStage(activeIdx);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative w-full py-28 md:py-36 bg-gradient-to-b from-[#07090e] via-[#090d16] to-[#07090e] border-y border-white/[0.06] overflow-hidden"
    >
      {/* Dynamic ambient auroras that shift with scroll */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[750px] h-[400px] bg-purple-900/15 rounded-full blur-[140px] pointer-events-none -z-10 transition-transform duration-700 ease-out"
        style={{
          transform: `translate(-50%, ${scrollY * 120}px)`,
        }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-emerald-900/10 rounded-full blur-[140px] pointer-events-none -z-10 transition-transform duration-700 ease-out"
        style={{
          transform: `translate(${scrollY * -60}px, 0)`,
        }}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Floating Story Progress Tracker Pill */}
        <div className="flex justify-center mb-16 sticky top-24 z-30 pointer-events-none">
          <div className="pointer-events-auto inline-flex items-center gap-1.5 p-1 rounded-full bg-slate-900/90 border border-white/10 backdrop-blur-xl shadow-2xl">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400 px-3">
              THE ASPIRANT REALITY
            </span>
            <div className="flex items-center gap-1 px-1">
              {[0, 1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    activeStage >= step
                      ? "w-6 bg-gradient-to-r from-purple-500 to-emerald-400"
                      : "w-2 bg-white/20"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Narrative Flow */}
        <div className="space-y-24 md:space-y-36">
          {/* Act 1: The Kota / Delhi Hostel Dilemma */}
          <div
            data-story-step="0"
            className="transition-all duration-300 transform"
            style={{
              opacity: itemProgress[0] ?? 1,
              transform: `translateY(${(1 - (itemProgress[0] ?? 1)) * 18}px)`,
            }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-bold tracking-wide mb-6">
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
              <span>THE 10:00 PM HOSTEL REALITY</span>
            </div>

            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.15] tracking-tight">
              Every evening in Kota, Old Rajinder Nagar, and Patna starts with pure determination.
            </h2>
            <p className="text-lg sm:text-2xl text-slate-300 mt-6 leading-relaxed font-normal">
              You sit at your study desk surrounded by NCERTs and coaching modules, determined to crush 6 hours of high-yield PYQs before sleep.
            </p>
          </div>

          {/* Act 2: The 2-Minute Telegram Lie */}
          <div
            data-story-step="1"
            className="transition-all duration-300 transform"
            style={{
              opacity: itemProgress[1] ?? 0.2,
              transform: `translateY(${(1 - (itemProgress[1] ?? 0.2)) * 18}px)`,
            }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-bold tracking-wide mb-6">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>THE RECEPTOR HIJACK</span>
            </div>

            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.15] tracking-tight">
              Then you pick up your phone{" "}
              <span className="text-purple-400">"just for 2 minutes"</span> to check a doubt on Telegram.
            </h2>

            {/* Parallax distraction badges */}
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-pink-500/15 to-purple-500/15 border border-pink-500/30 text-pink-200 text-sm font-bold shadow-lg shadow-pink-950/20">
                <span className="w-2 h-2 rounded-full bg-pink-400" />
                <span>Instagram Reels</span>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-red-500/15 to-rose-500/15 border border-red-500/30 text-red-200 text-sm font-bold shadow-lg shadow-red-950/20">
                <span className="w-2 h-2 rounded-full bg-red-400" />
                <span>YouTube Shorts</span>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-sky-500/15 to-indigo-500/15 border border-sky-500/30 text-sky-200 text-sm font-bold shadow-lg shadow-sky-950/20">
                <span className="w-2 h-2 rounded-full bg-sky-400" />
                <span>Telegram Groups</span>
              </div>
            </div>

            <p className="text-lg sm:text-2xl text-slate-300 mt-8 leading-relaxed">
              Before you know it, it's 1:30 AM.{" "}
              <span className="text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded-lg border border-rose-500/20">
                3 hours vanished into mindless thumb flicking.
              </span>{" "}
              The acute pit of guilt hits your stomach. Your competitive exam is in 70 days.
            </p>
          </div>

          {/* Act 3: The Epiphany */}
          <div
            data-story-step="2"
            className="transition-all duration-300 transform"
            style={{
              opacity: itemProgress[2] ?? 0.2,
              transform: `translateY(${(1 - (itemProgress[2] ?? 0.2)) * 18}px)`,
            }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-bold tracking-wide mb-6">
              <Brain className="w-3.5 h-3.5 text-purple-400" />
              <span>THE BEHAVIORAL TRUTH</span>
            </div>

            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.15] tracking-tight">
              You were never undisciplined.
            </h2>
            <p className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-purple-300 via-indigo-200 to-emerald-300 bg-clip-text text-transparent mt-6 leading-relaxed">
              Silicon Valley spent $100 Billion conditioning your thumb to swipe upward every 15 seconds.
            </p>
            <p className="text-base sm:text-xl text-slate-400 mt-4 leading-relaxed">
              Thick 500-page coaching question banks cannot fight engineered dopamine. You didn't want heavy PDFs. Your thumb just wanted fast, satisfying micro-loops.
            </p>

            {/* Kinetic Reel Words */}
            <div className="mt-10 py-6 border-y border-white/10 flex flex-wrap items-center justify-between gap-4 font-black text-xl sm:text-3xl uppercase tracking-wider text-slate-500">
              <span className="text-slate-400">Swipe Up</span>
              <span className="text-purple-400">· Solve MCQ</span>
              <span className="text-indigo-400">· Lock Proof</span>
              <span className="text-emerald-400">· Rank Higher</span>
            </div>
          </div>

          {/* Act 4: The Weaponization Solution */}
          <div
            data-story-step="3"
            className="transition-all duration-300 transform"
            style={{
              opacity: itemProgress[3] ?? 0.2,
              transform: `translateY(${(1 - (itemProgress[3] ?? 0.2)) * 18}px)`,
            }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold tracking-wide mb-6">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>THE SOLUTION</span>
            </div>

            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.15] tracking-tight">
              What if you stopped fighting the thumb swipe? <br />
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 bg-clip-text text-transparent">
                What if you weaponized it for your exam cutoff?
              </span>
            </h2>

            <p className="text-base sm:text-xl text-slate-300 mt-6 leading-relaxed max-w-3xl">
              Welcome to <strong>Qz Loop</strong>. The first reels-format active recall engine designed specifically for Indian aspirants preparing for NEET, JEE, UPSC, and SSC.
            </p>
          </div>
        </div>

        {/* The 10x Transformation Visual Matrix (Side-by-Side Comparison) */}
        <div className="mt-28 grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {/* Card 1: 60 Mins Social Media Trap */}
          <div className="p-8 sm:p-10 rounded-3xl bg-rose-950/20 border border-rose-500/25 relative overflow-hidden flex flex-col justify-between group hover:border-rose-500/50 transition-all duration-300 shadow-xl">
            <div className="absolute top-0 right-0 w-36 h-36 bg-rose-600/10 rounded-full blur-[45px] pointer-events-none" />
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold mb-4">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                <span>THE BRAINROT TRAP</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white mb-4">
                60 Minutes on Reels
              </h3>
              <ul className="space-y-4 text-sm text-slate-300">
                <li className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-white">240 passive videos:</strong> Dopamine surges without any retained knowledge or formulas.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-white">Zero active recall:</strong> Illusion of relaxation followed immediately by panic and guilt.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-white">Direct Result:</strong> 0 PYQs solved, wasted evening, lower confidence in mock tests.
                  </span>
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-6 border-t border-rose-500/20 flex items-center justify-between text-xs font-bold text-rose-300">
              <span>Mental State: Exhausted & Guilty</span>
              <span className="px-3 py-1 rounded-lg bg-rose-500/20 border border-rose-500/30 text-rose-200 font-mono">
                0 Marks Added
              </span>
            </div>
          </div>

          {/* Card 2: 60 Mins Qz Loop Virtuous Sprint */}
          <div className="p-8 sm:p-10 rounded-3xl bg-emerald-950/25 border border-emerald-500/35 relative overflow-hidden flex flex-col justify-between group hover:border-emerald-500/60 transition-all duration-300 shadow-[0_0_50px_rgba(16,185,129,0.15)]">
            <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/20 rounded-full blur-[45px] pointer-events-none" />
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold mb-4">
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                <span>THE QZ LOOP VIRTUOUS SPRINT</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white mb-4">
                60 Minutes on Qz Loop
              </h3>
              <ul className="space-y-4 text-sm text-slate-200">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-white">240 high-yield MCQs:</strong> 15-second timed decisions on authentic NCERT PYQs.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-white">Official NTA negative marking:</strong> Teaches your brain to avoid reckless gambles.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-white">Automated Spaced Repetition:</strong> Missed questions resurface at 24 hours automatically.
                  </span>
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-6 border-t border-emerald-500/25 flex items-center justify-between text-xs font-bold text-emerald-300">
              <span>Mental State: Proud & Confident</span>
              <span className="px-3 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-200 font-mono">
                +960 Marks Attempted
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

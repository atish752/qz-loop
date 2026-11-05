"use client";

import React from "react";
import { ScrollProgress } from "./ScrollProgress";
import { LandingNavbar } from "./LandingNavbar";
import { LandingHero } from "./LandingHero";
import { LandingContrast } from "./LandingContrast";
import { LandingHabitEngine } from "./LandingHabitEngine";
import { ExamRow } from "./ExamRow";
import { LandingStats } from "./LandingStats";
import { LandingCtaBanner } from "./LandingCtaBanner";
import { LandingFooter } from "./LandingFooter";

export function LandingPage() {
  return (
    <div className="w-full min-h-screen bg-[#05070c] text-slate-100 flex flex-col selection:bg-purple-500/30 selection:text-white">
      {/* 1. Scroll Progress Indicator */}
      <ScrollProgress />

      {/* 2. Glassmorphic Navigation */}
      <LandingNavbar />

      <main className="flex-1 w-full flex flex-col">
        {/* 3. Apple-Grade Hero with Interactive Device Reel */}
        <LandingHero />

        {/* 4. The Shift: High-Contrast Pictorial Reality Check */}
        <LandingContrast />

        {/* 5. The Habit Engine: /goal · /plan · /boost with Pictorial SVG Curves */}
        <LandingHabitEngine />

        {/* 6. Curated Premier Competitive Exams */}
        <ExamRow />

        {/* 7. Apple-Style Big Numbers */}
        <LandingStats />

        {/* 8. Final Conversion CTA */}
        <LandingCtaBanner />
      </main>

      {/* 9. Minimalist Compliance Footer */}
      <LandingFooter />
    </div>
  );
}

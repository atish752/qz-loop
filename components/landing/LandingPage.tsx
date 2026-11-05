"use client";

import React from "react";
import { ScrollProgress } from "./ScrollProgress";
import { LandingNavbar } from "./LandingNavbar";
import { LandingHero } from "./LandingHero";
import { LandingContrast } from "./LandingContrast";
import { LandingHabitEngine } from "./LandingHabitEngine";
import { LandingStats } from "./LandingStats";
import { ExamRow } from "./ExamRow";
import { LandingDuels } from "./LandingDuels";
import { LandingTestimonials } from "./LandingTestimonials";
import { LandingFaq } from "./LandingFaq";
import { LandingCtaBanner } from "./LandingCtaBanner";
import { LandingFooter } from "./LandingFooter";

export function LandingPage() {
  return (
    <div className="w-full min-h-screen bg-[#07090e] text-slate-100 flex flex-col selection:bg-purple-500/30 selection:text-white">
      {/* 1. Scroll Progress Indicator */}
      <ScrollProgress />

      {/* 2. Glassmorphic Navigation */}
      <LandingNavbar />

      <main className="flex-1 w-full flex flex-col">
        {/* 3. Apple-Grade Hero with Interactive Device Reel */}
        <LandingHero />

        {/* 4. The Reality Check: 2-Card Visual Contrast (Reels vs Qz-Loop) */}
        <LandingContrast />

        {/* 5. The Habit Engine: /goal · /plan · /boost */}
        <LandingHabitEngine />

        {/* 6. Apple-Style Big Numbers */}
        <LandingStats />

        {/* 7. Curated 10 Competitive Exams */}
        <ExamRow />

        {/* 8. 1-Tap WhatsApp Duels */}
        <LandingDuels />

        {/* 9. Punchy Verified Aspirant Quotes */}
        <LandingTestimonials />

        {/* 10. Direct FAQ */}
        <LandingFaq />

        {/* 11. Final Conversion CTA */}
        <LandingCtaBanner />
      </main>

      {/* 12. Minimalist Compliance Footer */}
      <LandingFooter />
    </div>
  );
}

"use client";

import React from "react";
import { ScrollProgress } from "./ScrollProgress";
import { LandingNavbar } from "./LandingNavbar";
import { LandingHero } from "./LandingHero";
import { ScrollStorySection } from "./ScrollStorySection";
import { LandingStats } from "./LandingStats";
import { LandingHabitEngine } from "./LandingHabitEngine";
import { ExamRow } from "./ExamRow";
import { LandingBentoFeatures } from "./LandingBentoFeatures";
import { LandingComparison } from "./LandingComparison";
import { LandingTestimonials } from "./LandingTestimonials";
import { LandingFaq } from "./LandingFaq";
import { LandingCtaBanner } from "./LandingCtaBanner";
import { LandingFooter } from "./LandingFooter";

export function LandingPage() {
  return (
    <div className="w-full min-h-screen bg-[#07090e] text-slate-100 flex flex-col selection:bg-purple-500/30 selection:text-white">
      {/* Scroll Progress Bar at top edge */}
      <ScrollProgress />

      <LandingNavbar />

      <main className="flex-1 w-full flex flex-col">
        {/* 1. Flagship Hero with Interactive Device Mockup */}
        <LandingHero />

        {/* 2. Holy Scroll-Style Narrative Scroll Story Section */}
        <ScrollStorySection />

        {/* 3. 4-Pillar Stat Impact Cards */}
        <LandingStats />

        {/* 4. The 3-Pillar Habit Engine (/goal, /plan, /boost) */}
        <LandingHabitEngine />

        {/* 5. 10 Indian Competitive Examinations Showcase */}
        <ExamRow />

        {/* 6. Apple-Grade Bento Grid with Interactive Negative Marking Simulator */}
        <LandingBentoFeatures />

        {/* 7. High-Contrast Paradigm Comparison Matrix */}
        <LandingComparison />

        {/* 8. App Store Verified Aspirant Community Reviews */}
        <LandingTestimonials />

        {/* 9. Frequently Asked Questions */}
        <LandingFaq />

        {/* 10. Radiant Final Conversion Call-To-Action */}
        <LandingCtaBanner />
      </main>

      {/* 11. Comprehensive Brand & Compliance Footer */}
      <LandingFooter />
    </div>
  );
}

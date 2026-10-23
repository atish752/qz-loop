"use client";

import React from "react";
import { LandingNavbar } from "./LandingNavbar";
import { LandingHero } from "./LandingHero";
import { LandingStats } from "./LandingStats";
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
      <LandingNavbar />
      <main className="flex-1 w-full flex flex-col">
        <LandingHero />
        <LandingStats />
        <ExamRow />
        <LandingBentoFeatures />
        <LandingComparison />
        <LandingTestimonials />
        <LandingFaq />
        <LandingCtaBanner />
      </main>
      <LandingFooter />
    </div>
  );
}

"use client";

import React from "react";
import { Check, ShieldCheck, Trophy } from "lucide-react";

const EXAMS = [
  { name: "SSC CGL / CHSL", code: "TCS Pattern · Tier 1 & 2", badge: "6.5M Aspirants" },
  { name: "RRB NTPC & Group D", code: "Railway Recruitment", badge: "12M Aspirants" },
  { name: "NEET UG", code: "NTA Biology & Chemistry", badge: "2.4M Aspirants" },
  { name: "Banking (SBI / IBPS)", code: "PO & Clerical Cadre", badge: "4.8M Aspirants" },
  { name: "UPSC CSAT & GS", code: "Civil Services Prelims", badge: "1.1M Aspirants" },
  { name: "Defence (CDS / NDA)", code: "UPSC Combined Defence", badge: "900K Aspirants" },
  { name: "State Police & SI", code: "UP, Bihar, MP Police", badge: "8.2M Aspirants" },
  { name: "JEE Main", code: "Physics & Chemistry Micro PYQs", badge: "1.4M Aspirants" },
];

export function ExamRow() {
  return (
    <section id="exams" className="w-full py-16 border-y border-white/[0.06] bg-[#090d16]/50 relative overflow-hidden">
      {/* Background glow subtle */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[250px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>100% Official TCS & NTA Pattern Aligned</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Built for India's 65 Million Aspirants
          </h3>
          <p className="text-sm text-slate-400 mt-2">
            Every question features exact examination marking formulas and syllabus-accurate difficulty weights.
          </p>
        </div>

        {/* Exam Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {EXAMS.map((exam, i) => (
            <div
              key={i}
              className="p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-purple-500/40 transition-all duration-300 group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {exam.badge}
                </span>
                <Trophy className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white group-hover:text-purple-200 transition-colors">
                  {exam.name}
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">{exam.code}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

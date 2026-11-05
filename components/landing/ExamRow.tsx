"use client";

import React, { useState } from "react";
import { ShieldCheck, ArrowUpRight, Users } from "lucide-react";
import { APP_LOOP_URL } from "./LandingNavbar";

interface ExamInfo {
  id: string;
  name: string;
  shortName: string;
  subtitle: string;
  volume: string;
  subjects: string[];
  scoring: string;
}

const ALL_EXAMS: ExamInfo[] = [
  {
    id: "neet",
    name: "NEET UG Medical",
    shortName: "NEET UG",
    subtitle: "NCERT Biology, Chemistry & Physics",
    volume: "2.4M Aspirants",
    subjects: ["NCERT Bio", "Organic Chem", "Physics"],
    scoring: "+4 / -1 NTA",
  },
  {
    id: "jee",
    name: "JEE Main Engineering",
    shortName: "JEE Main",
    subtitle: "NTA Engineering Entrance",
    volume: "1.4M Aspirants",
    subjects: ["Physics", "Chemistry", "Mathematics"],
    scoring: "+4 / -1 NTA",
  },
  {
    id: "upsc",
    name: "UPSC Civil Services",
    shortName: "UPSC Prelims",
    subtitle: "GS Paper 1 & CSAT",
    volume: "1.1M Aspirants",
    subjects: ["Polity", "Modern History", "Geography", "CSAT"],
    scoring: "+2 / -0.66 UPSC",
  },
  {
    id: "ssc",
    name: "SSC CGL / CHSL",
    shortName: "SSC CGL",
    subtitle: "Staff Selection Commission",
    volume: "3.2M Aspirants",
    subjects: ["Quant", "Reasoning", "English", "Static GK"],
    scoring: "+2 / -0.50 SSC",
  },
  {
    id: "rrb",
    name: "Railways RRB NTPC",
    shortName: "RRB NTPC",
    subtitle: "Mega Recruitment Board",
    volume: "10M+ Applicants",
    subjects: ["General Science", "Maths", "Current Affairs"],
    scoring: "+1 / -0.33 RRB",
  },
  {
    id: "banking",
    name: "Banking IBPS / SBI PO",
    shortName: "IBPS / SBI",
    subtitle: "PO & Clerk Speed Rounds",
    volume: "1.5M Aspirants",
    subjects: ["Quant DI", "Reasoning", "English"],
    scoring: "+1 / -0.25 IBPS",
  },
  {
    id: "nda",
    name: "NDA & CDS Defence",
    shortName: "NDA / CDS",
    subtitle: "UPSC Defence Academy",
    volume: "800K Aspirants",
    subjects: ["Mathematics", "GAT", "English"],
    scoring: "+2.5 / -0.83 NDA",
  },
  {
    id: "gate",
    name: "GATE Engineering",
    shortName: "GATE",
    subtitle: "Graduate Aptitude Test",
    volume: "700K Aspirants",
    subjects: ["Core Branches", "Engineering Maths", "Aptitude"],
    scoring: "+1 / -0.33 GATE",
  },
  {
    id: "cuet",
    name: "CUET UG Central Univ",
    shortName: "CUET UG",
    subtitle: "Class 12 Domain Entrance",
    volume: "1.9M Aspirants",
    subjects: ["Domain Bio/Chem/Phys/Math", "General Test"],
    scoring: "+5 / -1 NTA",
  },
];

export function ExamRow() {
  const [selectedId, setSelectedId] = useState("neet");
  const activeExam = ALL_EXAMS.find((e) => e.id === selectedId) || ALL_EXAMS[0];

  return (
    <section id="exams" className="py-24 border-y border-white/[0.06] bg-[#07090e] relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] font-bold uppercase tracking-wider mb-4">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Pan-India Coverage</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-[1.08]">
            Curated for your syllabus.
          </h2>

          <p className="text-sm sm:text-base text-slate-400 mt-3 font-normal">
            Exact negative penalty rules and verified PYQ banks.
          </p>
        </div>

        {/* Minimal Pill Selector */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto no-scrollbar pb-2 justify-start md:justify-center">
          {ALL_EXAMS.map((exam) => (
            <button
              key={exam.id}
              onClick={() => setSelectedId(exam.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                selectedId === exam.id
                  ? "bg-white text-slate-950 shadow-md shadow-white/10 scale-102"
                  : "bg-white/[0.03] text-slate-400 hover:text-white border border-white/5"
              }`}
            >
              {exam.shortName}
            </button>
          ))}
        </div>

        {/* Selected Exam Apple-Style Showcase Card */}
        <div className="max-w-3xl mx-auto p-6 sm:p-8 rounded-3xl bg-white/[0.03] border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider">
                {activeExam.volume}
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-[10px] font-mono text-purple-300">
                {activeExam.scoring}
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-white mb-1">
              {activeExam.name}
            </h3>
            <p className="text-xs text-slate-400 mb-3">
              {activeExam.subtitle}
            </p>

            <div className="flex flex-wrap gap-1.5">
              {activeExam.subjects.map((s, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 text-slate-300 text-[11px] font-medium"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>

          <a
            href={APP_LOOP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full md:w-auto px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shrink-0 shadow-md shadow-purple-600/30"
          >
            <span>Practice {activeExam.shortName}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </section>
  );
}

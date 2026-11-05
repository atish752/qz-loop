"use client";

import React, { useState } from "react";
import { ArrowUpRight, Download } from "lucide-react";
import Link from "next/link";
import { OFFICIAL_PLAYSTORE_URL } from "./LandingNavbar";

interface ExamInfo {
  id: string;
  shortName: string;
  name: string;
  scoring: string;
  subjects: string[];
}

const ALL_EXAMS: ExamInfo[] = [
  {
    id: "neet",
    shortName: "NEET UG",
    name: "National Eligibility cum Entrance Test",
    scoring: "+4.00 / -1.00 NTA",
    subjects: ["NCERT Biology", "Organic Chemistry", "Physics"],
  },
  {
    id: "jee",
    shortName: "JEE Main",
    name: "Joint Entrance Examination",
    scoring: "+4.00 / -1.00 NTA",
    subjects: ["Physics", "Chemistry", "Mathematics"],
  },
  {
    id: "upsc",
    shortName: "UPSC Prelims",
    name: "Civil Services Preliminary Examination",
    scoring: "+2.00 / -0.66 UPSC",
    subjects: ["Polity", "Modern History", "Geography", "CSAT"],
  },
  {
    id: "ssc",
    shortName: "SSC CGL",
    name: "Combined Graduate Level",
    scoring: "+2.00 / -0.50 SSC",
    subjects: ["Quantitative Aptitude", "Reasoning", "English", "General Awareness"],
  },
  {
    id: "rrb",
    shortName: "RRB NTPC",
    name: "Non-Technical Popular Categories",
    scoring: "+1.00 / -0.33 RRB",
    subjects: ["General Science", "Maths", "Current Affairs"],
  },
  {
    id: "banking",
    shortName: "IBPS / SBI",
    name: "Bank PO & Clerk Examination",
    scoring: "+1.00 / -0.25 IBPS",
    subjects: ["Data Interpretation", "Reasoning", "English"],
  },
  {
    id: "nda",
    shortName: "NDA / CDS",
    name: "National Defence Academy",
    scoring: "+2.50 / -0.83 UPSC",
    subjects: ["Mathematics", "General Ability Test", "English"],
  },
  {
    id: "gate",
    shortName: "GATE",
    name: "Graduate Aptitude Test in Engineering",
    scoring: "+1.00 / -0.33 GATE",
    subjects: ["Core Engineering", "Engineering Maths", "General Aptitude"],
  },
  {
    id: "cuet",
    shortName: "CUET UG",
    name: "Common University Entrance Test",
    scoring: "+5.00 / -1.00 NTA",
    subjects: ["Domain Sciences", "General Aptitude"],
  },
];

export function ExamRow() {
  const [selectedId, setSelectedId] = useState("neet");
  const activeExam = ALL_EXAMS.find((e) => e.id === selectedId) || ALL_EXAMS[0];

  return (
    <section id="exams" className="py-20 md:py-24 border-y border-white/[0.06] bg-[#05070c] relative overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="text-[11px] font-mono font-bold text-emerald-400 uppercase tracking-widest block mb-2">
            Verified PYQ Banks
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Curated for India's toughest exams.
          </h2>
        </div>

        {/* Minimal Pill Selector */}
        <div className="flex items-center gap-1.5 mb-8 overflow-x-auto no-scrollbar pb-2 justify-start md:justify-center">
          {ALL_EXAMS.map((exam) => (
            <button
              key={exam.id}
              onClick={() => setSelectedId(exam.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                selectedId === exam.id
                  ? "bg-white text-slate-950 shadow-md shadow-white/10"
                  : "bg-white/[0.03] text-slate-400 hover:text-white border border-white/5"
              }`}
            >
              {exam.shortName}
            </button>
          ))}
        </div>

        {/* Selected Exam Minimalist Showcase Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white/[0.02] border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2 font-mono text-xs">
              <span className="text-white font-bold">{activeExam.name}</span>
              <span className="text-slate-600">·</span>
              <span className="text-purple-300 font-bold">{activeExam.scoring}</span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {activeExam.subjects.map((s, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-0.5 rounded-md bg-white/5 border border-white/5 text-slate-300 text-[11px]"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>

          <a
            href={OFFICIAL_PLAYSTORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-white text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all hover:bg-slate-200 shrink-0 shadow-[0_0_15px_rgba(255,255,255,0.15)]"
          >
            <Download className="w-3.5 h-3.5 text-purple-700" />
            <span>Practice {activeExam.shortName} on App</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </section>
  );
}

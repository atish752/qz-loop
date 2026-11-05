"use client";

import React, { useState } from "react";
import { ShieldCheck, Sparkles, Clock, CheckCircle2, ChevronRight, BookOpen, Users, Award, ArrowUpRight } from "lucide-react";
import { APP_LOOP_URL } from "./LandingNavbar";

interface ExamDetail {
  id: string;
  name: string;
  subtitle: string;
  volume: string;
  status: "Live & Active" | "High Yield Live" | "Active Bank";
  subjects: string[];
  scoring: string;
  highlight: string;
}

const ALL_EXAMS: ExamDetail[] = [
  {
    id: "neet",
    name: "NEET UG Medical Entrance",
    subtitle: "National Eligibility cum Entrance Test (NTA)",
    volume: "2.4 Million Aspirants",
    status: "Live & Active",
    subjects: ["NCERT Biology (Botany & Zoology)", "Chemistry (Organic & Physical)", "Physics"],
    scoring: "+4.00 / -1.00 NTA Rule",
    highlight: "100% NCERT line-by-line PYQs from 2018–2024 with instant formula & diagram proofs.",
  },
  {
    id: "jee",
    name: "JEE Main (Engineering)",
    subtitle: "Joint Entrance Examination (NTA)",
    volume: "1.4 Million Aspirants",
    status: "Live & Active",
    subjects: ["Physics (Mechanics & Electrodynamics)", "Chemistry", "Mathematics"],
    scoring: "+4.00 / -1.00 NTA Rule",
    highlight: "Rapid numerical and conceptual drills under rigorous 15-second active recall windows.",
  },
  {
    id: "upsc",
    name: "UPSC Civil Services (Prelims)",
    subtitle: "IAS / IPS / IFS Prelims GS Paper 1 & CSAT",
    volume: "1.1 Million Aspirants",
    status: "Active Bank",
    subjects: ["Indian Polity & Constitution", "Modern History", "Geography & Environment", "CSAT Aptitude"],
    scoring: "+2.00 / -0.66 UPSC Rule",
    highlight: "Statement-based analytical MCQs and critical elimination technique training for GS-1.",
  },
  {
    id: "ssc",
    name: "SSC CGL / CHSL / MTS",
    subtitle: "Staff Selection Commission Central Government Posts",
    volume: "3.2 Million Aspirants",
    status: "Active Bank",
    subjects: ["Quantitative Aptitude", "General Intelligence & Reasoning", "English", "General Awareness"],
    scoring: "+2.00 / -0.50 SSC Rule",
    highlight: "Arithmetic shortcut drills, static GK flashcards, and grammar spot-the-error loops.",
  },
  {
    id: "rrb",
    name: "Railways RRB NTPC & Group D",
    subtitle: "Railway Recruitment Board Mega Exams",
    volume: "10+ Million Applicants",
    status: "Active Bank",
    subjects: ["General Science", "Basic Mathematics", "Reasoning & Current Affairs"],
    scoring: "+1.00 / -0.33 RRB Rule",
    highlight: "High-yield repetitive science questions and speed arithmetic loops.",
  },
  {
    id: "banking",
    name: "Banking IBPS / SBI PO & Clerk",
    subtitle: "Institute of Banking Personnel Selection",
    volume: "1.5 Million Aspirants",
    status: "Active Bank",
    subjects: ["Quantitative Aptitude (DI & Simplification)", "Reasoning Ability", "English Language"],
    scoring: "+1.00 / -0.25 IBPS Rule",
    highlight: "Fast calculations, number series shortcuts, and syllogism speed sprints.",
  },
  {
    id: "nda",
    name: "NDA & CDS Defence Entrance",
    subtitle: "Union Public Service Commission Defence Academy",
    volume: "800,000 Aspirants",
    status: "Active Bank",
    subjects: ["Mathematics", "English Comprehension", "General Knowledge & Current Affairs"],
    scoring: "+2.50 / -0.83 NDA Rule",
    highlight: "Trigonometry shortcuts, vocabulary drills, and static defense history PYQs.",
  },
  {
    id: "statepsc",
    name: "State PSC (BPSC, UPPSC, MPPSC)",
    subtitle: "State Public Service Commission Administrative Services",
    volume: "2.1 Million Aspirants",
    status: "Active Bank",
    subjects: ["State Specific GK & History", "Indian Polity", "General Science & Geography"],
    scoring: "+1.00 / -0.33 State Rule",
    highlight: "Specialized state history, geography, and constitutional amendment practice reels.",
  },
  {
    id: "gate",
    name: "GATE Engineering Entrance",
    subtitle: "Graduate Aptitude Test in Engineering",
    volume: "700,000 Aspirants",
    status: "Active Bank",
    subjects: ["Engineering Mathematics", "General Aptitude", "Core Branch Fundamentals"],
    scoring: "+1.00 / -0.33 GATE Rule",
    highlight: "Formula memory drills and quick multi-choice elimination under timed pressure.",
  },
  {
    id: "cuet",
    name: "CUET UG Central Universities",
    subtitle: "Common University Entrance Test (NTA)",
    volume: "1.9 Million Aspirants",
    status: "Active Bank",
    subjects: ["Domain Subjects (Bio, Chem, Phys, Math)", "General Test", "English"],
    scoring: "+5.00 / -1.00 NTA Rule",
    highlight: "NCERT Class 12 chapter-wise line-by-line questions for top Delhi University cutoffs.",
  },
];

export function ExamRow() {
  const [selectedExamId, setSelectedExamId] = useState("neet");
  const activeExam = ALL_EXAMS.find((e) => e.id === selectedExamId) || ALL_EXAMS[0];

  return (
    <section id="exams" className="w-full py-24 border-y border-white/[0.06] bg-[#090d16]/70 relative overflow-hidden">
      {/* Background glow subtle */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[300px] bg-emerald-600/10 rounded-full blur-[130px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold mb-3 shadow-sm">
            <ShieldCheck className="w-4 h-4" />
            <span>Pan-India Competitive Coverage</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Tailored for India's 10 Toughest Competitive Exams
          </h2>
          <p className="text-sm sm:text-base text-slate-400 mt-3">
            Every exam has distinct negative marking penalties, question lengths, and conceptual traps. Qz Loop customizes the reel feed to your specific exam syllabus.
          </p>
        </div>

        {/* Exam Navigation Switcher Tabs (with horizontal smooth scroll) */}
        <div className="flex items-center gap-2 mb-10 overflow-x-auto no-scrollbar pb-2 justify-start lg:justify-center">
          {ALL_EXAMS.map((exam) => (
            <button
              key={exam.id}
              onClick={() => setSelectedExamId(exam.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                selectedExamId === exam.id
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30 scale-105 border border-purple-400/40"
                  : "bg-white/[0.03] text-slate-400 hover:text-white border border-white/5 hover:border-white/10"
              }`}
            >
              <span>{exam.name.split(" ")[0]} {exam.name.split(" ")[1] || ""}</span>
              {selectedExamId === exam.id && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
            </button>
          ))}
        </div>

        {/* Selected Exam Showcase Card */}
        <div className="max-w-4xl mx-auto p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-[#0d1222] via-[#090d16] to-[#07090e] border border-white/15 shadow-[0_10px_50px_rgba(0,0,0,0.5)]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <span className="text-xs font-black px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  {activeExam.status}
                </span>
                <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-purple-400" />
                  {activeExam.volume}
                </span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white">
                {activeExam.name}
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                {activeExam.subtitle}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 text-right md:text-left self-start md:self-auto shrink-0">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-0.5">
                Official Scoring Rule
              </span>
              <span className="text-base font-black text-emerald-400 font-mono">
                {activeExam.scoring}
              </span>
            </div>
          </div>

          <div className="pt-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-8">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-3">
                Key Subjects Covered in Practice Feed:
              </span>
              <div className="flex flex-wrap gap-2 mb-4">
                {activeExam.subjects.map((subj, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 rounded-xl bg-purple-950/40 border border-purple-500/30 text-purple-200 text-xs font-semibold"
                  >
                    {subj}
                  </span>
                ))}
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {activeExam.highlight}
              </p>
            </div>

            <div className="md:col-span-4 flex justify-start md:justify-end">
              <a
                href={APP_LOOP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full md:w-auto px-6 py-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 border border-purple-400/30 text-white font-bold text-xs flex items-center justify-center gap-2 group transition-all shadow-md shadow-purple-600/30"
              >
                <span>Practice {activeExam.name.split(" ")[0]} MCQs</span>
                <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

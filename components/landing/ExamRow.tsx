"use client";

import React from "react";
import { ShieldCheck, Sparkles, Clock, CheckCircle2 } from "lucide-react";

export function ExamRow() {
  return (
    <section id="exams" className="w-full py-16 border-y border-white/[0.06] bg-[#090d16]/50 relative overflow-hidden">
      {/* Background glow subtle */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[250px] bg-emerald-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Currently Live For NEET UG Aspirants</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Laser-Focused on NEET UG Entrance
          </h3>
          <p className="text-sm text-slate-400 mt-2">
            We are currently dedicated 100% to medical aspirants preparing for NEET UG. Other competitive examinations are in active development.
          </p>
        </div>

        {/* Featured Live NEET UG Card */}
        <div className="max-w-3xl mx-auto mb-10 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-purple-950/30 to-[#07090e] border border-emerald-500/30 shadow-[0_0_40px_rgba(16,185,129,0.15)] flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live & Active Now
                </span>
                <span className="text-xs text-slate-400 font-mono">NTA Pattern 2025–2027</span>
              </div>
              <h4 className="text-xl font-black text-white">NEET UG Medical Entrance</h4>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                Full micro-practice for <strong>NCERT Biology (Botany & Zoology)</strong>, <strong>Chemistry (Organic, Inorganic & Physical)</strong>, and <strong>Physics</strong> with official +4 / -1 negative scoring.
              </p>
            </div>
          </div>
        </div>

        {/* Future Pipeline Exams (Coming Soon) */}
        <div>
          <div className="text-center mb-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-purple-400" />
              <span>Upcoming Examinations (Coming Later)</span>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-4xl mx-auto">
            {[
              { name: "JEE Main", category: "Engineering Physics & Chem" },
              { name: "SSC CGL & CHSL", category: "Staff Selection Commission" },
              { name: "RRB NTPC & Group D", category: "Railway Recruitment Board" },
              { name: "Banking & UPSC CSAT", category: "Aptitude & Reasoning" },
            ].map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col justify-between opacity-70 hover:opacity-100 transition-opacity"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/5 text-slate-400 border border-white/10">
                    Coming Soon
                  </span>
                </div>
                <div>
                  <h5 className="font-bold text-xs text-white">{item.name}</h5>
                  <p className="text-[11px] text-slate-400 mt-0.5">{item.category}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

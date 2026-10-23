"use client";

import React from "react";
import Link from "next/link";
import { Zap, Heart, ArrowUpRight } from "lucide-react";
import { APP_ORIGINAL_URL, APP_LOOP_URL } from "./LandingNavbar";

export function LandingFooter() {
  return (
    <footer className="w-full py-12 border-t border-white/[0.08] bg-[#05070c] text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand Info */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-600 to-emerald-400 p-[1px]">
                <div className="w-full h-full bg-[#090d16] rounded-[7px] flex items-center justify-center">
                  <Zap className="w-4 h-4 text-emerald-400" />
                </div>
              </div>
              <span className="font-extrabold text-base text-white tracking-tight">
                QZ<span className="text-emerald-400">·</span>LOOP
              </span>
            </div>
            <p className="text-slate-400 max-w-sm leading-relaxed mb-4">
              India's first mobile-first vertical-scroll micro-practice platform for competitive exam aspirants.
              Scroll. Solve. Improve. Repeat.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <span>Landing Page:</span>
              <span className="text-slate-300 font-mono">qz-loop-home.vercel.app</span>
              <span>·</span>
              <span>Webapp:</span>
              <a
                href={APP_ORIGINAL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 hover:underline font-mono inline-flex items-center gap-0.5"
              >
                <span>qz-loop.vercel.app</span>
                <ArrowUpRight className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Supported Exams */}
          <div>
            <h5 className="font-bold text-slate-200 text-xs uppercase tracking-wider mb-3">
              Examinations
            </h5>
            <ul className="space-y-2">
              <li>
                <a href="#exams" className="hover:text-white transition-colors">
                  SSC CGL & CHSL (Tier 1 & 2)
                </a>
              </li>
              <li>
                <a href="#exams" className="hover:text-white transition-colors">
                  Railways RRB NTPC & Group D
                </a>
              </li>
              <li>
                <a href="#exams" className="hover:text-white transition-colors">
                  NEET UG & JEE Main
                </a>
              </li>
              <li>
                <a href="#exams" className="hover:text-white transition-colors">
                  Banking (SBI & IBPS PO)
                </a>
              </li>
              <li>
                <a href="#exams" className="hover:text-white transition-colors">
                  UPSC CSAT & State PCS
                </a>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h5 className="font-bold text-slate-200 text-xs uppercase tracking-wider mb-3">
              Quick Links
            </h5>
            <ul className="space-y-2">
              <li>
                <a
                  href={APP_LOOP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 font-medium hover:underline inline-flex items-center gap-1"
                >
                  <span>Launch WebApp Feed</span>
                  <ArrowUpRight className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a href="#the-loop" className="hover:text-white transition-colors">
                  Interactive Simulator
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-white transition-colors">
                  Virtuous Doomscroll
                </a>
              </li>
              <li>
                <a href="#comparison" className="hover:text-white transition-colors">
                  Why Qz Loop
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-white transition-colors">
                  Aspirant FAQ
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
          <div>
            © {new Date().getFullYear()} Qz Loop. Engineered for India's competitive exam aspirants.
          </div>
          <div className="flex items-center gap-1">
            <span>Built with precision & behavioral psychology for 65M+ learners</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

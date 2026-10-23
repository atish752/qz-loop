"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, Menu, X, Zap } from "lucide-react";

export const APP_ORIGINAL_URL = "https://qz-loop.vercel.app";
export const APP_LOOP_URL = "https://qz-loop.vercel.app/loop";

export function LandingNavbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-[#07090e]/80 backdrop-blur-xl border-b border-white/[0.08] shadow-[0_4px_30px_rgba(0,0,0,0.5)]"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/landing" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-emerald-400 p-[1.5px] shadow-[0_0_20px_rgba(168,85,247,0.35)] group-hover:shadow-[0_0_28px_rgba(168,85,247,0.6)] transition-all">
            <div className="w-full h-full bg-[#090d16] rounded-[10px] flex items-center justify-center">
              <Zap className="w-5 h-5 text-emerald-400 fill-emerald-400/20" />
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xl tracking-tight text-white group-hover:text-purple-200 transition-colors">
                QZ<span className="text-emerald-400">·</span>LOOP
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 uppercase tracking-widest">
                NEET UG
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium tracking-wide">
              Scroll. Solve. Repeat.
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8">
          <a
            href="#the-loop"
            className="text-sm font-medium text-slate-300 hover:text-white transition-colors relative group py-1"
          >
            The Loop Demo
            <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-emerald-400 transition-all duration-300 group-hover:w-full" />
          </a>
          <a
            href="#features"
            className="text-sm font-medium text-slate-300 hover:text-white transition-colors relative group py-1"
          >
            Features
            <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-purple-400 transition-all duration-300 group-hover:w-full" />
          </a>
          <a
            href="#exams"
            className="text-sm font-medium text-slate-300 hover:text-white transition-colors relative group py-1"
          >
            Exams Covered
            <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-purple-400 transition-all duration-300 group-hover:w-full" />
          </a>
          <a
            href="#comparison"
            className="text-sm font-medium text-slate-300 hover:text-white transition-colors relative group py-1"
          >
            Why Qz Loop
            <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-purple-400 transition-all duration-300 group-hover:w-full" />
          </a>
          <a
            href="#faq"
            className="text-sm font-medium text-slate-300 hover:text-white transition-colors relative group py-1"
          >
            FAQ
            <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-purple-400 transition-all duration-300 group-hover:w-full" />
          </a>
        </nav>

        {/* Action Buttons */}
        <div className="hidden sm:flex items-center gap-4">
          <a
            href={`${APP_ORIGINAL_URL}/loop`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-slate-300 hover:text-white px-3 py-2 transition-colors"
          >
            Sign In
          </a>

          {/* Apple-grade Glowing Primary Action Button */}
          <a
            href={APP_LOOP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="relative inline-flex items-center justify-center p-[1px] overflow-hidden rounded-full font-semibold group shadow-[0_0_25px_rgba(168,85,247,0.4)] hover:shadow-[0_0_35px_rgba(52,211,153,0.5)] transition-all duration-300"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-purple-500 via-emerald-400 to-indigo-500 rounded-full animate-border-shimmer" />
            <span className="relative px-5 py-2.5 transition-all ease-out bg-[#090d16] rounded-full group-hover:bg-[#07090e] flex items-center gap-2 text-sm text-white font-medium">
              <span>Launch WebApp</span>
              <ArrowRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-1 transition-transform" />
            </span>
          </a>
        </div>

        {/* Mobile menu toggle button */}
        <div className="flex md:hidden items-center gap-3">
          <a
            href={APP_LOOP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-1.5 rounded-full bg-emerald-500 text-slate-950 text-xs font-bold flex items-center gap-1 shadow-lg shadow-emerald-500/20"
          >
            <span>Try Now</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:text-white"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#07090e]/95 backdrop-blur-2xl border-b border-white/10 px-6 py-6 flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <a
            href="#the-loop"
            onClick={() => setMobileMenuOpen(false)}
            className="text-base font-medium text-slate-200 hover:text-emerald-400 py-1"
          >
            The Loop Demo
          </a>
          <a
            href="#features"
            onClick={() => setMobileMenuOpen(false)}
            className="text-base font-medium text-slate-200 hover:text-emerald-400 py-1"
          >
            Features
          </a>
          <a
            href="#exams"
            onClick={() => setMobileMenuOpen(false)}
            className="text-base font-medium text-slate-200 hover:text-emerald-400 py-1"
          >
            Exams Covered
          </a>
          <a
            href="#comparison"
            onClick={() => setMobileMenuOpen(false)}
            className="text-base font-medium text-slate-200 hover:text-emerald-400 py-1"
          >
            Why Qz Loop
          </a>
          <a
            href="#faq"
            onClick={() => setMobileMenuOpen(false)}
            className="text-base font-medium text-slate-200 hover:text-emerald-400 py-1"
          >
            FAQ
          </a>

          <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
            <a
              href={APP_LOOP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-emerald-500 text-white font-bold text-center flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30"
            >
              <span>Launch Qz Loop (qz-loop.vercel.app)</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}
    </header>
  );
}

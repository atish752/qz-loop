"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, Download, ShieldCheck } from "lucide-react";

export const OFFICIAL_PLAYSTORE_URL = "https://play.google.com/store/apps/details?id=app.qzloop.qz_loop_app";
export const OFFICIAL_WHATSAPP_GROUP_URL = "https://chat.whatsapp.com/JaluiYU8C6nKGrr3YXBn6L";
export const APP_LOOP_URL = OFFICIAL_PLAYSTORE_URL;

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
          ? "bg-[#05070c]/85 backdrop-blur-2xl border-b border-white/[0.08] shadow-[0_4px_30px_rgba(0,0,0,0.8)]"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-emerald-400 p-[1.5px] shadow-[0_0_15px_rgba(168,85,247,0.3)]">
            <div className="w-full h-full bg-[#07090e] rounded-[9px] flex items-center justify-center font-black text-white text-xs">
              QZ
            </div>
          </div>
          <span className="font-extrabold text-lg tracking-tight text-white">
            Qz<span className="text-purple-400">-</span>loop
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-slate-300">
          <Link href="/#habit-engine" className="hover:text-white transition-colors">
            /goal · /plan · /boost
          </Link>
          <Link href="/#contrast" className="hover:text-white transition-colors">
            The Shift
          </Link>
          <Link href="/#exams" className="hover:text-white transition-colors">
            Exams
          </Link>
          <Link href="/data-safety" className="text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>DPDP Safety</span>
          </Link>
        </nav>

        {/* Action Button */}
        <div className="hidden sm:flex items-center gap-3">
          <a
            href={OFFICIAL_PLAYSTORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-full bg-white text-slate-950 hover:bg-slate-200 text-xs font-black flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(255,255,255,0.2)]"
          >
            <Download className="w-3.5 h-3.5 text-purple-700" />
            <span>Get App</span>
          </a>
        </div>

        {/* Mobile menu toggle */}
        <div className="flex sm:hidden items-center gap-2">
          <a
            href={OFFICIAL_PLAYSTORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-full bg-white text-slate-950 text-xs font-bold flex items-center gap-1"
          >
            <Download className="w-3 h-3 text-purple-700" />
            <span>Get App</span>
          </a>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="sm:hidden bg-[#07090e]/95 backdrop-blur-2xl border-b border-white/10 px-6 py-5 flex flex-col gap-3 animate-in fade-in duration-150">
          <Link
            href="/#habit-engine"
            onClick={() => setMobileMenuOpen(false)}
            className="text-xs font-semibold text-slate-200 py-1"
          >
            /goal · /plan · /boost
          </Link>
          <Link
            href="/#contrast"
            onClick={() => setMobileMenuOpen(false)}
            className="text-xs font-semibold text-slate-200 py-1"
          >
            The Shift
          </Link>
          <Link
            href="/#exams"
            onClick={() => setMobileMenuOpen(false)}
            className="text-xs font-semibold text-slate-200 py-1"
          >
            Exams
          </Link>
          <Link
            href="/data-safety"
            onClick={() => setMobileMenuOpen(false)}
            className="text-xs font-semibold text-emerald-400 py-1 flex items-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>DPDP Safety</span>
          </Link>
          <Link
            href="/privacy"
            onClick={() => setMobileMenuOpen(false)}
            className="text-xs font-semibold text-slate-400 py-1"
          >
            Privacy Policy
          </Link>
        </div>
      )}
    </header>
  );
}

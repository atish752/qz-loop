"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, ArrowRight, ShieldCheck, Download, MessageCircle, Sparkles } from "lucide-react";

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
          ? "bg-[#07090e]/80 backdrop-blur-2xl border-b border-white/[0.08] shadow-[0_4px_30px_rgba(0,0,0,0.6)]"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 sm:h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-emerald-400 p-[1.5px] shadow-[0_0_20px_rgba(168,85,247,0.35)] group-hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] transition-all">
            <div className="w-full h-full bg-[#090d16] rounded-[9px] flex items-center justify-center font-black text-white text-sm">
              QZ
            </div>
          </div>
          <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white group-hover:text-purple-200 transition-colors">
            Qz<span className="text-purple-400">-</span>loop
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-300">
          <Link href="/#habit-engine" className="hover:text-white transition-colors">
            /goal · /plan · /boost
          </Link>
          <Link href="/#contrast" className="hover:text-white transition-colors">
            Why It Works
          </Link>
          <Link href="/#exams" className="hover:text-white transition-colors">
            10 Exams
          </Link>
          <Link href="/#faq" className="hover:text-white transition-colors">
            FAQ
          </Link>
          <Link href="/data-safety" className="text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>DPDP Safety</span>
          </Link>
        </nav>

        {/* Action Buttons: WhatsApp & Play Store */}
        <div className="hidden sm:flex items-center gap-3">
          <a
            href={OFFICIAL_WHATSAPP_GROUP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-[#25D366] text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </a>

          <a
            href={OFFICIAL_PLAYSTORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl bg-white text-slate-950 hover:bg-slate-200 text-xs font-black flex items-center gap-1.5 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:scale-102"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Get App</span>
          </a>
        </div>

        {/* Mobile menu toggle */}
        <div className="flex sm:hidden items-center gap-2">
          <a
            href={OFFICIAL_PLAYSTORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg bg-white text-slate-950 text-xs font-bold flex items-center gap-1"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Get App</span>
          </a>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-300"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="sm:hidden bg-[#07090e]/95 backdrop-blur-2xl border-b border-white/10 px-6 py-6 flex flex-col gap-4 animate-in fade-in duration-200">
          <Link
            href="/#habit-engine"
            onClick={() => setMobileMenuOpen(false)}
            className="text-sm font-semibold text-slate-200 hover:text-purple-400 py-1"
          >
            /goal · /plan · /boost
          </Link>
          <Link
            href="/#contrast"
            onClick={() => setMobileMenuOpen(false)}
            className="text-sm font-semibold text-slate-200 hover:text-purple-400 py-1"
          >
            Why It Works
          </Link>
          <Link
            href="/#exams"
            onClick={() => setMobileMenuOpen(false)}
            className="text-sm font-semibold text-slate-200 hover:text-purple-400 py-1"
          >
            10 Exams Covered
          </Link>
          <Link
            href="/data-safety"
            onClick={() => setMobileMenuOpen(false)}
            className="text-sm font-semibold text-emerald-400 py-1 flex items-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Play Store Data Safety</span>
          </Link>
          <Link
            href="/privacy"
            onClick={() => setMobileMenuOpen(false)}
            className="text-sm font-semibold text-slate-400 hover:text-white py-1"
          >
            Privacy Policy
          </Link>

          <div className="pt-3 border-t border-white/10 flex flex-col gap-2.5">
            <a
              href={OFFICIAL_WHATSAPP_GROUP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 rounded-xl bg-[#25D366]/20 border border-[#25D366]/40 text-[#25D366] font-bold text-center flex items-center justify-center gap-2 text-xs"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Join WhatsApp Group</span>
            </a>
            <a
              href={OFFICIAL_PLAYSTORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 rounded-xl bg-white text-slate-950 font-black text-center flex items-center justify-center gap-2 text-xs"
            >
              <Download className="w-4 h-4" />
              <span>Install Qz-loop on Google Play</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
}

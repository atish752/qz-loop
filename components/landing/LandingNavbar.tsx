"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, ArrowRight, ShieldCheck, Download, MessageCircle } from "lucide-react";

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
          ? "bg-[#07090e]/85 backdrop-blur-xl border-b border-white/[0.08] shadow-[0_4px_30px_rgba(0,0,0,0.6)]"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-emerald-400 p-[1.5px] shadow-[0_0_20px_rgba(168,85,247,0.35)] group-hover:shadow-[0_0_28px_rgba(168,85,247,0.6)] transition-all">
            <div className="w-full h-full bg-[#090d16] rounded-[10px] flex items-center justify-center font-black text-white text-base">
              QZ
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xl tracking-tight text-white group-hover:text-purple-200 transition-colors">
                Qz<span className="text-purple-400">-</span>loop
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 uppercase tracking-wider">
                Official App
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium tracking-wide">
              15-Second MCQ Reels
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-7">
          <Link
            href="/#the-loop"
            className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            Interactive Demo
          </Link>
          <Link
            href="/#features"
            className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            Features
          </Link>
          <Link
            href="/#exams"
            className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            10 Exams
          </Link>
          <Link
            href="/data-safety"
            className="text-sm font-medium text-slate-300 hover:text-white transition-colors flex items-center gap-1"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Data Safety & DPDP</span>
          </Link>
          <Link
            href="/privacy"
            className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            Privacy
          </Link>
          <Link
            href="/contact"
            className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            Contact
          </Link>
        </nav>

        {/* Action Buttons: WhatsApp & Play Store */}
        <div className="hidden sm:flex items-center gap-3">
          {/* Powerful WhatsApp Group Button */}
          <a
            href={OFFICIAL_WHATSAPP_GROUP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 border border-[#25D366]/40 text-[#25D366] text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-[#25D366]/10"
          >
            <MessageCircle className="w-4 h-4 fill-[#25D366]/20" />
            <span>Join WhatsApp Group</span>
          </a>

          {/* Powerful Install Google Play Button */}
          <a
            href={OFFICIAL_PLAYSTORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="relative inline-flex items-center justify-center p-[1px] overflow-hidden rounded-xl font-bold group shadow-[0_0_25px_rgba(168,85,247,0.4)] hover:shadow-[0_0_35px_rgba(168,85,247,0.7)] transition-all duration-300"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-purple-500 via-indigo-500 to-emerald-400 rounded-xl" />
            <span className="relative px-5 py-2.5 bg-[#0e121e] rounded-[11px] group-hover:bg-[#090d16] flex items-center gap-2 text-xs text-white">
              <Download className="w-4 h-4 text-purple-400" />
              <span>Install on Play Store</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </a>
        </div>

        {/* Mobile menu toggle */}
        <div className="flex sm:hidden items-center gap-2">
          <a
            href={OFFICIAL_PLAYSTORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-bold flex items-center gap-1 shadow-md shadow-purple-600/30"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install</span>
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
        <div className="sm:hidden bg-[#07090e]/95 backdrop-blur-2xl border-b border-white/10 px-6 py-6 flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <Link
            href="/#the-loop"
            onClick={() => setMobileMenuOpen(false)}
            className="text-sm font-medium text-slate-200 hover:text-purple-400 py-1"
          >
            Interactive Demo
          </Link>
          <Link
            href="/#features"
            onClick={() => setMobileMenuOpen(false)}
            className="text-sm font-medium text-slate-200 hover:text-purple-400 py-1"
          >
            Features & Streaks
          </Link>
          <Link
            href="/#exams"
            onClick={() => setMobileMenuOpen(false)}
            className="text-sm font-medium text-slate-200 hover:text-purple-400 py-1"
          >
            Exams Covered
          </Link>
          <Link
            href="/data-safety"
            onClick={() => setMobileMenuOpen(false)}
            className="text-sm font-medium text-emerald-400 py-1 flex items-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Play Store Data Safety & DPDP</span>
          </Link>
          <Link
            href="/privacy"
            onClick={() => setMobileMenuOpen(false)}
            className="text-sm font-medium text-slate-200 hover:text-purple-400 py-1"
          >
            Privacy Policy
          </Link>
          <Link
            href="/terms"
            onClick={() => setMobileMenuOpen(false)}
            className="text-sm font-medium text-slate-200 hover:text-purple-400 py-1"
          >
            Terms & Conditions
          </Link>
          <Link
            href="/contact"
            onClick={() => setMobileMenuOpen(false)}
            className="text-sm font-medium text-slate-200 hover:text-purple-400 py-1"
          >
            Contact Us & Data Deletion
          </Link>

          <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
            <a
              href={OFFICIAL_WHATSAPP_GROUP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 rounded-xl bg-[#25D366]/20 border border-[#25D366]/40 text-[#25D366] font-bold text-center flex items-center justify-center gap-2 text-sm"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Join Official WhatsApp Group</span>
            </a>

            <a
              href={OFFICIAL_PLAYSTORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-500 text-white font-bold text-center flex items-center justify-center gap-2 shadow-lg shadow-purple-600/40 text-sm"
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

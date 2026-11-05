"use client";

import React from "react";
import Link from "next/link";
import { Download, MessageCircle, Mail, Phone, ShieldCheck } from "lucide-react";
import { OFFICIAL_PLAYSTORE_URL, OFFICIAL_WHATSAPP_GROUP_URL } from "./LandingNavbar";

export function LandingFooter() {
  return (
    <footer className="w-full py-16 border-t border-white/[0.06] bg-[#05070c] text-slate-400 text-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand & App Link */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-600 to-emerald-400 p-[1px]">
                <div className="w-full h-full bg-[#090d16] rounded-[7px] flex items-center justify-center font-bold text-white text-[11px]">
                  QZ
                </div>
              </div>
              <span className="font-extrabold text-base text-white tracking-tight">
                Qz<span className="text-purple-400">-</span>loop
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed mb-4 text-xs">
              15-second MCQ micro-practice for Indian competitive exams.
            </p>
            <div className="flex flex-col gap-2">
              <a
                href={OFFICIAL_PLAYSTORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-300 hover:text-white"
              >
                <Download className="w-3.5 h-3.5 text-purple-400" />
                <span>Google Play Store</span>
              </a>
              <a
                href={OFFICIAL_WHATSAPP_GROUP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#25D366] hover:text-white"
              >
                <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
                <span>Official WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h5 className="font-bold text-slate-200 text-xs uppercase tracking-wider mb-3">
              Platform
            </h5>
            <ul className="space-y-2 text-slate-400">
              <li><Link href="/#habit-engine" className="hover:text-white transition-colors">/goal · /plan · /boost</Link></li>
              <li><Link href="/#contrast" className="hover:text-white transition-colors">Why It Works</Link></li>
              <li><Link href="/#exams" className="hover:text-white transition-colors">10 Supported Exams</Link></li>
              <li><Link href="/#faq" className="hover:text-white transition-colors">FAQ</Link></li>
            </ul>
          </div>

          {/* Compliance & DPDP */}
          <div>
            <h5 className="font-bold text-slate-200 text-xs uppercase tracking-wider mb-3">
              Legal & DPDP
            </h5>
            <ul className="space-y-2">
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li>
                <Link href="/data-safety" className="hover:text-emerald-400 transition-colors flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Play Store Data Safety</span>
                </Link>
              </li>
              <li><Link href="/contact" className="hover:text-white transition-colors">DPDP Data Deletion</Link></li>
            </ul>
          </div>

          {/* Grievance & Contact */}
          <div>
            <h5 className="font-bold text-slate-200 text-xs uppercase tracking-wider mb-3">
              Grievance Officer
            </h5>
            <div className="space-y-2 text-slate-300">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-purple-400" />
                <a href="mailto:atish2k22@gmail.com" className="hover:text-purple-300 font-mono text-[11px]">
                  atish2k22@gmail.com
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <a href="tel:+919798482404" className="hover:text-emerald-300 font-mono text-[11px]">
                  +91 9798482404
                </a>
              </div>
              <div className="text-[11px] text-slate-400 pt-1">
                Atish Kumar · Patna, India
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/[0.05] flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
          <div>
            © {new Date().getFullYear()} Qz-loop. DPDP Act 2023 Protected.
          </div>
          <div className="flex items-center gap-3">
            <Link href="/privacy" className="hover:text-slate-300">Privacy</Link>
            <span>·</span>
            <Link href="/terms" className="hover:text-slate-300">Terms</Link>
            <span>·</span>
            <Link href="/data-safety" className="hover:text-slate-300">Data Safety</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

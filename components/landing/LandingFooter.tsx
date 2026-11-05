"use client";

import React from "react";
import Link from "next/link";
import { Download, MessageCircle, Mail, Phone, ShieldCheck } from "lucide-react";
import { OFFICIAL_PLAYSTORE_URL, OFFICIAL_WHATSAPP_GROUP_URL } from "./LandingNavbar";

export function LandingFooter() {
  return (
    <footer className="w-full py-16 border-t border-white/[0.08] bg-[#05070c] text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand Info & Mission */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-emerald-400 p-[1.5px]">
                <div className="w-full h-full bg-[#090d16] rounded-[9px] flex items-center justify-center font-bold text-white text-xs">
                  QZ
                </div>
              </div>
              <span className="font-extrabold text-base text-white tracking-tight">
                Qz<span className="text-purple-400">-</span>loop
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed mb-4">
              India's first vertical-scroll MCQ micro-practice app for competitive exams. Transform reflexive doomscrolling into daily rank-boosting streaks.
            </p>
            <div className="flex flex-col gap-2 pt-2">
              <a
                href={OFFICIAL_PLAYSTORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-semibold text-purple-300 hover:text-white"
              >
                <Download className="w-3.5 h-3.5 text-purple-400" />
                <span>Google Play Store</span>
              </a>
              <a
                href={OFFICIAL_WHATSAPP_GROUP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-semibold text-[#25D366] hover:text-white"
              >
                <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
                <span>Join Official WhatsApp Group</span>
              </a>
            </div>
          </div>

          {/* Supported Examinations */}
          <div>
            <h5 className="font-bold text-slate-200 text-xs uppercase tracking-wider mb-4">
              10 Supported Exams
            </h5>
            <ul className="space-y-2 text-slate-400">
              <li>NEET UG (Medical Entrance)</li>
              <li>JEE Main (Engineering)</li>
              <li>UPSC CSAT (Civil Services)</li>
              <li>SSC CGL & CHSL (Central Govt)</li>
              <li>IBPS & SBI PO (Banking)</li>
              <li>Railway RRB NTPC</li>
              <li>Defence CDS & NDA</li>
              <li>State PCS (UPPSC, BPSC, etc.)</li>
              <li>CUET UG (Central Universities)</li>
              <li>State Police Sub-Inspector</li>
            </ul>
          </div>

          {/* Legal & Compliance (Play Store & DPDP Act) */}
          <div>
            <h5 className="font-bold text-slate-200 text-xs uppercase tracking-wider mb-4">
              Legal & Data Safety
            </h5>
            <ul className="space-y-2.5">
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/data-safety" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Play Store Data Safety</span>
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  DPDP Act Data Deletion
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Grievance Redressal
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & DPDP Grievance Officer */}
          <div>
            <h5 className="font-bold text-slate-200 text-xs uppercase tracking-wider mb-4">
              Contact & Inquiry
            </h5>
            <p className="text-slate-400 leading-relaxed mb-3">
              For support, partnership, or data deletion requests under India's Digital Personal Data Protection (DPDP) Act:
            </p>
            <div className="space-y-2 text-slate-300">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-purple-400" />
                <a href="mailto:atish2k22@gmail.com" className="hover:text-purple-300 font-mono">
                  atish2k22@gmail.com
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-400" />
                <a href="tel:+919798482404" className="hover:text-emerald-300 font-mono">
                  +91 9798482404
                </a>
              </div>
              <div className="text-[11px] text-slate-400 pt-2">
                Grievance Officer: <strong>Atish Kumar</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
          <div>
            © {new Date().getFullYear()} Qz-loop (app.qzloop.qz_loop_app). All rights reserved.
          </div>
          <div className="flex items-center gap-3">
            <Link href="/privacy" className="hover:text-slate-300">Privacy</Link>
            <span>·</span>
            <Link href="/terms" className="hover:text-slate-300">Terms</Link>
            <span>·</span>
            <Link href="/data-safety" className="hover:text-slate-300">Data Safety</Link>
            <span>·</span>
            <Link href="/contact" className="hover:text-slate-300">DPDP Deletion</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

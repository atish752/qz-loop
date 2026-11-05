"use client";

import React from "react";
import Link from "next/link";
import { Download, MessageCircle, Mail, Phone, ShieldCheck } from "lucide-react";
import { OFFICIAL_PLAYSTORE_URL, OFFICIAL_WHATSAPP_GROUP_URL } from "./LandingNavbar";

export function LandingFooter() {
  return (
    <footer className="w-full py-12 border-t border-white/[0.06] bg-[#04060a] text-slate-400 text-xs">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-purple-600 to-emerald-400 p-[1px]">
                <div className="w-full h-full bg-[#07090e] rounded-[7px] flex items-center justify-center font-bold text-white text-[10px]">
                  QZ
                </div>
              </div>
              <span className="font-extrabold text-sm text-white">Qz-loop</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed mb-3">
              15-second MCQ reels for top Indian competitive exams.
            </p>
            <div className="flex items-center gap-3">
              <a
                href={OFFICIAL_PLAYSTORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-300 hover:text-white transition-colors"
                aria-label="Google Play Store"
              >
                <Download className="w-4 h-4 text-purple-400" />
              </a>
              <a
                href={OFFICIAL_WHATSAPP_GROUP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-300 hover:text-[#25D366] transition-colors"
                aria-label="Official WhatsApp Group"
              >
                <MessageCircle className="w-4 h-4 text-[#25D366]" />
              </a>
            </div>
          </div>

          {/* Platform */}
          <div>
            <h5 className="font-bold text-slate-200 text-xs uppercase tracking-wider mb-2.5">
              Platform
            </h5>
            <ul className="space-y-1.5 text-slate-400">
              <li><Link href="/#habit-engine" className="hover:text-white transition-colors">/goal · /plan · /boost</Link></li>
              <li><Link href="/#contrast" className="hover:text-white transition-colors">The Shift</Link></li>
              <li><Link href="/#exams" className="hover:text-white transition-colors">Supported Exams</Link></li>
              <li><a href={OFFICIAL_PLAYSTORE_URL} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Android Play Store App</a></li>
            </ul>
          </div>

          {/* Legal & Compliance */}
          <div>
            <h5 className="font-bold text-slate-200 text-xs uppercase tracking-wider mb-2.5">
              Legal & DPDP
            </h5>
            <ul className="space-y-1.5 text-slate-400">
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li>
                <Link href="/data-safety" className="hover:text-emerald-400 transition-colors flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Data Safety</span>
                </Link>
              </li>
              <li><Link href="/contact" className="hover:text-white transition-colors">DPDP Deletion</Link></li>
            </ul>
          </div>

          {/* Grievance */}
          <div>
            <h5 className="font-bold text-slate-200 text-xs uppercase tracking-wider mb-2.5">
              Grievance Officer
            </h5>
            <div className="space-y-1 text-slate-300 font-mono text-[11px]">
              <p className="text-white font-sans font-bold">Atish Kumar</p>
              <p><a href="mailto:atish2k22@gmail.com" className="hover:text-purple-300">atish2k22@gmail.com</a></p>
              <p><a href="tel:+919798482404" className="hover:text-emerald-300">+91 9798482404</a></p>
              <p className="text-slate-400 font-sans">Patna, India</p>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-slate-400 text-[11px] gap-2">
          <span>&copy; {new Date().getFullYear()} Qz-loop. All rights reserved.</span>
          <span>Compliant with Digital Personal Data Protection Act, 2023.</span>
        </div>
      </div>
    </footer>
  );
}

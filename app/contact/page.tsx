import React from "react";
import Link from "next/link";
import { ArrowLeft, Mail, Phone, MessageCircle, Shield, Trash2, Clock, CheckCircle2, Send, Download } from "lucide-react";
import { LandingNavbar, OFFICIAL_PLAYSTORE_URL, OFFICIAL_WHATSAPP_GROUP_URL } from "@/components/landing/LandingNavbar";
import { LandingFooter } from "@/components/landing/LandingFooter";

export const metadata = {
  title: "Contact Us & DPDP Data Requests | Qz-loop",
  description: "Official Contact and DPDP Act Data Management portal for Qz-loop. Get in touch, join our WhatsApp group, or request account erasure.",
};

export default function ContactPage() {
  return (
    <div className="w-full min-h-screen bg-[#07090e] text-slate-100 flex flex-col selection:bg-purple-500/30 selection:text-white">
      <LandingNavbar />
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-purple-400 hover:text-purple-300 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>

        {/* Header */}
        <div className="border-b border-white/10 pb-8 mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-bold mb-4">
            <Mail className="w-3.5 h-3.5" />
            <span>Official Support &amp; DPDP Act Grievance Redressal</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4">
            Contact &amp; Grievance Support
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl">
            Have questions, need help with your aspirant account, or wish to request data erasure under the DPDP Act 2023? Reach out directly to our team.
          </p>
        </div>

        {/* Contact Channels Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          {/* Email Support Card */}
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-purple-500/30 transition-all flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4">
                <Mail className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-white mb-1">Official Email Support</h2>
              <p className="text-xs text-slate-400 mb-4">
                For student inquiries, bug reports, and DPDP Act deletion requests.
              </p>
            </div>
            <div>
              <a
                href="mailto:atish2k22@gmail.com"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-colors"
              >
                <span>atish2k22@gmail.com</span>
                <Send className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Direct Phone Helpline Card */}
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-indigo-500/30 transition-all flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
                <Phone className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-white mb-1">Direct Phone Support</h2>
              <p className="text-xs text-slate-400 mb-4">
                Direct phone helpline for urgent technical inquiries and student assistance.
              </p>
            </div>
            <div>
              <a
                href="tel:9798482404"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors"
              >
                <span>+91 9798482404</span>
                <Phone className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* WhatsApp Aspirants Group */}
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-emerald-500/30 transition-all flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
                <MessageCircle className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-white mb-1">Official WhatsApp Group</h2>
              <p className="text-xs text-slate-400 mb-4">
                Join our active study group for daily doubt discussion and peer challenges.
              </p>
            </div>
            <div>
              <a
                href={OFFICIAL_WHATSAPP_GROUP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors"
              >
                <span>Join WhatsApp Group</span>
                <MessageCircle className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Google Play Store */}
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white mb-4">
                <Download className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-white mb-1">Google Play Store</h2>
              <p className="text-xs text-slate-400 mb-4">
                Download the official Qz-loop Android application directly from Google Play.
              </p>
            </div>
            <div>
              <a
                href={OFFICIAL_PLAYSTORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors border border-white/20"
              >
                <span>Install from Play Store</span>
                <Download className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* DPDP Act 2023 Data Management & Account Deletion Portal */}
        <section className="p-8 rounded-3xl bg-gradient-to-br from-purple-950/40 via-[#0d111c] to-emerald-950/30 border border-purple-500/30 shadow-[0_0_50px_rgba(168,85,247,0.15)] mb-10">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-bold w-fit mb-4">
            <Shield className="w-3.5 h-3.5" />
            <span>DPDP Act 2023 · Right to Complete Erasure</span>
          </div>

          <h2 className="text-2xl font-black text-white tracking-tight mb-3">
            Account &amp; Data Deletion Requests
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed mb-6">
            Under India&apos;s <strong>Digital Personal Data Protection (DPDP) Act, 2023</strong> and Google Play Developer Policies, all users have the absolute right to demand complete erasure of their account, Google authentication tokens, practice history, streak records, and personal identifiers.
          </p>

          <div className="space-y-4 text-xs text-slate-300 mb-6">
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block mb-0.5">Method 1: In-App Instant Deletion</strong>
                Open the Qz-loop mobile app &gt; navigate to Profile tab &gt; Settings &gt; Data &amp; Privacy &gt; tap &quot;Delete Account &amp; Erase Data&quot;. This immediately triggers secure deletion.
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block mb-0.5">Method 2: Email Grievance Officer</strong>
                Send an email with subject &quot;DPDP Data Deletion Request&quot; to <strong>atish2k22@gmail.com</strong> from your registered Google account email.
              </div>
            </div>
          </div>

          {/* Grievance Officer Box */}
          <div className="p-4 rounded-xl bg-black/40 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold block">Designated Grievance Officer</span>
              <span className="text-base font-bold text-white">Atish Kumar</span>
              <span className="text-xs text-purple-300 block">Qz-loop Legal &amp; Data Compliance</span>
            </div>
            <div className="flex items-center gap-2">
              <a
                href="mailto:atish2k22@gmail.com?subject=DPDP%20Data%20Deletion%20Request"
                className="px-4 py-2 rounded-xl bg-red-600/80 hover:bg-red-500 text-white font-bold text-xs transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Submit Deletion Email</span>
              </a>
            </div>
          </div>
        </section>

        {/* Operating Hours & SLA */}
        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 flex items-center gap-4 text-xs text-slate-400">
          <Clock className="w-5 h-5 text-purple-400 shrink-0" />
          <div>
            <strong className="text-white block">SLA Commitment</strong>
            DPDP grievance requests are acknowledged within 48 hours and resolved with verified data erasure within 7 business days.
          </div>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}

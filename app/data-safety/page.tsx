import React from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Lock, Database, Trash2, CheckCircle2, XCircle, Mail, Phone } from "lucide-react";
import { LandingNavbar, OFFICIAL_PLAYSTORE_URL, OFFICIAL_WHATSAPP_GROUP_URL } from "@/components/landing/LandingNavbar";
import { LandingFooter } from "@/components/landing/LandingFooter";

export const metadata = {
  title: "Google Play Data Safety & Security | Qz-loop",
  description: "Official Google Play Data Safety Questionnaire breakdown and DPDP Act 2023 security disclosure for Qz-loop.",
};

export default function DataSafetyPage() {
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold mb-4">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Google Play Data Safety Official Declaration</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4">
            Data Safety &amp; Security
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
            This page provides an exact public mirror of our official <strong>Google Play Console Data Safety Questionnaire</strong> and disclosures under India&apos;s <strong>Digital Personal Data Protection (DPDP) Act, 2023</strong> for the application <strong>Qz-loop (app.qzloop.qz_loop_app)</strong>.
          </p>
        </div>

        {/* High Level Declarations */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm mb-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>No Data Sold</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              We never sell your personal data or activity history to data brokers or third-party ad networks.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm mb-2">
              <Lock className="w-4 h-4" />
              <span>Encrypted in Transit</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              All communications between your mobile device and our backend use TLS 1.3 encryption.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm mb-2">
              <Trash2 className="w-4 h-4" />
              <span>Erasure on Demand</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Users can request full deletion of their account and all associated data at any time.
            </p>
          </div>
        </div>

        {/* Play Store Questionnaire Breakdown */}
        <div className="space-y-6 text-sm">
          {/* Data Shared */}
          <section className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-purple-400" />
                <span>1. Data Shared with Third Parties</span>
              </h2>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                0 Data Shared
              </span>
            </div>
            <p className="text-slate-300 text-xs leading-relaxed">
              <strong>None.</strong> Qz-loop does not share, rent, or transfer any user data with external third parties, advertising partners, or marketing aggregators. All authentication and practice records are strictly processed for app functionality.
            </p>
          </section>

          {/* Data Collected */}
          <section className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
            <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Database className="w-4 h-4 text-purple-400" />
              <span>2. Data Collected &amp; Purpose</span>
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400">
                    <th className="py-2.5 pr-4 font-semibold">Data Type</th>
                    <th className="py-2.5 px-4 font-semibold">Specific Fields</th>
                    <th className="py-2.5 px-4 font-semibold">Purpose</th>
                    <th className="py-2.5 pl-4 font-semibold">Optional / Required</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  <tr>
                    <td className="py-3 pr-4 font-bold text-white">Personal Info</td>
                    <td className="py-3 px-4">Name, Email Address, Profile Photo, @username</td>
                    <td className="py-3 px-4">App functionality, Account authentication, Profile sync</td>
                    <td className="py-3 pl-4 text-emerald-400">Required for Quiz Loop</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-bold text-white">App Activity</td>
                    <td className="py-3 px-4">Question attempts, Selected options, Response time, Daily streak</td>
                    <td className="py-3 px-4">Spaced repetition reviews, 70% streak rule, Mistake Vault</td>
                    <td className="py-3 pl-4 text-purple-300">App functionality</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-bold text-white">User-Generated Content</td>
                    <td className="py-3 px-4">MCQs created, Explanations, Question comments</td>
                    <td className="py-3 px-4">Community practice library, Doubt clearing</td>
                    <td className="py-3 pl-4 text-slate-400">Optional</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-bold text-white">Diagnostics</td>
                    <td className="py-3 px-4">Crash logs, Performance diagnostics</td>
                    <td className="py-3 px-4">Crash mitigation, Memory leak prevention</td>
                    <td className="py-3 pl-4 text-slate-400">Automatic / Anonymized</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Security Standards */}
          <section className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
            <h2 className="text-base font-bold text-white mb-3">
              3. Security Standards &amp; Data Handling
            </h2>
            <ul className="list-disc pl-5 space-y-2 text-xs text-slate-300">
              <li>
                <strong>Data Encryption:</strong> All data is securely transferred over HTTPS with TLS 1.3 protocol.
              </li>
              <li>
                <strong>Storage Security:</strong> Stored on ISO-27001 and SOC 2 Type II compliant cloud infrastructure with row-level security (RLS) enforcement.
              </li>
              <li>
                <strong>Data Retention:</strong> Data is retained only as long as you maintain an active account. Inactive accounts can be pruned upon request.
              </li>
            </ul>
          </section>

          {/* Contact & Grievance */}
          <section className="p-6 rounded-2xl bg-purple-950/20 border border-purple-500/30">
            <h2 className="text-base font-bold text-white mb-3">
              4. DPDP Act Grievance Redressal
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Under India&apos;s DPDP Act 2023, you can contact our Data Protection Grievance Officer directly:
            </p>
            <div className="flex flex-col sm:flex-row gap-4 text-xs text-slate-300">
              <div>
                <span className="text-slate-400 block font-medium">Grievance Officer</span>
                <span className="text-white font-bold">Atish Kumar</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Email</span>
                <a href="mailto:atish2k22@gmail.com" className="text-purple-300 hover:underline">
                  atish2k22@gmail.com
                </a>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Phone</span>
                <a href="tel:9798482404" className="text-purple-300 hover:underline">
                  +91 9798482404 (9798482404)
                </a>
              </div>
            </div>
          </section>
        </div>

        {/* Action bar */}
        <div className="mt-10 p-6 rounded-2xl bg-gradient-to-r from-purple-900/30 via-indigo-900/20 to-emerald-900/20 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-white">Join our community of future rankers</h3>
            <p className="text-xs text-slate-400">Install the official Qz-loop Android app today.</p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={OFFICIAL_PLAYSTORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-colors"
            >
              Play Store Download
            </a>
            <a
              href={OFFICIAL_WHATSAPP_GROUP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors"
            >
              WhatsApp Group
            </a>
          </div>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}

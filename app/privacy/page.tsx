import React from "react";
import Link from "next/link";
import { ArrowLeft, Shield, Mail, Phone, Lock, Trash2, CheckCircle2 } from "lucide-react";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { LandingFooter } from "@/components/landing/LandingFooter";

export const metadata = {
  title: "Privacy Policy | Qz-loop",
  description: "Official Privacy Policy and DPDP Act Data Management disclosure for Qz-loop.",
};

export default function PrivacyPolicyPage() {
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
            <Shield className="w-3.5 h-3.5" />
            <span>Google Play Policy & DPDP Act 2023 Compliant</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4">
            Privacy Policy
          </h1>
          <p className="text-sm text-slate-400">
            Last updated: November 5, 2026 · Effective Date: November 5, 2026 · Application: <strong>Qz-loop (app.qzloop.qz_loop_app)</strong>
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-invert max-w-none text-slate-300 space-y-8 text-sm leading-relaxed">
          <section className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <Lock className="w-4 h-4 text-purple-400" />
              1. Introduction & Overview
            </h2>
            <p>
              Welcome to <strong>Qz-loop</strong> ("we", "our", or "us"). We are committed to protecting your personal information and respecting your privacy rights. This Privacy Policy explains what data we collect, how we process it, and how you can exercise your rights under Google Play Developer Policies and India&apos;s <strong>Digital Personal Data Protection (DPDP) Act, 2023</strong>.
            </p>
            <p className="mt-2">
              Qz-loop is an educational platform providing 15-second multiple-choice question practice micro-reels for Indian competitive examinations (including NEET UG, JEE Main, UPSC CSAT, SSC CGL, Banking IBPS, Railway NTPC, Defence CDS, State PCS, CUET UG, and State Police).
            </p>
          </section>

          <section className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
            <h2 className="text-lg font-bold text-white mb-3">
              2. Information We Collect
            </h2>
            <p>We collect minimal information necessary to deliver our educational services:</p>
            <ul className="list-disc pl-5 space-y-2 mt-3 text-slate-300">
              <li>
                <strong>Account & Profile Information:</strong> When you sign in or sign up with Google, we receive your name, email address, and profile picture avatar. You may also configure a unique aspirant handle (@username) and target exam preference.
              </li>
              <li>
                <strong>Quiz Practice Activity:</strong> Records of questions attempted, options selected, correctness, time spent per question, streaks maintained, mistake vault items, and custom question collections.
              </li>
              <li>
                <strong>User-Generated Content:</strong> MCQs submitted by you through the in-app creator, including question text, options, explanations, and optional question comments.
              </li>
              <li>
                <strong>Study Partner Interactions:</strong> Direct question challenges sent between study partners and friend request connections.
              </li>
              <li>
                <strong>Device & Diagnostic Data:</strong> Basic application state and crash analytics to maintain application stability and performance.
              </li>
            </ul>
          </section>

          <section className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
            <h2 className="text-lg font-bold text-white mb-3">
              3. How We Use Your Information
            </h2>
            <p>Your data is used strictly for legitimate educational purposes:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              <div className="p-3.5 rounded-xl bg-purple-500/5 border border-purple-500/20 text-xs">
                <strong className="text-purple-300 block mb-1">Personalized Feed</strong>
                Delivering high-yield MCQs matched to your chosen exam and subject preferences.
              </div>
              <div className="p-3.5 rounded-xl bg-purple-500/5 border border-purple-500/20 text-xs">
                <strong className="text-purple-300 block mb-1">Streak & Spaced Repetition</strong>
                Enforcing the 70% daily goal streak rule and scheduling mistake reviews (1 Day, 1 Week, 1 Month).
              </div>
              <div className="p-3.5 rounded-xl bg-purple-500/5 border border-purple-500/20 text-xs">
                <strong className="text-purple-300 block mb-1">Social Study Challenges</strong>
                Allowing mutual study partners to send and receive question challenges in real time.
              </div>
              <div className="p-3.5 rounded-xl bg-purple-500/5 border border-purple-500/20 text-xs">
                <strong className="text-purple-300 block mb-1">Fair Leaderboards</strong>
                Calculating authentic percentile standings based on verified solve counts and accuracy.
              </div>
            </div>
          </section>

          <section className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
            <h2 className="text-lg font-bold text-white mb-3">
              4. Zero Data Selling & Third-Party Sharing Policy
            </h2>
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 font-medium mb-3">
              ✓ We DO NOT sell, rent, trade, or monetize your personal information to data brokers, advertising agencies, or marketing third parties.
            </div>
            <p>
              We do not run third-party behavioral advertisements or tracking SDKs. Data is only transferred to secure infrastructure providers (such as Supabase Cloud authentication and database servers) strictly to operate the service.
            </p>
          </section>

          <section className="p-6 rounded-2xl bg-white/[0.02] border border-purple-500/30 bg-purple-500/[0.03]">
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-purple-400" />
              5. Your Rights Under DPDP Act 2023 & Complete Data Deletion
            </h2>
            <p>
              In accordance with India&apos;s <strong>Digital Personal Data Protection Act, 2023</strong> and Google Play Developer Policies on User Data, you possess complete sovereignty over your data:
            </p>
            <div className="space-y-3 mt-4 text-xs">
              <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                <strong className="text-white block mb-0.5">1. Right to Access & Correction:</strong>
                You can review, edit, or modify your display name, username, target exam, daily goals, and saved playlists anytime directly in Profile settings.
              </div>
              <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                <strong className="text-white block mb-0.5">2. Right to Complete Account & Data Deletion (Erasure):</strong>
                You have the absolute right to have all your personal information, attempts, mistake records, and cloud profiles permanently erased:
                <ul className="list-disc pl-5 mt-2 space-y-1 text-slate-300">
                  <li>
                    <strong>In-App Self-Service Deletion:</strong> Navigate to <em>Profile Tab → Settings & Options → Permanently Delete Account</em>. Confirming this immediately purges your records.
                  </li>
                  <li>
                    <strong>Email Deletion Request:</strong> You can mail our Grievance Officer at <a href="mailto:atish2k22@gmail.com" className="text-purple-300 underline font-mono">atish2k22@gmail.com</a> with subject <em>&quot;Data Deletion Request&quot;</em>. All records will be permanently expunged within <strong>48 hours</strong>.
                  </li>
                </ul>
              </div>
              <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                <strong className="text-white block mb-0.5">3. Right of Grievance Redressal:</strong>
                If you have any questions, concerns, or grievances regarding your data, you can reach our designated Grievance Officer:
              </div>
            </div>

            <div className="mt-5 p-4 rounded-xl bg-[#0b0f19] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
              <div>
                <div className="font-bold text-white text-sm">Atish Kumar</div>
                <div className="text-slate-400">Grievance & Data Protection Officer, Qz-loop</div>
                <div className="text-slate-400 mt-1">
                  Email: <a href="mailto:atish2k22@gmail.com" className="text-purple-300 font-mono">atish2k22@gmail.com</a> · Phone: <a href="tel:+919798482404" className="text-emerald-400 font-mono">+91 9798482404</a>
                </div>
              </div>
              <a
                href="mailto:atish2k22@gmail.com?subject=DPDP%20Act%20Data%20Deletion%20Request"
                className="px-4 py-2.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-300 font-bold text-center transition-all whitespace-nowrap"
              >
                Request Data Erasure
              </a>
            </div>
          </section>

          <section className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
            <h2 className="text-lg font-bold text-white mb-3">
              6. Security & Encryption
            </h2>
            <p>
              We employ strict industry-standard technical measures to safeguard your information. All communication between the Qz-loop client application, website, and Supabase servers is encrypted in transit using Transport Layer Security (TLS 1.3 / HTTPS). Database storage implements role-based access control (RBAC) and row-level security policies.
            </p>
          </section>

          <section className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
            <h2 className="text-lg font-bold text-white mb-3">
              7. Children&apos;s Privacy
            </h2>
            <p>
              Qz-loop is built for secondary, senior-secondary, and university students preparing for Indian competitive examinations. We do not knowingly collect personal information from children under 13 without appropriate parental or legal guardian consent. If we discover that a user under 13 has registered without verified authorization, we promptly delete their account and associated records.
            </p>
          </section>

          <section className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
            <h2 className="text-lg font-bold text-white mb-3">
              8. Contact Us
            </h2>
            <p>
              For any questions regarding this Privacy Policy or data protection, please contact us:
            </p>
            <ul className="mt-3 space-y-1.5 text-xs font-mono text-slate-300">
              <li>Email: atish2k22@gmail.com</li>
              <li>Phone: +91 9798482404</li>
              <li>WhatsApp Community: https://chat.whatsapp.com/JaluiYU8C6nKGrr3YXBn6L</li>
            </ul>
          </section>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}

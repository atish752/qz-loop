import React from "react";
import Link from "next/link";
import { ArrowLeft, FileText, Mail, Phone, ShieldCheck, Scale, CheckCircle2 } from "lucide-react";
import { LandingNavbar, OFFICIAL_PLAYSTORE_URL, OFFICIAL_WHATSAPP_GROUP_URL } from "@/components/landing/LandingNavbar";
import { LandingFooter } from "@/components/landing/LandingFooter";

export const metadata = {
  title: "Terms and Conditions | Qz-loop",
  description: "Official Terms of Service and End User Agreement for Qz-loop mobile application.",
};

export default function TermsPage() {
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
            <Scale className="w-3.5 h-3.5" />
            <span>Standard Google Play & DPDP Act 2023 Agreement</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4">
            Terms and Conditions
          </h1>
          <p className="text-sm text-slate-400">
            Last updated: November 5, 2026 · Effective Date: November 5, 2026 · App: <strong>Qz-loop (app.qzloop.qz_loop_app)</strong>
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-invert max-w-none text-slate-300 space-y-8 text-sm leading-relaxed">
          <section className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-400" />
              1. Acceptance of Terms
            </h2>
            <p>
              By downloading, installing, accessing, or using the <strong>Qz-loop</strong> mobile application (&quot;the App&quot;) or our website, you agree to be legally bound by these Terms and Conditions (&quot;Terms&quot;) and our Privacy Policy. If you do not agree to these Terms, please do not install or use Qz-loop.
            </p>
            <p className="mt-2">
              These Terms apply to all aspirants, students, visitors, and contributors who access the service.
            </p>
          </section>

          <section className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
            <h2 className="text-lg font-bold text-white mb-3">
              2. Eligibility & Student Accounts
            </h2>
            <p>
              Qz-loop is designed for competitive exam aspirants (NEET UG, JEE Main, UPSC, SSC, Banking, Railways, Defence, State PCS, CUET, and Police exams). You must be at least 13 years of age (or have parent/guardian consent) to use the App.
            </p>
            <p className="mt-2">
              <strong>Compulsory Sign-In Policy:</strong> To access the interactive Quiz Loop, maintain authentic competitive leaderboard standings, earn daily streaks, and sync your Mistake Vault across devices, signing in or signing up with your verified Google Account is compulsory.
            </p>
          </section>

          <section className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
            <h2 className="text-lg font-bold text-white mb-3">
              3. Fair Play, Streaks & Leaderboard Integrity
            </h2>
            <p>
              Qz-loop enforces strict competitive integrity rules:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-3 text-slate-300">
              <li>
                <strong>70% Daily Goal Rule:</strong> Your daily practice streak increments only when you achieve at least 70% of your chosen daily MCQ target in Indian Standard Time (IST).
              </li>
              <li>
                <strong>Streak Protection:</strong> You may skip 1 day without penalty (grace protection). Missing two consecutive days without reaching 70% resets your streak to 0.
              </li>
              <li>
                <strong>Zero Automation / Fair Play:</strong> Any use of automated scripts, bots, clickers, or artificial methods to exploit solve counts, accuracy metrics, or leaderboards is strictly prohibited and results in immediate account suspension.
              </li>
            </ul>
          </section>

          <section className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
            <h2 className="text-lg font-bold text-white mb-3">
              4. User-Generated Questions & Community Content
            </h2>
            <p>
              Users may submit multiple-choice questions, explanations, and doubts to the community:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-3 text-slate-300">
              <li>
                You represent and warrant that questions submitted by you are accurate, non-plagiarized, and suitable for competitive exam preparation.
              </li>
              <li>
                You may not post abusive, defamatory, obscene, harassing, or hate-promoting content in comments or question titles.
              </li>
              <li>
                We reserve the right to review, edit, or remove any question or comment that violates quality or community guidelines without prior notice.
              </li>
            </ul>
          </section>

          <section className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
            <h2 className="text-lg font-bold text-white mb-3">
              5. Study Partners & Social Challenges
            </h2>
            <p>
              Mutual study partners can exchange friend requests and send question challenges. Users may unfriend, block, or report peers at any time. We do not tolerate spamming or unwanted solicitation through study challenges.
            </p>
          </section>

          <section className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
            <h2 className="text-lg font-bold text-white mb-3">
              6. Educational Disclaimer
            </h2>
            <p>
              Qz-loop is an independent self-study and practice companion tool. Qz-loop is not affiliated with, endorsed by, or sponsored by NTA, UPSC, SSC, IBPS, or any government body. While we strive for absolute accuracy in questions and answer keys, we make no guarantees of exam outcomes or specific ranks.
            </p>
          </section>

          <section className="p-6 rounded-2xl bg-white/[0.02] border border-white/10">
            <h2 className="text-lg font-bold text-white mb-3">
              7. Account Deletion & DPDP Act 2023 Compliance
            </h2>
            <p>
              In full compliance with India&apos;s <strong>Digital Personal Data Protection (DPDP) Act, 2023</strong> and Google Play Developer Policies:
            </p>
            <p className="mt-2">
              You have the right to request full erasure of your account, authentication records, and practice data at any time. You can trigger deletion within the app under Settings &gt; Data &amp; Privacy or by emailing our designated Grievance Officer at <strong>atish2k22@gmail.com</strong>.
            </p>
          </section>

          <section className="p-6 rounded-2xl bg-purple-950/20 border border-purple-500/30">
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-purple-400" />
              8. Contact & Grievance Redressal
            </h2>
            <p>
              For legal inquiries, terms clarification, or data rights:
            </p>
            <div className="mt-4 space-y-2 text-slate-300">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Grievance Officer:</span>
                <span className="font-semibold text-white">Atish Kumar</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-purple-400" />
                <a href="mailto:atish2k22@gmail.com" className="text-purple-300 hover:underline">
                  atish2k22@gmail.com
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-purple-400" />
                <a href="tel:9798482404" className="text-purple-300 hover:underline">
                  +91 9798482404 (9798482404)
                </a>
              </div>
            </div>
          </section>
        </div>

        {/* CTA Bar */}
        <div className="mt-12 p-6 rounded-2xl bg-gradient-to-r from-purple-900/30 via-indigo-900/20 to-emerald-900/20 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white">Ready to master high-yield MCQs?</h3>
            <p className="text-xs text-slate-400">Download the official Qz-loop Android app today.</p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <a
              href={OFFICIAL_PLAYSTORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all text-center"
            >
              Google Play Install
            </a>
            <a
              href={OFFICIAL_WHATSAPP_GROUP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all text-center"
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

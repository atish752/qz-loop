"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppLanguage } from "@/lib/utils/i18n";

export interface ExamOption {
  id: string;
  name: string;
  shortName: string;
  category: string;
  icon: string;
  description: string;
}

export const TOP_EXAMS_LIST: ExamOption[] = [
  {
    id: "exam-railway-ntpc",
    name: "Railways (RRB NTPC & Group D)",
    shortName: "Railways RRB",
    category: "Railways",
    icon: "train",
    description: "CEN NTPC, Group D, ALP & Technician (~1.5+ Cr Aspirants)",
  },
  {
    id: "exam-ssc-cgl",
    name: "SSC CGL / CHSL / MTS",
    shortName: "SSC CGL",
    category: "Staff Selection Commission",
    icon: "assignment",
    description: "Combined Graduate Level, CHSL & MTS (~45 Lakh Aspirants)",
  },
  {
    id: "exam-neet-ug",
    name: "NEET UG (Medical Entrance)",
    shortName: "NEET UG",
    category: "Medical Entrance",
    icon: "medical_services",
    description: "MBBS, BDS & AYUSH Entrance (~24 Lakh Aspirants)",
  },
  {
    id: "exam-cuet-ug",
    name: "CUET UG (Central Universities)",
    shortName: "CUET UG",
    category: "University Entrance",
    icon: "account_balance",
    description: "DU, BHU, JNU & Central Universities (~14 Lakh Aspirants)",
  },
  {
    id: "exam-jee-main",
    name: "JEE Main (Engineering Entrance)",
    shortName: "JEE Main",
    category: "Engineering Entrance",
    icon: "precision_manufacturing",
    description: "NITs, IIITs & Top Engineering Colleges (~12 Lakh Aspirants)",
  },
  {
    id: "exam-banking-ibps",
    name: "Banking (IBPS / SBI PO & Clerk)",
    shortName: "Banking IBPS",
    category: "Banking & Insurance",
    icon: "savings",
    description: "SBI, IBPS PO, Clerk & RRB Officer (~12 Lakh Aspirants)",
  },
  {
    id: "exam-state-police",
    name: "State Police / Constable & SI",
    shortName: "State Police",
    category: "Police Services",
    icon: "shield",
    description: "UP, Bihar, MP & State Police SI/Constable (~18 Lakh Aspirants)",
  },
  {
    id: "exam-state-pcs",
    name: "State PCS (BPSC, UPPSC, MPPSC)",
    shortName: "State PCS",
    category: "State Civil Services",
    icon: "map",
    description: "BPSC, UPPSC, MPPSC & State Civil Services (~7 Lakh Aspirants)",
  },
  {
    id: "exam-defence-cds",
    name: "Defence (NDA / CDS / AFCAT)",
    shortName: "Defence CDS",
    category: "Defence Services",
    icon: "military_tech",
    description: "National Defence Academy & Combined Defence Services",
  },
  {
    id: "exam-upsc-csat",
    name: "UPSC Civil Services (IAS / IPS)",
    shortName: "UPSC CSE",
    category: "Union Civil Services",
    icon: "policy",
    description: "Civil Services Preliminary Examination (GS + CSAT)",
  },
];

interface FirstTimeExamModalProps {
  onExamSelected?: (examId: string) => void;
}

export const FirstTimeExamModal: React.FC<FirstTimeExamModalProps> = ({ onExamSelected }) => {
  const router = useRouter();
  const { lang, t } = useAppLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState<string>("exam-railway-ntpc");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hasOnboarded = localStorage.getItem("qz_exam_onboarded");
      const savedExam = localStorage.getItem("qz_target_exam") || localStorage.getItem("qz_last_exam");
      if (savedExam) {
        setSelectedExamId(savedExam);
      }
      if (!hasOnboarded) {
        // First time visitor: show modal after slight delay for smooth entry
        const timer = setTimeout(() => {
          setIsOpen(true);
        }, 300);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  if (!isOpen) return null;

  const selectedExam = TOP_EXAMS_LIST.find((e) => e.id === selectedExamId) || TOP_EXAMS_LIST[0];

  const handleStartQuizLoop = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("qz_exam_onboarded", "true");
      localStorage.setItem("qz_target_exam", selectedExamId);
      localStorage.setItem("qz_last_exam", selectedExamId);
      window.dispatchEvent(
        new CustomEvent("qz_exam_changed", {
          detail: { examId: selectedExamId, examName: selectedExam.name },
        })
      );
    }
    if (onExamSelected) {
      onExamSelected(selectedExamId);
    }
    setIsOpen(false);
    router.push(`/loop?start=true&examId=${encodeURIComponent(selectedExamId)}`);
  };

  const handleDismiss = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("qz_exam_onboarded", "true");
      localStorage.setItem("qz_target_exam", selectedExamId);
      localStorage.setItem("qz_last_exam", selectedExamId);
      window.dispatchEvent(
        new CustomEvent("qz_exam_changed", {
          detail: { examId: selectedExamId, examName: selectedExam.name },
        })
      );
    }
    if (onExamSelected) {
      onExamSelected(selectedExamId);
    }
    setIsOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-sm bg-surface-container-lowest rounded-3xl p-5 sm:p-6 shadow-2xl border border-surface-container-high/60 flex flex-col gap-4 text-center animate-in zoom-in-95 duration-200">
        {/* Vibrant Badge & Icon */}
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary-container text-on-primary mx-auto flex items-center justify-center shadow-md">
          <span className="material-symbols-outlined text-[32px]">school</span>
        </div>

        {/* Title & Welcoming Aspirant Headline */}
        <div>
          <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-bold uppercase tracking-wider">
            {lang === "hi" ? "स्वागत है एस्पिरेंट" : "Welcome Aspirant"}
          </span>
          <h2 className="font-bold text-on-surface text-lg sm:text-xl mt-1.5 leading-snug">
            {lang === "hi" ? "आप किस परीक्षा की तैयारी कर रहे हैं?" : "Which exam are you preparing for?"}
          </h2>
          <p className="text-xs text-secondary mt-1 leading-relaxed">
            {lang === "hi"
              ? "अपना लक्ष्य चुनें। हम आपके लिए अनलिमिटेड क्विज़ लूप और प्रश्न तैयार करेंगे।"
              : "Select your target exam to launch unlimited practice questions & customized syllabus reels."}
          </p>
        </div>

        {/* Dropdown Menu for Top 10 Competitive Exams */}
        <div className="text-left flex flex-col gap-1.5">
          <label className="text-[11px] font-bold text-secondary uppercase tracking-wider">
            {lang === "hi" ? "लक्ष्य परीक्षा चुनें (Select Target Exam)" : "Select Target Exam"}
          </label>
          <div className="relative">
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="w-full py-3 pl-3.5 pr-10 rounded-xl bg-surface-container border border-surface-container-high text-on-surface font-semibold text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary shadow-xs cursor-pointer"
            >
              {TOP_EXAMS_LIST.map((exam) => (
                <option key={exam.id} value={exam.id}>
                  {exam.name}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-secondary">
              <span className="material-symbols-outlined text-[20px]">expand_more</span>
            </div>
          </div>
        </div>

        {/* Selected Exam Information Card */}
        <div className="p-3 rounded-2xl bg-surface-container-low border border-surface-container-high/40 text-left flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary-fixed/40 text-primary flex items-center justify-center shrink-0 mt-0.5">
            <span className="material-symbols-outlined text-[20px]">{selectedExam.icon}</span>
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-xs text-on-surface">{selectedExam.name}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-surface-container-highest text-secondary font-semibold">
                {selectedExam.category}
              </span>
            </div>
            <p className="text-[11px] text-secondary mt-0.5 line-clamp-2">
              {selectedExam.description}
            </p>
          </div>
        </div>

        {/* Action Buttons: Start Quiz Loop & Browse Home */}
        <div className="flex flex-col gap-2 pt-1">
          <button
            type="button"
            onClick={handleStartQuizLoop}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-primary to-primary-container hover:shadow-lg active:scale-98 text-on-primary font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 group cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px] transition-transform group-hover:scale-125">
              play_circle
            </span>
            <span>{lang === "hi" ? "क्विज़ लूप शुरू करें" : "Start Quiz Loop"}</span>
          </button>

          <button
            type="button"
            onClick={handleDismiss}
            className="py-2 text-xs text-secondary hover:text-on-surface font-semibold transition-colors cursor-pointer"
          >
            {lang === "hi" ? "होम स्क्रीन देखें" : "Explore Home Screen First"}
          </button>
        </div>
      </div>
    </div>
  );
};

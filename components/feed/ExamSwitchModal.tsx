"use client";

import React, { useState, useEffect } from "react";
import { Examination } from "@/types/database";
import { EXAM_SCORING_RULES } from "@/lib/utils/examScoring";

interface ExamSwitchModalProps {
  exams?: Examination[];
  currentExamId: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectExam: (exam: Examination) => void;
}

export const ExamSwitchModal: React.FC<ExamSwitchModalProps> = ({
  exams: initialExams,
  currentExamId,
  isOpen,
  onClose,
  onSelectExam,
}) => {
  const [exams, setExams] = useState<Examination[]>(initialExams || []);

  useEffect(() => {
    if (initialExams && initialExams.length > 0) {
      setExams(initialExams);
    } else if (isOpen) {
      fetch("/api/profile")
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.exams?.length > 0) {
            setExams(data.exams);
          }
        })
        .catch(() => {});
    }
  }, [initialExams, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-surface-container-lowest rounded-3xl p-5 shadow-2xl border border-surface-container-high/60 flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-2 border-b border-surface-container-high/40">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[24px]">school</span>
            <div>
              <h3 className="font-headline-sm text-base font-bold text-on-surface">Target Examination</h3>
              <p className="text-xs text-secondary">Switch exam domain & syllabus flow</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-secondary transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <p className="font-body-sm text-xs text-secondary my-2.5">
          Dynamic reels, syllabus topics, and negative marking formulas calibrate automatically.
        </p>

        <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col gap-2.5 pr-0.5">
          {exams.map((exam) => {
            const isSelected = exam.id === currentExamId;
            const scoringRule = EXAM_SCORING_RULES[exam.id];
            const scoringPill = scoringRule
              ? `+${scoringRule.marksPerCorrect} / -${scoringRule.penaltyPerWrong}`
              : "+2.0 / -0.50";

            return (
              <button
                key={exam.id}
                onClick={() => {
                  onSelectExam(exam);
                  onClose();
                }}
                className={`p-3.5 rounded-2xl text-left flex items-start justify-between gap-3 transition-all border ${
                  isSelected
                    ? "bg-primary-container text-on-primary border-primary shadow-sm"
                    : "bg-surface-container-low text-on-surface hover:bg-surface-container border-surface-container-high/40"
                }`}
              >
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm">{exam.name}</span>
                    {exam.category && (
                      <span className={`text-[10px] px-2 py-0.2 rounded-full font-semibold ${
                        isSelected ? "bg-white/20 text-white" : "bg-surface-container-highest text-secondary"
                      }`}>
                        {exam.category}
                      </span>
                    )}
                  </div>
                  <span className={`text-xs mt-0.5 line-clamp-1 leading-snug ${
                    isSelected ? "text-on-primary-container" : "text-secondary"
                  }`}>
                    {exam.description || "Competitive Exam Drill"}
                  </span>
                  <div className="flex items-center gap-2 mt-1.5 text-[11px] font-mono">
                    <span className={`px-1.5 py-0.2 rounded font-bold ${
                      isSelected ? "bg-white/25 text-white" : "bg-surface-container text-primary"
                    }`}>
                      Penalty: {scoringPill}
                    </span>
                    <span className={isSelected ? "text-white/80" : "text-secondary"}>
                      Negative Marking
                    </span>
                  </div>
                </div>

                <div className="shrink-0 pt-0.5">
                  {isSelected ? (
                    <span className="material-symbols-outlined text-[22px] text-on-primary">
                      check_circle
                    </span>
                  ) : (
                    <span className="material-symbols-outlined text-[20px] text-secondary opacity-40">
                      radio_button_unchecked
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

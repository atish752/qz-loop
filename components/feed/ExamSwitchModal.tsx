"use client";

import React from "react";
import { Examination } from "@/types/database";

interface ExamSwitchModalProps {
  exams: Examination[];
  currentExamId: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectExam: (exam: Examination) => void;
}

export const ExamSwitchModal: React.FC<ExamSwitchModalProps> = ({
  exams,
  currentExamId,
  isOpen,
  onClose,
  onSelectExam,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/40 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-sm bg-surface-container-lowest rounded-2xl p-5 shadow-xl border border-surface-container-high/50 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[22px]">school</span>
            <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">Target Examination</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-secondary transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <p className="font-body-sm text-body-sm text-secondary">
          Questions and subjects adjust dynamically to your selected exam.
        </p>

        <div className="flex flex-col gap-2 mt-1">
          {exams.map((exam) => {
            const isSelected = exam.id === currentExamId;
            return (
              <button
                key={exam.id}
                onClick={() => {
                  onSelectExam(exam);
                  onClose();
                }}
                className={`p-3.5 rounded-xl text-left flex items-center justify-between transition-all ${
                  isSelected
                    ? "bg-primary-container text-on-primary shadow-sm"
                    : "bg-surface-container-low text-on-surface hover:bg-surface-container"
                }`}
              >
                <div className="flex flex-col">
                  <span className="font-label-lg text-label-lg font-bold">{exam.name}</span>
                  <span className={`font-body-sm text-body-sm line-clamp-1 ${isSelected ? "text-on-primary-container" : "text-secondary"}`}>
                    {exam.description || "Competitive Exam Drill"}
                  </span>
                </div>
                {isSelected && (
                  <span className="material-symbols-outlined text-[22px] text-on-primary">
                    check_circle
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { TopHeader } from "../layout/TopHeader";
import { DuplicateCheckResult } from "@/types/database";

const SUBJECTS = [
  { id: "subj-maths", name: "Maths", icon: "calculate" },
  { id: "subj-reasoning", name: "Reasoning", icon: "psychology" },
  { id: "subj-english", name: "English", icon: "spellcheck" },
  { id: "subj-gk", name: "GK", icon: "public" },
];

export const CreateQuestionView: React.FC = () => {
  const router = useRouter();

  // Form states
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("subj-gk");
  const [questionText, setQuestionText] = useState<string>("");
  const [language, setLanguage] = useState<"en" | "hi">("en");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [options, setOptions] = useState<[string, string, string, string]>([
    "",
    "",
    "",
    "",
  ]);
  const [correctOptionId, setCorrectOptionId] = useState<string>("A");
  const [explanation, setExplanation] = useState<string>("");

  // Duplicate check state
  const [duplicateResult, setDuplicateResult] = useState<DuplicateCheckResult | null>(null);
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState<boolean>(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState<boolean>(false);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [publishSuccess, setPublishSuccess] = useState<boolean>(false);

  // Debounced duplicate detection
  const checkDuplicateQuestion = useCallback(async (text: string) => {
    if (!text || text.trim().length < 8) {
      setDuplicateResult(null);
      return;
    }

    setIsCheckingDuplicate(true);
    try {
      const res = await fetch("/api/questions/check-duplicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionText: text }),
      });
      const data = await res.json();
      if (data.success) {
        setDuplicateResult(data);
      }
    } catch {
      // Handled
    } finally {
      setIsCheckingDuplicate(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      checkDuplicateQuestion(questionText);
    }, 450);

    return () => clearTimeout(timer);
  }, [questionText, checkDuplicateQuestion]);

  const handleOptionChange = (index: number, val: string) => {
    const updated: [string, string, string, string] = [...options];
    updated[index] = val;
    setOptions(updated);
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!questionText.trim()) {
      setErrorMsg("Please enter the question statement");
      return;
    }

    if (options.some((opt) => !opt.trim())) {
      setErrorMsg("Please fill in all 4 answer options");
      return;
    }

    if (duplicateResult?.is_exact_duplicate) {
      setErrorMsg("This exact question already exists in Qz Loop. Exact duplicates cannot be republished.");
      return;
    }

    setIsSubmitting(true);
    try {
      const formattedOptions = [
        { id: "A", text: options[0].trim() },
        { id: "B", text: options[1].trim() },
        { id: "C", text: options[2].trim() },
        { id: "D", text: options[3].trim() },
      ];

      const res = await fetch("/api/questions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectId: selectedSubjectId,
          questionText: questionText.trim(),
          language,
          options: formattedOptions,
          correctOptionId,
          explanation: explanation.trim() || undefined,
          difficulty,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setPublishSuccess(true);
      } else {
        setErrorMsg(data.error || "Failed to publish question");
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Network error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen pb-24">
      <TopHeader currentTab="create" streakDays={14} activeExamName="SSC CGL" />

      <div className="flex flex-col w-full px-4 pt-3 pb-8">
        {publishSuccess ? (
          <div className="py-12 flex flex-col items-center justify-center text-center gap-4 animate-in fade-in">
            <div className="w-16 h-16 rounded-full bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-[36px]">rocket_launch</span>
            </div>
            <h2 className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-on-surface">
              Question Published!
            </h2>
            <p className="font-body-md text-body-md text-secondary max-w-xs">
              Your question is now live in the community practice feed for SSC CGL aspirants.
            </p>
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={() => {
                  setPublishSuccess(false);
                  setQuestionText("");
                  setOptions(["", "", "", ""]);
                  setExplanation("");
                  setDuplicateResult(null);
                }}
                className="px-4 py-2.5 rounded-xl bg-surface-container font-label-md text-label-md text-on-surface hover:bg-surface-container-high transition-colors"
              >
                Add Another
              </button>
              <button
                onClick={() => router.push("/")}
                className="px-5 py-2.5 rounded-xl bg-primary text-on-primary font-label-md text-label-md font-bold shadow-sm hover:bg-primary-container transition-colors"
              >
                Go to Feed
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handlePublish} className="flex flex-col gap-4">
            {/* Subject Selector Filter Row */}
            <section>
              <div className="flex items-center justify-between mb-2">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-semibold">
                  Target Domain
                </span>
                <span className="font-label-sm text-label-sm text-primary flex items-center gap-1 font-bold">
                  <span className="material-symbols-outlined text-[14px]">bolt</span>
                  +25 Rep Points
                </span>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
                {SUBJECTS.map((s) => {
                  const isSelected = selectedSubjectId === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedSubjectId(s.id)}
                      className={`px-3.5 py-2 rounded-full font-label-md text-label-md transition-all flex items-center gap-1.5 shrink-0 ${
                        isSelected
                          ? "bg-primary-container text-on-primary shadow-sm font-bold scale-[1.02]"
                          : "bg-surface-container text-secondary hover:text-on-surface"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">{s.icon}</span>
                      <span>{s.name}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Language & Difficulty Row */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setLanguage("en")}
                  className={`px-2.5 py-1 rounded-lg text-label-sm font-semibold transition-all ${
                    language === "en" ? "bg-surface-container-lowest text-primary shadow-xs" : "text-secondary"
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage("hi")}
                  className={`px-2.5 py-1 rounded-lg text-label-sm font-semibold transition-all ${
                    language === "hi" ? "bg-surface-container-lowest text-primary shadow-xs" : "text-secondary"
                  }`}
                >
                  हिंदी
                </button>
              </div>

              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as "easy" | "medium" | "hard")}
                className="px-2.5 py-1 rounded-xl bg-surface-container-low border border-surface-container-high text-label-sm font-medium text-on-surface focus:outline-none"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            {/* Question Input Card */}
            <section className="bg-surface-container-low rounded-xl p-3.5 border border-surface-container-high/40 shadow-xs">
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-label-md text-label-md text-secondary flex items-center gap-1 font-semibold">
                  <span className="material-symbols-outlined text-[16px]">help</span>
                  <span>Question Statement</span>
                </label>
                <span className="font-label-sm text-label-sm text-secondary">
                  {questionText.length} / 300
                </span>
              </div>
              <textarea
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="Type question statement in English or हिंदी..."
                rows={3}
                maxLength={300}
                className="w-full bg-transparent font-headline-sm text-headline-sm text-on-surface focus:outline-none resize-none leading-snug placeholder:text-secondary/50"
              />
              <div className="flex items-center justify-end gap-2 pt-1 border-t border-surface-container-high/30 text-secondary">
                <button
                  type="button"
                  onClick={() => setQuestionText((prev) => prev + "² ")}
                  className="px-2 py-0.5 rounded text-xs hover:bg-surface-container transition-colors"
                  title="Superscript"
                >
                  x²
                </button>
                <button
                  type="button"
                  onClick={() => setQuestionText((prev) => prev + "√ ")}
                  className="px-2 py-0.5 rounded text-xs hover:bg-surface-container transition-colors"
                  title="Square root"
                >
                  √
                </button>
                <button
                  type="button"
                  onClick={() => setQuestionText((prev) => prev + "₹ ")}
                  className="px-2 py-0.5 rounded text-xs hover:bg-surface-container transition-colors"
                  title="Rupee symbol"
                >
                  ₹
                </button>
              </div>
            </section>

            {/* Real-Time Duplicate Warning Banner */}
            {duplicateResult?.is_similar && (
              <div
                className={`rounded-xl p-3 flex items-start justify-between gap-3 shadow-xs border ${
                  duplicateResult.is_exact_duplicate
                    ? "bg-error-container/40 border-error text-error"
                    : "bg-primary-fixed/40 border-primary/20 text-on-surface"
                }`}
              >
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  <span
                    className={`material-symbols-outlined text-[20px] shrink-0 mt-0.5 ${
                      duplicateResult.is_exact_duplicate ? "text-error" : "text-primary"
                    }`}
                  >
                    warning
                  </span>
                  <div className="flex flex-col min-w-0">
                    <span className="font-label-md text-label-md font-bold leading-tight">
                      {duplicateResult.is_exact_duplicate
                        ? "Exact Duplicate Detected"
                        : "Similar Question Exists"}
                    </span>
                    <span className="font-body-sm text-body-sm line-clamp-1 opacity-90 mt-0.5">
                      {duplicateResult.matched_question?.question_text}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDuplicateModal(true)}
                  className="px-3 py-1 rounded-lg bg-surface-container-lowest text-primary font-label-sm text-label-sm font-bold shadow-xs hover:bg-surface transition-colors shrink-0"
                >
                  View
                </button>
              </div>
            )}

            {/* Answer Choices Stack */}
            <section>
              <div className="flex items-center justify-between mb-1.5 px-0.5">
                <span className="font-label-md text-label-md text-secondary font-semibold">
                  Answer Choices
                </span>
                <span className="font-label-sm text-label-sm text-tertiary font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px]">check_circle</span>
                  Option {correctOptionId} marked correct
                </span>
              </div>

              <div className="flex flex-col gap-2">
                {(["A", "B", "C", "D"] as const).map((letter, idx) => {
                  const isCorrect = correctOptionId === letter;
                  return (
                    <div
                      key={letter}
                      onClick={() => setCorrectOptionId(letter)}
                      className={`group cursor-pointer rounded-xl p-3 flex items-center justify-between transition-all border ${
                        isCorrect
                          ? "bg-tertiary-container/15 border-tertiary text-on-surface shadow-xs"
                          : "bg-surface-container-low border-surface-container-high/40 text-on-surface hover:bg-surface-container"
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-full font-label-md text-label-md flex items-center justify-center shrink-0 font-bold transition-colors ${
                            isCorrect
                              ? "bg-tertiary text-on-tertiary shadow-xs"
                              : "bg-surface-container-highest text-secondary"
                          }`}
                        >
                          {letter}
                        </div>
                        <input
                          type="text"
                          value={options[idx]}
                          onChange={(e) => handleOptionChange(idx, e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          placeholder={`Enter option ${letter}...`}
                          className="bg-transparent font-body-lg text-body-lg text-on-surface focus:outline-none w-full"
                        />
                      </div>

                      <div className="flex items-center pl-2 shrink-0">
                        {isCorrect ? (
                          <span className="flex items-center gap-1 text-tertiary font-label-sm text-label-sm font-bold">
                            <span className="material-symbols-outlined text-[18px]">check_circle</span>
                            <span>Correct</span>
                          </span>
                        ) : (
                          <span className="material-symbols-outlined text-[18px] text-secondary opacity-50 group-hover:opacity-100 transition-opacity">
                            radio_button_unchecked
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="font-body-sm text-body-sm text-secondary mt-1.5 px-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px] text-primary">touch_app</span>
                <span>Tap any option row to mark it as the correct answer.</span>
              </p>
            </section>

            {/* Explanation Field (Optional) */}
            <section className="bg-surface-container-low rounded-xl p-3 border border-surface-container-high/40">
              <label className="font-label-md text-label-md text-secondary flex items-center gap-1 font-semibold mb-1">
                <span className="material-symbols-outlined text-[16px] text-primary">lightbulb</span>
                <span>Quick Explanation / Proof (Optional)</span>
              </label>
              <textarea
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="Include key formula, shortcut, or reason for students..."
                rows={2}
                className="w-full bg-transparent font-body-md text-body-md text-on-surface focus:outline-none resize-none"
              />
            </section>

            {/* Error Message Banner */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-error-container text-on-error-container text-label-md font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">error</span>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Publish Button */}
            <section className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || duplicateResult?.is_exact_duplicate}
                className={`w-full h-14 rounded-2xl font-label-lg text-label-lg shadow-md transition-all flex items-center justify-center gap-2 ${
                  duplicateResult?.is_exact_duplicate
                    ? "bg-surface-container text-secondary cursor-not-allowed"
                    : "bg-primary-container text-on-primary hover:bg-primary active:scale-98"
                }`}
              >
                <span className="material-symbols-outlined text-[22px]">rocket_launch</span>
                <span>
                  {isSubmitting
                    ? "Publishing..."
                    : isCheckingDuplicate
                    ? "Checking Duplicates..."
                    : "Publish Question"}
                </span>
              </button>
              <p className="text-center font-label-sm text-label-sm text-secondary mt-2">
                Subject to peer verification before live mock tests
              </p>
            </section>
          </form>
        )}
      </div>

      {/* Duplicate Details Modal */}
      {showDuplicateModal && duplicateResult?.matched_question && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/40 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm bg-surface-container-lowest rounded-2xl p-5 shadow-xl border border-surface-container-high/50 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
                Existing Match Found
              </span>
              <button
                onClick={() => setShowDuplicateModal(false)}
                className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-secondary"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high/40 flex flex-col gap-2">
              <span className="font-label-sm text-label-sm text-secondary uppercase font-bold">
                {duplicateResult.matched_question.subject_name || "General"}
              </span>
              <p className="font-headline-sm text-headline-sm text-on-surface">
                {duplicateResult.matched_question.question_text}
              </p>
              <div className="flex items-center gap-2 text-secondary font-label-sm text-label-sm">
                <span>By {duplicateResult.matched_question.author_name || "Rahul S."}</span>
                <span>·</span>
                <span>{duplicateResult.matched_question.total_attempts} attempts</span>
                <span>·</span>
                <span>{duplicateResult.matched_question.accuracy_percentage}% accuracy</span>
              </div>
            </div>

            <p className="font-body-sm text-body-sm text-secondary">
              To keep practice feeds high quality, identical questions are merged.
            </p>

            <button
              onClick={() => {
                setShowDuplicateModal(false);
                router.push("/");
              }}
              className="w-full py-2.5 rounded-xl bg-primary text-on-primary font-label-md text-label-md font-bold shadow-sm"
            >
              View Existing in Feed
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

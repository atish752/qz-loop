"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { TopHeader } from "../layout/TopHeader";
import { DuplicateCheckResult, Question, UserProfile } from "@/types/database";
import { formatWhatsAppChallenge, openWhatsAppShare, OFFICIAL_WHATSAPP_GROUP_URL } from "@/lib/utils/whatsapp";
import { getExamScoringRule } from "@/lib/utils/examScoring";
import { getTopicsForSubject } from "@/lib/data/topics";
import { useAppLanguage } from "@/lib/utils/i18n";
import { QuestionScanner } from "./QuestionScanner";
import { ParsedQuestion } from "@/lib/utils/ocrParser";
import { detectTopicAndSyllabus } from "@/lib/utils/topicDetector";

export const EXAMS_LIST = [
  { id: "exam-railway-ntpc", name: "Railways (RRB NTPC & Group D)", shortName: "Railways RRB" },
  { id: "exam-ssc-cgl", name: "SSC CGL / CHSL / MTS", shortName: "SSC CGL" },
  { id: "exam-neet-ug", name: "NEET UG (Medical Entrance)", shortName: "NEET UG" },
  { id: "exam-cuet-ug", name: "CUET UG (Central Universities)", shortName: "CUET UG" },
  { id: "exam-jee-main", name: "JEE Main (Engineering Entrance)", shortName: "JEE Main" },
  { id: "exam-banking-ibps", name: "Banking (IBPS / SBI PO & Clerk)", shortName: "Banking IBPS" },
  { id: "exam-state-police", name: "State Police / Constable & SI (UP/Bihar/MP)", shortName: "State Police" },
  { id: "exam-state-pcs", name: "State PCS (BPSC, UPPSC, MPPSC)", shortName: "State PCS" },
  { id: "exam-defence-cds", name: "Defence (NDA / CDS / AFCAT)", shortName: "Defence CDS" },
  { id: "exam-upsc-csat", name: "UPSC Civil Services (IAS / IPS Prelims)", shortName: "UPSC Civil Services" },
];

export const EXAM_SUBJECTS_MAP: Record<
  string,
  { id: string; name: string; icon: string; slug: string }[]
> = {
  "exam-railway-ntpc": [
    { id: "subj-rrb-maths", name: "General Mathematics", icon: "calculate", slug: "maths" },
    { id: "subj-rrb-reasoning", name: "General Intelligence & Reasoning", icon: "psychology", slug: "reasoning" },
    { id: "subj-rrb-science", name: "General Science", icon: "science", slug: "science" },
    { id: "subj-rrb-gk", name: "General Awareness & Current Affairs", icon: "public", slug: "gk" },
  ],
  "exam-ssc-cgl": [
    { id: "subj-maths", name: "Quantitative Aptitude", icon: "calculate", slug: "maths" },
    { id: "subj-reasoning", name: "General Intelligence & Reasoning", icon: "psychology", slug: "reasoning" },
    { id: "subj-english", name: "English Comprehension", icon: "spellcheck", slug: "english" },
    { id: "subj-gk", name: "General Awareness (Polity & GK)", icon: "public", slug: "gk" },
  ],
  "exam-neet-ug": [
    { id: "subj-neet-bio", name: "Biology (Botany & Zoology)", icon: "eco", slug: "biology" },
    { id: "subj-neet-chem", name: "Chemistry", icon: "biotech", slug: "chemistry" },
    { id: "subj-neet-phy", name: "Physics", icon: "bolt", slug: "physics" },
  ],
  "exam-cuet-ug": [
    { id: "subj-cuet-gt", name: "General Test (Quant, Logic & GK)", icon: "auto_awesome", slug: "gk" },
    { id: "subj-cuet-eng", name: "English Language", icon: "spellcheck", slug: "english" },
    { id: "subj-cuet-domain", name: "Domain Knowledge", icon: "menu_book", slug: "domain" },
  ],
  "exam-jee-main": [
    { id: "subj-jee-maths", name: "Mathematics", icon: "calculate", slug: "maths" },
    { id: "subj-jee-physics", name: "Physics", icon: "bolt", slug: "physics" },
    { id: "subj-jee-chemistry", name: "Chemistry", icon: "science", slug: "chemistry" },
  ],
  "exam-banking-ibps": [
    { id: "subj-bank-quant", name: "Quantitative Aptitude & DI", icon: "calculate", slug: "maths" },
    { id: "subj-bank-reasoning", name: "Reasoning Ability & Puzzles", icon: "psychology", slug: "reasoning" },
    { id: "subj-bank-english", name: "English Language & Grammar", icon: "spellcheck", slug: "english" },
    { id: "subj-bank-ga", name: "Banking & Financial Awareness", icon: "account_balance", slug: "gk" },
  ],
  "exam-state-police": [
    { id: "subj-pol-gk", name: "General Knowledge & Law/Constitution", icon: "shield", slug: "gk" },
    { id: "subj-pol-num", name: "Numerical & Mental Ability", icon: "calculate", slug: "maths" },
    { id: "subj-pol-reas", name: "Mental Aptitude & Reasoning", icon: "psychology", slug: "reasoning" },
    { id: "subj-pol-hindi", name: "General Hindi (सामान्य हिन्दी)", icon: "translate", slug: "hindi" },
  ],
  "exam-state-pcs": [
    { id: "subj-pcs-gs", name: "General Studies Paper-I", icon: "public", slug: "gk" },
    { id: "subj-pcs-csat", name: "General Mental Ability (CSAT)", icon: "psychology", slug: "reasoning" },
    { id: "subj-pcs-state", name: "State Special GK & History", icon: "map", slug: "state-gk" },
    { id: "subj-pcs-hindi", name: "General Hindi & Essay", icon: "translate", slug: "hindi" },
  ],
  "exam-defence-cds": [
    { id: "subj-def-maths", name: "Elementary Mathematics", icon: "calculate", slug: "maths" },
    { id: "subj-def-english", name: "English Comprehension", icon: "spellcheck", slug: "english" },
    { id: "subj-def-gk", name: "General Knowledge & Defence", icon: "military_tech", slug: "gk" },
    { id: "subj-def-science", name: "General Science", icon: "science", slug: "science" },
  ],
  "exam-upsc-csat": [
    { id: "subj-upsc-gs", name: "General Studies Paper-I", icon: "account_balance", slug: "gk" },
    { id: "subj-upsc-csat", name: "CSAT Paper-II (Reasoning)", icon: "psychology", slug: "reasoning" },
    { id: "subj-upsc-ca", name: "Current Affairs & Environment", icon: "eco", slug: "current-affairs" },
  ],
};

const LOCAL_STORAGE_DRAFT_KEY = "qz_loop_question_draft";

export const CreateQuestionView: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams ? searchParams.get("edit") : null;
  const { lang, t } = useAppLanguage();

  // User & Auth State
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  useEffect(() => {
    const checkAuth = () => {
      if (typeof window !== "undefined") {
        const uid = localStorage.getItem("qz_user_id");
        setIsLoggedIn(Boolean(uid));
        if (uid) {
          fetch(`/api/profile?userId=${encodeURIComponent(uid)}`)
            .then((r) => r.json())
            .then((d) => {
              if (d.success && d.user) setUser(d.user);
            })
            .catch(() => {});
        } else {
          setUser(null);
        }
      }
    };
    checkAuth();
    window.addEventListener("qz_auth_changed", checkAuth);
    return () => window.removeEventListener("qz_auth_changed", checkAuth);
  }, []);

  // Form states - Auto defaults to user's preferred examination from profile or persistent storage
  const [selectedExamId, setSelectedExamId] = useState<string>("exam-neet-ug");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("subj-neet-bio");
  const [targetTopic, setTargetTopic] = useState<string>("Genetics and Evolution");
  const [customTopic, setCustomTopic] = useState<string>("");
  const [syllabusTag, setSyllabusTag] = useState<string>("");
  const [pyqInfo, setPyqInfo] = useState<string>("");
  const [questionText, setQuestionText] = useState<string>("");
  const [hindiQuestionText, setHindiQuestionText] = useState<string>("");
  const [language, setLanguage] = useState<"en" | "hi">("en");
  const [languageFormat, setLanguageFormat] = useState<"en" | "hi" | "bilingual">("en");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");

  const [options, setOptions] = useState<[string, string, string, string]>([
    "",
    "",
    "",
    "",
  ]);
  const [hindiOptions, setHindiOptions] = useState<[string, string, string, string]>([
    "",
    "",
    "",
    "",
  ]);
  const [correctOptionId, setCorrectOptionId] = useState<string>("A");
  const [explanation, setExplanation] = useState<string>("");
  const [hindiExplanation, setHindiExplanation] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [previewLanguage, setPreviewLanguage] = useState<"en" | "hi">("en");
  const [creationMethod, setCreationMethod] = useState<"manual" | "scan">("manual");
  const [scanSuccessNotice, setScanSuccessNotice] = useState<string | null>(null);
  const [autoDetectedNotice, setAutoDetectedNotice] = useState<string | null>(null);

  // Target examination automatically bound from user profile or persistent storage
  const persistentExamId =
    (typeof window !== "undefined"
      ? localStorage.getItem("qz_target_exam") || localStorage.getItem("qz_last_exam")
      : null) || null;
  const effectiveExamId = user?.preferred_examination_id || persistentExamId || selectedExamId || "exam-neet-ug";
  const currentExamObj = EXAMS_LIST.find((e) => e.id === effectiveExamId) || EXAMS_LIST[2] || EXAMS_LIST[0];
  const currentExamSubjects = EXAM_SUBJECTS_MAP[effectiveExamId] || EXAM_SUBJECTS_MAP["exam-neet-ug"];
  const currentSubjectObj = currentExamSubjects.find((s) => s.id === selectedSubjectId) || currentExamSubjects[0];
  const dynamicTopics = getTopicsForSubject(currentSubjectObj?.slug, currentSubjectObj?.name);
  const effectiveDynamicTopics = React.useMemo(() => {
    if (targetTopic && targetTopic !== "Others" && !dynamicTopics.includes(targetTopic)) {
      const idx = dynamicTopics.indexOf("Others");
      if (idx !== -1) {
        return [...dynamicTopics.slice(0, idx), targetTopic, ...dynamicTopics.slice(idx)];
      }
      return [...dynamicTopics, targetTopic];
    }
    return dynamicTopics;
  }, [dynamicTopics, targetTopic]);

  // Live Debounced Keyword & Topic Auto-Detection when typing or editing
  const lastAutoDetectedTextRef = useRef<string>("");
  const autoDetectTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const textToAnalyze = (questionText + " " + hindiQuestionText).trim();
    if (textToAnalyze.length < 6) return;
    if (textToAnalyze === lastAutoDetectedTextRef.current) return;

    if (autoDetectTimerRef.current) {
      clearTimeout(autoDetectTimerRef.current);
    }

    autoDetectTimerRef.current = setTimeout(() => {
      lastAutoDetectedTextRef.current = textToAnalyze;
      const detected = detectTopicAndSyllabus(textToAnalyze);

      if (detected.detectedTopic || detected.detectedSyllabusTag || detected.detectedSubjectSlug) {
        if (detected.detectedTopic) {
          setTargetTopic(detected.detectedTopic);
        }
        if (detected.detectedSyllabusTag && !syllabusTag) {
          setSyllabusTag(detected.detectedSyllabusTag);
        }
        if (detected.detectedPyqInfo && !pyqInfo) {
          setPyqInfo(detected.detectedPyqInfo);
        }
        if (detected.detectedSubjectSlug) {
          const matchSub = currentExamSubjects.find((s) => s.slug === detected.detectedSubjectSlug);
          if (matchSub) {
            setSelectedSubjectId(matchSub.id);
          }
        }
        setAutoDetectedNotice(
          `✨ Auto-detected: ${detected.detectedTopic || ""} ${detected.detectedSyllabusTag ? `(${detected.detectedSyllabusTag})` : ""}`
        );
      }
    }, 400);

    return () => {
      if (autoDetectTimerRef.current) {
        clearTimeout(autoDetectTimerRef.current);
      }
    };
  }, [questionText, hindiQuestionText, currentExamSubjects, syllabusTag, pyqInfo]);

  const handleParsedQuestion = useCallback((parsed: ParsedQuestion) => {
    const isHindiText = /[\u0900-\u097F]/.test(parsed.questionText) || lang === "hi";
    if (parsed.questionText) {
      setQuestionText(parsed.questionText);
      if (isHindiText) {
        setHindiQuestionText(parsed.questionText);
      }
    }
    if (parsed.options && parsed.options.length >= 4) {
      setOptions(parsed.options);
      if (isHindiText) {
        setHindiOptions(parsed.options);
      }
    }
    if (parsed.correctOptionId) {
      setCorrectOptionId(parsed.correctOptionId);
    }
    if (parsed.explanation) {
      setExplanation(parsed.explanation);
      if (isHindiText) {
        setHindiExplanation(parsed.explanation);
      }
    }

    // Smart keyword & topic auto-detection
    const detected = detectTopicAndSyllabus(parsed.questionText);
    if (detected.detectedTopic) {
      setTargetTopic(detected.detectedTopic);
    }
    if (detected.detectedSyllabusTag) {
      setSyllabusTag(detected.detectedSyllabusTag);
    }
    if (detected.detectedPyqInfo) {
      setPyqInfo(detected.detectedPyqInfo);
    }
    if (detected.detectedSubjectSlug) {
      const matchSub = currentExamSubjects.find((s) => s.slug === detected.detectedSubjectSlug);
      if (matchSub) {
        setSelectedSubjectId(matchSub.id);
      }
    }
    if (detected.detectedTopic || detected.detectedSyllabusTag) {
      setAutoDetectedNotice(
        `✨ Auto-detected: ${detected.detectedTopic || ""} ${detected.detectedSyllabusTag ? `(${detected.detectedSyllabusTag})` : ""}`
      );
    }

    setScanSuccessNotice(
      lang === "hi"
        ? "प्रश्न और 4 विकल्प स्वचालित रूप से भर गए हैं! सही विकल्प जांचें और प्रकाशित करें।"
        : "Question and 4 options populated! Select the correct option and publish."
    );
    setTimeout(() => setScanSuccessNotice(null), 6000);
  }, [lang, currentExamSubjects]);

  // Edit Mode state
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [isLoadingEdit, setIsLoadingEdit] = useState<boolean>(false);

  // Duplicate check state
  const [duplicateResult, setDuplicateResult] = useState<DuplicateCheckResult | null>(null);
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState<boolean>(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState<boolean>(false);

  // Draft state
  const [hasRestorableDraft, setHasRestorableDraft] = useState<boolean>(false);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const isInitialMount = useRef(true);

  // Submission & WhatsApp Share state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [publishSuccess, setPublishSuccess] = useState<boolean>(false);
  const [publishedQuestion, setPublishedQuestion] = useState<Question | null>(null);
  const [shareCopied, setShareCopied] = useState<boolean>(false);

  // 1. Fetch Question Data if editing
  useEffect(() => {
    if (!editId) {
      // Check if draft exists
      if (typeof window !== "undefined") {
        const savedDraft = localStorage.getItem(LOCAL_STORAGE_DRAFT_KEY);
        if (savedDraft) {
          try {
            const parsed = JSON.parse(savedDraft);
            if (parsed.questionText || parsed.options?.some((o: string) => o.trim())) {
              setHasRestorableDraft(true);
              setDraftSavedAt(parsed.savedAt || "recently");
            }
          } catch {
            // ignore
          }
        }
      }
      return;
    }

    setIsEditMode(true);
    setIsLoadingEdit(true);

    fetch(`/api/questions/${editId}?edit=true`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.question) {
          const q: Question = data.question;
          if (q.examination_id) setSelectedExamId(q.examination_id);
          setSelectedSubjectId(q.subject_id || "subj-gk");
          setQuestionText(q.question_text || "");
          setHindiQuestionText(q.hindi_question_text || "");
          setLanguage(q.language || "en");
          setDifficulty(q.difficulty || "medium");
          setExplanation(q.explanation || "");
          setHindiExplanation(q.hindi_explanation || "");
          setSyllabusTag(q.syllabus_tag || "");
          setPyqInfo(q.pyq_info || "");
          if (q.options && q.options.length >= 4) {
            setOptions([
              q.options[0]?.text || "",
              q.options[1]?.text || "",
              q.options[2]?.text || "",
              q.options[3]?.text || "",
            ]);
            setHindiOptions([
              q.options[0]?.hindi_text || "",
              q.options[1]?.hindi_text || "",
              q.options[2]?.hindi_text || "",
              q.options[3]?.hindi_text || "",
            ]);
          }
          if (q.correct_option_id) {
            setCorrectOptionId(q.correct_option_id);
          }
        } else {
          setErrorMsg(data.error || "Failed to load question for editing");
        }
      })
      .catch((err) => {
        setErrorMsg(err.message || "Failed to load question for editing");
      })
      .finally(() => {
        setIsLoadingEdit(false);
      });
  }, [editId]);

  // 2. Draft Autosaving (Debounced)
  const saveDraft = useCallback(() => {
    if (isEditMode) return;
    if (typeof window === "undefined") return;

    const draft = {
      selectedExamId,
      selectedSubjectId,
      targetTopic,
      syllabusTag,
      pyqInfo,
      questionText,
      hindiQuestionText,
      language,
      difficulty,
      options,
      hindiOptions,
      correctOptionId,
      explanation,
      hindiExplanation,
      savedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    localStorage.setItem(LOCAL_STORAGE_DRAFT_KEY, JSON.stringify(draft));
    setDraftSavedAt(draft.savedAt);
  }, [
    isEditMode,
    selectedExamId,
    selectedSubjectId,
    targetTopic,
    syllabusTag,
    pyqInfo,
    questionText,
    hindiQuestionText,
    language,
    difficulty,
    options,
    hindiOptions,
    correctOptionId,
    explanation,
    hindiExplanation,
  ]);

  // Sync exam & subjects from user profile or localStorage automatically
  useEffect(() => {
    const syncExam = () => {
      let activeId = user?.preferred_examination_id;
      if (!activeId && typeof window !== "undefined") {
        activeId = localStorage.getItem("qz_target_exam") || localStorage.getItem("qz_last_exam") || undefined;
      }
      if (!activeId) activeId = "exam-neet-ug";

      setSelectedExamId(activeId);
      const subjs = EXAM_SUBJECTS_MAP[activeId] || EXAM_SUBJECTS_MAP["exam-neet-ug"];
      if (subjs && subjs.length > 0) {
        setSelectedSubjectId((prev) => {
          const valid = subjs.some((s) => s.id === prev);
          return valid ? prev : subjs[0].id;
        });
      }
    };

    syncExam();
    window.addEventListener("qz_exam_changed", syncExam);
    window.addEventListener("qz_auth_changed", syncExam);

    if (user?.language_preference === "hi") {
      setLanguageFormat("hi");
      setLanguage("hi");
    }

    return () => {
      window.removeEventListener("qz_exam_changed", syncExam);
      window.removeEventListener("qz_auth_changed", syncExam);
    };
  }, [user]);

  // Keep targetTopic in sync with dynamic topics whenever subject changes
  useEffect(() => {
    if (dynamicTopics.length > 0 && !dynamicTopics.includes(targetTopic)) {
      setTargetTopic(dynamicTopics[0]);
    }
  }, [dynamicTopics, targetTopic]);

  const handleSubjectSelect = (subId: string) => {
    setSelectedSubjectId(subId);
    const sub = currentExamSubjects.find((s) => s.id === subId);
    const topics = getTopicsForSubject(sub?.slug, sub?.name);
    if (topics.length > 0) {
      setTargetTopic(topics[0]);
    }
  };

  const handleExamChange = (examId: string) => {
    setSelectedExamId(examId);
    const subjs = EXAM_SUBJECTS_MAP[examId] || EXAM_SUBJECTS_MAP["exam-railway-ntpc"];
    if (subjs && subjs.length > 0) {
      setSelectedSubjectId(subjs[0].id);
      const topics = getTopicsForSubject(subjs[0].slug, subjs[0].name);
      if (topics.length > 0) {
        setTargetTopic(topics[0]);
      }
    }
  };

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (isEditMode) return;

    const timer = setTimeout(() => {
      if (questionText.trim().length > 3 || options.some((o) => o.trim())) {
        saveDraft();
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [questionText, options, explanation, hindiQuestionText, hindiOptions, hindiExplanation, saveDraft, isEditMode]);

  const handleRestoreDraft = () => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem(LOCAL_STORAGE_DRAFT_KEY);
    if (!raw) return;
    try {
      const draft = JSON.parse(raw);
      if (draft.selectedExamId) setSelectedExamId(draft.selectedExamId);
      if (draft.selectedSubjectId) setSelectedSubjectId(draft.selectedSubjectId);
      if (draft.targetTopic) setTargetTopic(draft.targetTopic);
      if (draft.syllabusTag) setSyllabusTag(draft.syllabusTag);
      if (draft.pyqInfo) setPyqInfo(draft.pyqInfo);
      if (draft.questionText) setQuestionText(draft.questionText);
      if (draft.hindiQuestionText) setHindiQuestionText(draft.hindiQuestionText);
      if (draft.language) setLanguage(draft.language);
      if (draft.difficulty) setDifficulty(draft.difficulty);
      if (draft.options) setOptions(draft.options);
      if (draft.hindiOptions) setHindiOptions(draft.hindiOptions);
      if (draft.correctOptionId) setCorrectOptionId(draft.correctOptionId);
      if (draft.explanation) setExplanation(draft.explanation);
      if (draft.hindiExplanation) setHindiExplanation(draft.hindiExplanation);
      setHasRestorableDraft(false);
    } catch {
      // ignore
    }
  };

  const handleDiscardDraft = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(LOCAL_STORAGE_DRAFT_KEY);
    }
    setHasRestorableDraft(false);
    setDraftSavedAt(null);
  };

  // 3. Quality & Engagement score calculation
  const calculateQualityScore = () => {
    let score = 30;
    if (questionText.trim().length >= 25) score += 20;
    if (options.every((o) => o.trim().length > 0)) score += 20;
    if (explanation.trim().length >= 15) score += 15;
    if (hindiQuestionText.trim().length >= 15) score += 10;
    if (syllabusTag.trim().length > 0 || pyqInfo.trim().length > 0) score += 5;
    return Math.min(100, score);
  };

  // 4. Debounced duplicate detection
  const checkDuplicateQuestion = useCallback(async (text: string) => {
    if (!text || text.trim().length < 8 || isEditMode) {
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
  }, [isEditMode]);

  useEffect(() => {
    const timer = setTimeout(() => {
      checkDuplicateQuestion(questionText);
      const textToAnalyze = questionText.trim() || hindiQuestionText.trim();
      if (textToAnalyze.length >= 8 && !isEditMode) {
        const detected = detectTopicAndSyllabus(textToAnalyze);
        if (detected.detectedTopic) {
          setTargetTopic((prev) => (!prev || prev === "Genetics and Evolution" || prev === "Percentage, Profit & Loss" || dynamicTopics.includes(detected.detectedTopic!) ? detected.detectedTopic! : prev));
        }
        if (detected.detectedSyllabusTag) {
          setSyllabusTag((prev) => (!prev ? detected.detectedSyllabusTag! : prev));
        }
        if (detected.detectedPyqInfo) {
          setPyqInfo((prev) => (!prev ? detected.detectedPyqInfo! : prev));
        }
        if (detected.detectedSubjectSlug) {
          const matchSub = currentExamSubjects.find((s) => s.slug === detected.detectedSubjectSlug);
          if (matchSub) {
            setSelectedSubjectId(matchSub.id);
          }
        }
        if (detected.detectedTopic || detected.detectedSyllabusTag) {
          setAutoDetectedNotice(
            `✨ Auto-detected: ${detected.detectedTopic || ""} ${detected.detectedSyllabusTag ? `(${detected.detectedSyllabusTag})` : ""}`
          );
        }
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [questionText, hindiQuestionText, checkDuplicateQuestion, isEditMode, currentExamSubjects, dynamicTopics]);

  const handleOptionChange = (index: number, val: string) => {
    const updated: [string, string, string, string] = [...options];
    updated[index] = val;
    setOptions(updated);
  };

  const handleHindiOptionChange = (index: number, val: string) => {
    const updated: [string, string, string, string] = [...hindiOptions];
    updated[index] = val;
    setHindiOptions(updated);
  };

  // 5. Submit Form (Create or Update)
  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Ensure student has a persistent ID (or create guest ID) so question authoring is fully functional
    let uid = user?.id || (typeof window !== "undefined" ? localStorage.getItem("qz_user_id") : null);
    if (!uid && typeof window !== "undefined") {
      uid = "usr-aspirant-" + Math.random().toString(36).substring(2, 9);
      localStorage.setItem("qz_user_id", uid);
      document.cookie = `qz_user_id=${uid}; path=/; max-age=2592000; SameSite=Lax`;
    }

    const isHindiOnly = languageFormat === "hi";

    if (isHindiOnly) {
      if (!hindiQuestionText.trim()) {
        setErrorMsg(lang === "hi" ? "कृपया प्रश्न का विवरण दर्ज करें" : "Please enter the Hindi question statement");
        return;
      }
      if (hindiOptions.some((opt) => !opt.trim())) {
        setErrorMsg(lang === "hi" ? "कृपया सभी 4 विकल्प भरें" : "Please fill in all 4 Hindi answer choices");
        return;
      }
    } else {
      if (!questionText.trim()) {
        setErrorMsg(lang === "hi" ? "कृपया प्रश्न का विवरण दर्ज करें" : "Please enter the question statement");
        return;
      }
      if (options.some((opt) => !opt.trim())) {
        setErrorMsg(lang === "hi" ? "कृपया सभी 4 विकल्प भरें" : "Please fill in all 4 answer options");
        return;
      }
    }

    const effectiveQText = (isHindiOnly ? hindiQuestionText : questionText).trim();
    if (effectiveQText.length > 600) {
      setErrorMsg(lang === "hi" ? "प्रश्न विवरण 600 अक्षरों से अधिक नहीं हो सकता" : "Question statement cannot exceed 600 characters");
      return;
    }

    if (!isEditMode && duplicateResult?.is_exact_duplicate) {
      setErrorMsg("This exact question already exists in Qz Loop. Exact duplicates cannot be republished.");
      return;
    }

    setIsSubmitting(true);
    try {
      const formattedOptions = [
        {
          id: "A",
          text: (isHindiOnly ? hindiOptions[0] : options[0]).trim(),
          hindi_text: hindiOptions[0]?.trim() || undefined,
        },
        {
          id: "B",
          text: (isHindiOnly ? hindiOptions[1] : options[1]).trim(),
          hindi_text: hindiOptions[1]?.trim() || undefined,
        },
        {
          id: "C",
          text: (isHindiOnly ? hindiOptions[2] : options[2]).trim(),
          hindi_text: hindiOptions[2]?.trim() || undefined,
        },
        {
          id: "D",
          text: (isHindiOnly ? hindiOptions[3] : options[3]).trim(),
          hindi_text: hindiOptions[3]?.trim() || undefined,
        },
      ];

      const uid = user?.id || (typeof window !== "undefined" ? localStorage.getItem("qz_user_id") : null);
      const effectiveTopic = targetTopic === "Others" && customTopic.trim() ? customTopic.trim() : targetTopic.trim();

      const payload = {
        examinationId: effectiveExamId,
        subjectId: currentSubjectObj.id,
        questionText: (isHindiOnly ? hindiQuestionText : questionText).trim(),
        hindiQuestionText: hindiQuestionText.trim() || undefined,
        language: isHindiOnly ? "hi" : "en",
        options: formattedOptions,
        correctOptionId,
        explanation: (isHindiOnly ? hindiExplanation : explanation).trim() || undefined,
        hindiExplanation: hindiExplanation.trim() || undefined,
        difficulty,
        syllabusTag: syllabusTag.trim() || undefined,
        targetTopic: effectiveTopic || undefined,
        pyqInfo: pyqInfo.trim() || undefined,
        authorId: uid || undefined,
      };

      const url = isEditMode ? `/api/questions/${editId}` : "/api/questions/create";
      const method = isEditMode ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(uid ? { "x-user-id": uid } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setPublishedQuestion(data.question);
        setPublishSuccess(true);
        if (typeof window !== "undefined") {
          localStorage.removeItem(LOCAL_STORAGE_DRAFT_KEY);
          try {
            const raw = localStorage.getItem("qz_local_authored_questions");
            const list: Question[] = raw ? JSON.parse(raw) : [];
            const existingIdx = list.findIndex((q) => q.id === data.question.id);
            if (existingIdx >= 0) {
              list[existingIdx] = data.question;
            } else {
              list.unshift(data.question);
            }
            localStorage.setItem("qz_local_authored_questions", JSON.stringify(list));
          } catch {
            // ignore
          }
          window.dispatchEvent(
            new CustomEvent("qz_question_created", { detail: { question: data.question } })
          );
        }
      } else {
        setErrorMsg(data.error || "Failed to save question");
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Network error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShareToWhatsApp = () => {
    if (!publishedQuestion) return;
    const examObj = EXAMS_LIST.find((e) => e.id === (publishedQuestion.examination_id || selectedExamId));
    const challengeText = formatWhatsAppChallenge({
      question: publishedQuestion,
      authorUsername: publishedQuestion.author_name?.toLowerCase().replace(/\s+/g, "_"),
      targetExam: `${examObj?.shortName || "SSC CGL"} · ${publishedQuestion.subject_name || "General"}`,
      language: publishedQuestion.language,
    });
    openWhatsAppShare(challengeText);
  };

  const handleCopyChallenge = () => {
    if (!publishedQuestion || typeof window === "undefined") return;
    const examObj = EXAMS_LIST.find((e) => e.id === (publishedQuestion.examination_id || selectedExamId));
    const challengeText = formatWhatsAppChallenge({
      question: publishedQuestion,
      authorUsername: publishedQuestion.author_name?.toLowerCase().replace(/\s+/g, "_"),
      targetExam: `${examObj?.shortName || "SSC CGL"} · ${publishedQuestion.subject_name || "General"}`,
      language: publishedQuestion.language,
    });
    if (navigator.clipboard) {
      navigator.clipboard.writeText(challengeText);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    }
  };

  if (isLoadingEdit) {
    return (
      <div className="flex flex-col min-h-screen">
        <TopHeader
          currentTab="create"
          streakDays={isLoggedIn ? (user?.current_streak ?? 0) : 0}
          activeExamName={user?.target_exam || "Railways RRB"}
          user={isLoggedIn ? user : null}
        />
        <div className="flex-1 flex items-center justify-center p-8 text-secondary">
          <span className="material-symbols-outlined animate-spin text-[32px] text-primary">sync</span>
          <span className="ml-2 font-medium">{t.loadingQuestionDetails || "Loading question details..."}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen pb-24">
      <TopHeader
        currentTab="create"
        streakDays={isLoggedIn ? (user?.current_streak ?? 0) : 0}
        activeExamName={user?.target_exam || "Railways RRB"}
        user={isLoggedIn ? user : null}
      />

      <div className="flex flex-col w-full px-4 pt-3 pb-8">
        {/* Guest Visitor Banner if not logged in */}
        {!isLoggedIn && (
          <div className="rounded-2xl p-4 bg-surface-container-low border border-primary/20 shadow-xs mb-4 flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-container text-on-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">edit_note</span>
              </div>
              <div className="flex flex-col min-w-0">
                <h3 className="font-bold text-on-surface text-base">{t.creatorStudioGuestTitle || "Creator Studio"}</h3>
                <p className="text-xs text-secondary mt-0.5 leading-relaxed">
                  {t.creatorStudioGuestDesc || "Sign in or create your free account to publish verified MCQs, share shortcut tricks, and contribute to the community feed."}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  window.dispatchEvent(
                    new CustomEvent("open_auth_modal", {
                      detail: { reason: "Sign in to publish questions & earn community badges", mode: "signup" },
                    })
                  );
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-primary text-on-primary font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs hover:bg-primary-container active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-[16px]">login</span>
                <span>{t.signInToPublish || "Sign In / Sign Up to Publish"}</span>
              </button>
            </div>
          </div>
        )}

        {/* Creator Studio Form Area (Locked & Blurred for Guests) */}
        <div className="relative my-1">
          <div className={!isLoggedIn ? "filter blur-md select-none pointer-events-none opacity-40 transition-all" : ""}>
            {publishSuccess ? (
          <div className="py-8 flex flex-col items-center justify-center text-center gap-4 animate-in fade-in max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-[36px]">
                {isEditMode ? "check_circle" : "rocket_launch"}
              </span>
            </div>
            <h2 className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-on-surface">
              {isEditMode ? (t.questionUpdatedTitle || "Question Updated!") : (t.publishedSuccess || "Question Published!")}
            </h2>
            <p className="font-body-md text-body-md text-secondary">
              {isEditMode
                ? (t.questionUpdatedDesc || "Your question revisions and bilingual solutions have been saved.")
                : (t.questionPublishedDesc || "Your question is now live in the community feed for competitive aspirants.")}
            </p>

            {/* Direct WhatsApp Challenge Sharing Card */}
            <div className="w-full bg-[#25D366]/10 border border-[#25D366]/30 rounded-2xl p-4 flex flex-col gap-3 my-2 text-left">
              <div className="flex items-center gap-2 text-[#25D366] font-bold text-sm">
                <span className="material-symbols-outlined text-[20px]">share</span>
                <span>{t.challengeWhatsAppTitle || "Challenge Aspirants on WhatsApp"}</span>
              </div>
              <p className="text-xs text-on-surface/80 leading-relaxed">
                {t.challengeWhatsAppDesc || "Post this formatted challenge directly to your Telegram or WhatsApp study groups to test your peers!"}
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleShareToWhatsApp}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-[#25D366] text-white font-bold text-xs shadow-sm hover:bg-[#20ba59] active:scale-95 transition-all flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[18px]">chat</span>
                  <span>{t.shareToWhatsAppBtn || "Share to WhatsApp"}</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyChallenge}
                  className="py-2.5 px-3 rounded-xl bg-surface-container font-semibold text-xs hover:bg-surface-container-high transition-colors text-on-surface flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">content_copy</span>
                  <span>{shareCopied ? (t.copied || "Copied!") : (t.copyText || "Copy Text")}</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-2 w-full">
              {!isEditMode && (
                <button
                  onClick={() => {
                    setPublishSuccess(false);
                    setPublishedQuestion(null);
                    setQuestionText("");
                    setHindiQuestionText("");
                    setOptions(["", "", "", ""]);
                    setHindiOptions(["", "", "", ""]);
                    setExplanation("");
                    setHindiExplanation("");
                    setSyllabusTag("");
                    setPyqInfo("");
                    setDuplicateResult(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-surface-container font-label-md text-label-md text-on-surface hover:bg-surface-container-high transition-colors"
                >
                  {t.addAnotherBtn || "Add Another"}
                </button>
              )}
              <button
                onClick={() => router.push("/loop")}
                className="flex-1 py-2.5 rounded-xl bg-primary text-on-primary font-label-md text-label-md font-bold shadow-sm hover:bg-primary-container transition-colors"
              >
                {t.goToFeedBtn || "Go to Quiz Loop"}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Draft Restore Notification Banner */}
            {hasRestorableDraft && !isEditMode && (
              <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-on-surface flex items-center justify-between gap-2 animate-in slide-in-from-top-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-[20px] shrink-0">
                    history_edu
                  </span>
                  <div className="text-xs min-w-0">
                    <span className="font-bold">{t.draftRestoredTitle || "Unfinished draft restored"}</span>
                    <span className="text-secondary block text-[11px] truncate">
                      {t.lastAutosavedAt || "Last autosaved at"} {draftSavedAt}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleRestoreDraft}
                    className="px-2.5 py-1 rounded-lg bg-amber-600 text-white font-bold text-xs hover:bg-amber-700 transition-colors"
                  >
                    {t.loadDraft || "Load Draft"}
                  </button>
                  <button
                    type="button"
                    onClick={handleDiscardDraft}
                    className="p-1 rounded-lg text-secondary hover:text-error transition-colors"
                    title="Discard draft"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                </div>
              </div>
            )}

            {/* Header info bar with Save Draft Button */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h1 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                  {isEditMode ? (t.editQuestionTitle || "Edit Question") : (t.createQuestionTitle || "Author New Question")}
                </h1>
                {isEditMode && (
                  <span className="px-2 py-0.5 rounded-full bg-primary-fixed text-primary text-[10px] font-bold">
                    ID: {editId}
                  </span>
                )}
              </div>
              {!isEditMode && (
                <div className="flex items-center gap-1.5 text-xs text-secondary">
                  {draftSavedAt && (
                    <span className="text-[11px] text-tertiary font-medium hidden sm:inline">
                      {t.autosavedLabel || "Autosaved"} {draftSavedAt}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={saveDraft}
                    className="px-2.5 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold text-xs flex items-center gap-1 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[14px]">save</span>
                    <span>{t.saveDraft || "Save Draft"}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Three-Way Unified Authoring Bar: Question Editor (Pencil only, minimal space) | Smart Scan Question (Middle, flexible space) | Live Reel Preview (Right, compact) */}
            <div className="flex items-center gap-1.5 p-1 bg-surface-container rounded-2xl shadow-xs h-12">
              {/* 1. Question Editor / Manual Entry (Pencil icon only, minimum space, default) */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab("edit");
                  setCreationMethod("manual");
                }}
                className={`h-full px-3.5 rounded-xl transition-all flex items-center justify-center shrink-0 ${
                  activeTab === "edit" && creationMethod === "manual"
                    ? "bg-primary text-on-primary shadow-xs"
                    : "text-secondary hover:text-on-surface hover:bg-surface-container-high/60"
                }`}
                title={lang === "hi" ? "1. मैन्युअल एंट्री (Question Editor)" : "1. Manual Entry (Question Editor)"}
                aria-label="1. Manual Entry"
              >
                <span className="material-symbols-outlined text-[20px]">edit</span>
              </button>

              {/* 2. Smart Scan Question (Middle, flexible more space, scanner icon) */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab("edit");
                  setCreationMethod("scan");
                }}
                className={`flex-1 h-full px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 min-w-0 ${
                  activeTab === "edit" && creationMethod === "scan"
                    ? "bg-primary text-on-primary shadow-xs"
                    : "text-secondary hover:text-on-surface hover:bg-surface-container-high/60"
                }`}
                title={lang === "hi" ? "2. स्मार्ट स्कैन (OCR)" : "2. Smart Scan Question"}
                aria-label="2. Smart Scan Question"
              >
                <span className="material-symbols-outlined text-[19px] shrink-0">document_scanner</span>
                <span className="truncate">{lang === "hi" ? "2. स्मार्ट स्कैन (OCR)" : "2. Smart Scan Question"}</span>
              </button>

              {/* 3. Live Reel Preview (Last, compact width, preview icon) */}
              <button
                type="button"
                onClick={() => setActiveTab("preview")}
                className={`h-full px-3 sm:px-3.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 ${
                  activeTab === "preview"
                    ? "bg-primary text-on-primary shadow-xs"
                    : "text-secondary hover:text-on-surface hover:bg-surface-container-high/60"
                }`}
                title={t.liveReelPreviewTab || "Live Reel Preview"}
                aria-label="Live Reel Preview"
              >
                <span className="material-symbols-outlined text-[19px]">all_inclusive</span>
                <span className="hidden xs:inline truncate">{lang === "hi" ? "पूर्वावलोकन" : "Preview"}</span>
              </button>
            </div>


            {activeTab === "preview" ? (
              /* Live Reel Preview Card */
              <div className="p-4 rounded-2xl bg-surface-container-lowest border border-surface-container-high/60 shadow-md flex flex-col gap-3 relative">
                <div className="flex items-center justify-between pb-2 border-b border-surface-container-high/40">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full bg-primary-fixed text-primary text-xs font-bold uppercase">
                      {(EXAM_SUBJECTS_MAP[selectedExamId] || EXAM_SUBJECTS_MAP["exam-ssc-cgl"]).find((s) => s.id === selectedSubjectId)?.name || "Subject"} · {targetTopic}
                    </span>
                    {syllabusTag && (
                      <span className="px-2 py-0.5 rounded-full bg-surface-container text-secondary text-[10px] font-bold">
                        {syllabusTag}
                      </span>
                    )}
                    {pyqInfo && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-200 text-[10px] font-bold">
                        {pyqInfo}
                      </span>
                    )}
                  </div>

                  {/* Toggle Preview English vs Hindi */}
                  <div className="flex items-center rounded-lg bg-surface-container p-0.5 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setPreviewLanguage("en")}
                      className={`px-2 py-0.5 rounded-md ${
                        previewLanguage === "en" ? "bg-primary text-on-primary" : "text-secondary"
                      }`}
                    >
                      EN
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewLanguage("hi")}
                      className={`px-2 py-0.5 rounded-md ${
                        previewLanguage === "hi" ? "bg-primary text-on-primary" : "text-secondary"
                      }`}
                    >
                      हिन्दी
                    </button>
                  </div>
                </div>

                <h3 className="text-base font-bold text-on-surface leading-snug">
                  {previewLanguage === "hi" && hindiQuestionText.trim()
                    ? hindiQuestionText
                    : (questionText.trim() || "Type your question statement in the editor to preview...")}
                </h3>

                <div className="flex flex-col gap-2 my-1">
                  {(["A", "B", "C", "D"] as const).map((letter, idx) => {
                    const optText =
                      previewLanguage === "hi" && hindiOptions[idx]?.trim()
                        ? hindiOptions[idx]
                        : options[idx];

                    return (
                      <div
                        key={letter}
                        className={`p-2.5 rounded-xl border flex items-center justify-between text-xs font-medium ${
                          correctOptionId === letter
                            ? "bg-emerald-500/20 border-emerald-600 text-emerald-950 dark:text-emerald-100 font-bold"
                            : "bg-surface-container-low border-surface-container-high/40 text-on-surface"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              correctOptionId === letter
                                ? "bg-emerald-600 text-white"
                                : "bg-surface-container text-secondary"
                            }`}
                          >
                            {letter}
                          </span>
                          <span>{optText || `Option ${letter}`}</span>
                        </div>
                        {correctOptionId === letter && (
                          <span className="text-emerald-600 font-bold">
                            ✓ Correct (+{getExamScoringRule(selectedExamId).marksPerCorrect.toFixed(2)})
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {((previewLanguage === "hi" && hindiExplanation.trim()) || explanation.trim()) && (
                  <div className="p-2.5 rounded-xl bg-surface-container-low text-xs text-on-surface border border-surface-container-high/40">
                    <strong className="text-primary font-bold">Quick Proof: </strong>
                    {previewLanguage === "hi" && hindiExplanation.trim()
                      ? hindiExplanation
                      : explanation}
                  </div>
                )}

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => setActiveTab("edit")}
                    className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-sm"
                  >
                    {t.backToEdit}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handlePublish} className="flex flex-col gap-4">
                {/* Smart OCR Scanner with Horizontal Camera Viewfinder (Mounted when in scan mode) */}
                {creationMethod === "scan" && (
                  <QuestionScanner
                    onParsedQuestion={handleParsedQuestion}
                    lang={lang}
                  />
                )}

                {/* Scan Success Notice */}
                {scanSuccessNotice && (
                  <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-950 dark:text-emerald-100 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                    <span className="material-symbols-outlined text-[20px] text-emerald-600 shrink-0">check_circle</span>
                    <span>{scanSuccessNotice}</span>
                  </div>
                )}

                {/* Language Format & Difficulty */}
                {/* Language Format (Difficulty & penalty are default as per exam) */}
                <div className="flex items-center justify-between gap-2.5">
                  <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => { setLanguageFormat("en"); setLanguage("en"); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        languageFormat === "en"
                          ? "bg-surface-container-lowest text-primary shadow-xs"
                          : "text-secondary hover:text-on-surface"
                      }`}
                    >
                      {t.formatEnglish}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setLanguageFormat("hi"); setLanguage("hi"); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        languageFormat === "hi"
                          ? "bg-surface-container-lowest text-primary shadow-xs"
                          : "text-secondary hover:text-on-surface"
                      }`}
                    >
                      {t.formatHindi}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setLanguageFormat("bilingual"); setLanguage("en"); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        languageFormat === "bilingual"
                          ? "bg-surface-container-lowest text-primary shadow-xs"
                          : "text-secondary hover:text-on-surface"
                      }`}
                    >
                      {t.formatBilingual}
                    </button>
                  </div>
                </div>

                {/* Question Statement Input - Adapts to English, Hindi Only, or Bilingual */}
                {(languageFormat === "en" || languageFormat === "bilingual") && (
                  <section className="bg-surface-container-low rounded-xl p-3.5 border border-surface-container-high/40 shadow-xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="font-label-md text-label-md text-secondary flex items-center gap-1 font-semibold">
                        <span className="material-symbols-outlined text-[16px]">help</span>
                        <span>{t.questionStatementEn}</span>
                      </label>
                      <span className="font-label-sm text-label-sm text-secondary">
                        {questionText.length} / 600
                      </span>
                    </div>
                    <textarea
                      value={questionText}
                      onChange={(e) => setQuestionText(e.target.value)}
                      placeholder="Type question statement in English (up to 600 characters)..."
                      rows={3}
                      maxLength={600}
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
                )}

                {(languageFormat === "hi" || languageFormat === "bilingual") && (
                  <section className="bg-surface-container-low rounded-xl p-3.5 border border-surface-container-high/40 shadow-xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="font-label-md text-label-md text-secondary flex items-center gap-1 font-semibold">
                        <span className="material-symbols-outlined text-[16px] text-primary">translate</span>
                        <span>{t.questionStatementHi}</span>
                      </label>
                      <span className="font-label-sm text-label-sm text-secondary">
                        {hindiQuestionText.length} / 600
                      </span>
                    </div>
                    <textarea
                      value={hindiQuestionText}
                      onChange={(e) => setHindiQuestionText(e.target.value)}
                      placeholder="प्रश्न का विवरण यहाँ लिखें... (अधिकतम 600 अक्षर)"
                      rows={3}
                      maxLength={600}
                      className="w-full bg-transparent font-headline-sm text-headline-sm text-on-surface focus:outline-none resize-none leading-snug placeholder:text-secondary/50"
                    />
                  </section>
                )}

                {/* Real-Time Duplicate Warning Banner */}
                {duplicateResult?.is_similar && !isEditMode && (
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
                            ? (t.exactDuplicateDetected || "Exact Duplicate Detected")
                            : (t.similarQuestionExists || "Similar Question Exists")}
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
                      {t.view || "View"}
                    </button>
                  </div>
                )}

                {/* Answer Choices Stack */}
                <section>
                  <div className="flex items-center justify-between mb-1.5 px-0.5">
                    <span className="font-label-md text-label-md text-secondary font-semibold">
                      {t.optionsLabel} {languageFormat === "hi" ? "(हिन्दी विकल्प)" : ""}
                    </span>
                    <span className="font-label-sm text-label-sm text-tertiary font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px]">check_circle</span>
                      Option {correctOptionId} {t.correct}
                    </span>
                  </div>

                  <div className="flex flex-col gap-2.5">
                    {(["A", "B", "C", "D"] as const).map((letter, idx) => {
                      const isCorrect = correctOptionId === letter;
                      return (
                        <div
                          key={letter}
                          onClick={() => setCorrectOptionId(letter)}
                          className={`group cursor-pointer rounded-xl p-3 flex flex-col gap-2 transition-all border ${
                            isCorrect
                              ? "bg-tertiary-container/15 border-tertiary text-on-surface shadow-xs"
                              : "bg-surface-container-low border-surface-container-high/40 text-on-surface hover:bg-surface-container"
                          }`}
                        >
                          <div className="flex items-center justify-between">
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
                              {languageFormat === "hi" ? (
                                <input
                                  type="text"
                                  value={hindiOptions[idx]}
                                  onChange={(e) => handleHindiOptionChange(idx, e.target.value)}
                                  onClick={(e) => e.stopPropagation()}
                                  placeholder={`विकल्प ${letter} (हिन्दी)...`}
                                  maxLength={300}
                                  className="bg-transparent font-body-md text-body-md text-on-surface focus:outline-none w-full"
                                />
                              ) : (
                                <input
                                  type="text"
                                  value={options[idx]}
                                  onChange={(e) => handleOptionChange(idx, e.target.value)}
                                  onClick={(e) => e.stopPropagation()}
                                  placeholder={`Option ${letter} (English)...`}
                                  maxLength={300}
                                  className="bg-transparent font-body-md text-body-md text-on-surface focus:outline-none w-full"
                                />
                              )}
                            </div>

                            <div className="flex items-center pl-2 shrink-0">
                              {isCorrect ? (
                                <span className="flex items-center gap-1 text-tertiary font-label-sm text-label-sm font-bold">
                                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                                  <span>{t.correct}</span>
                                </span>
                              ) : (
                                <span className="material-symbols-outlined text-[18px] text-secondary opacity-50 group-hover:opacity-100 transition-opacity">
                                  radio_button_unchecked
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Bilingual secondary option input */}
                          {languageFormat === "bilingual" && (
                            <div className="pl-10">
                              <input
                                type="text"
                                value={hindiOptions[idx]}
                                onChange={(e) => handleHindiOptionChange(idx, e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                placeholder={`विकल्प ${letter} (हिन्दी अनुवाद - Optional)...`}
                                maxLength={300}
                                className="bg-transparent text-xs text-secondary placeholder:text-secondary/40 focus:outline-none w-full border-t border-surface-container-high/30 pt-1"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <p className="font-body-sm text-body-sm text-secondary mt-1.5 px-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px] text-primary">touch_app</span>
                    <span>{t.tapOptionHint}</span>
                  </p>
                </section>

                {/* Explanation / Solution Proof Fields (English & Hindi) */}
                <section className="bg-surface-container-low rounded-xl p-3 border border-surface-container-high/40 flex flex-col gap-2.5">
                  {(languageFormat === "en" || languageFormat === "bilingual") && (
                    <div>
                      <label className="font-label-md text-label-md text-secondary flex items-center gap-1 font-semibold mb-1">
                        <span className="material-symbols-outlined text-[16px] text-primary">lightbulb</span>
                        <span>{t.explanationProof} (English - Optional)</span>
                      </label>
                      <textarea
                        value={explanation}
                        onChange={(e) => setExplanation(e.target.value)}
                        placeholder={t.explanationPlaceholder}
                        rows={2}
                        maxLength={800}
                        className="w-full bg-transparent font-body-md text-body-md text-on-surface focus:outline-none resize-none"
                      />
                    </div>
                  )}

                  {(languageFormat === "hi" || languageFormat === "bilingual") && (
                    <div>
                      <label className="font-label-md text-label-md text-secondary flex items-center gap-1 font-semibold mb-1">
                        <span className="material-symbols-outlined text-[16px] text-primary">translate</span>
                        <span>{t.explanationProof} (हिन्दी व्याख्या - {languageFormat === "hi" ? "Optional" : "वैकल्पिक"})</span>
                      </label>
                      <textarea
                        value={hindiExplanation}
                        onChange={(e) => setHindiExplanation(e.target.value)}
                        placeholder={t.hindiExplanationPlaceholder}
                        rows={2}
                        maxLength={800}
                        className="w-full bg-transparent font-body-md text-body-md text-on-surface focus:outline-none resize-none"
                      />
                    </div>
                  )}
                </section>

                {/* ============================================================== */}
                {/* BOTTOM SECTION: Subject, Topic, Syllabus Tag & PYQ Details     */}
                {/* Placed below question explanation as per specification         */}
                {/* ============================================================== */}

                {/* Smart Auto-Detection Indicator */}
                {autoDetectedNotice && (
                  <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/25 text-primary text-xs font-bold flex items-center justify-between gap-2 animate-in fade-in">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="material-symbols-outlined text-[17px] text-primary shrink-0">auto_awesome</span>
                      <span className="truncate">{autoDetectedNotice}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAutoDetectedNotice(null)}
                      className="text-[11px] underline opacity-80 hover:opacity-100 shrink-0"
                    >
                      Dismiss
                    </button>
                  </div>
                )}

                {/* Easy 3-Step Question Maker & Target Exam Default Card */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-surface-container-low border border-surface-container-high/40 shadow-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
                      <span className="material-symbols-outlined text-[20px]">school</span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-label-sm text-[10px] uppercase tracking-wider text-secondary font-bold">
                        Easy 3-Step Question Maker · Target Exam
                      </span>
                      <span className="font-headline-sm text-xs sm:text-sm font-bold text-on-surface truncate">
                        {currentExamObj.name}
                      </span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                    {currentExamObj.shortName}
                  </span>
                </div>

                {/* Subject Selector Filter Row (Target Domain) */}
                <section>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-semibold">
                      {t.targetDomain}
                    </span>
                    <span className="font-label-sm text-label-sm text-primary flex items-center gap-1 font-bold">
                      <span className="material-symbols-outlined text-[14px]">bolt</span>
                      +25 Rep Points
                    </span>
                  </div>
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
                    {currentExamSubjects.map((s) => {
                      const isSelected = selectedSubjectId === s.id;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => handleSubjectSelect(s.id)}
                          className={`px-3.5 py-2 rounded-full font-label-md text-label-md transition-all flex items-center gap-1.5 shrink-0 ${
                            isSelected
                              ? "bg-primary text-on-primary shadow-sm font-bold scale-[1.02]"
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

                {/* Subtopic, Syllabus Tag & PYQ Metadata Row */}
                <section className="bg-surface-container-low rounded-xl p-3 border border-surface-container-high/40 flex flex-col gap-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-bold text-secondary uppercase tracking-wider block mb-1">
                        {t.syllabusTag}
                      </label>
                      <input
                        type="text"
                        value={syllabusTag}
                        onChange={(e) => setSyllabusTag(e.target.value)}
                        placeholder="e.g. Indian Polity · Article 14-32"
                        className="w-full px-3 py-1.5 rounded-xl bg-surface-container border border-surface-container-high/50 text-xs text-on-surface font-medium focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-secondary uppercase tracking-wider block mb-1">
                        {t.pyqInfo}
                      </label>
                      <input
                        type="text"
                        value={pyqInfo}
                        onChange={(e) => setPyqInfo(e.target.value)}
                        placeholder="e.g. SSC CGL 2023 Tier 1, RRB NTPC 2021"
                        className="w-full px-3 py-1.5 rounded-xl bg-surface-container border border-surface-container-high/50 text-xs text-on-surface font-medium focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-secondary uppercase tracking-wider block mb-1">
                      {t.selectTopic}
                    </label>
                    <select
                      value={targetTopic}
                      onChange={(e) => setTargetTopic(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-surface-container border border-surface-container-high/50 text-xs text-on-surface font-semibold focus:outline-none focus:border-primary"
                    >
                      {effectiveDynamicTopics.map((top) => (
                        <option key={top} value={top}>
                          {top}
                        </option>
                      ))}
                    </select>

                    {targetTopic === "Others" && (
                      <div className="mt-2 animate-in fade-in">
                        <label className="text-[11px] font-bold text-secondary uppercase tracking-wider block mb-1">
                          {lang === "hi" ? "कस्टम टॉपिक का नाम लिखें (वैकल्पिक)" : "Specify Topic Name (Optional)"}
                        </label>
                        <input
                          type="text"
                          value={customTopic}
                          onChange={(e) => setCustomTopic(e.target.value)}
                          placeholder={lang === "hi" ? "उदा. आधुनिक भारत का इतिहास, लाभ-हानि शॉर्टकट" : "e.g. Modern Indian History, Percentage Shortcuts"}
                          className="w-full px-3 py-1.5 rounded-xl bg-surface-container border border-surface-container-high/50 text-xs text-on-surface font-medium focus:outline-none focus:border-primary"
                        />
                      </div>
                    )}
                  </div>
                </section>

                {/* Join WhatsApp Study Community Banner */}
                <div className="p-3.5 rounded-2xl bg-[#25D366]/10 border border-[#25D366]/30 flex items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-[#25D366] text-white flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[18px]">groups</span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-xs text-on-surface truncate">
                        {t.joinOfficialWhatsAppGroup}
                      </span>
                      <span className="text-[11px] text-secondary truncate">
                        {t.whatsappShareCommunityDesc}
                      </span>
                    </div>
                  </div>
                  <a
                    href={OFFICIAL_WHATSAPP_GROUP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-[#25D366] text-white font-bold text-xs shadow-xs hover:bg-[#20ba59] active:scale-95 transition-all shrink-0"
                  >
                    {t.joinGroupBtn}
                  </a>
                </div>

                {/* Error Message Banner */}
                {errorMsg && (
                  <div className="p-3 rounded-xl bg-error-container text-on-error-container text-label-md font-semibold flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">error</span>
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Publish / Update Button */}
                <section className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting || (!isEditMode && duplicateResult?.is_exact_duplicate)}
                    className={`w-full h-14 rounded-2xl font-label-lg text-label-lg shadow-md transition-all flex items-center justify-center gap-2 ${
                      !isEditMode && duplicateResult?.is_exact_duplicate
                        ? "bg-surface-container text-secondary cursor-not-allowed"
                        : "bg-primary-container text-on-primary hover:bg-primary active:scale-98"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[22px]">
                      {isEditMode ? "save" : "rocket_launch"}
                    </span>
                    <span>
                      {isSubmitting
                        ? isEditMode
                          ? t.updatingBtn
                          : t.publishing
                        : isCheckingDuplicate
                        ? t.checkingDuplicates
                        : isEditMode
                        ? t.updateQuestionBtn
                        : t.publishButton}
                    </span>
                  </button>
                  <p className="text-center font-label-sm text-label-sm text-secondary mt-2">
                    {t.peerReviewNote}
                  </p>
                </section>
              </form>
            )}
          </div>
        )}
      </div>

          {!isLoggedIn && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-start pt-12 sm:pt-16 p-4 text-center bg-surface/30 backdrop-blur-xs rounded-2xl">
              <div className="sticky top-20 flex flex-col items-center p-6 rounded-3xl bg-surface/95 backdrop-blur-md border border-primary/20 shadow-xl max-w-sm mx-auto">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shadow-sm mb-3">
                  <span className="material-symbols-outlined text-[32px]">lock</span>
                </div>
                <h3 className="text-lg font-bold text-on-surface">
                  {lang === "hi" ? "क्रिएटर स्टूडियो लॉक है" : "Creator Studio Locked"}
                </h3>
                <p className="text-xs text-secondary mt-1.5 max-w-xs leading-relaxed mb-4">
                  {lang === "hi"
                    ? "प्रश्न प्रकाशित करने, शॉर्टकट ट्रिक्स साझा करने और समुदाय में योगदान देने के लिए साइन इन करें।"
                    : "Sign in or create a free account to author verified MCQs, share shortcut tricks, and contribute to the community feed."}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    window.dispatchEvent(
                      new CustomEvent("open_auth_modal", {
                        detail: {
                          reason: "Sign in to publish questions & earn community badges",
                          mode: "signup",
                        },
                      })
                    );
                  }}
                  className="py-3 px-6 rounded-xl bg-primary text-on-primary font-bold text-sm flex items-center gap-2 shadow-md hover:bg-primary-container active:scale-95 transition-all cursor-pointer pointer-events-auto"
                >
                  <span className="material-symbols-outlined text-[18px]">login</span>
                  <span>{t.signInToPublish || "Sign In / Sign Up to Publish"}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Duplicate Details Modal */}
      {showDuplicateModal && duplicateResult?.matched_question && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/40 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm bg-surface-container-lowest rounded-2xl p-5 shadow-xl border border-surface-container-high/50 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
                {t.existingMatchFound}
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
                <span>{duplicateResult.matched_question.total_attempts} {t.attempts}</span>
                <span>·</span>
                <span>{duplicateResult.matched_question.accuracy_percentage}% {t.accuracy}</span>
              </div>
            </div>

            <p className="font-body-sm text-body-sm text-secondary">
              {t.duplicateMergeNote}
            </p>

            <button
              onClick={() => {
                setShowDuplicateModal(false);
                router.push("/");
              }}
              className="w-full py-2.5 rounded-xl bg-primary text-on-primary font-label-md text-label-md font-bold shadow-sm"
            >
              {t.viewExistingInFeed}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

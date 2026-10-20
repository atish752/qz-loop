/**
 * Exam Scoring Rules and Negative Marking Calculations for Top 10 Indian Competitive Exams
 */

export interface ExamScoringRule {
  examId: string;
  examName: string;
  shortName: string;
  marksPerCorrect: number;
  penaltyPerWrong: number;
  fractionLabel: string;
  description: string;
}

export const EXAM_SCORING_RULES: Record<string, ExamScoringRule> = {
  "exam-railway-ntpc": {
    examId: "exam-railway-ntpc",
    examName: "Railways (RRB NTPC & Group D)",
    shortName: "Railways RRB",
    marksPerCorrect: 1.0,
    penaltyPerWrong: 0.33,
    fractionLabel: "-0.33 (1/3rd)",
    description: "+1 mark for correct, -0.33 mark (1/3rd) penalty for wrong answer",
  },
  "exam-ssc-cgl": {
    examId: "exam-ssc-cgl",
    examName: "SSC CGL / CHSL / MTS",
    shortName: "SSC CGL",
    marksPerCorrect: 2.0,
    penaltyPerWrong: 0.5,
    fractionLabel: "-0.50 (1/4th)",
    description: "+2 marks for correct, -0.50 marks deducted for wrong answer",
  },
  "exam-neet-ug": {
    examId: "exam-neet-ug",
    examName: "NEET UG (Medical Entrance)",
    shortName: "NEET UG",
    marksPerCorrect: 4.0,
    penaltyPerWrong: 1.0,
    fractionLabel: "-1.00 (1/4th)",
    description: "+4 marks for correct, -1 mark penalty for wrong answer",
  },
  "exam-cuet-ug": {
    examId: "exam-cuet-ug",
    examName: "CUET UG (Central Universities)",
    shortName: "CUET UG",
    marksPerCorrect: 5.0,
    penaltyPerWrong: 1.0,
    fractionLabel: "-1.00 (1/5th)",
    description: "+5 marks for correct, -1 mark penalty for wrong answer",
  },
  "exam-jee-main": {
    examId: "exam-jee-main",
    examName: "JEE Main (Engineering Entrance)",
    shortName: "JEE Main",
    marksPerCorrect: 4.0,
    penaltyPerWrong: 1.0,
    fractionLabel: "-1.00 (1/4th)",
    description: "+4 marks for correct, -1 mark penalty for wrong answer",
  },
  "exam-banking-ibps": {
    examId: "exam-banking-ibps",
    examName: "Banking (IBPS / SBI PO & Clerk)",
    shortName: "Banking IBPS",
    marksPerCorrect: 1.0,
    penaltyPerWrong: 0.25,
    fractionLabel: "-0.25 (1/4th)",
    description: "+1 mark for correct, -0.25 mark (1/4th) penalty for wrong answer",
  },
  "exam-state-police": {
    examId: "exam-state-police",
    examName: "State Police / Constable & SI (UP/Bihar/MP)",
    shortName: "State Police",
    marksPerCorrect: 2.0,
    penaltyPerWrong: 0.5,
    fractionLabel: "-0.50 (1/4th)",
    description: "+2 marks for correct, -0.50 mark penalty for wrong answer",
  },
  "exam-state-pcs": {
    examId: "exam-state-pcs",
    examName: "State PCS (BPSC, UPPSC, MPPSC)",
    shortName: "State PCS",
    marksPerCorrect: 2.0,
    penaltyPerWrong: 0.66,
    fractionLabel: "-0.66 (1/3rd)",
    description: "+2 marks for correct, -0.66 mark (1/3rd) penalty for wrong answer",
  },
  "exam-defence-cds": {
    examId: "exam-defence-cds",
    examName: "Defence (NDA / CDS / AFCAT)",
    shortName: "Defence NDA/CDS",
    marksPerCorrect: 1.0,
    penaltyPerWrong: 0.33,
    fractionLabel: "-0.33 (1/3rd)",
    description: "+1 mark for correct, -0.33 mark penalty for wrong answer",
  },
  "exam-upsc-csat": {
    examId: "exam-upsc-csat",
    examName: "UPSC Civil Services (IAS / IPS Prelims)",
    shortName: "UPSC Civil Services",
    marksPerCorrect: 2.5,
    penaltyPerWrong: 0.83,
    fractionLabel: "-0.83 (1/3rd)",
    description: "+2.5 marks for correct, -0.83 mark (1/3rd) penalty for wrong answer",
  },
};

export function getExamScoringRule(examId?: string): ExamScoringRule {
  if (examId && EXAM_SCORING_RULES[examId]) {
    return EXAM_SCORING_RULES[examId];
  }
  return EXAM_SCORING_RULES["exam-neet-ug"] || EXAM_SCORING_RULES["exam-railway-ntpc"];
}

export function calculateNetScore(
  examId: string | undefined,
  correctCount: number,
  wrongCount: number
): {
  netScore: number;
  maxPossibleMarks: number;
  penaltyDeducted: number;
  grossMarks: number;
  scoringRule: ExamScoringRule;
} {
  const rule = getExamScoringRule(examId);
  const grossMarks = Number((correctCount * rule.marksPerCorrect).toFixed(2));
  const penaltyDeducted = Number((wrongCount * rule.penaltyPerWrong).toFixed(2));
  const netScore = Number((grossMarks - penaltyDeducted).toFixed(2));
  const maxPossibleMarks = Number(((correctCount + wrongCount) * rule.marksPerCorrect).toFixed(2));

  return {
    netScore,
    maxPossibleMarks,
    penaltyDeducted,
    grossMarks,
    scoringRule: rule,
  };
}

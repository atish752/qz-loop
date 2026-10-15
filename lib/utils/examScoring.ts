/**
 * Exam Scoring Rules and Negative Marking Calculations for Indian Competitive Exams
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
  "exam-ssc-cgl": {
    examId: "exam-ssc-cgl",
    examName: "SSC CGL (Tier 1 & 2)",
    shortName: "SSC CGL",
    marksPerCorrect: 2.0,
    penaltyPerWrong: 0.5,
    fractionLabel: "-0.50 (1/4th)",
    description: "+2 marks for correct, -0.50 marks deducted for wrong answer",
  },
  "exam-ssc-chsl": {
    examId: "exam-ssc-chsl",
    examName: "SSC CHSL (10+2)",
    shortName: "SSC CHSL",
    marksPerCorrect: 2.0,
    penaltyPerWrong: 0.5,
    fractionLabel: "-0.50 (1/4th)",
    description: "+2 marks for correct, -0.50 marks deducted for wrong answer",
  },
  "exam-railway-ntpc": {
    examId: "exam-railway-ntpc",
    examName: "RRB NTPC & Group D",
    shortName: "RRB NTPC",
    marksPerCorrect: 1.0,
    penaltyPerWrong: 0.33,
    fractionLabel: "-0.33 (1/3rd)",
    description: "+1 mark for correct, -0.33 mark (1/3rd) penalty for wrong answer",
  },
  "exam-banking-ibps": {
    examId: "exam-banking-ibps",
    examName: "IBPS PO / Clerk & SBI",
    shortName: "Banking IBPS/SBI",
    marksPerCorrect: 1.0,
    penaltyPerWrong: 0.25,
    fractionLabel: "-0.25 (1/4th)",
    description: "+1 mark for correct, -0.25 mark (1/4th) penalty for wrong answer",
  },
  "exam-state-pcs": {
    examId: "exam-state-pcs",
    examName: "State PCS (UPPSC, BPSC, MPPSC)",
    shortName: "State PCS",
    marksPerCorrect: 2.0,
    penaltyPerWrong: 0.66,
    fractionLabel: "-0.66 (1/3rd)",
    description: "+2 marks for correct, -0.66 mark (1/3rd) penalty for wrong answer",
  },
  "exam-upsc-csat": {
    examId: "exam-upsc-csat",
    examName: "UPSC CSAT & Prelims GS",
    shortName: "UPSC CSAT",
    marksPerCorrect: 2.5,
    penaltyPerWrong: 0.83,
    fractionLabel: "-0.83 (1/3rd)",
    description: "+2.5 marks for correct, -0.83 mark (1/3rd) penalty for wrong answer",
  },
  "exam-defence-cds": {
    examId: "exam-defence-cds",
    examName: "Defence CDS / NDA / AFCAT",
    shortName: "Defence CDS",
    marksPerCorrect: 1.0,
    penaltyPerWrong: 0.33,
    fractionLabel: "-0.33 (1/3rd)",
    description: "+1 mark for correct, -0.33 mark penalty for wrong answer",
  },
};

export function getExamScoringRule(examId?: string): ExamScoringRule {
  if (examId && EXAM_SCORING_RULES[examId]) {
    return EXAM_SCORING_RULES[examId];
  }
  return EXAM_SCORING_RULES["exam-ssc-cgl"];
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

/**
 * Indian Competitive Examinations Authentic Target Dates & Countdown Calculator
 */

export interface ExamCountdownInfo {
  examId: string;
  examShortName: string;
  examDisplayName: string;
  targetDate: Date;
  targetDateString: string;
  daysLeft: number;
  headlineEn: string;
  headlineHi: string;
}

interface ExamScheduleRule {
  examId: string;
  shortName: string;
  slugName: string;
  month: number; // 0-indexed (0 = Jan, 4 = May)
  day: number;
  fixedName: string;
}

const EXAM_SCHEDULES: Record<string, ExamScheduleRule> = {
  "exam-neet-ug": {
    examId: "exam-neet-ug",
    shortName: "NEET",
    slugName: "NEET",
    month: 4, // May
    day: 2,   // First Sunday of May
    fixedName: "NEET",
  },
  "exam-jee-main": {
    examId: "exam-jee-main",
    shortName: "JEE Main",
    slugName: "JEE Main",
    month: 0, // January
    day: 24,
    fixedName: "JEE Main",
  },
  "exam-ssc-cgl": {
    examId: "exam-ssc-cgl",
    shortName: "SSC CGL",
    slugName: "SSC CGL",
    month: 6, // July
    day: 14,
    fixedName: "SSC CGL",
  },
  "exam-railway-ntpc": {
    examId: "exam-railway-ntpc",
    shortName: "Railways RRB",
    slugName: "Railways RRB",
    month: 2, // March
    day: 15,
    fixedName: "Railways RRB",
  },
  "exam-cuet-ug": {
    examId: "exam-cuet-ug",
    shortName: "CUET UG",
    slugName: "CUET UG",
    month: 4, // May
    day: 15,
    fixedName: "CUET UG",
  },
  "exam-banking-ibps": {
    examId: "exam-banking-ibps",
    shortName: "Banking IBPS",
    slugName: "Banking IBPS",
    month: 7, // August
    day: 22,
    fixedName: "Banking IBPS",
  },
  "exam-state-police": {
    examId: "exam-state-police",
    shortName: "State Police",
    slugName: "State Police",
    month: 1, // February
    day: 28,
    fixedName: "State Police",
  },
  "exam-state-pcs": {
    examId: "exam-state-pcs",
    shortName: "State PCS",
    slugName: "State PCS",
    month: 5, // June
    day: 20,
    fixedName: "State PCS",
  },
  "exam-defence-cds": {
    examId: "exam-defence-cds",
    shortName: "Defence CDS",
    slugName: "Defence CDS",
    month: 3, // April
    day: 18,
    fixedName: "Defence CDS",
  },
  "exam-upsc-csat": {
    examId: "exam-upsc-csat",
    shortName: "UPSC CSE",
    slugName: "UPSC Civil Services",
    month: 4, // May
    day: 30,
    fixedName: "UPSC CSE",
  },
};

export function getExamCountdown(examIdOrName?: string, fromDate = new Date()): ExamCountdownInfo {
  // Normalize exam key
  let ruleKey = "exam-ssc-cgl";

  if (examIdOrName) {
    const clean = examIdOrName.toLowerCase();
    if (clean.includes("neet")) ruleKey = "exam-neet-ug";
    else if (clean.includes("jee")) ruleKey = "exam-jee-main";
    else if (clean.includes("ssc") || clean.includes("cgl")) ruleKey = "exam-ssc-cgl";
    else if (clean.includes("railway") || clean.includes("rrb") || clean.includes("ntpc")) ruleKey = "exam-railway-ntpc";
    else if (clean.includes("cuet")) ruleKey = "exam-cuet-ug";
    else if (clean.includes("bank") || clean.includes("ibps") || clean.includes("sbi")) ruleKey = "exam-banking-ibps";
    else if (clean.includes("police") || clean.includes("constable")) ruleKey = "exam-state-police";
    else if (clean.includes("pcs") || clean.includes("bpsc") || clean.includes("uppsc")) ruleKey = "exam-state-pcs";
    else if (clean.includes("defence") || clean.includes("nda") || clean.includes("cds")) ruleKey = "exam-defence-cds";
    else if (clean.includes("upsc") || clean.includes("ias") || clean.includes("civil")) ruleKey = "exam-upsc-csat";
    else if (EXAM_SCHEDULES[examIdOrName]) ruleKey = examIdOrName;
  }

  const rule = EXAM_SCHEDULES[ruleKey] || EXAM_SCHEDULES["exam-ssc-cgl"];

  // Normalize fromDate to midnight UTC / local
  const currentYear = fromDate.getFullYear();
  const startOfFrom = new Date(currentYear, fromDate.getMonth(), fromDate.getDate());

  let targetYear = currentYear;
  let targetDate = new Date(targetYear, rule.month, rule.day);

  // If already passed in current year, target is in the next year
  if (targetDate.getTime() <= startOfFrom.getTime()) {
    targetYear += 1;
    targetDate = new Date(targetYear, rule.month, rule.day);
  }

  const diffMs = targetDate.getTime() - startOfFrom.getTime();
  const daysLeft = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));

  const examDisplayName = `${rule.fixedName} ${targetYear}`;
  const targetDateString = targetDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return {
    examId: rule.examId,
    examShortName: rule.shortName,
    examDisplayName,
    targetDate,
    targetDateString,
    daysLeft,
    headlineEn: `${daysLeft} days left for ${examDisplayName}`,
    headlineHi: `${examDisplayName} के लिए ${daysLeft} दिन शेष`,
  };
}

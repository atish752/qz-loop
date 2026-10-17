import { Question } from "@/types/database";

export const OFFICIAL_WHATSAPP_GROUP_URL = "https://chat.whatsapp.com/JaluiYU8C6nKGrr3YXBn6L";
export const FOUNDER_NAME = "Atish Kumar";
export const FOUNDER_PHONE = "+91 9798482404";
export const FOUNDER_WHATSAPP_NUMBER = "+91 9798482404";
export const FOUNDER_WHATSAPP_LINK = "https://wa.me/919798482404?text=Hi%20Atish,%20I%20have%20feedback/suggestion%20for%20Qz%20Loop";
export const FOUNDER_EMAIL = "atish2k22@gmail.com";

/**
 * Format a rich WhatsApp challenge message for Indian competitive exam aspirants.
 * WhatsApp supports *bold*, _italics_, ~strikethrough~, and `code`.
 */
export function formatWhatsAppChallenge(params: {
  question: Question;
  authorUsername?: string;
  userSolvedTimeSec?: number | null;
  origin?: string;
  targetExam?: string;
  language?: "en" | "hi";
}): string {
  const { question, authorUsername, userSolvedTimeSec, origin, targetExam, language } = params;
  const baseUrl = origin || (typeof window !== "undefined" ? window.location.origin : "https://qzloop.app");
  const link = `${baseUrl}/q/${question.id}`;
  const exam = targetExam || question.subject_name || "Competitive Exam";
  const authorTag = authorUsername ? `by @${authorUsername}` : "";
  const pyqTag = question.pyq_info ? ` [${question.pyq_info}]` : "";
  const syllabusTag = question.syllabus_tag ? ` · _${question.syllabus_tag}_` : "";

  const isHindi = language === "hi" || (question.language === "hi" && !language);

  // Time & accuracy hook to provoke healthy student competition
  const avgSec = Math.round((question.total_time_ms || 15000) / Math.max(1, question.total_attempts) / 1000);
  const accPercent = question.total_attempts > 0
    ? Math.round((question.correct_attempts / question.total_attempts) * 100)
    : 72;

  const timeHook = typeof userSolvedTimeSec === "number" && userSolvedTimeSec > 0
    ? (isHindi
        ? `⚡ *मैंने इसे ${userSolvedTimeSec}s में हल किया!* क्या आप मेरा समय हरा सकते हैं?`
        : `⚡ *I solved this in ${userSolvedTimeSec}s!* Can you beat my time?`)
    : (isHindi
        ? `⚡ *औसत समय: ${avgSec}s* | सटीकता: *${accPercent}%*`
        : `⚡ *Community Avg: ${avgSec}s* | Accuracy: *${accPercent}%*`);

  const activeQuestionText = isHindi && question.hindi_question_text
    ? question.hindi_question_text
    : question.question_text;

  const optLines = question.options
    .map((o) => {
      const optText = isHindi && o.hindi_text ? o.hindi_text : o.text;
      return `(${o.id}) ${optText}`;
    })
    .join("\n");

  const challengeHeader = isHindi
    ? `🔥 *Qz Loop MCQ चुनौती* ${authorTag}`.trim()
    : `🔥 *Qz Loop MCQ Challenge* ${authorTag}`.trim();

  const ctaLine = isHindi
    ? `👉 *Qz Loop पर लाइव हल करें और Quick Proof देखें:*`
    : `👉 *Solve live & check Quick Proof on Qz Loop:*`;

  return [
    challengeHeader,
    `📚 *${exam}*${pyqTag}${syllabusTag}`,
    "",
    `❓ *${activeQuestionText}*`,
    "",
    optLines,
    "",
    timeHook,
    ctaLine,
    link,
  ].join("\n");
}

/**
 * Format an Asia/Kolkata daily study scorecard for WhatsApp groups
 */
export function formatWhatsAppScorecard(params: {
  displayName: string;
  username: string;
  targetExam: string;
  solvedCount: number;
  accuracy: number;
  correctCount: number;
  incorrectCount: number;
  avgTimeSec: number;
  streakDays: number;
  periodLabel: string;
  netMarks?: number;
  origin?: string;
}): string {
  const {
    displayName,
    username,
    targetExam,
    solvedCount,
    accuracy,
    correctCount,
    incorrectCount,
    avgTimeSec,
    streakDays,
    periodLabel,
    netMarks,
    origin,
  } = params;

  const baseUrl = origin || (typeof window !== "undefined" ? window.location.origin : "https://qzloop.app");

  const marksLine = typeof netMarks === "number"
    ? `🎯 *Estimated Net Marks:* ${netMarks >= 0 ? "+" : ""}${netMarks.toFixed(2)}\n`
    : "";

  return [
    `📊 *My Qz Loop Practice Record* (${periodLabel})`,
    `👤 *${displayName}* (@${username}) · *${targetExam}*`,
    "",
    `✅ *Questions Solved:* ${solvedCount}`,
    `🎯 *Accuracy:* ${accuracy}% (${correctCount} Correct / ${incorrectCount} Wrong)`,
    marksLine ? marksLine.trim() : null,
    `⚡ *Average Speed:* ${avgTimeSec}s per question`,
    `🔥 *Practice Streak:* ${streakDays} Days Unbroken`,
    "",
    `🏆 *Can you beat my practice score today? Join me on Qz Loop:*`,
    baseUrl,
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * Open WhatsApp share link directly with native deep link and universal wa.me fallback
 */
export function openWhatsAppShare(text: string) {
  const encoded = encodeURIComponent(text);
  // wa.me is the official universal link intercepted natively on Android and iOS
  const universalUrl = `https://wa.me/?text=${encoded}`;
  if (typeof window !== "undefined") {
    window.open(universalUrl, "_blank", "noopener,noreferrer");
  }
}

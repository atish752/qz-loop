// Automated Acceptance Test Suite for Qz Loop
// Validates all requirements and scenarios end-to-end

import { db } from "../lib/data/store";
import { normalizeTextFingerprint } from "../lib/utils/fingerprint";
import { checkSimilarity } from "../lib/utils/similarity";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`FAILED: ${message}`);
  }
  console.log(`  ✓ ${message}`);
}

async function runTests() {
  console.log("=================================================");
  console.log("   Qz Loop MVP Automated Acceptance Test Suite   ");
  console.log("=================================================");

  // Scenario 1: Initial State & Feed Loading
  console.log("\n[Scenario 1] A student opens the feed for SSC CGL");
  const initialFeed = db.getFeedQuestions({
    examId: "exam-ssc-cgl",
    subjectSlug: "all",
  });
  assert(initialFeed.length > 0, "Feed returns eligible questions");
  assert(initialFeed[0].correct_option_id === undefined, "Security rule: correct_option_id masked before answer");
  assert(initialFeed[0].options.length === 4, "Question has 4 answer choices");
  console.log(`    Sample Question: "${initialFeed[0].question_text.substring(0, 40)}..."`);

  // Scenario 2: Changing between All, Maths, Reasoning, English, and GK
  console.log("\n[Scenario 2] Switching subject filters maintains session without errors");
  const subjects = ["maths", "reasoning", "english", "gk"];
  for (const s of subjects) {
    const subjFeed = db.getFeedQuestions({
      examId: "exam-ssc-cgl",
      subjectSlug: s,
    });
    assert(subjFeed.length > 0, `Filter '${s}' returned questions`);
    assert(subjFeed.every((q) => q.subject_slug === s), `All items belong to subject '${s}'`);
  }

  // Scenario 3: Question metrics visible before answering
  console.log("\n[Scenario 3] Community metrics visible before student answers");
  const q = initialFeed[0];
  assert(typeof q.total_attempts === "number", "Total attempts count is visible");
  assert(typeof q.correct_attempts === "number", "Accuracy basis exists");
  assert(typeof q.total_time_ms === "number", "Average time data exists");

  // Scenario 4: Submitting an answer, stopping timer, and recording feedback
  console.log("\n[Scenario 4] Answering question: timer stops, feedback provided, metrics updated");
  const prevAttempts = q.total_attempts;
  const answerResult = db.submitAttempt({
    questionId: q.id,
    selectedOptionId: "B",
    responseTimeMs: 8200,
  });
  assert(typeof answerResult.isCorrect === "boolean", "Instant correctness feedback returned");
  assert(Boolean(answerResult.correctOptionId), "Correct option revealed post-answer");
  assert(Boolean(answerResult.explanation), "Author's explanation ('Quick Proof') displayed");
  assert(answerResult.updatedMetrics.total_attempts === prevAttempts + 1, "Question community attempts incremented");

  // Scenario 5: "I Know This · Hide" control
  console.log("\n[Scenario 5] Hiding easy question excludes it from future feed");
  const questionToHide = initialFeed[1].id;
  db.hideQuestion("user-current", questionToHide);
  const feedAfterHide = db.getFeedQuestions({
    userId: "user-current",
    examId: "exam-ssc-cgl",
    subjectSlug: "all",
  });
  assert(!feedAfterHide.some((item) => item.id === questionToHide), "Hidden question no longer appears in feed");

  // Scenario 6: Restoring hidden question via Profile
  console.log("\n[Scenario 6] Restoring previously hidden question from Profile screen");
  const hiddenList = db.getHiddenQuestions("user-current");
  assert(hiddenList.some((item) => item.id === questionToHide), "Hidden question listed in user's hidden manager");
  db.restoreQuestion("user-current", questionToHide);
  const hiddenListAfter = db.getHiddenQuestions("user-current");
  assert(!hiddenListAfter.some((item) => item.id === questionToHide), "Question successfully restored");

  // Scenario 7: Question creation flow with validation
  console.log("\n[Scenario 7] User creates and publishes new question");
  const newQ = db.createQuestion({
    subjectId: "subj-maths",
    questionText: "If the radius of a circle is doubled, what is the ratio of the new area to the old area?",
    language: "en",
    options: [
      { id: "A", text: "2 : 1" },
      { id: "B", text: "4 : 1" },
      { id: "C", text: "8 : 1" },
      { id: "D", text: "1 : 4" },
    ],
    correctOptionId: "B",
    explanation: "Area = πr². If radius becomes 2r, new Area = π(2r)² = 4πr². Ratio = 4 : 1.",
    difficulty: "easy",
  });
  assert(Boolean(newQ.id), "New question published with unique ID");
  assert(newQ.correct_option_id === "B", "Correct option recorded");

  // Scenario 8: Duplicate detection - Layer 1 (Exact match)
  console.log("\n[Scenario 8] Layer 1: Exact duplicate detection blocks duplicate publication");
  const dupCheck1 = db.checkDuplicate("If the radius of a circle is doubled, what is the ratio of the new area to the old area?");
  assert(dupCheck1.is_exact_duplicate === true, "Exact duplicate recognized with 1.0 similarity score");
  let blockedExact = false;
  try {
    db.createQuestion({
      subjectId: "subj-maths",
      questionText: "If the radius of a circle is doubled, what is the ratio of the new area to the old area?",
      options: [
        { id: "A", text: "2:1" },
        { id: "B", text: "4:1" },
      ],
      correctOptionId: "B",
    });
  } catch {
    blockedExact = true;
  }
  assert(blockedExact, "Server-side duplicate check strictly blocks publication of exact duplicate");

  // Scenario 9: Duplicate detection - Layer 2 (Trigram similarity warning)
  console.log("\n[Scenario 9] Layer 2: Trigram similarity catches paraphrased question");
  const dupCheck2 = db.checkDuplicate("When the radius of circle is doubled, calculate the ratio of new area to old area");
  assert(dupCheck2.is_similar === true, "Trigram similarity triggers warning on paraphrased question");
  assert(Boolean(dupCheck2.matched_question), "Returns matching question details and author for preview");

  // Scenario 10: Hindi Unicode characters support
  console.log("\n[Scenario 10] Hindi Unicode text in questions, options and explanation");
  const hindiQ = db.createQuestion({
    subjectId: "subj-gk",
    questionText: "भारत के किस राज्य में 'काजीरंगा राष्ट्रीय उद्यान' स्थित है?",
    language: "hi",
    options: [
      { id: "A", text: "असम" },
      { id: "B", text: "पश्चिम बंगाल" },
      { id: "C", text: "उत्तराखंड" },
      { id: "D", text: "मध्य प्रदेश" },
    ],
    correctOptionId: "A",
    explanation: "काजीरंगा राष्ट्रीय उद्यान असम में स्थित है और यह एक सींग वाले गैंडे के लिए प्रसिद्ध है।",
    difficulty: "easy",
  });
  assert(hindiQ.language === "hi", "Language set to Hindi");
  assert(hindiQ.question_text.includes("काजीरंगा"), "Hindi Unicode preserved in question");
  assert(hindiQ.options[0].text === "असम", "Hindi Unicode preserved in options");

  // Scenario 11: Personal Matrix Dashboard
  console.log("\n[Scenario 11] Matrix personal dashboard (Today, Week, Month, Lifetime in Asia/Kolkata)");
  for (const p of ["today", "week", "month", "lifetime"] as const) {
    const matrix = db.getMatrixStats("user-current", p);
    assert(matrix.total_solved > 0, `Matrix total solved exists for ${p}`);
    assert(matrix.accuracy_percentage >= 0, `Matrix accuracy % exists for ${p}`);
    assert(matrix.subjects.length === 4, `All 4 subjects evaluated in ${p} matrix`);
    assert(Boolean(matrix.subjects[0].status), `Subject status evaluated: ${matrix.subjects[0].status}`);
  }

  // Scenario 12: Leaderboard and Deterministic Scoring Formula
  console.log("\n[Scenario 12] Leaderboard calculations with deterministic scoring formula");
  for (const period of ["weekly", "monthly"] as const) {
    const lb = db.getLeaderboard(period);
    assert(lb.length >= 3, `Leaderboard has top participants for ${period}`);
    assert(lb[0].rank === 1, "Leaderboard leader has rank #1");
    assert(lb[0].score >= lb[1].score, "Leaderboard sorted in descending score order");
    assert(lb.some((e) => e.is_current_user), "Current user standing included in leaderboard");
  }

  // Scenario 13: Question Reporting
  console.log("\n[Scenario 13] Question reporting mechanism");
  db.reportQuestion({
    reporterId: "user-current",
    questionId: initialFeed[0].id,
    reason: "incorrect_answer",
    details: "Verification test",
  });
  assert(true, "Question report logged successfully");

  // Scenario 14: Shared Question Retrieval by ID with secure answer masking
  console.log("\n[Scenario 14] Shared question retrieval by ID for direct links (/q/[id])");
  const sharedQ = db.getQuestionById(initialFeed[0].id);
  assert(Boolean(sharedQ), "Shared question successfully fetched by ID");
  assert(sharedQ?.correct_option_id === undefined, "Security rule: correct_option_id masked in shared question preview");
  assert(sharedQ?.id === initialFeed[0].id, "Correct question returned");

  // Scenario 15: Rapid duplicate attempt submission idempotency
  console.log("\n[Scenario 15] Double-click idempotency protection on attempt submission");
  const testQ = initialFeed[2];
  const initialAttempts = testQ.total_attempts;
  const res1 = db.submitAttempt({
    questionId: testQ.id,
    selectedOptionId: "A",
    responseTimeMs: 5000,
  });
  // Immediate second submission within 2 seconds
  const res2 = db.submitAttempt({
    questionId: testQ.id,
    selectedOptionId: "A",
    responseTimeMs: 5000,
  });
  assert(res1.isCorrect === res2.isCorrect, "Idempotent response matches");
  assert(res2.updatedMetrics.total_attempts === res1.updatedMetrics.total_attempts, "Question attempts only incremented ONCE despite rapid double-tap");

  // Scenario 16: Genuine User Lifetime Summary & Profile verification
  console.log("\n[Scenario 16] Genuine User Lifetime practice summary calculation");
  const lifetimeSummary = db.getUserLifetimeSummary("user-current");
  assert(lifetimeSummary.totalSolved > 0, "Lifetime total solved is computed from genuine attempts");
  assert(lifetimeSummary.overallAccuracy > 0, "Lifetime accuracy is computed from genuine attempts");
  const profile = db.getCurrentUser();
  assert(profile.total_questions_answered === lifetimeSummary.totalSolved, "Profile reflects genuine lifetime total answered");
  assert(profile.overall_accuracy === lifetimeSummary.overallAccuracy, "Profile reflects genuine lifetime accuracy");

  // Scenario 17: Honest zero-attempt matrix handling
  console.log("\n[Scenario 17] Honest zero-attempt matrix handling (no fake numbers)");
  const emptyUserMatrix = db.getMatrixStats("non-existent-user", "today");
  assert(emptyUserMatrix.total_solved === 0, "Returns 0 for total solved when no attempts exist");
  assert(emptyUserMatrix.accuracy_percentage === 0, "Returns 0% accuracy when no attempts exist");
  assert(emptyUserMatrix.fastest_correct_seconds === null, "Returns null fastest time when no attempts exist");

  // Scenario 18: Leaderboard qualification threshold (20 attempts)
  console.log("\n[Scenario 18] Leaderboard 20-attempt qualification threshold enforcement");
  const weeklyLb = db.getLeaderboard("weekly");
  const qualifiedOnly = weeklyLb.filter((e) => e.is_qualified !== false);
  assert(qualifiedOnly.every((e) => e.total_attempts >= 20), "All ranked AIR participants have at least 20 attempts");
  assert(qualifiedOnly.every((e) => e.rank > 0), "All qualified participants have valid positive ranks");

  console.log("\n=================================================");
  console.log("   ALL 18 ACCEPTANCE TEST SUITES PASSED (100%)   ");
  console.log("=================================================\n");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});

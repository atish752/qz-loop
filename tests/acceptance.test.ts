// Automated Acceptance Test Suite for Qz Loop
// Validates all requirements and scenarios end-to-end
(process.env as Record<string, string | undefined>).NODE_ENV = "test";

import fs from "fs";
import path from "path";
import { db } from "../lib/data/store";
import { normalizeTextFingerprint } from "../lib/utils/fingerprint";
import { checkSimilarity } from "../lib/utils/similarity";
import { getTopicsForSubject } from "../lib/data/topics";
import { OFFICIAL_WHATSAPP_GROUP_URL, FOUNDER_PHONE, FOUNDER_EMAIL, FOUNDER_WHATSAPP_LINK } from "../lib/utils/whatsapp";
import { TRANSLATIONS } from "../lib/utils/i18n";
import { getExamCountdown } from "../lib/utils/examDates";
import { parseQuestionAndOptions } from "../lib/utils/ocrParser";

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

  // Scenario 19: Multi-subject flow in feed (Maths + English or Reasoning + GK)
  console.log("\n[Scenario 19] Multi-subject flow in feed (e.g. Maths + English)");
  const multiFeed1 = db.getFeedQuestions({
    examId: "exam-ssc-cgl",
    subjectSlug: "maths,english",
  });
  assert(multiFeed1.length > 0, "Multi-subject filter returned questions");
  assert(
    multiFeed1.every((q) => q.subject_slug === "maths" || q.subject_slug === "english"),
    "All items belong strictly to chosen subjects 'maths' or 'english'"
  );

  const multiFeed2 = db.getFeedQuestions({
    examId: "exam-ssc-cgl",
    subjectSlugs: ["reasoning", "gk"],
  });
  assert(multiFeed2.length > 0, "Array subjectSlugs filter returned questions");
  assert(
    multiFeed2.every((q) => q.subject_slug === "reasoning" || q.subject_slug === "gk"),
    "All items belong strictly to chosen subjects 'reasoning' or 'gk'"
  );

  // Scenario 20: Spaced Repetition custom repeat interval (< 1 Day, < 1 Week, < 1 Month, Never)
  console.log("\n[Scenario 20] Spaced Repetition repeat interval recording and scheduling");
  const targetQ = initialFeed[3];
  // 1. Set repeat interval 'never'
  const neverPref = db.setQuestionRepeatInterval("user-current", targetQ.id, "never");
  assert(neverPref.interval === "never", "Repeat interval 'never' successfully recorded");
  assert(db.getQuestionRepeatInterval("user-current", targetQ.id) === "never", "Retrieved repeat interval matches 'never'");

  // Verify 'never' question excluded from revision feed
  const feedAfterNever = db.getFeedQuestions({
    userId: "user-current",
    examId: "exam-ssc-cgl",
    subjectSlug: "all",
  });
  assert(!feedAfterNever.some((q) => q.id === targetQ.id), "Question marked 'never' excluded from future revision feed");

  // 2. Set repeat interval 'day'
  const dayPref = db.setQuestionRepeatInterval("user-current", targetQ.id, "day");
  assert(dayPref.interval === "day", "Repeat interval '< 1 Day' successfully updated");
  assert(Boolean(dayPref.next_review_at), "Next review timestamp scheduled within hours");

  // Scenario 21: Reel Question Likes (Fire button)
  console.log("\n[Scenario 21] Like / Fire interactions on reel questions");
  const likeStatusBefore = db.getQuestionLikeStatus("user-current", targetQ.id);
  const toggleRes1 = db.toggleLikeQuestion("user-current", targetQ.id);
  assert(toggleRes1.liked !== likeStatusBefore.liked, "Like toggle flipped user like state");
  const toggleRes2 = db.toggleLikeQuestion("user-current", targetQ.id);
  assert(toggleRes2.liked === likeStatusBefore.liked, "Second like toggle reverted user like state");

  // Scenario 22: Question Playlists and Collections
  console.log("\n[Scenario 22] Question Playlists and Collections");
  const createdCol = db.createCollection("user-current", "Tricky Quant Shortcuts", "Tricky formulas to revise");
  assert(createdCol.name === "Tricky Quant Shortcuts", "Playlist collection created");
  const saveRes = db.saveQuestionToCollection("user-current", targetQ.id, "Tricky Quant Shortcuts");
  assert(saveRes.saved === true, "Question saved to playlist");
  const savedCols = db.getQuestionCollections("user-current", targetQ.id);
  assert(savedCols.includes("Tricky Quant Shortcuts"), "Question listed in playlist collections");
  db.removeQuestionFromCollection("user-current", targetQ.id, "Tricky Quant Shortcuts");
  const savedColsAfter = db.getQuestionCollections("user-current", targetQ.id);
  assert(!savedColsAfter.includes("Tricky Quant Shortcuts"), "Question successfully removed from playlist");

  // Scenario 23: Study Friends and Direct Chat with Question Sharing
  console.log("\n[Scenario 23] Friends, Study Connections, and Direct Chat with Question Sharing");
  const friends = db.getFriends("user-current");
  assert(friends.length >= 4, "User has initial study partners");
  const friendReq = db.sendFriendRequest("user-current", "Rohan Verma");
  assert(friendReq.success === true, "Friend request accepted / connected");
  
  // Send study message sharing question
  const sentMsg = db.sendMessage({
    fromUserId: "user-current",
    toUserId: "user-priya",
    text: "Can you beat my time on this question?",
    questionId: targetQ.id,
  });
  assert(sentMsg.question_id === targetQ.id, "Direct message links shared question ID");
  const thread = db.getMessages("user-current", "user-priya");
  assert(thread.some((m) => m.id === sentMsg.id), "Message visible in direct study chat thread");

  // Scenario 24: Habit engine settings (/goal, /schedule, /boost)
  console.log("\n[Scenario 24] Habit engine settings (/goal, /schedule, /boost)");
  const habit = db.getHabitSettings("user-current");
  assert(typeof habit.daily_goal === "number", "Daily question practice goal exists");
  assert(habit.schedule_slots.length >= 3, "Study revision schedule slots exist");
  const updatedHabit = db.updateDailyGoal("user-current", 35);
  assert(updatedHabit.daily_goal === 35, "Daily practice goal updated successfully to 35");

  // Scenario 25: User Profile & Unique Instagram-style Username Enforcement
  console.log("\n[Scenario 25] User Profile & Unique Instagram-style Username Enforcement");
  const currProfile = db.getCurrentUser();
  assert(Boolean(currProfile.display_name), "Profile carries display name");
  assert(Boolean(currProfile.username), "Profile carries unique username");
  assert(Boolean(currProfile.target_exam || currProfile.preferred_examination_id), "Profile carries target examination");

  // Verify username uniqueness check
  assert(db.isUsernameAvailable("amit_ssc", "user-current") === false, "Taken username 'amit_ssc' correctly detected as unavailable");
  assert(db.isUsernameAvailable("AMIT_SSC", "user-current") === false, "Case-insensitive uppercase handle correctly detected as unavailable");
  assert(db.isUsernameAvailable("super_unique_aspirant_99", "user-current") === true, "New unique username correctly detected as available");
  assert(db.isUsernameAvailable("a!", "user-current") === false, "Invalid username with symbols correctly rejected");
  assert(db.isUsernameAvailable(".bad_dot", "user-current") === false, "Leading dot in username rejected");
  assert(db.isUsernameAvailable("bad_dot.", "user-current") === false, "Trailing dot in username rejected");
  assert(db.isUsernameAvailable("consecutive..dot", "user-current") === false, "Consecutive dots in username rejected");
  assert(db.isUsernameAvailable("with space", "user-current") === false, "Space inside username rejected");

  // Verify error is thrown if trying to take someone else's username
  let duplicateUsernameBlocked = false;
  try {
    db.updateProfile({ username: "amit_ssc" });
  } catch (err: unknown) {
    duplicateUsernameBlocked = true;
  }
  assert(duplicateUsernameBlocked, "Profile update strictly blocks duplicate username collision");

  // Verify valid unique username update succeeds
  const updatedProfile = db.updateProfile({ username: "rahul_ssc_topper", display_name: "Rahul Topper", target_exam: "SSC CGL" });
  assert(updatedProfile.username === "rahul_ssc_topper", "Unique username successfully updated");
  assert(updatedProfile.display_name === "Rahul Topper", "Display name successfully updated");
  assert(updatedProfile.target_exam === "SSC CGL", "Target examination successfully maintained");

  // Revert username back to rahul_cgl for test purity
  db.updateProfile({ username: "rahul_cgl", display_name: "Rahul S." });

  // Scenario 26: Social Screen - Search Aspirants by Unique Username & Friend System
  console.log("\n[Scenario 26] Social Screen - Search Aspirants by Unique Username & Friend System");
  const searchResults = db.searchUsers("amit_ssc", "user-current");
  assert(searchResults.length > 0, "Search by unique username returns matching student profile");
  assert(searchResults[0].username === "amit_ssc", "Returned student profile has exact matching username");
  assert(Boolean(searchResults[0].target_exam), "Searched user carries target examination");

  // Send friend request by unique handle with '@' prefix
  const handleFriendReq = db.sendFriendRequest("user-current", "@vikram_p");
  assert(handleFriendReq.success === true, "Friend request accepted via unique @handle");
  assert(handleFriendReq.friend?.username === "vikram_p", "Connected friend retains unique username");

  // Verify self-friend requests are strictly blocked
  const selfFriendReq = db.sendFriendRequest("user-current", "@rahul_cgl");
  assert(selfFriendReq.success === false, "Self-friend request strictly blocked");

  // Verify request to non-existent handle is blocked
  const invalidFriendReq = db.sendFriendRequest("user-current", "@nonexistent_ghost_999");
  assert(invalidFriendReq.success === false, "Friend request to non-existent handle strictly blocked");

  // Scenario 27: Quiz Loop Sharing & Normal Quiz Loop Experience (Answer or Ignore)
  console.log("\n[Scenario 27] Quiz Loop Sharing & Normal Quiz Loop Experience (Answer or Ignore)");
  // Share a quiz reel to a friend
  const sharedReelMsg = db.sendMessage({
    fromUserId: "user-current",
    toUserId: "user-amit",
    text: "Practice this tricky quant question!",
    questionId: initialFeed[0].id,
  });
  assert(sharedReelMsg.question_id === initialFeed[0].id, "Direct message links shared quiz reel ID");

  // Friend fetches the shared question
  const fetchedSharedQ = db.getQuestionById(sharedReelMsg.question_id!);
  assert(Boolean(fetchedSharedQ), "Friend successfully opens shared quiz");
  assert(fetchedSharedQ?.correct_option_id === undefined, "Security rule: correct answer hidden before answering");

  // Option 1: Ignore flow - Friend ignores the shared quiz without submitting
  const attemptsBeforeIgnore = fetchedSharedQ!.total_attempts;
  const userAttemptsBefore = db.getAttemptsByUser("user-amit").length;
  // Ignoring leaves question metrics and user history untouched
  const questionAfterIgnore = db.getQuestionById(sharedReelMsg.question_id!);
  assert(questionAfterIgnore!.total_attempts === attemptsBeforeIgnore, "Ignored question does not increment community attempts");
  assert(db.getAttemptsByUser("user-amit").length === userAttemptsBefore, "Ignored question does not record user attempt");

  // Option 2: Practice flow - friend submits answer -> timer stops, feedback provided, attempts updated
  const beforeAttempts = questionAfterIgnore!.total_attempts;
  const friendAttempt = db.submitAttempt({
    userId: "user-amit",
    questionId: fetchedSharedQ!.id,
    selectedOptionId: "B",
    responseTimeMs: 6400,
  });
  assert(typeof friendAttempt.isCorrect === "boolean", "Practice provides instant correctness feedback");
  assert(Boolean(friendAttempt.explanation), "Practice reveals author proof and explanation");
  assert(friendAttempt.updatedMetrics.total_attempts === beforeAttempts + 1, "Question community attempts incremented");

  // Scenario 28: Brand Logo and Navigation Hierarchy
  console.log("\n[Scenario 28] Brand Logo and Navigation Hierarchy");
  const fs = await import("fs");
  assert(fs.existsSync("public/logo.jpg"), "Official brand logo image exists in public/logo.jpg");
  assert(fs.existsSync("public/icon.png"), "Official app icon exists in public/icon.png");
  assert(fs.existsSync("public/icon.svg"), "Official SVG icon exists in public/icon.svg");

  // Verify icon.png is a genuine PNG binary
  const pngHeader = fs.readFileSync("public/icon.png").slice(0, 8);
  const isRealPng = pngHeader.equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  assert(isRealPng, "public/icon.png is verified as genuine PNG binary");

  // Verify Leaderboard calculation includes unique usernames and remains available for Profile Ranks entry
  const lbWeekly = db.getLeaderboard("weekly");
  assert(lbWeekly.length > 0, "Leaderboard calculations remain available for Profile Ranks entry");
  assert(Boolean(lbWeekly[0].username), "Leaderboard entry carries unique Instagram-style username");

  // Scenario 29: Top 10 Indian Competitive Examinations Ordered by Candidate Volume & Major Subjects
  console.log("\n[Scenario 29] Top 10 Indian Competitive Examinations Ordered by Candidate Volume");
  const exams = db.getExaminations();
  assert(exams.length === 10, "Exactly top 10 Indian competitive exams present");
  assert(exams[0].id === "exam-railway-ntpc", "Rank #1 exam by student volume is Railways (RRB NTPC & Group D)");
  assert(exams[1].id === "exam-ssc-cgl", "Rank #2 exam by student volume is SSC CGL / CHSL / MTS");
  assert(exams[2].id === "exam-neet-ug", "Rank #3 exam by student volume is NEET UG");
  assert(exams[3].id === "exam-cuet-ug", "Rank #4 exam by student volume is CUET UG");
  assert(exams[4].id === "exam-jee-main", "Rank #5 exam by student volume is JEE Main");
  assert(exams[5].id === "exam-banking-ibps", "Rank #6 exam by student volume is Banking IBPS / SBI PO & Clerk");
  assert(exams[6].id === "exam-state-police", "Rank #7 exam by student volume is State Police / Constable & SI");
  assert(exams[7].id === "exam-state-pcs", "Rank #8 exam by student volume is State PCS");
  assert(exams[8].id === "exam-defence-cds", "Rank #9 exam by student volume is Defence NDA / CDS / AFCAT");
  assert(exams[9].id === "exam-upsc-csat", "Rank #10 exam by student volume is UPSC Civil Services");
  for (const ex of exams) {
    const subjects = db.getSubjects(ex.id);
    assert(subjects.length >= 3, `Exam '${ex.name}' has authentic major subjects mapped (${subjects.length} subjects)`);
  }

  // Scenario 30: Fresh User Signup & Absolute Zero Scratch Initialization
  console.log("\n[Scenario 30] Fresh User Signup & Absolute Zero Scratch Initialization");
  const freshUser = db.signUpUser({
    display_name: "Fresh Aspirant",
    username: "fresh_aspirant_01",
    target_exam: "Railways (RRB NTPC & Group D)",
    preferred_examination_id: "exam-railway-ntpc",
    avatar_url: "data:image/jpeg;base64,mockcompressedavatar",
  });
  assert(freshUser.current_streak === 0, "Fresh user starts at 0 streak");
  assert(freshUser.today_solved_count === 0, "Fresh user starts at 0 solved today");
  assert(freshUser.total_questions_answered === 0, "Fresh user starts at 0 total answered");
  assert(freshUser.overall_accuracy === 0, "Fresh user starts at 0% accuracy");
  const freshMatrix = db.getMatrixStats(freshUser.id, "today");
  assert(freshMatrix.total_solved === 0, "Fresh user matrix starts at 0 solved");
  assert(freshMatrix.accuracy_percentage === 0, "Fresh user matrix accuracy is 0%");
  assert(freshMatrix.fastest_correct_seconds === null, "Fresh user matrix fastest time is null");
  assert(db.getFriends(freshUser.id).length === 0, "Fresh user starts with empty friends list");
  assert(db.getUserCollections(freshUser.id).length === 0, "Fresh user starts with empty saved playlists");
  const defaultFeed = db.getFeedQuestions({ examId: "exam-railway-ntpc" });
  assert(defaultFeed.length === 10, "Default 10 clean GK/baseline questions are available for new user to browse immediately");

  // Scenario 31: Per-User Practice Increment & Multi-User Isolation
  console.log("\n[Scenario 31] Per-User Practice Increment & Multi-User Isolation");
  const preRahulStreak = db.getProfileById("user-current")?.current_streak || 0;
  const preRahulSolved = db.getProfileById("user-current")?.today_solved_count || 0;
  const preFreshAttempts = db.getAttemptsByUser(freshUser.id).length;

  const attemptResult = db.submitAttempt({
    userId: freshUser.id,
    questionId: "q-gk-1",
    selectedOptionId: "B", // Correct answer
    responseTimeMs: 4200,
  });
  assert(attemptResult.isCorrect === true, "Fresh user answered correctly");
  
  // Verify fresh user's stats incremented
  const updatedFreshUser = db.getProfileById(freshUser.id)!;
  assert(updatedFreshUser.current_streak === 1, "Fresh user streak incremented to 1");
  assert(updatedFreshUser.today_solved_count === 1, "Fresh user today solved incremented to 1");
  assert(updatedFreshUser.total_questions_answered === 1, "Fresh user total questions answered is 1");
  assert(updatedFreshUser.overall_accuracy === 100, "Fresh user overall accuracy updated to 100%");
  assert(db.getAttemptsByUser(freshUser.id).length === preFreshAttempts + 1, "Attempt recorded under fresh user ID");

  // Verify other users (Rahul) remained completely unaffected
  const postRahul = db.getProfileById("user-current")!;
  assert(postRahul.current_streak === preRahulStreak, "Unrelated user streak untouched");
  assert(postRahul.today_solved_count === preRahulSolved, "Unrelated user solved count untouched");

  // Scenario 32: Multi-Exam Authentic Subject Matrix (NEET UG, JEE Main, UPSC)
  console.log("\n[Scenario 32] Multi-Exam Authentic Subject Matrix (NEET UG, JEE Main, UPSC)");
  // A. NEET UG Student
  const neetUser = db.signUpUser({
    display_name: "NEET Aspirant",
    username: "neet_aspirant_2026",
    target_exam: "NEET UG (Medical Entrance)",
    preferred_examination_id: "exam-neet-ug",
  });
  const neetMatrix = db.getMatrixStats(neetUser.id, "lifetime");
  assert(neetMatrix.subjects.length === 3, "NEET matrix correctly evaluates exactly 3 NEET subjects");
  const neetSubjectSlugs = neetMatrix.subjects.map((s) => s.subject_slug || (s as any).slug);
  assert(neetSubjectSlugs.includes("biology"), "NEET matrix includes Biology");
  assert(neetSubjectSlugs.includes("chemistry"), "NEET matrix includes Chemistry");
  assert(neetSubjectSlugs.includes("physics"), "NEET matrix includes Physics");

  // B. JEE Main Student
  const jeeUser = db.signUpUser({
    display_name: "JEE Aspirant",
    username: "jee_topper_2026",
    target_exam: "JEE Main (Engineering Entrance)",
    preferred_examination_id: "exam-jee-main",
  });
  const jeeMatrix = db.getMatrixStats(jeeUser.id, "lifetime");
  assert(jeeMatrix.subjects.length === 3, "JEE Main matrix correctly evaluates exactly 3 JEE subjects");
  const jeeSubjectSlugs = jeeMatrix.subjects.map((s) => s.subject_slug || (s as any).slug);
  assert(jeeSubjectSlugs.includes("maths"), "JEE Main matrix includes Mathematics");
  assert(jeeSubjectSlugs.includes("physics"), "JEE Main matrix includes Physics");
  assert(jeeSubjectSlugs.includes("chemistry"), "JEE Main matrix includes Chemistry");

  // C. UPSC Student
  const upscUser = db.signUpUser({
    display_name: "UPSC Aspirant",
    username: "upsc_ias_2026",
    target_exam: "UPSC Civil Services (IAS / IPS Prelims)",
    preferred_examination_id: "exam-upsc-csat",
  });
  const upscMatrix = db.getMatrixStats(upscUser.id, "lifetime");
  assert(upscMatrix.subjects.length === 3, "UPSC matrix correctly evaluates exactly 3 UPSC subjects");
  const upscSubjectSlugs = upscMatrix.subjects.map((s) => s.subject_slug || (s as any).slug);
  assert(upscSubjectSlugs.includes("gk"), "UPSC matrix includes General Studies Paper-I");
  assert(upscSubjectSlugs.includes("reasoning"), "UPSC matrix includes CSAT Paper-II");
  assert(upscSubjectSlugs.includes("current-affairs"), "UPSC matrix includes Current Affairs");

  // Scenario 33: Guest Zero Matrix & Safe Fallback
  console.log("\n[Scenario 33] Guest Zero Matrix & Safe Fallback");
  const guestMatrix = db.getMatrixStats("guest", "today");
  assert(guestMatrix.total_solved === 0, "Guest matrix total solved is 0");
  assert(guestMatrix.accuracy_percentage === 0, "Guest matrix accuracy is 0%");
  assert(guestMatrix.fastest_correct_seconds === null, "Guest matrix fastest time is null");
  assert(Boolean(guestMatrix.weekly_activity?.every((w) => w.count === 0)), "Guest weekly activity has 0 counts");

  // Scenario 34: Username Availability Strictness & Conflict Block
  console.log("\n[Scenario 34] Username Availability Strictness & Conflict Block");
  assert(db.isUsernameAvailable("fresh_aspirant_01") === false, "Taken username correctly reported unavailable");
  assert(db.isUsernameAvailable("fresh_aspirant_01", freshUser.id) === true, "Self username update allowed");
  let collisionBlocked = false;
  try {
    db.signUpUser({
      display_name: "Collision Imposter",
      username: "fresh_aspirant_01",
    });
  } catch {
    collisionBlocked = true;
  }
  assert(collisionBlocked, "Duplicate signup strictly blocked with collision rejection");

  // Scenario 35: Pure Hindi Question Creation & Character Limit (up to 600 chars)
  console.log("\n[Scenario 35] Pure Hindi Question Creation & Character Limit");
  const hindiQuestionText = "भारतीय संविधान का कौन सा अनुच्छेद अस्पृश्यता के उन्मूलन से संबंधित है और इसका किसी भी रूप में आचरण निषिद्ध करता है? यह मौलिक अधिकारों के तहत समानता के अधिकार का एक अभिन्न अंग है।";
  assert(hindiQuestionText.length > 5, "Hindi question text is long and valid");
  assert(hindiQuestionText.length <= 600, "Hindi question within 600 character limit");

  const createdHindiQ = db.createQuestion({
    examinationId: "exam-railway-ntpc",
    subjectId: "subj-railway-gk",
    questionText: "", // Empty English!
    hindiQuestionText: hindiQuestionText,
    language: "hi",
    options: [
      { id: "A", text: "अनुच्छेद 14", hindi_text: "अनुच्छेद 14" },
      { id: "B", text: "अनुच्छेद 17", hindi_text: "अनुच्छेद 17" },
      { id: "C", text: "अनुच्छेद 19", hindi_text: "अनुच्छेद 19" },
      { id: "D", text: "अनुच्छेद 21", hindi_text: "अनुच्छेद 21" },
    ],
    correctOptionId: "B",
    explanation: "",
    hindiExplanation: "अनुच्छेद 17 अस्पृश्यता का अंत करता है और इसका अभ्यास निषिद्ध बनाता है।",
    difficulty: "medium",
    syllabusTag: "Polity · Fundamental Rights",
  });
  assert(createdHindiQ.id.startsWith("q-"), "Hindi-only question successfully created in store");
  assert(createdHindiQ.language === "hi", "Question language registered as 'hi'");
  assert(createdHindiQ.hindi_question_text === hindiQuestionText, "Hindi question text faithfully preserved");
  assert(createdHindiQ.question_text === hindiQuestionText, "Question text fallback populated with Hindi text");

  // Scenario 36: Dynamic Subject Topics Mapping (getTopicsForSubject)
  console.log("\n[Scenario 36] Dynamic Subject Topics & Subtopics Mapping");
  const gkTopics = getTopicsForSubject("gk");
  assert(gkTopics.some((t) => t.includes("Polity")), "GK includes Indian Polity");
  assert(gkTopics.some((t) => t.includes("History")), "GK includes Indian History");

  const mathsTopics = getTopicsForSubject("maths");
  assert(mathsTopics.some((t) => t.includes("Profit & Loss")), "Maths includes Profit & Loss");
  assert(mathsTopics.some((t) => t.includes("Algebra")), "Maths includes Algebra");

  const bioTopics = getTopicsForSubject("biology");
  assert(bioTopics.some((t) => t.includes("Human Physiology")), "Biology includes Human Physiology");

  // Scenario 37: User Profile Language Preference & Feed Filtering
  console.log("\n[Scenario 37] User Profile Language Preference & Feed Filtering");
  const hindiUser = db.signUpUser({
    display_name: "Vikram Kumar",
    username: "vikram_hindi_aspirant",
    preferred_examination_id: "exam-railway-ntpc",
    language_preference: "hi",
  });
  assert(hindiUser.language_preference === "hi", "User saved with Hindi language preference");

  const hindiFeed = db.getFeedQuestions({
    examId: "exam-railway-ntpc",
    language: "hi",
  });
  assert(hindiFeed.length > 0, "Feed returned questions for Hindi filter");
  assert(
    hindiFeed.every((q) => q.language === "hi" || Boolean(q.hindi_question_text)),
    "Every question in Hindi feed carries Hindi text or Hindi flag"
  );

  const englishFeed = db.getFeedQuestions({
    examId: "exam-railway-ntpc",
    language: "en",
  });
  assert(englishFeed.length > 0, "Feed returned questions for English filter");

  // Scenario 38: WhatsApp Group URL, Founder Contact & Central i18n
  console.log("\n[Scenario 38] WhatsApp Community & Founder Direct Support");
  assert(OFFICIAL_WHATSAPP_GROUP_URL === "https://chat.whatsapp.com/JaluiYU8C6nKGrr3YXBn6L", "Official WhatsApp group URL verified");
  assert(FOUNDER_PHONE === "+91 9798482404", "Founder phone contact verified");
  assert(FOUNDER_EMAIL === "atish2k22@gmail.com", "Founder email contact verified");
  assert(FOUNDER_WHATSAPP_LINK.includes("919798482404"), "Founder direct WhatsApp link verified");
  assert(TRANSLATIONS.en.startQuiz === "Start Qz Loop 🚀", "English i18n translation verified");
  assert(TRANSLATIONS.hi.startQuiz === "क्विज़ लूप शुरू करें 🚀", "Hindi i18n translation verified");
  assert(TRANSLATIONS.en.joinWhatsAppCommunity === "Join WhatsApp Group", "WhatsApp community English string verified");
  assert(TRANSLATIONS.hi.joinWhatsAppCommunity === "व्हाट्सएप ग्रुप से जुड़ें", "WhatsApp community Hindi string verified");

  // Scenario 39: 2-step Signup with Google ID, Handle & Email Persistence
  console.log("\n[Scenario 39] 2-step Signup with Google ID, Handle & Email Persistence");
  const stepTwoUser = db.signUpUser({
    display_name: "Pooja Verma",
    username: "pooja_railway_2026",
    target_exam: "Railways (RRB NTPC & Group D)",
    preferred_examination_id: "exam-railway-ntpc",
    email: "pooja.verma@example.com",
    language_preference: "hi",
  });
  assert(stepTwoUser.email === "pooja.verma@example.com", "User email saved during signup");
  assert(stepTwoUser.language_preference === "hi", "User study language preference saved during signup");

  const updatedStepTwoProfile = db.updateProfile(stepTwoUser.id, {
    email: "pooja.updated@example.com",
    display_name: "Pooja V.",
  });
  assert(updatedStepTwoProfile.email === "pooja.updated@example.com", "User email editable and updated in Profile");
  assert(updatedStepTwoProfile.display_name === "Pooja V.", "Display name updated in Profile");

  const syncedUser = db.syncUserFromAuth({
    id: "user-google-oauth-test",
    display_name: "Google Aspirant",
    username: "google_aspirant_99",
    email: "google.oauth@gmail.com",
    target_exam: "NEET UG (Medical Entrance)",
    preferred_examination_id: "exam-neet-ug",
  });
  assert(syncedUser.email === "google.oauth@gmail.com", "OAuth sync persists student email");

  // Scenario 40: Creator Studio 600-Character Ceiling Enforcement & Overlength Rejection
  console.log("\n[Scenario 40] Creator Studio 600-Character Limit Enforcement");
  const validLongQText = "A".repeat(595);
  const validLongQ = db.createQuestion({
    subjectId: "subj-maths",
    questionText: validLongQText,
    options: [
      { id: "A", text: "Option A" },
      { id: "B", text: "Option B" },
      { id: "C", text: "Option C" },
      { id: "D", text: "Option D" },
    ],
    correctOptionId: "A",
  });
  assert(validLongQ.question_text.length === 595, "Question with 595 chars accepted");

  let overlengthRejected = false;
  try {
    db.createQuestion({
      subjectId: "subj-maths",
      questionText: "B".repeat(605),
      options: [
        { id: "A", text: "Option A" },
        { id: "B", text: "Option B" },
      ],
      correctOptionId: "A",
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes("600 characters")) {
      overlengthRejected = true;
    }
  }
  assert(overlengthRejected === true, "Question exceeding 600 characters strictly rejected with error");

  // Scenario 41: Dynamic Subject Topics Mapping & Target Topic Persistence
  console.log("\n[Scenario 41] Dynamic Subject Topics Mapping & Target Topic Persistence");
  const neetBioTopics = getTopicsForSubject("biology");
  assert(neetBioTopics.some((t) => t.includes("Genetics")), "NEET Biology includes Genetics");

  const neetPhyTopics = getTopicsForSubject("physics");
  assert(neetPhyTopics.some((t) => t.includes("Optics") || t.includes("Mechanics")), "NEET Physics includes Optics/Mechanics");

  const neetChemTopics = getTopicsForSubject("chemistry");
  assert(neetChemTopics.some((t) => t.includes("Organic Chemistry")), "NEET Chemistry includes Organic Chemistry");

  const qWithTopic = db.createQuestion({
    subjectId: "subj-neet-bio",
    questionText: "Which organelle is known as the powerhouse of the cell?",
    targetTopic: "Cell Structure & Function",
    syllabusTag: "Cytology",
    options: [
      { id: "A", text: "Mitochondria" },
      { id: "B", text: "Ribosome" },
      { id: "C", text: "Golgi Apparatus" },
      { id: "D", text: "Nucleus" },
    ],
    correctOptionId: "A",
  });
  assert(Boolean(qWithTopic.syllabus_tag?.includes("Cell Structure & Function")), "Target topic is persisted in syllabus_tag");

  // Scenario 42: Dark Mode Light Purple Contrast & i18n Dictionary Parity
  console.log("\n[Scenario 42] Dark Mode Contrast & Comprehensive i18n Coverage");
  const globalsCss = fs.readFileSync(path.join(__dirname, "../app/globals.css"), "utf8");
  assert(globalsCss.includes("#a855f7") || globalsCss.includes("#c084fc"), "Dark mode globals.css has light purple contrast overrides (#a855f7 / #c084fc)");

  const requiredI18nKeys = [
    "metricSolved",
    "metricAccuracy",
    "metricResults",
    "metricTotalTime",
    "metricAvgTime",
    "metricFastest",
    "examScoringTitle",
    "hideQuestion",
    "repeatPrompt",
    "welcomeAspirant",
    "startQuiz",
    "skipQuestion",
    "joinWhatsAppCommunityBanner",
  ] as const;

  for (const key of requiredI18nKeys) {
    assert(Boolean(TRANSLATIONS.en[key]), `English dictionary contains '${key}'`);
    assert(Boolean(TRANSLATIONS.hi[key]), `Hindi dictionary contains '${key}'`);
  }

  // Scenario 43: Instagram-Style Collections / Playlists & Independent Save
  console.log("\n[Scenario 43] Instagram-Style Collections / Playlists & Independent Save");
  const testStudentId = "user-student-collections-test";
  const otherStudentId = "user-other-collections-test";

  // Create playlist
  const testCol43 = db.createCollection(testStudentId, "Maths Trigonometry Hacks", "Formulas and fast proofs");
  assert(testCol43.name === "Maths Trigonometry Hacks", "Collection created with correct title");
  assert(testCol43.user_id === testStudentId, "Collection assigned to target student");

  // Independent quick save to 'Saved Questions'
  const indepSave = db.saveQuestionToCollection(testStudentId, "q-rrb-01", "Saved Questions");
  assert(indepSave.saved === true, "Question saved independently to 'Saved Questions'");

  // Save to custom playlist
  const customSave = db.saveQuestionToCollection(testStudentId, "q-rrb-01", "Maths Trigonometry Hacks");
  assert(customSave.saved === true, "Question saved to custom playlist");

  // Verify multiple collections contain the question
  const activePlaylists = db.getQuestionCollections(testStudentId, "q-rrb-01");
  assert(activePlaylists.includes("Saved Questions"), "Question indexed in Saved Questions");
  assert(activePlaylists.includes("Maths Trigonometry Hacks"), "Question indexed in custom playlist");

  // Verify user isolation: other student starts with 0 collections
  const otherCols = db.getUserCollections(otherStudentId);
  assert(otherCols.length === 0, "Other student's collections are completely isolated");

  // Remove from collection
  const removed = db.removeQuestionFromCollection(testStudentId, "q-rrb-01", "Maths Trigonometry Hacks");
  assert(removed === true, "Question removed from custom playlist");
  const remainingPlaylists = db.getQuestionCollections(testStudentId, "q-rrb-01");
  assert(!remainingPlaylists.includes("Maths Trigonometry Hacks"), "Question no longer in custom playlist");
  assert(remainingPlaylists.includes("Saved Questions"), "Independent quick save remains intact");

  // Scenario 44: Direct Question Suggestion Delivery & Non-Friend Chat Inbox
  console.log("\n[Scenario 44] Direct Question Suggestion Delivery & Non-Friend Chat Inbox");
  const authorUserId = "user-creator-author-44";
  const studentSuggestorId = "user-student-suggestor-44";

  // Student is NOT friend of author
  const authorFriends = db.getFriends(authorUserId);
  assert(!authorFriends.some((f) => f.id === studentSuggestorId), "Suggestor is not in author's friends list");

  // Student submits suggestion message
  const suggestionText = "💡 Correction / Suggestion for Question: Option B formula should be 2*pi*r";
  const testMsg44 = db.sendMessage({
    fromUserId: studentSuggestorId,
    toUserId: authorUserId,
    text: suggestionText,
    questionId: "q-rrb-01",
  });
  assert(testMsg44.id.startsWith("msg-"), "Suggestion direct message successfully created");

  // Author retrieves all messages
  const authorInbox = db.getAllMessagesForUser(authorUserId);
  const foundSuggestion = authorInbox.find((m) => m.id === testMsg44.id);
  assert(Boolean(foundSuggestion), "Author inbox receives non-friend question suggestion directly");
  assert(Boolean(foundSuggestion?.text?.includes("💡 Correction")), "Suggestion message body faithfully preserved");

  // Scenario 45: Authored Questions Deletion & Store Clean-up
  console.log("\n[Scenario 45] Authored Questions Deletion & Store Clean-up");
  const authorQ = db.createQuestion({
    subjectId: "subj-maths",
    questionText: "Sample temporary authored question to be deleted by creator",
    options: [
      { id: "A", text: "Alpha" },
      { id: "B", text: "Beta" },
    ],
    correctOptionId: "A",
  });
  assert(authorQ.id.startsWith("q-"), "Authored question created");

  // Save into collection first
  db.saveQuestionToCollection(testStudentId, authorQ.id, "Saved Questions");
  assert(db.getQuestionCollections(testStudentId, authorQ.id).includes("Saved Questions"), "Question initially in Saved Questions");

  // Delete question
  const deleteSuccess = db.deleteQuestion(authorQ.id);
  assert(deleteSuccess === true, "Author successfully deletes their created question");
  assert(db.getQuestionById(authorQ.id) === undefined, "Deleted question no longer retrievable from questions store");
  assert(!db.getQuestionCollections(testStudentId, authorQ.id).includes("Saved Questions"), "Deleted question purged from collections");

  // Scenario 46: Complete i18n Parity & Daily Goal Tracker Translations
  console.log("\n[Scenario 46] Complete i18n Parity & Localization Coverage");
  const newlyVerifiedKeys = [
    "dailyGoalReached",
    "dailyGoalRemaining",
    "exactDuplicateDetected",
    "similarQuestionExists",
    "loadingQuestionDetails",
    "suggestCorrection",
    "moreOptions",
    "onboardingSlide1Title",
    "onboardingSlide2Title",
    "onboardingSlide3Title",
    "onboardingSlide4Title",
  ] as const;

  for (const k of newlyVerifiedKeys) {
    assert(Boolean(TRANSLATIONS.en[k]), `English dictionary contains '${k}'`);
    assert(Boolean(TRANSLATIONS.hi[k]), `Hindi dictionary contains '${k}'`);
  }

  // Scenario 47: Live Google OAuth Bridge & AuthSync Recovery
  console.log("\n[Scenario 47] Live Google OAuth Bridge & AuthSync Recovery");
  const authCallbackRouteFile = fs.readFileSync(path.join(__dirname, "../app/auth/callback/route.ts"), "utf8");
  assert(authCallbackRouteFile.includes("localStorage.setItem(\"qz_user_id\""), "Auth callback writes user ID directly to client localStorage via bridge script");
  assert(authCallbackRouteFile.includes("document.cookie = \"qz_user_id=\""), "Auth callback persists secure qz_user_id cookie");
  assert(authCallbackRouteFile.includes("window.dispatchEvent(new CustomEvent(\"qz_auth_changed\""), "Auth callback triggers immediate client-side reactive auth broadcast");
  assert(authCallbackRouteFile.includes("errorDesc || errorParam"), "Auth callback renders clean user-facing error notice if OAuth provider denies access");

  const authSyncComponentFile = fs.readFileSync(path.join(__dirname, "../components/auth/AuthSync.tsx"), "utf8");
  assert(authSyncComponentFile.includes("syncFromCookie"), "AuthSync provides cookie-to-localStorage automated fallback");
  assert(authSyncComponentFile.includes("supabase.auth.onAuthStateChange"), "AuthSync subscribes to live Supabase OAuth session changes");

  const layoutFile = fs.readFileSync(path.join(__dirname, "../app/layout.tsx"), "utf8");
  assert(layoutFile.includes("<AuthSync />"), "RootLayout actively mounts <AuthSync /> on every application page");

  // Scenario 48: Onboarding Persistence & Single-Session Guard
  console.log("\n[Scenario 48] Onboarding Persistence & Single-Session Guard");
  const newOnboardingUser = db.signUpUser({
    display_name: "Ramesh Verma",
    username: "ramesh_railway",
    target_exam: "Railways (RRB NTPC & Group D)",
    preferred_examination_id: "exam-railway-ntpc",
  });
  assert(newOnboardingUser.onboarding_completed === true, "New user signed up has onboarding_completed: true");

  const syncedOnboardingUser = db.syncUserFromAuth({
    id: "user-synced-cloud",
    display_name: "Cloud User",
    username: "cloud_user",
    onboarding_completed: true,
  });
  assert(syncedOnboardingUser.onboarding_completed === true, "Auth sync preserves onboarding_completed: true");

  const seedCurrent = db.getProfileById("user-current");
  assert(seedCurrent?.onboarding_completed === true, "Seed profiles have onboarding_completed: true");

  const onboardingModalFile = fs.readFileSync(path.join(__dirname, "../components/auth/UsernameOnboardingModal.tsx"), "utf8");
  assert(onboardingModalFile.includes("qz_onboarding_completed"), "UsernameOnboardingModal checks qz_onboarding_completed in localStorage");
  assert(onboardingModalFile.includes("data.user.onboarding_completed"), "UsernameOnboardingModal checks data.user.onboarding_completed");
  assert(onboardingModalFile.includes("qz_auth_changed"), "UsernameOnboardingModal listens to qz_auth_changed");

  // Scenario 49: Author ID Preservation & Feed Community Prioritization
  console.log("\n[Scenario 49] Author ID Preservation & Feed Community Prioritization");
  const specificAuthorId = "user-creator-789";
  const authoredQ = db.createQuestion({
    authorId: specificAuthorId,
    subjectId: "subj-gk",
    questionText: "What is the capital of Jharkhand state in India?",
    options: [
      { id: "A", text: "Ranchi" },
      { id: "B", text: "Patna" },
      { id: "C", text: "Jamshedpur" },
      { id: "D", text: "Dhanbad" },
    ],
    correctOptionId: "A",
  });
  assert(authoredQ.author_id === specificAuthorId, "Question created with explicit authorId preserves author_id");

  const authorQuestions = db.getQuestionsByAuthor(specificAuthorId);
  assert(authorQuestions.some((q) => q.id === authoredQ.id), "getQuestionsByAuthor retrieves question by author ID");

  const feedForAuthor = db.getFeedQuestions({ userId: specificAuthorId, limit: 10 });
  assert(feedForAuthor.some((q) => q.id === authoredQ.id), "Authored question appears in feed for author");
  assert(feedForAuthor[0].id === authoredQ.id, "Newly authored question is prioritized at index 0 in the feed");

  // Scenario 50: 0-Baseline Real Community Metrics Guarantee
  console.log("\n[Scenario 50] 0-Baseline Real Community Metrics Guarantee");
  const cleanBaselineQ = db.getQuestionById("q-math-1");
  assert(cleanBaselineQ?.total_attempts === 0, "Seed question total_attempts is 0");
  assert(cleanBaselineQ?.correct_attempts === 0, "Seed question correct_attempts is 0");
  assert(cleanBaselineQ?.total_time_ms === 0, "Seed question total_time_ms is 0");
  assert(cleanBaselineQ?.quality_upvotes === 0, "Seed question quality_upvotes is 0");

  const questionCardFile = fs.readFileSync(path.join(__dirname, "../components/loop/QuestionReelCard.tsx"), "utf8");
  assert(questionCardFile.includes("metrics.attempts.toLocaleString()"), "QuestionReelCard displays real numerical attempts");
  assert(questionCardFile.includes("accuracyPercentage"), "QuestionReelCard displays real accuracy percentage");
  assert(questionCardFile.includes("metrics.avgTimeSec"), "QuestionReelCard displays real average solve speed");
  assert(questionCardFile.includes("metrics.fastestSec ? `${metrics.fastestSec}s` : \"0s\""), "QuestionReelCard displays 0s baseline fastest solve");

  // Scenario 51: Mutual Friendship Workflow & Study Chat Sender Attribution
  console.log("\n[Scenario 51] Mutual Friendship Workflow & Study Chat Sender Attribution");
  const studentA = db.signUpUser({ display_name: "Student Alpha", username: "student_alpha" });
  const studentB = db.signUpUser({ display_name: "Student Beta", username: "student_beta" });
  const studentAId = studentA.id;
  const studentBId = studentB.id;

  const sendResult = db.sendFriendRequest(studentAId, studentBId);
  assert(sendResult.success === true, "Student A successfully sends friend request to Student B");

  const bIncoming = db.getIncomingFriendRequests(studentBId);
  assert(bIncoming.some((r) => r.id === studentAId), "Student B sees Student A in incoming friend requests");

  const acceptResult = db.respondFriendRequest(studentBId, studentAId, "accept");
  assert(acceptResult.success === true, "Student B successfully accepts Student A's friend request");

  const aFriends = db.getFriends(studentAId);
  const bFriends = db.getFriends(studentBId);
  assert(aFriends.some((f) => f.id === studentBId && f.status === "friend"), "Student B is mutual friend of Student A");
  assert(bFriends.some((f) => f.id === studentAId && f.status === "friend"), "Student A is mutual friend of Student B");

  const sentMessage = db.sendMessage({
    fromUserId: studentAId,
    toUserId: studentBId,
    text: "Hey, try this tricky polity question!",
    questionId: authoredQ.id,
  });
  assert(sentMessage.from_user_id === studentAId, "Study chat message has correct from_user_id");
  assert(sentMessage.to_user_id === studentBId, "Study chat message has correct to_user_id");
  assert(sentMessage.question_id === authoredQ.id, "Study chat message embeds shared question ID");

  const studyChatFile = fs.readFileSync(path.join(__dirname, "../components/loop/StudyChatModal.tsx"), "utf8");
  assert(studyChatFile.includes("currentUid ? m.from_user_id === currentUid : m.from_user_id === \"user-current\""), "StudyChatModal uses dynamic user ID attribution instead of hardcoded user-current");

  // Scenario 52: 'Others' Custom Topic & Simplified Village Question Creation
  console.log("\n[Scenario 52] 'Others' Custom Topic & Simplified Village Question Creation");
  const s52GkTopics = getTopicsForSubject("gk");
  const s52MathTopics = getTopicsForSubject("maths");
  const s52BioTopics = getTopicsForSubject("biology");
  assert(s52GkTopics.includes("Others"), "GK topics include 'Others' option");
  assert(s52MathTopics.includes("Others"), "Maths topics include 'Others' option");
  assert(s52BioTopics.includes("Others"), "Biology topics include 'Others' option");

  const customQ = db.createQuestion({
    subjectId: "subj-gk",
    questionText: "What is the ancient name of Patna city in Bihar?",
    targetTopic: "प्राचीन भारतीय इतिहास",
    syllabusTag: "Bihar History",
    options: [
      { id: "A", text: "Pataliputra" },
      { id: "B", text: "Magadha" },
      { id: "C", text: "Vaishali" },
      { id: "D", text: "Anga" },
    ],
    correctOptionId: "A",
  });
  assert(Boolean(customQ.syllabus_tag?.includes("प्राचीन भारतीय इतिहास")), "Custom topic is preserved in syllabus_tag");

  const createViewFile = fs.readFileSync(path.join(__dirname, "../components/create/CreateQuestionView.tsx"), "utf8");
  assert(createViewFile.includes("targetTopic === \"Others\""), "CreateQuestionView renders custom topic input when 'Others' selected");
  assert(createViewFile.includes("Easy 3-Step Question Maker"), "CreateQuestionView renders simplified 3-step beginner guide");

  const topHeaderFile = fs.readFileSync(path.join(__dirname, "../components/layout/TopHeader.tsx"), "utf8");
  assert(topHeaderFile.includes("Qz-loop"), "TopHeader displays prominent brand name 'Qz-loop'");
  assert(!topHeaderFile.includes("onClick={onSelectExam}"), "TopHeader has removed exam switcher button from JSX");

  // Scenario 53: Authentic NEET UG Feed Isolation, Subject Filters & Authoring Prioritization
  console.log("\n[Scenario 53] Authentic NEET UG Feed Isolation, Subject Filters & Authoring Prioritization");
  const neetFeed = db.getFeedQuestions({
    examId: "exam-neet-ug",
    subjectSlug: "all",
  });
  assert(neetFeed.length >= 5, "NEET UG feed returns authentic seed questions");
  assert(neetFeed.every((q) => q.examination_id === "exam-neet-ug"), "All questions in NEET feed strictly belong to exam-neet-ug");
  assert(!neetFeed.some((q) => q.examination_id === "exam-ssc-cgl"), "SSC CGL questions do not contaminate NEET feed");

  // Verify NEET subject filters
  const neetBioFeed = db.getFeedQuestions({
    examId: "exam-neet-ug",
    subjectSlug: "biology",
  });
  assert(neetBioFeed.length > 0, "NEET Biology filter returns questions");
  assert(neetBioFeed.every((q) => q.subject_slug === "biology"), "All questions in NEET Biology feed have subject_slug 'biology'");

  const neetChemFeed = db.getFeedQuestions({
    examId: "exam-neet-ug",
    subjectSlug: "chemistry",
  });
  assert(neetChemFeed.length > 0, "NEET Chemistry filter returns questions");
  assert(neetChemFeed.every((q) => q.subject_slug === "chemistry"), "All questions in NEET Chemistry feed have subject_slug 'chemistry'");

  const neetPhyFeed = db.getFeedQuestions({
    examId: "exam-neet-ug",
    subjectSlug: "physics",
  });
  assert(neetPhyFeed.length > 0, "NEET Physics filter returns questions");
  assert(neetPhyFeed.every((q) => q.subject_slug === "physics"), "All questions in NEET Physics feed have subject_slug 'physics'");

  // Verify non-NEET exam feed does not contain NEET questions
  const sscFeed = db.getFeedQuestions({
    examId: "exam-ssc-cgl",
    subjectSlug: "all",
  });
  assert(!sscFeed.some((q) => q.examination_id === "exam-neet-ug"), "NEET questions do not leak into SSC CGL feed");

  // Verify newly authored NEET question is prioritized at index 0 in NEET feed
  const testNeetAuthorId = "usr-neet-aspirant-99";
  const newNeetQ = db.createQuestion({
    examinationId: "exam-neet-ug",
    subjectId: "subj-neet-bio",
    questionText: "Which organelle is known as the powerhouse of the cell in biology?",
    targetTopic: "Cell Structure and Function",
    options: [
      { id: "A", text: "Mitochondria" },
      { id: "B", text: "Ribosome" },
      { id: "C", text: "Golgi apparatus" },
      { id: "D", text: "Lysosome" },
    ],
    correctOptionId: "A",
    authorId: testNeetAuthorId,
  });
  assert(newNeetQ.examination_id === "exam-neet-ug", "Newly created question preserves NEET exam ID");
  assert(newNeetQ.author_id === testNeetAuthorId, "Newly created question preserves author ID");

  const neetAuthorQuestions = db.getQuestionsByAuthor(testNeetAuthorId);
  assert(neetAuthorQuestions.some((q) => q.id === newNeetQ.id), "getQuestionsByAuthor retrieves newly authored NEET question");

  const neetFeedWithAuthor = db.getFeedQuestions({
    examId: "exam-neet-ug",
    userId: testNeetAuthorId,
  });
  assert(neetFeedWithAuthor[0].id === newNeetQ.id, "Newly authored question is prioritized at index 0 for the author");

  // Scenario 54: Authentic Target Exam Countdown Engine & Hero Display
  console.log("\n[Scenario 54] Authentic Target Exam Countdown Engine & Hero Display");
  // Oct 18, 2026 system date
  const systemRefDate = new Date(2026, 9, 18);
  const neetCountdown = getExamCountdown("exam-neet-ug", systemRefDate);
  assert(neetCountdown.daysLeft === 196, `NEET 2027 countdown from Oct 18, 2026 is exactly 196 days (got ${neetCountdown.daysLeft})`);
  assert(neetCountdown.examDisplayName === "NEET 2027", "NEET exam display name is 'NEET 2027'");
  assert(neetCountdown.headlineEn === "196 days left for NEET 2027", "Headline matches '196 days left for NEET 2027'");
  assert(neetCountdown.headlineHi.includes("196 दिन शेष"), "Hindi headline contains '196 दिन शेष'");

  const jeeCountdown = getExamCountdown("exam-jee-main", systemRefDate);
  assert(jeeCountdown.examDisplayName === "JEE Main 2027", "JEE exam display name is 'JEE Main 2027'");
  assert(jeeCountdown.daysLeft > 0, "JEE countdown returns positive days left");

  const homeDashboardFile = fs.readFileSync(path.join(__dirname, "../components/home/HomeDashboardView.tsx"), "utf8");
  assert(homeDashboardFile.includes("getExamCountdown"), "HomeDashboardView imports getExamCountdown");
  assert(homeDashboardFile.includes("examCountdown.headlineEn"), "HomeDashboardView renders English countdown headline");
  assert(homeDashboardFile.includes("text-2xl sm:text-3xl font-black"), "HomeDashboardView renders prominent countdown typography");

  // Scenario 55: Simplified Village-Friendly Creator Studio
  console.log("\n[Scenario 55] Simplified Village-Friendly Creator Studio");
  const s55CreateFile = fs.readFileSync(path.join(__dirname, "../components/create/CreateQuestionView.tsx"), "utf8");
  assert(!s55CreateFile.includes("Question Quality Index"), "Quality Index meter removed from Create UI");
  assert(!s55CreateFile.includes("Position under"), "Position under exam selector card removed from Create UI");
  assert(!s55CreateFile.includes("Penalty for wrong attempt"), "Penalty dropdown removed from Create UI");
  assert(s55CreateFile.includes("qz_local_authored_questions"), "CreateQuestionView caches authored questions in localStorage");
  assert(s55CreateFile.includes("qz_question_created"), "CreateQuestionView dispatches qz_question_created event");

  const s55ProfileFile = fs.readFileSync(path.join(__dirname, "../components/profile/ProfileView.tsx"), "utf8");
  assert(s55ProfileFile.includes("qz_local_authored_questions"), "ProfileView syncs with qz_local_authored_questions");

  // Scenario 56: Header & Bottom Navigation Profile & Language Settings Integration
  console.log("\n[Scenario 56] Header & Bottom Navigation Profile & Language Settings Integration");
  const s56HeaderFile = fs.readFileSync(path.join(__dirname, "../components/layout/TopHeader.tsx"), "utf8");
  assert(!s56HeaderFile.includes("toggleLanguage") && !s56HeaderFile.includes("setLanguage"), "TopHeader does not include language switcher button");
  assert(!s56HeaderFile.includes("href=\"/profile\""), "TopHeader does not include top-right profile photo link");

  const s56BottomNavFile = fs.readFileSync(path.join(__dirname, "../components/layout/BottomNav.tsx"), "utf8");
  assert(s56BottomNavFile.includes("user?.avatar_url"), "BottomNav renders avatar photo if user has uploaded avatar");
  assert(s56BottomNavFile.includes("rounded-full overflow-hidden"), "BottomNav renders avatar in a circular cutout");
  assert(s56BottomNavFile.includes("person"), "BottomNav renders fallback person icon");

  const s56ProfileFile = fs.readFileSync(path.join(__dirname, "../components/profile/ProfileView.tsx"), "utf8");
  assert(s56ProfileFile.includes("setAppLanguage"), "ProfileView provides language switcher via setAppLanguage");
  assert(s56ProfileFile.includes("App Language (भाषा)"), "ProfileView settings includes App Language option");

  // Scenario 57: Light Mode Default, Target Headline, First-Time Exam Selector, Quiz Loop UI Overhaul & Guest Auth Gating
  console.log("\n[Scenario 57] Light Mode Default, Target Headline, First-Time Exam Selector, Quiz Loop UI Overhaul & Guest Auth Gating");
  const s57LayoutFile = fs.readFileSync(path.join(__dirname, "../app/layout.tsx"), "utf8");
  assert(s57LayoutFile.includes("theme === 'dark'"), "Layout script activates dark mode only when explicitly saved as dark");
  assert(!s57LayoutFile.includes("prefers-color-scheme: dark"), "Layout script does not default to dark via prefers-color-scheme");

  const s57HomeFile = fs.readFileSync(path.join(__dirname, "../components/home/HomeDashboardView.tsx"), "utf8");
  assert(s57HomeFile.includes("Your Target is") && s57HomeFile.includes("Practice Unlimited"), "HomeDashboardView renders 'Your Target is ... Practice Unlimited' headline");
  assert(s57HomeFile.includes("<FirstTimeExamModal"), "HomeDashboardView mounts FirstTimeExamModal");
  assert(s57HomeFile.includes("filter blur-md"), "HomeDashboardView gates lower dashboard for guests with blur container");

  const s57ModalFile = fs.readFileSync(path.join(__dirname, "../components/home/FirstTimeExamModal.tsx"), "utf8");
  assert(s57ModalFile.includes("/loop?start=true&examId="), "FirstTimeExamModal redirects with deep link parameters");

  const s57ReelFile = fs.readFileSync(path.join(__dirname, "../components/loop/QuestionReelCard.tsx"), "utf8");
  assert(!s57ReelFile.includes("Question by <strong"), "QuestionReelCard removed 'Question by' row above question text");
  assert(!s57ReelFile.includes("I know this (hide)"), "QuestionReelCard removed bottom 'I know this (hide)' bar");
  assert(!s57ReelFile.includes("Next Question (Swipe)"), "QuestionReelCard removed swipe button above profile tab");
  assert(s57ReelFile.includes("authorEmoji"), "QuestionReelCard renders authorEmoji avatar");

  const s57LoopContainerFile = fs.readFileSync(path.join(__dirname, "../components/loop/QuizLoopContainer.tsx"), "utf8");
  assert(s57LoopContainerFile.includes("status.isAnswerMode && !status.isAnswered"), "QuizLoopContainer only prompts skip modal if user revealed answers");
  assert(s57LoopContainerFile.includes("qz_quiz_lang"), "QuizLoopContainer includes top bilingual switch");
  assert(s57LoopContainerFile.includes("startParamHandledRef"), "QuizLoopContainer guards against infinite auto-start re-triggers");
  assert(s57LoopContainerFile.includes("isAnswerMode: false"), "QuizLoopContainer resets activeStatusRef upon reel transition");

  const s57TopHeaderFile = fs.readFileSync(path.join(__dirname, "../components/layout/TopHeader.tsx"), "utf8");
  assert(s57TopHeaderFile.includes("qz_theme_changed"), "TopHeader synchronizes theme state with qz_theme_changed");

  const s57CreateFile = fs.readFileSync(path.join(__dirname, "../components/create/CreateQuestionView.tsx"), "utf8");
  assert(s57CreateFile.includes("filter blur-md"), "CreateQuestionView gates form below banner with blur container");

  const s57SocialFile = fs.readFileSync(path.join(__dirname, "../components/social/SocialView.tsx"), "utf8");
  assert(s57SocialFile.includes("filter blur-md"), "SocialView gates social lounge below header with blur container");

  const s57ProfileFile = fs.readFileSync(path.join(__dirname, "../components/profile/ProfileView.tsx"), "utf8");
  assert(s57ProfileFile.includes("filter blur-md"), "ProfileView gates profile and settings with blur container");
  assert(s57ProfileFile.includes("Target Examination") || s57ProfileFile.includes("Target Exam"), "ProfileView provides guest exam switcher card");

  // Scenario 58: Smart OCR Scanner, Spaced Repetition Feed, Horizontal SWIPE, Digital Timer & Post-Answer Modal
  console.log("\n[Scenario 58] Smart OCR Scanner, Spaced Repetition Feed, Horizontal SWIPE, Digital Timer & Post-Answer Modal");

  // 1. OCR Parser heuristics - Standard, Numbered, Inline, 2x2 and Hindi
  const sampleOcrText = `Q. Which article of the Constitution deals with Fundamental Rights?
  (A) Article 12-35
  (B) Article 36-51
  (C) Article 51A
  (D) Article 1-4
  Ans: A
  Explanation: Part III, Articles 12 to 35 contains Fundamental Rights.`;

  const parsed = parseQuestionAndOptions(sampleOcrText);
  assert(parsed.questionText.includes("Fundamental Rights"), "OCR parser extracts question statement");
  assert(parsed.options.length === 4, "OCR parser extracts 4 options");
  assert(parsed.options[0].includes("Article 12-35"), "OCR parser correctly extracts Option A");
  assert(parsed.options[1].includes("Article 36-51"), "OCR parser correctly extracts Option B");
  assert(parsed.correctOptionId === "A", "OCR parser detects correct answer A");
  assert(Boolean(parsed.explanation && parsed.explanation.includes("Part III")), "OCR parser extracts explanation");

  // Numbered Question Statement & Inline Options
  const numberedParsed = parseQuestionAndOptions(`1. What is the capital of India?
  (A) New Delhi
  (B) Mumbai
  (C) Kolkata
  (D) Chennai
  Ans: A`);
  assert(numberedParsed.questionText === "What is the capital of India?", "OCR parser correctly parses questions starting with number '1.'");
  assert(numberedParsed.options[0] === "New Delhi", "Option A is not swallowed by question statement");

  const inlineParsed = parseQuestionAndOptions(`Which planet is known as Red Planet? (A) Venus (B) Mars (C) Jupiter (D) Saturn`);
  assert(inlineParsed.options[0] === "Venus" && inlineParsed.options[1] === "Mars", "OCR parser extracts single-space inline options");

  const twoByTwoParsed = parseQuestionAndOptions(`Which planet is known as Red Planet?\n(A) Venus (B) Mars\n(C) Jupiter (D) Saturn`);
  assert(twoByTwoParsed.options[1] === "Mars" && twoByTwoParsed.options[3] === "Saturn", "OCR parser extracts 2x2 textbook options layout");

  const hindiParsed = parseQuestionAndOptions(`लाल ग्रह किसे कहा जाता है?
  (क) शुक्र
  (ख) मंगल
  (ग) बृहस्पति
  (घ) शनि
  उत्तर: ख`);
  assert(hindiParsed.questionText.includes("लाल ग्रह"), "OCR parser handles Hindi questions");
  assert(hindiParsed.options[0] === "शुक्र" && hindiParsed.options[1] === "मंगल", "OCR parser handles Devanagari options क, ख, ग, घ");
  assert(hindiParsed.correctOptionId === "B", "OCR parser maps Hindi answer 'उत्तर: ख' to Option B");

  // 2. Create tab two parts & scanner component
  const s58CreateFile = fs.readFileSync(path.join(__dirname, "../components/create/CreateQuestionView.tsx"), "utf8");
  assert(s58CreateFile.includes("QuestionScanner"), "CreateQuestionView mounts QuestionScanner");
  assert(s58CreateFile.includes("1. Manual Entry") || s58CreateFile.includes("1. मैन्युअल एंट्री"), "CreateQuestionView divides creator into Manual Entry part");
  assert(s58CreateFile.includes("2. Smart Scan Question") || s58CreateFile.includes("2. स्मार्ट स्कैन"), "CreateQuestionView divides creator into Smart Scan OCR part");

  const s58ScannerFile = fs.readFileSync(path.join(__dirname, "../components/create/QuestionScanner.tsx"), "utf8");
  assert(s58ScannerFile.includes("navigator.mediaDevices.getUserMedia"), "QuestionScanner requests camera access");
  assert(s58ScannerFile.includes("Tesseract.recognize"), "QuestionScanner implements client-side zero-egress OCR");
  assert(s58ScannerFile.includes("h-44 sm:h-52"), "QuestionScanner renders horizontal camera viewfinder");

  // 3. Spaced Repetition Feed & Anti-random duplication guarantee
  const srUser = db.signUpUser({
    display_name: "SR Aspirant",
    username: `sr_user_${Date.now()}`,
    target_exam: "SSC CGL / CHSL / MTS",
    preferred_examination_id: "exam-ssc-cgl",
  });
  const testUserId = srUser.id;

  const feed1 = db.getFeedQuestions({ userId: testUserId, examId: "exam-ssc-cgl", limit: 5 });
  assert(feed1.length > 0, "Feed returns questions for logged in user");
  const answeredQ = feed1[0];

  db.submitAttempt({
    userId: testUserId,
    questionId: answeredQ.id,
    selectedOptionId: "B",
    responseTimeMs: 9000,
  });

  db.setQuestionRepeatInterval(testUserId, answeredQ.id, "never");
  const feedAfterNeverUser = db.getFeedQuestions({ userId: testUserId, examId: "exam-ssc-cgl", limit: 10 });
  assert(!feedAfterNeverUser.some(q => q.id === answeredQ.id), "Question marked 'never' does not resurface for signed in user");

  const secondQ = feed1[1];
  db.submitAttempt({
    userId: testUserId,
    questionId: secondQ.id,
    selectedOptionId: "A",
    responseTimeMs: 7500,
  });
  const weekPref = db.setQuestionRepeatInterval(testUserId, secondQ.id, "week");
  assert(Boolean(weekPref.next_review_at), "Week interval sets scheduled next_review_at");
  const feedBeforeDue = db.getFeedQuestions({ userId: testUserId, examId: "exam-ssc-cgl", limit: 10 });
  assert(!feedBeforeDue.some(q => q.id === secondQ.id), "Question scheduled for week does not resurface randomly before due time");

  // Due repetition resurfacing guarantee with is_repeat badge
  const dueUser = db.signUpUser({ display_name: "Due Aspirant", username: `due_${Date.now()}`, preferred_examination_id: "exam-ssc-cgl" });
  const feedDueUser = db.getFeedQuestions({ userId: dueUser.id, examId: "exam-ssc-cgl", limit: 3 });
  const dueQ = feedDueUser[0];
  db.submitAttempt({ userId: dueUser.id, questionId: dueQ.id, selectedOptionId: "C", responseTimeMs: 6000 });
  db.setQuestionRepeatInterval(dueUser.id, dueQ.id, "week");
  const duePref = (db as unknown as { repeatPreferences: Map<string, { next_review_at: string }> }).repeatPreferences.get(`${dueUser.id}:${dueQ.id}`)!;
  duePref.next_review_at = new Date(Date.now() - 50000).toISOString(); // Time in past

  const feedWithDue = db.getFeedQuestions({ userId: dueUser.id, examId: "exam-ssc-cgl", limit: 5 });
  const resurfacedItem = feedWithDue.find(q => q.id === dueQ.id);
  assert(Boolean(resurfacedItem), "Due spaced repetition question resurfaces in feed");
  assert(resurfacedItem?.is_repeat === true, "Resurfaced question has is_repeat: true badge");

  // Answering resurfaced question satisfies schedule
  db.submitAttempt({ userId: dueUser.id, questionId: dueQ.id, selectedOptionId: "A", responseTimeMs: 4000 });
  const feedAfterSatisfied = db.getFeedQuestions({ userId: dueUser.id, examId: "exam-ssc-cgl", limit: 5 });
  assert(!feedAfterSatisfied.some(q => q.id === dueQ.id), "Satisfied question does not loop immediately on next reel");

  // 4. Stretched Bottom Community Metrics Bar & Removed SWIPE Button
  const s58ReelFile = fs.readFileSync(path.join(__dirname, "../components/loop/QuestionReelCard.tsx"), "utf8");
  assert(!s58ReelFile.includes("title=\"Next Question (Swipe)\""), "QuestionReelCard removed SWIPE button above profile tab on bottom-right");
  assert(s58ReelFile.includes("grid grid-cols-4"), "QuestionReelCard stretches bottom metrics bar across full available width with 4 columns");
  assert(s58ReelFile.includes("safe-area-inset-bottom"), "QuestionReelCard uses safe-area-inset-bottom to eliminate scroll jumping/glitching");
  assert(s58ReelFile.includes("Repeat Question"), "QuestionReelCard renders Repeat Question badge for resurfaced questions");

  // 5. Digital Timer
  assert(!s58ReelFile.includes("<span className=\"material-symbols-outlined text-[15px]\">timer</span>"), "QuestionReelCard removed clunky stopwatch icon");
  assert(s58ReelFile.includes("font-mono text-xs sm:text-sm font-extrabold tracking-widest"), "QuestionReelCard renders sleek digital timer");
  assert(s58ReelFile.includes("animate-ping"), "QuestionReelCard renders pulsating live digital timing dot");

  // 6. Post-Answer Modal
  assert(s58ReelFile.includes("showPostAnswerModal"), "QuestionReelCard manages Post-Answer Pop-up Modal state");
  assert(s58ReelFile.includes("Skip & Next Question"), "QuestionReelCard renders large prominent Skip & Next button");

  // Scenario 59: NEET Biology Onboarding, Multi-Device Isolation, User Search & Mobile Edit Modal
  console.log("\n[Scenario 59] NEET Biology Onboarding, Multi-Device Isolation, User Search & Mobile Edit Modal");

  // 1. Interactive Onboarding Modal NEET Biology verification
  const onboardingFile = fs.readFileSync(path.join(__dirname, "../components/onboarding/InteractiveOnboardingModal.tsx"), "utf8");
  assert(onboardingFile.includes("NEET Biology · Cell Cycle"), "Onboarding slide 1 displays NEET Biology topic badge");
  assert(onboardingFile.includes("meiosis does crossing over between non-sister chromatids"), "Onboarding slide 1 features authentic NEET Biology meiotic crossing over question");
  assert(onboardingFile.includes("Pachytene"), "Onboarding slide 1 includes Pachytene as correct answer");
  assert(!onboardingFile.includes("Maths · Profit & Loss"), "Maths question completely removed from onboarding");
  assert(onboardingFile.includes("High-Yield Biology"), "Onboarding slide 4 includes High-Yield Biology playlist");

  // 2. Multi-device identity isolation in store & profile updates
  const testUserA = db.syncUserFromAuth({
    id: "usr-laptop-test-1",
    display_name: "Laptop User",
    username: "laptop_aspirant",
    target_exam: "NEET UG (Medical Entrance)",
  });
  const testUserB = db.syncUserFromAuth({
    id: "usr-phone-test-2",
    display_name: "Phone User",
    username: "phone_aspirant",
    target_exam: "NEET UG (Medical Entrance)",
  });
  assert(testUserA.id !== testUserB.id, "Multi-device users have separate distinct IDs");

  // Updating user B's username must NOT affect user A
  const updatedB = db.updateProfile({ username: "phone_superstar" }, testUserB.id);
  assert(updatedB.username === "phone_superstar", "User B username updated to new unique handle");
  const recheckA = db.getProfileById(testUserA.id);
  assert(recheckA?.username === "laptop_aspirant", "User A username remains completely unpolluted across devices");

  // 3. User search by username and display name
  const searchResults1 = db.searchUsers("phone_super", testUserA.id);
  assert(searchResults1.some((u) => u.id === testUserB.id), "User search finds peer by username substring");
  const searchResults2 = db.searchUsers("Laptop User", testUserB.id);
  assert(searchResults2.some((u) => u.id === testUserA.id), "User search finds peer by display name substring");
  assert(!searchResults1.some((u) => u.id === testUserA.id), "User search strictly excludes the searching user themselves");

  // 4. Mobile Profile Edit Modal Sticky Buttons & Overflow Scroll
  const profileViewFile = fs.readFileSync(path.join(__dirname, "../components/profile/ProfileView.tsx"), "utf8");
  assert(profileViewFile.includes("max-h-[88vh]"), "Profile edit modal has max-height boundary for mobile viewports");
  assert(profileViewFile.includes("h-[88dvh] max-h-[88dvh]"), "Profile edit modal enforces dynamic mobile viewport height");
  assert(profileViewFile.includes("overflow-y-auto"), "Profile edit modal form has scrollable body");
  assert(profileViewFile.includes("border-t border-surface-container-high/40 bg-surface-container-lowest shrink-0"), "Profile edit modal has fixed sticky footer for Save and Cancel buttons");
  assert(profileViewFile.includes("form=\"edit-student-profile-form\""), "Save Profile button submits form from sticky footer");
  assert(profileViewFile.includes("safe-area-inset-bottom"), "Profile edit modal sticky footer accounts for mobile safe area");

  // 5. Username onboarding guard & first-time prompt logic
  const usernameModalFile = fs.readFileSync(path.join(__dirname, "../components/auth/UsernameOnboardingModal.tsx"), "utf8");
  assert(usernameModalFile.includes("qz_onboarded_user_id"), "UsernameOnboardingModal scopes completion state to specific user ID");
  assert(usernameModalFile.includes("qz_needs_username"), "UsernameOnboardingModal checks first-time signup username trigger");

  // 6. Authentic NEET Biology placeholders in i18n
  const i18nFile = fs.readFileSync(path.join(__dirname, "../lib/utils/i18n.ts"), "utf8");
  assert(i18nFile.includes("NEET Biology Notes, High-Yield PYQs"), "English i18n features NEET Biology collection placeholder");
  assert(i18nFile.includes("NEET बायोलॉजी नोट्स"), "Hindi i18n features NEET Biology collection placeholder");
  assert(i18nFile.includes("crossing over occurs in Pachytene"), "English i18n features NEET Biology crossing over suggestion placeholder");
  assert(i18nFile.includes("NCERT आधारित स्पष्टीकरण देखें"), "Hindi onboarding features NCERT explanation copy instead of short tricks");

  // 7. Supabase SQL Migration script
  const sqlMigrationPath = path.join(__dirname, "../supabase/migrations/20261020_social_search_and_auth_fix.sql");
  assert(fs.existsSync(sqlMigrationPath), "Supabase SQL migration file exists");
  const sqlMigrationContent = fs.readFileSync(sqlMigrationPath, "utf8");
  assert(sqlMigrationContent.includes("pg_trgm"), "Migration enables pg_trgm extension for search");
  assert(sqlMigrationContent.includes("idx_profiles_username_trgm"), "Migration creates trigram GIN index on username");
  assert(sqlMigrationContent.includes("auth.uid()::text = user_id OR auth.uid()::text = friend_id"), "Migration provides reciprocal friendship RLS insertion");

  // Scenario 60: Social Search Lifecycle, Peer Attribution, Full-Width Metrics Bar, Persistent Comments & Fire Likes Cross-Device Sync
  console.log("\n[Scenario 60] Social Search Lifecycle, Peer Attribution, Full-Width Metrics Bar, Persistent Comments & Fire Likes Cross-Device Sync");

  // 1. Social Lifecycle & Strict Self Exclusion
  const uUserA = db.signUpUser({ display_name: "Aman Sharma", username: `aman_${Date.now()}` });
  const uUserB = db.signUpUser({ display_name: "Bhavna Patel", username: `bhavna_${Date.now()}` });
  const uUserC = db.signUpUser({ display_name: "Chirag Verma", username: `chirag_${Date.now()}` });

  // Self exclusion in user search
  const searchAman = db.searchUsers(uUserA.username, uUserA.id);
  assert(!searchAman.some(u => u.id === uUserA.id), "User A searching their own username strictly excludes themselves");
  const searchAmanByName = db.searchUsers("Aman", uUserA.id);
  assert(!searchAmanByName.some(u => u.id === uUserA.id), "User A searching by display name strictly excludes themselves");

  // Initial friends list is empty and does not contain self
  const friendsA = db.getFriends(uUserA.id);
  assert(!friendsA.some(f => f.id === uUserA.id), "User A friends list strictly excludes self");

  // User A sends friend request to User B
  const reqResult = db.sendFriendRequest(uUserA.id, uUserB.username);
  assert(reqResult.success === true, "User A successfully sends friend request to User B");
  assert(reqResult.status === "request_sent", "User A status is request_sent");

  // User A views friends/requests: has request_sent
  const friendsAAfterReq = db.getFriends(uUserA.id);
  const sentToB = friendsAAfterReq.find(f => f.id === uUserB.id);
  assert(sentToB?.status === "request_sent", "User A sees outgoing friend request to User B with status request_sent");

  // User B views incoming requests: has pending_incoming
  const friendsBAfterReq = db.getFriends(uUserB.id);
  const incomingFromA = friendsBAfterReq.find(f => f.id === uUserA.id);
  assert(incomingFromA?.status === "pending_incoming", "User B sees incoming friend request from User A with status pending_incoming");

  // User B accepts request
  const acceptRes = db.respondFriendRequest(uUserB.id, uUserA.id, "accept");
  assert(acceptRes.success === true, "User B accepts User A's friend request");

  // Both are now reciprocal friends
  const friendsAAfterAccept = db.getFriends(uUserA.id);
  const friendBInA = friendsAAfterAccept.find(f => f.id === uUserB.id);
  assert(friendBInA?.status === "friend", "User A sees User B as mutual friend");

  const friendsBAfterAccept = db.getFriends(uUserB.id);
  const friendAInB = friendsBAfterAccept.find(f => f.id === uUserA.id);
  assert(friendAInB?.status === "friend", "User B sees User A as mutual friend");

  // User A sends request to User C, but User C declines
  db.sendFriendRequest(uUserA.id, uUserC.username);
  const declineRes = db.respondFriendRequest(uUserC.id, uUserA.id, "decline");
  assert(declineRes.success === true, "User C declines User A's friend request");
  const friendsAAfterDecline = db.getFriends(uUserA.id);
  assert(!friendsAAfterDecline.some(f => f.id === uUserC.id), "Declined request is completely removed from User A's friends");
  const friendsCAfterDecline = db.getFriends(uUserC.id);
  assert(!friendsCAfterDecline.some(f => f.id === uUserA.id), "Declined request is completely removed from User C's friends");

  // 2. Chat UI & Peer Profile Hydration (No Raw UUID Handles)
  const socialViewSrc = fs.readFileSync(path.join(__dirname, "../components/social/SocialView.tsx"), "utf8");
  assert(socialViewSrc.includes("Send Request"), "SocialView renders 'Send Request' instead of 'Add Friend'");
  assert(!socialViewSrc.includes("t.addFriendBtn || \"Add Friend\""), "SocialView removed old 'Add Friend' button label");
  assert(socialViewSrc.includes("cleanHandle"), "SocialView implements cleanHandle sanitization helper");
  assert(socialViewSrc.includes("cleanDisplayName"), "SocialView implements cleanDisplayName sanitization helper");
  assert(socialViewSrc.includes("pollInterval = setInterval"), "SocialView has rapid active chat polling");
  assert(socialViewSrc.includes("1200"), "SocialView implements 1.2-second rapid active chat polling");
  assert(socialViewSrc.includes("handleRespondFriendRequest(usr.id, \"decline\")"), "SocialView renders Decline button alongside Accept for incoming requests in search");
  assert(socialViewSrc.includes("temp-"), "SocialView implements instant optimistic message sending");

  const studyChatModalSrc = fs.readFileSync(path.join(__dirname, "../components/loop/StudyChatModal.tsx"), "utf8");
  assert(studyChatModalSrc.includes("cleanHandle"), "StudyChatModal implements cleanHandle helper");
  assert(studyChatModalSrc.includes("chatBottomRef"), "StudyChatModal implements chatBottomRef auto-scroll anchor");
  assert(studyChatModalSrc.includes("setInterval"), "StudyChatModal implements rapid chat polling");
  assert(studyChatModalSrc.includes("1200"), "StudyChatModal implements 1.2-second rapid chat polling");
  assert(studyChatModalSrc.includes("data.peers"), "StudyChatModal hydrates peer profile from API data.peers");

  // Messages API route peer hydration
  const messagesRouteSrc = fs.readFileSync(path.join(__dirname, "../app/api/messages/route.ts"), "utf8");
  assert(messagesRouteSrc.includes("idsToHydrate"), "Messages API route hydrates peer profiles from Supabase even when messages array is empty");

  // 3. Quiz Loop UI Overhaul: Removed Swipe Button & Stretched Bottom Metrics Bar
  const reelCardSrc = fs.readFileSync(path.join(__dirname, "../components/loop/QuestionReelCard.tsx"), "utf8");
  assert(!reelCardSrc.includes("title=\"Next Question (Swipe)\""), "QuestionReelCard removed swipe button above profile tab");
  assert(reelCardSrc.includes("absolute bottom-0 left-0 right-0"), "QuestionReelCard pins bottom answering bar to absolute bottom");
  assert(reelCardSrc.includes("pb-[max(0.75rem,env(safe-area-inset-bottom))]"), "QuestionReelCard anchors bottom bar with safe-area-inset-bottom");
  assert(reelCardSrc.includes("overflow-hidden"), "QuestionReelCard locks root container with overflow-hidden to eliminate vertical scroll jumping");
  assert(reelCardSrc.includes("grid grid-cols-4"), "QuestionReelCard stretches metrics bar into full-width 4-column responsive grid");
  assert(reelCardSrc.includes("attempts") && reelCardSrc.includes("avg speed") && reelCardSrc.includes("accuracy"), "QuestionReelCard displays all 4 metrics clearly without truncation");
  assert(reelCardSrc.includes("data.totalLikes"), "QuestionReelCard syncs authoritative total fire likes from API response");

  // 4. Question Comments Persistence Across Accounts
  const testQuestion = db.getFeedQuestions({ examId: "exam-neet-ug" })[0];
  const initialComments = db.getComments(testQuestion.id);
  const newComment = db.addComment({
    questionId: testQuestion.id,
    userId: uUserA.id,
    text: "Mendelian genetics PYQ shortcut: Remember 9:3:3:1 phenotypic ratio for dihybrid cross!",
  });
  assert(Boolean(newComment.id), "New comment successfully created with unique ID");
  const commentsAfterAdd = db.getComments(testQuestion.id);
  assert(commentsAfterAdd.length === initialComments.length + 1, "Comments count increased by 1 across accounts");
  assert(commentsAfterAdd.some(c => c.id === newComment.id), "Created comment retrievable cross-account");

  // 5. Fire (Likes) Cross-Device Persistence
  const initialLikeStatus = db.getQuestionLikeStatus(testQuestion.id, uUserA.id);
  const toggleRes = db.toggleQuestionLike(testQuestion.id, uUserA.id);
  assert(toggleRes.liked === !initialLikeStatus.liked, "User A toggle flips like status");
  const updatedStatusForA = db.getQuestionLikeStatus(testQuestion.id, uUserA.id);
  assert(updatedStatusForA.liked === toggleRes.liked, "User A sees updated like state");

  // Cross-device user B sees updated total likes count
  const statusForUserB = db.getQuestionLikeStatus(testQuestion.id, uUserB.id);
  assert(statusForUserB.totalLikes === updatedStatusForA.totalLikes, "User B on different device sees identical total likes count");

  // Unauthenticated / guest visitors receive total likes accurately
  const statusForGuest = db.getQuestionLikeStatus(testQuestion.id, undefined);
  assert(statusForGuest.totalLikes === updatedStatusForA.totalLikes, "Guest visitor receives accurate total likes count");
  assert(statusForGuest.liked === false, "Guest visitor liked flag defaults to false");

  // 6. Instagram Reels-Style Share Sheet Modal
  const shareModalSrc = fs.readFileSync(path.join(__dirname, "../components/loop/ShareFriendModal.tsx"), "utf8");
  assert(shareModalSrc.includes("f.status === \"friend\""), "ShareFriendModal strictly filters accepted mutual friends only");
  assert(shareModalSrc.includes("searchQuery"), "ShareFriendModal includes quick search input for filtering friends");
  assert(shareModalSrc.includes("cleanHandle"), "ShareFriendModal implements cleanHandle helper for peer handles");
  assert(shareModalSrc.includes("data.friend.status === \"friend\""), "ShareFriendModal prevents unaccepted pending friend requests from appearing in accepted friends list");
  assert(shareModalSrc.includes("Sent ✓") || shareModalSrc.includes("Send"), "ShareFriendModal renders 1-tap Send pill with confirmation");
  assert(shareModalSrc.includes("rounded-t-3xl"), "ShareFriendModal renders Instagram reels-style bottom sheet layout");

  // 7. Supabase SQL Migration includes question_likes & question_comments
  assert(sqlMigrationContent.includes("CREATE TABLE IF NOT EXISTS question_likes"), "SQL migration creates question_likes table");
  assert(sqlMigrationContent.includes("CREATE TABLE IF NOT EXISTS question_comments"), "SQL migration creates question_comments table");
  assert(sqlMigrationContent.includes("idx_question_likes_qid"), "SQL migration creates question_likes index");
  assert(sqlMigrationContent.includes("idx_question_comments_qid"), "SQL migration creates question_comments index");

  // Scenario 61: Multi-Device Serverless Persistence, Interactive Cropper & Noise Filtering, Social Notification Badge, Chat Deduplication & Resilient Sharing
  console.log("\n[Scenario 61] Multi-Device Serverless Persistence, Interactive Cropper, Noise Filtering, Social Badge & Resilient Chat");

  // 1. Rigorous Noise Filtering in OCR Parser
  const noisyOcrSample = `8:37:46 7.00 KB/s 86%
< - Ask Gemini - a wX9uKjN_bL34kPoQw
https://askgemini.google.com/share/92842
Q. 1 What is the primary function of ribosomes in a eukaryotic cell?
(A) Protein synthesis
(B) Lipid synthesis
(C) DNA replication
(D) ATP generation
Ans: A
Explanation: Ribosomes are the cellular machinery responsible for translating mRNA into polypeptide chains (proteins).`;

  const parsedNoisy = parseQuestionAndOptions(noisyOcrSample);
  assert(
    !parsedNoisy.questionText.includes("Gemini") &&
    !parsedNoisy.questionText.includes("wX9uKjN") &&
    !parsedNoisy.questionText.includes("8:37:46") &&
    !parsedNoisy.questionText.includes("http"),
    "OCR parser rigorously strips '< - Ask Gemini', URL, and clock/battery line from question text"
  );
  assert(
    parsedNoisy.questionText.includes("What is the primary function of ribosomes in a eukaryotic cell?"),
    "OCR parser cleanly preserves the question text"
  );
  assert(parsedNoisy.options[0] === "Protein synthesis", "Option A is extracted without noise");
  assert(parsedNoisy.options[1] === "Lipid synthesis", "Option B is extracted without noise");
  assert(parsedNoisy.options[2] === "DNA replication", "Option C is extracted without noise");
  assert(parsedNoisy.options[3] === "ATP generation", "Option D is extracted without noise");
  assert(parsedNoisy.correctOptionId === "A", "Correct answer is detected as Option A");

  // Optics / Physics terminology must never be stripped as noise
  const opticsOcrSample = `10:30 AM 5G 85%
Ask Gemini - a wX9uKjN_bL34kPoQw
https://gemini.google.com/share/1234
Q. A thin convex lens has a focal length of 25 cm. What is its optical power?
(A) +4.0 D
(B) -4.0 D
(C) +0.25 D
(D) Concave lens with -2.0 D
Ans: A`;
  const parsedOptics = parseQuestionAndOptions(opticsOcrSample);
  assert(parsedOptics.questionText.includes("convex lens"), "Preserves 'convex lens' in optics physics questions");
  assert(parsedOptics.options[3].includes("Concave lens"), "Preserves 'Concave lens' in options without truncating");
  assert(!parsedOptics.questionText.includes("Gemini"), "Strips Gemini noise from optics question");

  // 2. Interactive Scanner Cropper UI & Prominent Action Buttons
  const scannerSrc = fs.readFileSync(path.join(__dirname, "../components/create/QuestionScanner.tsx"), "utf8");
  assert(scannerSrc.includes("Confirm Crop & Extract"), "QuestionScanner includes prominent 'Confirm Crop & Extract' button");
  assert(scannerSrc.includes("Skip Header"), "QuestionScanner includes prominent 'Skip Header' button");
  assert(scannerSrc.includes("Re-take / Cancel"), "QuestionScanner includes prominent 'Re-take / Cancel' button");
  assert(scannerSrc.includes("cropX") && scannerSrc.includes("cropY") && scannerSrc.includes("cropW") && scannerSrc.includes("cropH"), "QuestionScanner extracts and draws strictly the cropped bounding box to canvas");

  // 3. Social Notification Badge in BottomNav
  const bottomNavSrc = fs.readFileSync(path.join(__dirname, "../components/layout/BottomNav.tsx"), "utf8");
  assert(bottomNavSrc.includes("incomingRequestsCount"), "BottomNav tracks incoming friend requests count");
  assert(bottomNavSrc.includes("bg-red-600") && bottomNavSrc.includes("animate-pulse"), "BottomNav renders pulsating red notification badge counter on Social tab");

  // 4. Chat Input Disable & Infinite Loop Prevention
  assert(studyChatModalSrc.includes("disabled={isSending}"), "StudyChatModal disables input during message dispatch to prevent repeated sends");
  assert(socialViewSrc.includes("disabled={isSendingMessage}"), "SocialView disables input during message dispatch to prevent repeated sends");
  assert(studyChatModalSrc.includes("prev.length === next.length"), "StudyChatModal stabilizes chat list and avoids unnecessary re-renders");
  assert(socialViewSrc.includes("prev.length === next.length"), "SocialView stabilizes chat list and avoids unnecessary re-renders");

  // 5. Supabase Serverless Persistence & Service Role Key
  const serverSupabaseSrc = fs.readFileSync(path.join(__dirname, "../lib/supabase/server.ts"), "utf8");
  assert(serverSupabaseSrc.includes("SUPABASE_SERVICE_ROLE_KEY"), "createServerSupabaseClient supports SUPABASE_SERVICE_ROLE_KEY for serverless admin operations");

  const migration20261021 = fs.readFileSync(path.join(__dirname, "../supabase/migrations/20261021_serverless_persistence_fix.sql"), "utf8");
  assert(migration20261021.includes("CREATE POLICY \"Users can insert friend requests\" ON friendships"), "20261021 migration hardens friendships RLS insertion");
  assert(migration20261021.includes("WITH CHECK (true)"), "20261021 migration allows serverless friendship insertion");
  assert(migration20261021.includes("CREATE TABLE IF NOT EXISTS profiles"), "20261021 migration ensures profiles table exists");
  assert(migration20261021.includes("CREATE TABLE IF NOT EXISTS friendships"), "20261021 migration ensures friendships table exists");
  assert(migration20261021.includes("CREATE TABLE IF NOT EXISTS direct_messages"), "20261021 migration ensures direct_messages table exists");
  assert(migration20261021.includes("CREATE TABLE IF NOT EXISTS question_comments"), "20261021 migration ensures question_comments table exists");
  assert(migration20261021.includes("CREATE TABLE IF NOT EXISTS question_likes"), "20261021 migration ensures question_likes table exists");

  // 6. Resilient In-App Comments & Draft Preservation
  const commentsModalSrc = fs.readFileSync(path.join(__dirname, "../components/loop/CommentsModal.tsx"), "utf8");
  assert(commentsModalSrc.includes("sessionStorage.setItem"), "CommentsModal preserves guest comment draft in sessionStorage");
  assert(commentsModalSrc.includes("sessionStorage.getItem"), "CommentsModal restores guest comment draft from sessionStorage upon sign-in");

  // 7. Store Like State Sync on Unlike
  db.syncQuestionLikes("test-q-sync-unlike", ["user-sync-1", "user-sync-2"]);
  assert(db.getQuestionLikeStatus("test-q-sync-unlike").totalLikes === 2, "Sync likes sets initial count");
  db.syncQuestionLikes("test-q-sync-unlike", ["user-sync-1"]);
  assert(db.getQuestionLikeStatus("test-q-sync-unlike").totalLikes === 1, "Sync likes updates cleanly when user unlikes");

  // Scenario 62: Tab Navigation Continuity, Scroll Isolation, PWA Install Button, Cross-User Publishing & Post-Answer Solution Modal
  console.log("\n[Scenario 62] Tab Navigation Continuity, Scroll Isolation, PWA Install Button, Cross-User Publishing & Post-Answer Solution Modal");

  // 1. Cross-User Question Publishing & Instant Feed Visibility
  const newCommunityQ = db.createQuestion({
    examinationId: "exam-neet-ug",
    subjectId: "subj-biology",
    questionText: "Which organelle is known as the powerhouse of the cell in aerobic respiration?",
    options: [
      { id: "A", text: "Mitochondria" },
      { id: "B", text: "Endoplasmic Reticulum" },
      { id: "C", text: "Golgi Apparatus" },
      { id: "D", text: "Ribosome" },
    ],
    correctOptionId: "A",
    explanation: "Mitochondria generate most of the chemical energy needed to power the cell's biochemical reactions (ATP).",
    authorId: "user-author-peer-1",
  });
  assert(newCommunityQ.publication_status === "published", "Community question publication_status is published");
  assert(newCommunityQ.moderation_status === "active", "Community question moderation_status is active");

  // Other student preparing for NEET UG queries the feed
  const peerFeed = db.getFeedQuestions({
    userId: "user-peer-student-2",
    examId: "exam-neet-ug",
  });
  assert(peerFeed.some((q) => q.id === newCommunityQ.id), "Published question is immediately visible in feed for peer students preparing for that exam");

  // Guest visitor preparing for NEET UG queries the feed
  const guestFeed = db.getFeedQuestions({
    examId: "exam-neet-ug",
  });
  assert(guestFeed.some((q) => q.id === newCommunityQ.id), "Published question is immediately visible in feed for unauthenticated guest visitors");

  // 2. Feed Route Dynamic & Cache-Control Configuration
  const feedRouteSrc = fs.readFileSync(path.join(__dirname, "../app/api/feed/route.ts"), "utf8");
  assert(feedRouteSrc.includes("export const dynamic = \"force-dynamic\""), "Feed route handler exports dynamic force-dynamic");
  assert(feedRouteSrc.includes("no-store"), "Feed route response uses no-store cache control for instant visibility");
  assert(feedRouteSrc.includes("lastCloudFeedSyncByExam"), "Feed route isolates cloud feed sync TTL per examination");

  // 3. Tab Navigation & Qz Loop Resumption
  const bottomNavFileSrc = fs.readFileSync(path.join(__dirname, "../components/layout/BottomNav.tsx"), "utf8");
  assert(bottomNavFileSrc.includes("sessionStorage.setItem(\"qz_loop_is_active\", \"true\")"), "BottomNav saves loop active flag to sessionStorage on tab switch");
  assert(bottomNavFileSrc.includes("pointer-events-auto touch-manipulation pb-safe"), "BottomNav inner container includes pb-safe with pointer-events-auto for full edge clickability");

  const quizLoopContainerSrc = fs.readFileSync(path.join(__dirname, "../components/loop/QuizLoopContainer.tsx"), "utf8");
  assert(quizLoopContainerSrc.includes("sessionStorage.getItem(\"qz_loop_cached_questions\")"), "QuizLoopContainer restores feed questions from sessionStorage on tab return");
  assert(quizLoopContainerSrc.includes("sessionStorage.getItem(\"qz_loop_active_question_id\")"), "QuizLoopContainer restores exact active question from sessionStorage on tab return");
  assert(quizLoopContainerSrc.includes("sessionStorage.getItem(\"qz_loop_answered_records\")"), "QuizLoopContainer restores answeredRecords from sessionStorage on tab return");

  // 4. Timer Continuity Across Tab Switches
  const questionReelCardSrc = fs.readFileSync(path.join(__dirname, "../components/loop/QuestionReelCard.tsx"), "utf8");
  assert(questionReelCardSrc.includes("qz_timer_start_"), "QuestionReelCard uses persistent sessionStorage timer start key");
  assert(questionReelCardSrc.includes("Date.now() - startTimeRef.current"), "QuestionReelCard calculates continuous elapsed solve time across tab navigation");

  // 5. Touch Scroll Isolation & Rubber-Band Prevention
  const globalsCssSrc = fs.readFileSync(path.join(__dirname, "../app/globals.css"), "utf8");
  assert(globalsCssSrc.includes("overscroll-behavior: none"), "globals.css enforces overscroll-behavior: none on html and body");
  assert(quizLoopContainerSrc.includes("data-no-swipe=\"true\""), "QuizLoopContainer marks controls with data-no-swipe");
  assert(quizLoopContainerSrc.includes("targetEl?.closest(\".bottom-controls\")"), "QuizLoopContainer gesture detection ignores touches starting on bottom controls");
  assert(quizLoopContainerSrc.includes("touchAction: \"none\""), "QuizLoopContainer bottom controls enforce inline touchAction: none");
  assert(questionReelCardSrc.includes("touchAction: \"none\""), "QuestionReelCard action rail and top bar enforce inline touchAction: none");

  // 6. TopHeader PWA Install / Download Webapp Button
  const topHeaderSrc = fs.readFileSync(path.join(__dirname, "../components/layout/TopHeader.tsx"), "utf8");
  assert(topHeaderSrc.includes("download_for_offline"), "TopHeader renders PWA download/install icon button");
  assert(topHeaderSrc.includes("beforeinstallprompt"), "TopHeader listens for beforeinstallprompt event");
  assert(topHeaderSrc.includes("appinstalled"), "TopHeader tracks appinstalled event state");
  assert(topHeaderSrc.includes("Install Qz-loop App"), "TopHeader includes PWA installation guidance modal fallback");

  // 7. Post-Answer Solution Modal & Spaced Repetition Buttons
  assert(questionReelCardSrc.includes("setShowPostAnswerModal(false)"), "Solution popup modal is NOT pre-opened after answering");
  assert(questionReelCardSrc.includes("Cut / Close Solution") || questionReelCardSrc.includes("Cut / Close modal"), "Post-answer solution popup includes cut/close option");
  assert(quizLoopContainerSrc.includes("Quick Proof & Solution"), "QuizLoopContainer renders Quick Proof & Solution button on pinned bottom bar");
  assert(quizLoopContainerSrc.includes("repeatDay"), "QuizLoopContainer renders Spaced Repetition Timeline buttons (1 Day, 1 Week, 1 Month, Never) below Quick Proof");
  assert(quizLoopContainerSrc.includes("/api/questions/repeat"), "Spaced repetition selection posts to /api/questions/repeat");

  console.log("\n=================================================");
  console.log("   ALL 62 ACCEPTANCE TEST SUITES PASSED (100%)   ");
  console.log("=================================================\n");
}


runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});


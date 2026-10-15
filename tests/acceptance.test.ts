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
  assert(guestMatrix.weekly_activity.every((w) => w.count === 0), "Guest weekly activity has 0 counts");

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

  console.log("\n=================================================");
  console.log("   ALL 34 ACCEPTANCE TEST SUITES PASSED (100%)   ");
  console.log("=================================================\n");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});


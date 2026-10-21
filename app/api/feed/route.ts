import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/data/store";
import { createServerSupabaseClient } from "@/lib/supabase/server";

let lastCloudFeedSync = 0;
const CLOUD_FEED_SYNC_TTL_MS = 60 * 1000; // 60 seconds cache

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subjectSlug = searchParams.get("subjects") || searchParams.get("subject") || "all";
    const cookieUserId = request.cookies.get("qz_user_id")?.value;
    const requestedUserId =
      searchParams.get("userId") || request.headers.get("x-user-id") || cookieUserId;
    const user =
      requestedUserId && requestedUserId !== "guest"
        ? db.getProfileById(requestedUserId) || null
        : null;
    const examId = searchParams.get("examId") || user?.preferred_examination_id || "exam-neet-ug";
    const excludedParam = searchParams.get("excludedIds");
    const sessionExcludedIds = excludedParam ? excludedParam.split(",") : [];
    const langParam = (searchParams.get("lang") || searchParams.get("language") || "all") as "en" | "hi" | "all";

    // Recover community published questions from Supabase if connected (throttled by TTL to minimize egress)
    const now = Date.now();
    if (now - lastCloudFeedSync > CLOUD_FEED_SYNC_TTL_MS) {
      try {
        const supabase = await createServerSupabaseClient();
        if (supabase) {
          const { data: cloudQuestions } = await supabase
            .from("questions")
            .select("*")
            .eq("publication_status", "published")
            .eq("moderation_status", "active")
            .order("created_at", { ascending: false })
            .limit(50);

          lastCloudFeedSync = now;

        if (cloudQuestions && cloudQuestions.length > 0) {
          for (const cq of cloudQuestions) {
            const existing = db.getQuestionById(cq.id);
            if (!existing) {
              db.syncCloudQuestion({
                id: cq.id,
                author_id: cq.author_id,
                author_name: cq.author_name || "Aspirant",
                examination_id: cq.examination_id,
                subject_id: cq.subject_id,
                subject_name: cq.subject_name || "General",
                subject_slug: cq.subject_slug || "general",
                question_text: cq.question_text,
                hindi_question_text: cq.hindi_question_text,
                language: cq.language || "en",
                options: cq.options || [],
                correct_option_id: cq.correct_option_id,
                explanation: cq.explanation,
                hindi_explanation: cq.hindi_explanation,
                difficulty: cq.difficulty || "medium",
                syllabus_tag: cq.syllabus_tag,
                pyq_info: cq.pyq_info,
                quality_upvotes: cq.quality_upvotes || 0,
                quality_downvotes: cq.quality_downvotes || 0,
                normalized_fingerprint: cq.normalized_fingerprint || cq.id,
                publication_status: cq.publication_status || "published",
                moderation_status: cq.moderation_status || "active",
                total_attempts: cq.total_attempts || 0,
                correct_attempts: cq.correct_attempts || 0,
                total_time_ms: cq.total_time_ms || 0,
                fastest_correct_ms: cq.fastest_correct_ms,
                created_at: cq.created_at || new Date().toISOString(),
              });
            }
          }
        }
      }
    } catch (sbErr) {
      console.error("Supabase feed questions sync notice:", sbErr);
    }
  }

  // Recover user's spaced repetition preferences and attempts from Supabase
  if (requestedUserId && requestedUserId !== "guest") {
    try {
      const supabase = await createServerSupabaseClient();
      if (supabase) {
        // 1. Spaced Repetition Preferences
        const { data: cloudRepeatPrefs } = await supabase
          .from("question_repeat_preferences")
          .select("*")
          .eq("user_id", requestedUserId);
        if (cloudRepeatPrefs && cloudRepeatPrefs.length > 0) {
          for (const p of cloudRepeatPrefs) {
            db.syncCloudRepeatPreference({
              user_id: p.user_id,
              question_id: p.question_id,
              interval: p.interval,
              next_review_at: p.next_review_at,
              updated_at: p.updated_at,
            });
          }
        }

        // 2. Question Attempts (Required for lastAttemptByQ in getFeedQuestions)
        const { data: cloudAttempts } = await supabase
          .from("question_attempts")
          .select("id, user_id, question_id, selected_option_id, is_correct, response_time_ms, created_at")
          .eq("user_id", requestedUserId);
        if (cloudAttempts && cloudAttempts.length > 0) {
          for (const att of cloudAttempts) {
            db.syncCloudAttempt({
              id: att.id,
              user_id: att.user_id,
              question_id: att.question_id,
              selected_option_id: att.selected_option_id,
              is_correct: att.is_correct,
              response_time_ms: att.response_time_ms,
              created_at: att.created_at,
            });
          }
        }
      }
    } catch {
      // best-effort
    }
  }

    const questions = db.getFeedQuestions({
      userId: requestedUserId || undefined,
      examId,
      subjectSlug,
      sessionExcludedIds,
      language: langParam,
      limit: 10,
    });

    return NextResponse.json(
      {
        success: true,
        questions,
        count: questions.length,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=15, stale-while-revalidate=45",
        },
      }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load feed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

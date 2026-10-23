import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/data/store";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { questionId, selectedOptionId, responseTimeMs, userId } = body;

    if (!questionId || !selectedOptionId) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const cookieUserId = request.cookies.get("qz_user_id")?.value;
    const resolvedUserId =
      userId || request.headers.get("x-user-id") || cookieUserId || undefined;
    const targetUserId = resolvedUserId && resolvedUserId !== "guest" ? resolvedUserId : "guest";

    const result = db.submitAttempt({
      userId: targetUserId,
      questionId,
      selectedOptionId,
      responseTimeMs: typeof responseTimeMs === "number" ? responseTimeMs : 10000,
    });

    // Cloud / Supabase Data Sync
    try {
      const supabase = await createServerSupabaseClient();
      if (supabase && resolvedUserId) {
        // Ensure question stub exists in Supabase so foreign key constraints never fail
        const qObj = db.getQuestionById(questionId);
        if (qObj) {
          try {
            await supabase.from("questions").upsert({
              id: qObj.id,
              examination_id: qObj.examination_id || "exam-neet-ug",
              subject_id: qObj.subject_id || "subj-neet-bio",
              subject_name: qObj.subject_name || "Biology",
              subject_slug: qObj.subject_slug || "biology",
              question_text: qObj.question_text || "Practice Question",
              correct_option_id: qObj.correct_option_id || "A",
              options: qObj.options || [],
              publication_status: "published",
              moderation_status: "active",
              normalized_fingerprint: qObj.normalized_fingerprint || qObj.id,
            }, { onConflict: "id", ignoreDuplicates: true });
          } catch {}
        }

        const validUuid = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : undefined;
        const attemptPayload: Record<string, any> = {
          user_id: resolvedUserId,
          question_id: questionId,
          selected_option_id: selectedOptionId,
          is_correct: result.isCorrect,
          response_time_ms: typeof responseTimeMs === "number" ? responseTimeMs : 10000,
        };
        if (validUuid) {
          attemptPayload.id = validUuid;
        }

        const { error: insErr } = await supabase.from("question_attempts").insert(attemptPayload);
        if (insErr) {
          // Fallback: omit explicit id and let Postgres default gen_random_uuid() populate it
          delete attemptPayload.id;
          await supabase.from("question_attempts").insert(attemptPayload);
        }

        const userProf = db.getProfileById(resolvedUserId);
        if (userProf) {
          await supabase.from("profiles").update({
            current_streak: userProf.current_streak,
            total_questions_answered: userProf.total_questions_answered,
            overall_accuracy: userProf.overall_accuracy,
            today_solved_count: userProf.today_solved_count,
          }).eq("id", resolvedUserId);
        }

        if (result.updatedMetrics) {
          await supabase.from("questions").update({
            total_attempts: result.updatedMetrics.total_attempts,
            correct_attempts: result.updatedMetrics.correct_attempts,
            fastest_correct_ms: result.updatedMetrics.fastest_correct_seconds
              ? Math.round(result.updatedMetrics.fastest_correct_seconds * 1000)
              : null,
          }).eq("id", questionId);
        }

        // Sync updated repeat preference if modified upon solving
        const repPref = db.getQuestionRepeatPreference(resolvedUserId, questionId);
        if (repPref) {
          await supabase.from("question_repeat_preferences").upsert({
            user_id: resolvedUserId,
            question_id: questionId,
            interval: repPref.interval,
            next_review_at: repPref.next_review_at || null,
            updated_at: new Date().toISOString(),
          }, { onConflict: "user_id,question_id" });
        }
      }
    } catch (sbErr) {
      console.error("Supabase submit sync notice:", sbErr);
    }

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Submission failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}


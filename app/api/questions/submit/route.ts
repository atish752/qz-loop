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

    const result = db.submitAttempt({
      userId: resolvedUserId,
      questionId,
      selectedOptionId,
      responseTimeMs: typeof responseTimeMs === "number" ? responseTimeMs : 10000,
    });

    // Cloud / Supabase Data Sync
    try {
      const supabase = await createServerSupabaseClient();
      if (supabase && resolvedUserId) {
        await supabase.from("question_attempts").insert({
          user_id: resolvedUserId,
          question_id: questionId,
          selected_option_id: selectedOptionId,
          is_correct: result.isCorrect,
          response_time_ms: typeof responseTimeMs === "number" ? responseTimeMs : 10000,
        });

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


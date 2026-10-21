import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/data/store";
import { RepeatInterval } from "@/types/database";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { questionId, interval } = body;

    if (!questionId) {
      return NextResponse.json({ success: false, error: "Question ID is required" }, { status: 400 });
    }

    const validIntervals: RepeatInterval[] = ["day", "week", "month", "never"];
    if (!validIntervals.includes(interval)) {
      return NextResponse.json({ success: false, error: "Invalid repeat interval" }, { status: 400 });
    }

    const cookieUserId = request.cookies.get("qz_user_id")?.value;
    const requestedUserId =
      body.userId || request.headers.get("x-user-id") || cookieUserId;
    if (!requestedUserId || requestedUserId === "guest") {
      return NextResponse.json({ success: false, error: "Unauthorized: User ID required" }, { status: 401 });
    }
    const pref = db.setQuestionRepeatInterval(requestedUserId, questionId, interval);

    // Persist to Supabase
    try {
      const { createServerSupabaseClient } = await import("@/lib/supabase/server");
      const supabase = await createServerSupabaseClient();
      if (supabase && requestedUserId) {
        await supabase.from("question_repeat_preferences").upsert({
          user_id: requestedUserId,
          question_id: questionId,
          interval: pref.interval,
          next_review_at: pref.next_review_at || null,
          updated_at: pref.updated_at,
        }, { onConflict: "user_id,question_id" });
      }
    } catch (sbErr) {
      console.error("Supabase repeat pref persistence notice:", sbErr);
    }

    return NextResponse.json({
      success: true,
      preference: pref,
      message: `Repeat interval set to '${interval}'`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to set repeat interval";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/data/store";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const periodParam = searchParams.get("period") || "week";
    const validPeriods = ["today", "week", "month", "lifetime"] as const;
    const period = validPeriods.includes(periodParam as (typeof validPeriods)[number])
      ? (periodParam as (typeof validPeriods)[number])
      : "week";

    const cookieUserId = request.cookies.get("qz_user_id")?.value;
    const requestedUserId = searchParams.get("userId") || request.headers.get("x-user-id") || cookieUserId;
    const targetUserId = requestedUserId && requestedUserId !== "guest" ? requestedUserId : "guest";

    if (targetUserId !== "guest") {
      try {
        const { createServerSupabaseClient } = await import("@/lib/supabase/server");
        const supabase = await createServerSupabaseClient();
        if (supabase) {
          const { data: cloudAttempts } = await supabase
            .from("question_attempts")
            .select("id, user_id, question_id, selected_option_id, is_correct, response_time_ms, created_at")
            .eq("user_id", targetUserId);

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
      } catch (sbErr) {
        // Fall back to in-memory attempts
      }
    }

    const stats = db.getMatrixStats(targetUserId, period);

    return NextResponse.json({
      success: true,
      stats,
      isGuest: targetUserId === "guest",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to calculate stats";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

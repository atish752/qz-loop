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
    const currentUser = requestedUserId
      ? db.getProfileById(requestedUserId) || db.getCurrentUser()
      : db.getCurrentUser();
    const pref = db.setQuestionRepeatInterval(currentUser.id, questionId, interval);

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

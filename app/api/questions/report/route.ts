import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/data/store";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { questionId, reason, details } = body;
    const reporterId =
      body.userId ||
      request.headers.get("x-user-id") ||
      request.cookies.get("qz_user_id")?.value ||
      "guest";

    if (!questionId || !reason) {
      return NextResponse.json(
        { success: false, error: "Question ID and reason are required" },
        { status: 400 }
      );
    }

    db.reportQuestion({
      reporterId,
      questionId,
      reason,
      details,
    });

    return NextResponse.json({
      success: true,
      message: "Report submitted. Thank you for keeping Qz Loop accurate!",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to report question";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

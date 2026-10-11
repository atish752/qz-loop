import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/data/store";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { questionId, reason, details } = body;
    const currentUser = db.getCurrentUser();

    if (!questionId || !reason) {
      return NextResponse.json(
        { success: false, error: "Question ID and reason are required" },
        { status: 400 }
      );
    }

    db.reportQuestion({
      reporterId: currentUser.id,
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

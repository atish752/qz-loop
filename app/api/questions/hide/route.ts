import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/data/store";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { questionId } = body;
    const userId =
      body.userId ||
      request.headers.get("x-user-id") ||
      request.cookies.get("qz_user_id")?.value;

    if (!userId || userId === "guest") {
      return NextResponse.json({ success: false, error: "Unauthorized: User ID required" }, { status: 401 });
    }

    if (!questionId) {
      return NextResponse.json({ success: false, error: "Question ID is required" }, { status: 400 });
    }

    db.hideQuestion(userId, questionId);

    return NextResponse.json({
      success: true,
      message: "Question hidden from your feed.",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to hide question";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

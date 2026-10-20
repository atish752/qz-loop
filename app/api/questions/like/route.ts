import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/data/store";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const questionId = searchParams.get("questionId");
    if (!questionId) {
      return NextResponse.json({ success: false, error: "Question ID required" }, { status: 400 });
    }
    const userId =
      searchParams.get("userId") ||
      request.headers.get("x-user-id") ||
      request.cookies.get("qz_user_id")?.value;
    if (!userId || userId === "guest") {
      return NextResponse.json({ success: true, isLiked: false, likesCount: 0 });
    }
    const status = db.getQuestionLikeStatus(userId, questionId);
    return NextResponse.json({ success: true, ...status });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to get like status";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { questionId } = body;
    if (!questionId) {
      return NextResponse.json({ success: false, error: "Question ID required" }, { status: 400 });
    }
    const userId =
      body.userId ||
      request.headers.get("x-user-id") ||
      request.cookies.get("qz_user_id")?.value;
    if (!userId || userId === "guest") {
      return NextResponse.json({ success: false, error: "Unauthorized: User ID required" }, { status: 401 });
    }
    const result = db.toggleLikeQuestion(userId, questionId);
    return NextResponse.json({ success: true, ...result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to toggle like";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

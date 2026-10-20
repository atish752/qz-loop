import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/data/store";

export async function GET(request: NextRequest) {
  try {
    const questionId = request.nextUrl.searchParams.get("questionId");
    if (!questionId) {
      return NextResponse.json({ success: false, error: "Question ID required" }, { status: 400 });
    }
    const userId =
      request.nextUrl.searchParams.get("userId") ||
      request.headers.get("x-user-id") ||
      request.cookies.get("qz_user_id")?.value;
    if (!userId || userId === "guest") {
      return NextResponse.json({ success: true, userVote: null });
    }
    const result = db.getQuestionQualityVote(userId, questionId);
    return NextResponse.json({ success: true, ...result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to get quality vote";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { questionId, vote } = body;
    if (!questionId || (vote !== "up" && vote !== "down")) {
      return NextResponse.json({ success: false, error: "Valid questionId and vote ('up' | 'down') required" }, { status: 400 });
    }
    const userId =
      body.userId ||
      request.headers.get("x-user-id") ||
      request.cookies.get("qz_user_id")?.value;
    if (!userId || userId === "guest") {
      return NextResponse.json({ success: false, error: "Unauthorized: User ID required" }, { status: 401 });
    }
    const result = db.voteQuestionQuality(userId, questionId, vote);
    return NextResponse.json({ success: true, ...result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to vote";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

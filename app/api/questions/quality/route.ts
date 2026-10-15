import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/data/store";

export async function GET(request: NextRequest) {
  try {
    const questionId = request.nextUrl.searchParams.get("questionId");
    if (!questionId) {
      return NextResponse.json({ success: false, error: "Question ID required" }, { status: 400 });
    }
    const user = db.getCurrentUser();
    const result = db.getQuestionQualityVote(user.id, questionId);
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
    const user = db.getCurrentUser();
    const result = db.voteQuestionQuality(user.id, questionId, vote);
    return NextResponse.json({ success: true, ...result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to vote";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

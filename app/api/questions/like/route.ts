import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/data/store";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const questionId = searchParams.get("questionId");
    if (!questionId) {
      return NextResponse.json({ success: false, error: "Question ID required" }, { status: 400 });
    }
    const currentUser = db.getCurrentUser();
    const status = db.getQuestionLikeStatus(currentUser.id, questionId);
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
    const currentUser = db.getCurrentUser();
    const result = db.toggleLikeQuestion(currentUser.id, questionId);
    return NextResponse.json({ success: true, ...result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to toggle like";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

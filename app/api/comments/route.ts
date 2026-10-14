import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/data/store";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const questionId = searchParams.get("questionId");
    if (!questionId) {
      return NextResponse.json({ success: false, error: "Question ID required" }, { status: 400 });
    }
    const comments = db.getComments(questionId);
    return NextResponse.json({ success: true, comments });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load question discussions";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { questionId, text } = body;
    if (!questionId || !text?.trim()) {
      return NextResponse.json({ success: false, error: "Question ID and comment text required" }, { status: 400 });
    }
    const currentUser = db.getCurrentUser();
    const comment = db.addComment({
      questionId,
      userId: currentUser.id,
      text,
    });
    return NextResponse.json({ success: true, comment });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to post comment";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

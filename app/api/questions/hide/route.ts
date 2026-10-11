import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/data/store";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { questionId } = body;
    const currentUser = db.getCurrentUser();

    if (!questionId) {
      return NextResponse.json({ success: false, error: "Question ID is required" }, { status: 400 });
    }

    db.hideQuestion(currentUser.id, questionId);

    return NextResponse.json({
      success: true,
      message: "Question hidden from your feed.",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to hide question";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

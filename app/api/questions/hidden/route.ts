import { NextResponse } from "next/server";
import { db } from "@/lib/data/store";

export async function GET() {
  try {
    const currentUser = db.getCurrentUser();
    const hiddenQuestions = db.getHiddenQuestions(currentUser.id);

    return NextResponse.json({
      success: true,
      questions: hiddenQuestions,
      count: hiddenQuestions.length,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to get hidden questions";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

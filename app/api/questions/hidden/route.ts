import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/data/store";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId =
      searchParams.get("userId") ||
      request.headers.get("x-user-id") ||
      request.cookies.get("qz_user_id")?.value;

    if (!userId || userId === "guest") {
      return NextResponse.json({ success: true, questions: [], count: 0, isGuest: true });
    }
    const hiddenQuestions = db.getHiddenQuestions(userId);

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

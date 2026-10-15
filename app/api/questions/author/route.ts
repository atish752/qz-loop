import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/data/store";

export async function GET(request: NextRequest) {
  try {
    const authorId = request.nextUrl.searchParams.get("authorId") || undefined;
    const questions = db.getQuestionsByAuthor(authorId);

    return NextResponse.json({
      success: true,
      questions,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load author questions";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

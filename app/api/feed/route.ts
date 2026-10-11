import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/data/store";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subjectSlug = searchParams.get("subject") || "all";
    const examId = searchParams.get("examId") || "exam-ssc-cgl";
    const excludedParam = searchParams.get("excludedIds");
    const sessionExcludedIds = excludedParam ? excludedParam.split(",") : [];

    const questions = db.getFeedQuestions({
      examId,
      subjectSlug,
      sessionExcludedIds,
      limit: 10,
    });

    return NextResponse.json({
      success: true,
      questions,
      count: questions.length,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load feed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

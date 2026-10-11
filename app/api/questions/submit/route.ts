import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/data/store";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { questionId, selectedOptionId, responseTimeMs } = body;

    if (!questionId || !selectedOptionId) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const result = db.submitAttempt({
      questionId,
      selectedOptionId,
      responseTimeMs: typeof responseTimeMs === "number" ? responseTimeMs : 10000,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Submission failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

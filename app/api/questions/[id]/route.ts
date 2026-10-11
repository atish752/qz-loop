import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/data/store";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const question = db.getQuestionById(id);

    if (!question) {
      return NextResponse.json(
        { success: false, error: "Question not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      question,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load question";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

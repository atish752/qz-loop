import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/data/store";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { examinationId, subjectId, questionText, language, options, correctOptionId, explanation, difficulty } = body;

    if (!subjectId || !questionText || !options || !correctOptionId) {
      return NextResponse.json(
        { success: false, error: "Please fill in all required question fields" },
        { status: 400 }
      );
    }

    const newQuestion = db.createQuestion({
      examinationId,
      subjectId,
      questionText,
      language: language === "hi" ? "hi" : "en",
      options,
      correctOptionId,
      explanation,
      difficulty,
    });

    return NextResponse.json({
      success: true,
      question: newQuestion,
      message: "Question published successfully!",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to publish question";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

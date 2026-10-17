import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/data/store";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      examinationId,
      subjectId,
      questionText,
      hindiQuestionText,
      language,
      options,
      correctOptionId,
      explanation,
      hindiExplanation,
      difficulty,
      syllabusTag,
      targetTopic,
      pyqInfo,
    } = body;

    const effectiveQuestionText = (questionText || hindiQuestionText || "").trim();
    if (!subjectId || !effectiveQuestionText || !options || !correctOptionId) {
      return NextResponse.json(
        { success: false, error: "Please fill in all required question fields" },
        { status: 400 }
      );
    }

    if (effectiveQuestionText.length > 600) {
      return NextResponse.json(
        { success: false, error: "Question statement cannot exceed 600 characters" },
        { status: 400 }
      );
    }

    const newQuestion = db.createQuestion({
      examinationId,
      subjectId,
      questionText,
      hindiQuestionText,
      language: language === "hi" ? "hi" : "en",
      options,
      correctOptionId,
      explanation,
      hindiExplanation,
      difficulty,
      syllabusTag,
      targetTopic,
      pyqInfo,
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

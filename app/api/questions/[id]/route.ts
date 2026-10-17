import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/data/store";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const isEditMode = request.nextUrl.searchParams.get("edit") === "true";
    const question = isEditMode ? db.getRawQuestionById(id) : db.getQuestionById(id);

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

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const currentUser = db.getCurrentUser();
    const updated = db.updateQuestion(
      id,
      {
        question_text: body.questionText || body.question_text,
        hindi_question_text: body.hindiQuestionText ?? body.hindi_question_text,
        language: body.language,
        options: body.options,
        correct_option_id: body.correctOptionId || body.correct_option_id,
        explanation: body.explanation,
        hindi_explanation: body.hindiExplanation ?? body.hindi_explanation,
        difficulty: body.difficulty,
        syllabus_tag: body.syllabusTag ?? body.syllabus_tag,
        pyq_info: body.pyqInfo ?? body.pyq_info,
        subject_id: body.subjectId || body.subject_id,
        examination_id: body.examinationId || body.examination_id,
      },
      currentUser.id
    );

    return NextResponse.json({
      success: true,
      question: updated,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update question";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const currentUser = db.getCurrentUser();
    const deleted = db.deleteQuestion(id, currentUser.id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Question not found or cannot be deleted" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Question deleted successfully",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete question";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}


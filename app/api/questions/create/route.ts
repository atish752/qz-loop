import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/data/store";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const cookieUserId = request.cookies.get("qz_user_id")?.value;
    const authorId =
      body.authorId ||
      body.userId ||
      request.headers.get("x-user-id") ||
      cookieUserId ||
      undefined;

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

    // Ensure author exists in local store from Supabase if needed
    if (authorId && !db.getProfileById(authorId)) {
      try {
        const supabase = await createServerSupabaseClient();
        if (supabase) {
          const { data: dbProfile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", authorId)
            .maybeSingle();
          if (dbProfile) {
            db.syncUserFromAuth({
              id: dbProfile.id,
              display_name: dbProfile.display_name,
              username: dbProfile.username,
              target_exam: dbProfile.target_exam,
              preferred_examination_id: dbProfile.preferred_examination_id,
              avatar_url: dbProfile.avatar_url,
              email: dbProfile.email,
              language_preference: dbProfile.language_preference,
              onboarding_completed: dbProfile.onboarding_completed,
            });
          }
        }
      } catch (recoveryErr) {
        console.error("Supabase author recovery error:", recoveryErr);
      }
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
      authorId,
    });

    // Cloud / Supabase Sync
    try {
      const supabase = await createServerSupabaseClient();
      if (supabase) {
        await supabase.from("questions").insert({
          id: newQuestion.id,
          author_id: newQuestion.author_id,
          author_name: newQuestion.author_name,
          examination_id: newQuestion.examination_id,
          subject_id: newQuestion.subject_id,
          subject_name: newQuestion.subject_name,
          question_text: newQuestion.question_text,
          hindi_question_text: newQuestion.hindi_question_text,
          language: newQuestion.language,
          options: newQuestion.options,
          correct_option_id: newQuestion.correct_option_id,
          explanation: newQuestion.explanation,
          hindi_explanation: newQuestion.hindi_explanation,
          difficulty: newQuestion.difficulty,
          syllabus_tag: newQuestion.syllabus_tag,
          pyq_info: newQuestion.pyq_info,
          total_attempts: 0,
          correct_attempts: 0,
          total_time_ms: 0,
          normalized_fingerprint: newQuestion.normalized_fingerprint,
          publication_status: newQuestion.publication_status,
          moderation_status: newQuestion.moderation_status,
        });
      }
    } catch (sbErr) {
      console.error("Supabase question insert notice:", sbErr);
    }

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


import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/data/store";
import { createServerSupabaseClient } from "@/lib/supabase/server";

let authorSyncTimestamps = new Map<string, number>();
const AUTHOR_SYNC_TTL_MS = 60 * 1000;

export async function GET(request: NextRequest) {
  try {
    const authorId =
      request.nextUrl.searchParams.get("authorId") ||
      request.headers.get("x-user-id") ||
      request.cookies.get("qz_user_id")?.value ||
      undefined;

    // Cloud recovery from Supabase if connected (throttled by TTL per author to minimize egress)
    const now = Date.now();
    const lastSync = authorId ? authorSyncTimestamps.get(authorId) || 0 : 0;
    if (authorId && now - lastSync > AUTHOR_SYNC_TTL_MS) {
      authorSyncTimestamps.set(authorId, now);
      try {
        const supabase = await createServerSupabaseClient();
        if (supabase) {
          const { data: cloudQuestions } = await supabase
            .from("questions")
            .select("*")
            .eq("author_id", authorId);

          if (cloudQuestions && cloudQuestions.length > 0) {
            for (const cq of cloudQuestions) {
              const existing = db.getQuestionById(cq.id);
              if (!existing) {
                db.syncCloudQuestion({
                  id: cq.id,
                  author_id: cq.author_id,
                  author_name: cq.author_name || "Aspirant",
                  examination_id: cq.examination_id,
                  subject_id: cq.subject_id,
                  subject_name: cq.subject_name || "General",
                  subject_slug: cq.subject_slug || "general",
                  question_text: cq.question_text,
                  hindi_question_text: cq.hindi_question_text,
                  language: cq.language || "en",
                  options: cq.options || [],
                  correct_option_id: cq.correct_option_id,
                  explanation: cq.explanation,
                  hindi_explanation: cq.hindi_explanation,
                  difficulty: cq.difficulty || "medium",
                  syllabus_tag: cq.syllabus_tag,
                  pyq_info: cq.pyq_info,
                  quality_upvotes: cq.quality_upvotes || 0,
                  quality_downvotes: cq.quality_downvotes || 0,
                  normalized_fingerprint: cq.normalized_fingerprint || cq.id,
                  publication_status: cq.publication_status || "published",
                  moderation_status: cq.moderation_status || "active",
                  total_attempts: cq.total_attempts || 0,
                  correct_attempts: cq.correct_attempts || 0,
                  total_time_ms: cq.total_time_ms || 0,
                  fastest_correct_ms: cq.fastest_correct_ms,
                  created_at: cq.created_at || new Date().toISOString(),
                });
              }
            }
          }
        }
      } catch (sbErr) {
        console.error("Supabase author questions sync notice:", sbErr);
      }
    }

    const questions = db.getQuestionsByAuthor(authorId);

    return NextResponse.json({
      success: true,
      questions,
      count: questions.length,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load author questions";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}


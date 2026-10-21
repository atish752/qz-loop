import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/data/store";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const questionId = searchParams.get("questionId");
    if (!questionId) {
      return NextResponse.json({ success: false, error: "Question ID required" }, { status: 400 });
    }

    // Sync cloud discussions from Supabase
    try {
      const supabase = await createServerSupabaseClient();
      if (supabase) {
        const { data: cloudComments } = await supabase
          .from("question_comments")
          .select("*")
          .eq("question_id", questionId)
          .order("created_at", { ascending: false });

        if (cloudComments && cloudComments.length > 0) {
          db.syncComments(
            questionId,
            cloudComments.map((c) => ({
              id: c.id,
              question_id: c.question_id,
              user_id: c.user_id,
              user_name: c.user_name,
              user_avatar: c.user_avatar,
              comment_text: c.comment_text,
              likes_count: c.likes_count ?? 0,
              created_at: c.created_at,
            }))
          );
        }
      }
    } catch (err) {
      console.error("Supabase comments sync notice:", err);
    }

    const comments = db.getComments(questionId);
    return NextResponse.json({ success: true, comments });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load question discussions";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { questionId, text, action, commentId, userId } = body;

    // Handle vote / like action via POST as well
    if (action === "vote" || action === "like") {
      const targetCommentId = commentId || body.id;
      if (!targetCommentId) {
        return NextResponse.json({ success: false, error: "Comment ID required for voting" }, { status: 400 });
      }
      const targetUid = userId || request.headers.get("x-user-id") || db.getCurrentUser().id;
      const voteResult = db.toggleLikeComment(targetCommentId, targetUid);
      if (!voteResult.comment) {
        return NextResponse.json({ success: false, error: "Comment not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, comment: voteResult.comment, isLiked: voteResult.isLiked });
    }

    if (!questionId || !text?.trim()) {
      return NextResponse.json({ success: false, error: "Question ID and comment text required" }, { status: 400 });
    }
    const cookieUserId = request.cookies.get("qz_user_id")?.value;
    const currentUid = userId || request.headers.get("x-user-id") || cookieUserId;
    if (!currentUid || currentUid === "guest") {
      return NextResponse.json({ success: false, error: "Unauthorized: Please sign in to post comments" }, { status: 401 });
    }

    // Recover user profile from Supabase if not yet in memory
    try {
      const supabase = await createServerSupabaseClient();
      if (supabase && currentUid && !db.getProfileById(currentUid)) {
        const { data: dbProfile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", currentUid)
          .maybeSingle();

        if (dbProfile) {
          db.syncUserFromAuth({
            id: dbProfile.id,
            display_name: dbProfile.display_name,
            username: dbProfile.username,
            avatar_url: dbProfile.avatar_url,
            target_exam: dbProfile.target_exam,
            preferred_examination_id: dbProfile.preferred_examination_id,
          });
        }
      }
    } catch {}

    const comment = db.addComment({
      questionId,
      userId: currentUid,
      text: text.trim(),
    });

    // Sync to Supabase question_comments table
    try {
      const supabase = await createServerSupabaseClient();
      if (supabase) {
        await supabase.from("question_comments").insert({
          id: comment.id,
          question_id: questionId,
          user_id: currentUid,
          user_name: comment.user_name || "Aspirant",
          user_avatar: comment.user_avatar || null,
          comment_text: comment.comment_text,
          likes_count: 0,
        });
      }
    } catch (err) {
      console.error("Supabase comment persist notice:", err);
    }

    return NextResponse.json({ success: true, comment });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to post comment";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { commentId, userId } = body;
    const targetCommentId = commentId || body.id;
    if (!targetCommentId) {
      return NextResponse.json({ success: false, error: "Comment ID required for voting" }, { status: 400 });
    }
    const targetUid = userId || request.headers.get("x-user-id") || db.getCurrentUser().id;
    const voteResult = db.toggleLikeComment(targetCommentId, targetUid);
    if (!voteResult.comment) {
      return NextResponse.json({ success: false, error: "Comment not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, comment: voteResult.comment, isLiked: voteResult.isLiked });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to vote comment";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}


import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/data/store";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const questionId = searchParams.get("questionId");
    if (!questionId) {
      return NextResponse.json({ success: false, error: "Question ID required" }, { status: 400 });
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
    const currentUid = userId || request.headers.get("x-user-id") || db.getCurrentUser().id;
    const comment = db.addComment({
      questionId,
      userId: currentUid,
      text,
    });
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

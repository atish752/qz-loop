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
    const userId =
      searchParams.get("userId") ||
      request.headers.get("x-user-id") ||
      request.cookies.get("qz_user_id")?.value;

    // Sync cloud likes from Supabase
    try {
      const supabase = await createServerSupabaseClient();
      if (supabase) {
        const { data: cloudLikes, error: likesErr } = await supabase
          .from("question_likes")
          .select("user_id")
          .eq("question_id", questionId);

        if (!likesErr && cloudLikes) {
          const userIds = cloudLikes.map((l) => l.user_id);
          db.syncQuestionLikes(questionId, userIds);
          const isLiked = Boolean(userId && userId !== "guest" && userIds.includes(userId));
          return NextResponse.json({
            success: true,
            liked: isLiked,
            isLiked,
            totalLikes: userIds.length,
            likesCount: userIds.length,
          });
        }
      }
    } catch (err) {
      console.error("Supabase likes sync notice:", err);
    }

    const status = db.getQuestionLikeStatus(userId && userId !== "guest" ? userId : undefined, questionId);
    return NextResponse.json({
      success: true,
      liked: status.liked,
      isLiked: status.liked,
      totalLikes: status.totalLikes,
      likesCount: status.totalLikes,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to get like status";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { questionId } = body;
    if (!questionId) {
      return NextResponse.json({ success: false, error: "Question ID required" }, { status: 400 });
    }
    const userId =
      body.userId ||
      request.headers.get("x-user-id") ||
      request.cookies.get("qz_user_id")?.value;
    if (!userId || userId === "guest") {
      return NextResponse.json({ success: false, error: "Unauthorized: User ID required" }, { status: 401 });
    }

    const result = db.toggleLikeQuestion(userId, questionId);

    // Sync like state strictly to Supabase question_likes
    try {
      const supabase = await createServerSupabaseClient();
      if (supabase) {
        if (result.liked) {
          await supabase.from("question_likes").upsert(
            {
              user_id: userId,
              question_id: questionId,
            },
            { onConflict: "user_id,question_id" }
          );
        } else {
          await supabase
            .from("question_likes")
            .delete()
            .match({ user_id: userId, question_id: questionId });
        }

        // Query fresh exact total count from Supabase
        const { data: latestLikes } = await supabase
          .from("question_likes")
          .select("user_id")
          .eq("question_id", questionId);

        if (latestLikes) {
          const uids = latestLikes.map((l) => l.user_id);
          db.syncQuestionLikes(questionId, uids);
          return NextResponse.json({
            success: true,
            liked: result.liked,
            isLiked: result.liked,
            totalLikes: uids.length,
            likesCount: uids.length,
          });
        }
      }
    } catch (err) {
      console.error("Supabase like persist notice:", err);
    }

    return NextResponse.json({
      success: true,
      liked: result.liked,
      isLiked: result.liked,
      totalLikes: result.totalLikes,
      likesCount: result.totalLikes,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to toggle like";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

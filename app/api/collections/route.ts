import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/data/store";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeQuestions = searchParams.get("includeQuestions") === "true";
    const targetUserId =
      searchParams.get("userId") ||
      request.headers.get("x-user-id") ||
      request.cookies.get("qz_user_id")?.value;

    if (!targetUserId || targetUserId === "guest") {
      return NextResponse.json({ success: true, collections: [], isGuest: true });
    }
    const collections = db.getUserCollections(targetUserId);

    if (includeQuestions) {
      const populated = collections.map((col) => ({
        ...col,
        questions: db.getQuestionsByIds(col.question_ids),
      }));
      return NextResponse.json({ success: true, collections: populated });
    }

    return NextResponse.json({ success: true, collections });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load playlists";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { questionId, collectionName, action = "save", description } = body;
    const targetUserId =
      body.userId ||
      request.headers.get("x-user-id") ||
      request.cookies.get("qz_user_id")?.value;

    if (!targetUserId || targetUserId === "guest") {
      return NextResponse.json({ success: false, error: "Unauthorized: User ID required" }, { status: 401 });
    }

    if (!collectionName || typeof collectionName !== "string") {
      return NextResponse.json({ success: false, error: "Playlist name is required" }, { status: 400 });
    }

    if (action === "create_only") {
      const col = db.createCollection(targetUserId, collectionName, description);
      return NextResponse.json({ success: true, collection: col });
    }

    if (!questionId) {
      return NextResponse.json({ success: false, error: "Question ID is required" }, { status: 400 });
    }

    if (action === "remove" || action === "remove_question") {
      const removed = db.removeQuestionFromCollection(targetUserId, questionId, collectionName);
      const collections = db.getUserCollections(targetUserId);
      return NextResponse.json({ success: true, removed, collections });
    }

    const result = db.saveQuestionToCollection(targetUserId, questionId, collectionName);
    const collections = db.getUserCollections(targetUserId);
    return NextResponse.json({ success: true, ...result, collections });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to save to playlist";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

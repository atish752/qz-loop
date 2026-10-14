import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/data/store";

export async function GET() {
  try {
    const currentUser = db.getCurrentUser();
    const collections = db.getUserCollections(currentUser.id);
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
    const currentUser = db.getCurrentUser();

    if (!collectionName || typeof collectionName !== "string") {
      return NextResponse.json({ success: false, error: "Playlist name is required" }, { status: 400 });
    }

    if (action === "create_only") {
      const col = db.createCollection(currentUser.id, collectionName, description);
      return NextResponse.json({ success: true, collection: col });
    }

    if (!questionId) {
      return NextResponse.json({ success: false, error: "Question ID is required" }, { status: 400 });
    }

    if (action === "remove") {
      const removed = db.removeQuestionFromCollection(currentUser.id, questionId, collectionName);
      return NextResponse.json({ success: true, removed });
    }

    const result = db.saveQuestionToCollection(currentUser.id, questionId, collectionName);
    const collections = db.getUserCollections(currentUser.id);
    return NextResponse.json({ success: true, ...result, collections });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to save to playlist";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

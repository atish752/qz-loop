import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/data/store";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const currentUser = db.getCurrentUser();

    if (search) {
      const searchResults = db.searchUsers(search, currentUser.id);
      return NextResponse.json({ success: true, users: searchResults });
    }

    const friends = db.getFriends(currentUser.id);
    return NextResponse.json({ success: true, friends });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load friends";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { target } = body;
    if (!target) {
      return NextResponse.json({ success: false, error: "Friend username or ID is required" }, { status: 400 });
    }
    const currentUser = db.getCurrentUser();
    const result = db.sendFriendRequest(currentUser.id, target);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.message }, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to send friend request";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { friendId, action } = body;
    if (!friendId || (action !== "accept" && action !== "decline")) {
      return NextResponse.json({ success: false, error: "Valid friendId and action are required" }, { status: 400 });
    }
    const currentUser = db.getCurrentUser();
    const result = db.respondFriendRequest(currentUser.id, friendId, action);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update friend request";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

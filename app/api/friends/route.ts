import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/data/store";

export async function GET() {
  try {
    const currentUser = db.getCurrentUser();
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
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to send friend request";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

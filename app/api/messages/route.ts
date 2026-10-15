import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/data/store";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const friendId = searchParams.get("friendId");
    const currentUser = db.getCurrentUser();

    if (!friendId) {
      // Return all messages involving current user
      const friends = db.getFriends(currentUser.id);
      const allMsgs: any[] = [];
      friends.forEach((f) => {
        const msgs = db.getMessages(currentUser.id, f.id);
        allMsgs.push(...msgs);
      });
      const enhanced = allMsgs.map((m) => {
        if (m.question_id) {
          const q = db.getQuestionById(m.question_id);
          return { ...m, question: q };
        }
        return m;
      });
      return NextResponse.json({ success: true, messages: enhanced });
    }

    const messages = db.getMessages(currentUser.id, friendId);

    // Enhance any question references with question preview
    const enhanced = messages.map((m) => {
      if (m.question_id) {
        const q = db.getQuestionById(m.question_id);
        return { ...m, question: q };
      }
      return m;
    });

    return NextResponse.json({ success: true, messages: enhanced });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load study chat messages";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { toUserId, text, questionId } = body;
    if (!toUserId) {
      return NextResponse.json({ success: false, error: "Recipient user ID is required" }, { status: 400 });
    }
    const currentUser = db.getCurrentUser();
    const message = db.sendMessage({
      fromUserId: currentUser.id,
      toUserId,
      text,
      questionId,
    });
    return NextResponse.json({ success: true, message });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to send chat message";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

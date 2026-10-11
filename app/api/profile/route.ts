import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/data/store";

export async function GET() {
  try {
    const user = db.getCurrentUser();
    const exams = db.getExaminations();
    const subjects = db.getSubjects(user.preferred_examination_id);
    const hiddenCount = db.getHiddenQuestions(user.id).length;

    return NextResponse.json({
      success: true,
      user,
      exams,
      subjects,
      hiddenCount,
      allProfiles: db.getAllProfiles(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load profile";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const updated = db.updateProfile(body);
    return NextResponse.json({
      success: true,
      user: updated,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update profile";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Switch active user profile (useful for testing different competitors)
    const body = await request.json();
    const { userId } = body;
    if (userId) {
      const switched = db.setCurrentUser(userId);
      return NextResponse.json({ success: true, user: switched });
    }
    return NextResponse.json({ success: false, error: "User ID required" }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to switch user";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

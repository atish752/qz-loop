import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/data/store";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const checkUsername = searchParams.get("checkUsername");

    if (checkUsername) {
      const requestedUserId = searchParams.get("userId") || request.headers.get("x-user-id");
      const isAvailable = db.isUsernameAvailable(checkUsername, requestedUserId || undefined);
      return NextResponse.json({
        success: true,
        username: checkUsername.trim().toLowerCase().replace(/^@/, ""),
        available: isAvailable,
      });
    }

    const requestedUserId = searchParams.get("userId") || request.headers.get("x-user-id");
    const user = requestedUserId ? db.getProfileById(requestedUserId) || null : null;
    const exams = db.getExaminations();
    const activeExamId = user?.preferred_examination_id || exams[0]?.id || "exam-railway-ntpc";
    const subjects = db.getSubjects(activeExamId);
    const hiddenCount = user ? db.getHiddenQuestions(user.id).length : 0;

    return NextResponse.json({
      success: true,
      user,
      isGuest: !user,
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
    const requestedUserId = body.userId || body.id || request.headers.get("x-user-id");
    const payload = {
      ...body,
      preferred_examination_id: body.preferred_examination_id || body.preferredExaminationId,
      target_exam: body.target_exam || body.targetExam,
      display_name: body.display_name || body.displayName,
    };
    const updated = db.updateProfile(payload, requestedUserId || undefined);
    return NextResponse.json({
      success: true,
      user: updated,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update profile";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;
    if (userId) {
      const switched = db.setCurrentUser(userId);
      return NextResponse.json({ success: true, user: switched });
    }

    const examId = body.preferred_examination_id || body.preferredExaminationId;
    if (examId) {
      const updated = db.updateProfile({
        preferred_examination_id: examId,
        target_exam: body.target_exam || body.targetExam,
      });
      return NextResponse.json({ success: true, user: updated });
    }

    return NextResponse.json({ success: false, error: "User ID or Examination ID required" }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to switch user or update exam";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

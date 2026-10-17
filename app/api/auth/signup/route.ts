import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/data/store";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      display_name,
      displayName,
      username,
      target_exam,
      targetExam,
      preferred_examination_id,
      preferredExaminationId,
      avatar_url,
      avatarUrl,
      email,
      language_preference,
      languagePreference,
    } = body;

    const name = (display_name || displayName || "").trim();
    const uname = (username || "").trim().toLowerCase();
    const exam = target_exam || targetExam || "Railways (RRB NTPC & Group D)";
    const examId = preferred_examination_id || preferredExaminationId || "exam-railway-ntpc";
    const avatar = avatar_url || avatarUrl || "";
    const lang = (language_preference || languagePreference || "en") === "hi" ? "hi" : "en";

    if (!name) {
      return NextResponse.json({ success: false, error: "Display name is required" }, { status: 400 });
    }
    if (!uname || uname.length < 3) {
      return NextResponse.json({ success: false, error: "Username must be at least 3 characters" }, { status: 400 });
    }

    const newUser = db.signUpUser({
      display_name: name,
      username: uname,
      target_exam: exam,
      preferred_examination_id: examId,
      avatar_url: avatar,
      email,
      language_preference: lang,
    });

    return NextResponse.json({
      success: true,
      user: newUser,
      message: "Account created with fresh zero baseline data!",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Signup failed";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

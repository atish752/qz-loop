import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/data/store";
import { createServerSupabaseClient } from "@/lib/supabase/server";

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
    const exam = target_exam || targetExam || "NEET UG (Medical Entrance)";
    const examId = preferred_examination_id || preferredExaminationId || "exam-neet-ug";
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

    // Cloud sync to Supabase profiles table
    try {
      const supabase = await createServerSupabaseClient();
      if (supabase && newUser) {
        await supabase.from("profiles").upsert({
          id: newUser.id,
          display_name: newUser.display_name,
          username: newUser.username,
          target_exam: newUser.target_exam,
          preferred_examination_id: newUser.preferred_examination_id,
          avatar_url: newUser.avatar_url,
          email: newUser.email,
          language_preference: newUser.language_preference,
          onboarding_completed: true,
        });
      }
    } catch (sbErr) {
      console.error("Supabase signup profile sync notice:", sbErr);
    }

    const res = NextResponse.json({
      success: true,
      user: newUser,
      message: "Account created with fresh zero baseline data!",
    });
    res.cookies.set("qz_user_id", newUser.id, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      sameSite: "lax",
    });
    return res;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Signup failed";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

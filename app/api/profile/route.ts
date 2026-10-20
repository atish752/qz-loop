import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/data/store";
import { createServerSupabaseClient } from "@/lib/supabase/server";

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

    const cookieUserId = request.cookies.get("qz_user_id")?.value;
    const requestedUserId =
      searchParams.get("userId") ||
      request.headers.get("x-user-id") ||
      cookieUserId;

    let user = requestedUserId ? db.getProfileById(requestedUserId) || null : null;

    // Cloud recovery: if user is not in in-memory store, recover from Supabase
    if (!user && requestedUserId) {
      try {
        const supabase = await createServerSupabaseClient();
        if (supabase) {
          const { data: dbProfile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", requestedUserId)
            .maybeSingle();

          if (dbProfile) {
            user = db.syncUserFromAuth({
              id: dbProfile.id,
              display_name: dbProfile.display_name,
              username: dbProfile.username,
              target_exam: dbProfile.target_exam,
              preferred_examination_id: dbProfile.preferred_examination_id,
              avatar_url: dbProfile.avatar_url,
              email: dbProfile.email,
              language_preference: dbProfile.language_preference,
              onboarding_completed: dbProfile.onboarding_completed,
            });
          } else {
            const { data: authData } = await supabase.auth.getUser();
            if (authData?.user && authData.user.id === requestedUserId) {
              const u = authData.user;
              const meta = u.user_metadata || {};
              user = db.syncUserFromAuth({
                id: u.id,
                display_name: meta.full_name || meta.name || u.email?.split("@")[0] || "Aspirant",
                username: "aspirant_" + u.id.slice(0, 6),
                avatar_url: meta.avatar_url || meta.picture || null,
                email: u.email,
              });
            }
          }
        }
      } catch (recoveryErr) {
        console.error("Supabase profile recovery notice:", recoveryErr);
      }
    }
    const exams = db.getExaminations();
    const activeExamId = user?.preferred_examination_id || "exam-neet-ug";
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
    const cookieUserId = request.cookies.get("qz_user_id")?.value;
    const requestedUserId =
      body.userId || body.id || request.headers.get("x-user-id") || cookieUserId;
    const payload = {
      ...body,
      preferred_examination_id: body.preferred_examination_id || body.preferredExaminationId,
      target_exam: body.target_exam || body.targetExam,
      display_name: body.display_name || body.displayName,
    };
    const updated = db.updateProfile(payload, requestedUserId || undefined);

    // Sync to Supabase cloud if connected
    try {
      const supabase = await createServerSupabaseClient();
      if (supabase && updated) {
        await supabase.from("profiles").upsert({
          id: updated.id,
          display_name: updated.display_name,
          username: updated.username,
          target_exam: updated.target_exam,
          preferred_examination_id: updated.preferred_examination_id,
          avatar_url: updated.avatar_url,
          email: updated.email,
          language_preference: updated.language_preference,
          onboarding_completed: updated.onboarding_completed ?? true,
        });
      }
    } catch (supabaseErr) {
      console.error("Supabase profile sync error:", supabaseErr);
    }

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
    const cookieUserId = request.cookies.get("qz_user_id")?.value;
    const requestedUserId =
      body.userId || request.headers.get("x-user-id") || cookieUserId;

    if (body.userId) {
      const switched = db.setCurrentUser(body.userId);
      return NextResponse.json({ success: true, user: switched });
    }

    const examId = body.preferred_examination_id || body.preferredExaminationId;
    if (examId) {
      const updated = db.updateProfile(
        {
          preferred_examination_id: examId,
          target_exam: body.target_exam || body.targetExam,
        },
        requestedUserId || undefined
      );

      // Sync updated exam to Supabase
      try {
        const supabase = await createServerSupabaseClient();
        if (supabase && requestedUserId) {
          await supabase.from("profiles").update({
            preferred_examination_id: examId,
            target_exam: body.target_exam || body.targetExam,
          }).eq("id", requestedUserId);
        }
      } catch (err) {
        console.error("Supabase exam update notice:", err);
      }

      return NextResponse.json({ success: true, user: updated });
    }

    return NextResponse.json({ success: false, error: "User ID or Examination ID required" }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to switch user or update exam";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}


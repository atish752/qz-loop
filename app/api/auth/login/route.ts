import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/data/store";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { identifier, email, isGoogle, googleName, googleEmail, googleAvatar } = body;

    // Handle Google Sign-In
    if (isGoogle) {
      const name = googleName || (googleEmail ? googleEmail.split("@")[0] : "Google Aspirant");
      const baseUsername = (googleEmail ? googleEmail.split("@")[0] : "aspirant")
        .toLowerCase()
        .replace(/[^a-z0-9_.]/g, "");

      // 1. Check if user already exists in Supabase by email or username
      try {
        const supabase = await createServerSupabaseClient();
        if (supabase) {
          let cloudUser: any = null;
          if (googleEmail) {
            const { data } = await supabase.from("profiles").select("*").eq("email", googleEmail).maybeSingle();
            if (data) cloudUser = data;
          }
          if (!cloudUser) {
            const { data } = await supabase.from("profiles").select("*").ilike("username", baseUsername).maybeSingle();
            if (data) cloudUser = data;
          }
          if (cloudUser) {
            const targetUser = db.syncUserFromAuth(cloudUser);
            const res = NextResponse.json({ success: true, user: targetUser, isExisting: true });
            res.cookies.set("qz_user_id", targetUser.id, { path: "/", maxAge: 60 * 60 * 24 * 30, sameSite: "lax" });
            return res;
          }
        }
      } catch (err) {
        console.error("Supabase google auth check notice:", err);
      }

      // 2. Check local memory
      let targetUsername = baseUsername;
      let counter = 1;
      while (!db.isUsernameAvailable(targetUsername)) {
        const existing = db.getAllProfiles().find((p) => p.username === targetUsername);
        if (existing) {
          const targetUser = db.getProfileById(existing.id) || existing;
          const res = NextResponse.json({ success: true, user: targetUser, isExisting: true });
          res.cookies.set("qz_user_id", targetUser.id, { path: "/", maxAge: 60 * 60 * 24 * 30, sameSite: "lax" });
          return res;
        }
        targetUsername = `${baseUsername}_${counter++}`;
      }

      // Create new user for fresh Google sign-in
      const newUser = db.signUpUser({
        display_name: name,
        username: targetUsername,
        target_exam: "NEET UG (Medical Entrance)",
        preferred_examination_id: "exam-neet-ug",
        avatar_url: googleAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80",
        email: googleEmail,
      });

      // Persist to Supabase
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
            onboarding_completed: true,
          });
        }
      } catch (sbErr) {
        console.error("Supabase new google user persist notice:", sbErr);
      }

      const res = NextResponse.json({ success: true, user: newUser, isNew: true });
      res.cookies.set("qz_user_id", newUser.id, { path: "/", maxAge: 60 * 60 * 24 * 30, sameSite: "lax" });
      return res;
    }

    // Handle Email/Username Login
    const searchId = (identifier || email || "").trim().toLowerCase().replace(/^@+/, "");
    if (!searchId) {
      return NextResponse.json({ success: false, error: "Please enter your username or email" }, { status: 400 });
    }

    // 1. Check local in-memory profiles first
    const matched = db.getAllProfiles().find(
      (p) => p.username.toLowerCase() === searchId || p.display_name.toLowerCase() === searchId
    );

    if (matched) {
      const targetUser = db.getProfileById(matched.id) || matched;
      const res = NextResponse.json({ success: true, user: targetUser });
      res.cookies.set("qz_user_id", targetUser.id, { path: "/", maxAge: 60 * 60 * 24 * 30, sameSite: "lax" });
      return res;
    }

    // 2. Query Supabase profiles table for cross-device authentication
    try {
      const supabase = await createServerSupabaseClient();
      if (supabase) {
        // Query by username
        const { data: byUname } = await supabase
          .from("profiles")
          .select("*")
          .ilike("username", searchId)
          .maybeSingle();

        let cloudUser = byUname;
        if (!cloudUser) {
          const { data: byEmail } = await supabase
            .from("profiles")
            .select("*")
            .ilike("email", searchId)
            .maybeSingle();
          if (byEmail) cloudUser = byEmail;
        }
        if (!cloudUser) {
          const { data: byName } = await supabase
            .from("profiles")
            .select("*")
            .ilike("display_name", searchId)
            .maybeSingle();
          if (byName) cloudUser = byName;
        }

        if (cloudUser) {
          const targetUser = db.syncUserFromAuth(cloudUser);
          const res = NextResponse.json({ success: true, user: targetUser });
          res.cookies.set("qz_user_id", targetUser.id, { path: "/", maxAge: 60 * 60 * 24 * 30, sameSite: "lax" });
          return res;
        }
      }
    } catch (err) {
      console.error("Supabase cross-device login check notice:", err);
    }

    return NextResponse.json({
      success: false,
      error: `No aspirant account found for @${searchId}. Please sign up.`,
    }, { status: 404 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Login failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/data/store";

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
      
      // Check if user already exists with this username
      let targetUsername = baseUsername;
      let counter = 1;
      while (!db.isUsernameAvailable(targetUsername)) {
        // If it's existing profile, switch to it
        const existing = db.getAllProfiles().find((p) => p.username === targetUsername);
        if (existing) {
          const switched = db.setCurrentUser(existing.id);
          return NextResponse.json({ success: true, user: switched, isExisting: true });
        }
        targetUsername = `${baseUsername}_${counter++}`;
      }

      // Create new zero-data user for fresh Google sign-in
      const newUser = db.signUpUser({
        display_name: name,
        username: targetUsername,
        target_exam: "Railways (RRB NTPC & Group D)",
        preferred_examination_id: "exam-railway-ntpc",
        avatar_url: googleAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80",
        email: googleEmail,
      });

      return NextResponse.json({ success: true, user: newUser, isNew: true });
    }

    // Handle Email/Username Login
    const searchId = (identifier || email || "").trim().toLowerCase().replace(/^@+/, "");
    if (!searchId) {
      return NextResponse.json({ success: false, error: "Please enter your username or email" }, { status: 400 });
    }

    const matched = db.getAllProfiles().find(
      (p) => p.username.toLowerCase() === searchId || p.display_name.toLowerCase() === searchId
    );

    if (matched) {
      const switched = db.setCurrentUser(matched.id);
      return NextResponse.json({ success: true, user: switched });
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

import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { db } from "@/lib/data/store";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createServerSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error && data?.user) {
        const user = data.user;
        const meta = user.user_metadata || {};
        const email = user.email || "";
        const name = meta.full_name || meta.name || (email ? email.split("@")[0] : "Aspirant");
        const avatar = meta.avatar_url || meta.picture || null;

        // Check if profile exists in Supabase PostgreSQL
        try {
          const { data: existingProfile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .maybeSingle();

          let username = existingProfile?.username;

          if (!existingProfile) {
            // New user: generate temporary unique username
            const cleanBase = (meta.name || (email ? email.split("@")[0] : "aspirant"))
              .toLowerCase()
              .replace(/[^a-z0-9_]/g, "")
              .slice(0, 15);
            const rand = Math.floor(1000 + Math.random() * 9000);
            username = `${cleanBase || "aspirant"}_${rand}`;

            await supabase.from("profiles").insert({
              id: user.id,
              display_name: name,
              username: username,
              avatar_url: avatar,
              target_exam: "Railways (RRB NTPC & Group D)",
              preferred_examination_id: "exam-railway-ntpc",
              role: "student",
              current_streak: 0,
              daily_goal: 10,
              today_solved_count: 0,
              total_questions_answered: 0,
              overall_accuracy: 0,
            });
          }

          // Sync into local data store
          db.syncUserFromAuth({
            id: user.id,
            display_name: existingProfile?.display_name || name,
            username: username || existingProfile?.username || ("user_" + user.id.slice(0, 8)),
            avatar_url: existingProfile?.avatar_url || avatar,
            target_exam: existingProfile?.target_exam || "Railways (RRB NTPC & Group D)",
            preferred_examination_id: existingProfile?.preferred_examination_id || "exam-railway-ntpc",
          });
        } catch (dbErr) {
          console.error("Error creating/syncing user profile on callback:", dbErr);
        }

        // Return redirect with user ID cookie
        const response = NextResponse.redirect(`${origin}${next}`);
        response.cookies.set("qz_user_id", user.id, {
          path: "/",
          maxAge: 60 * 60 * 24 * 30, // 30 days
          sameSite: "lax",
        });
        return response;
      }
    }
  }

  // Redirect to home if code is invalid or missing
  return NextResponse.redirect(`${origin}/`);
}

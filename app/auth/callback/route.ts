import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { db } from "@/lib/data/store";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  const errorParam = searchParams.get("error");
  const errorDesc = searchParams.get("error_description");

  // 1. Handle error response from Google / Supabase
  if (errorParam || errorDesc) {
    const errorHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Sign-In Issue · Qz Loop</title>
  <style>
    body {
      background: #0b0f19;
      color: #f0f3fa;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 24px;
      text-align: center;
      box-sizing: border-box;
    }
    .card {
      max-width: 420px;
      width: 100%;
      background: #121724;
      border: 1px solid #263046;
      border-radius: 24px;
      padding: 32px 24px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.4);
    }
    .icon {
      font-size: 36px;
      margin-bottom: 12px;
    }
    h2 {
      font-size: 20px;
      font-weight: 700;
      margin: 0 0 8px 0;
    }
    p {
      color: #94a3b8;
      font-size: 13px;
      line-height: 1.5;
      margin: 0 0 24px 0;
    }
    .btn {
      display: inline-block;
      width: 100%;
      padding: 14px;
      border-radius: 14px;
      background: #a855f7;
      color: #ffffff;
      font-weight: 700;
      font-size: 14px;
      text-decoration: none;
      box-sizing: border-box;
      transition: background 0.2s;
    }
    .btn:hover {
      background: #c084fc;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">⚠️</div>
    <h2>Google Sign-In Notice</h2>
    <p>${errorDesc || errorParam || "Could not complete sign-in. Please try again."}</p>
    <a href="/" class="btn">Return to Qz Loop & Try Again</a>
  </div>
</body>
</html>`;
    return new NextResponse(errorHtml, {
      status: 400,
      headers: { "Content-Type": "text/html" },
    });
  }

  // 2. Exchange code for Supabase session
  if (code) {
    const supabase = await createServerSupabaseClient();
    if (supabase) {
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (!exchangeError && data?.user) {
        const user = data.user;
        const meta = user.user_metadata || {};
        const email = user.email || "";
        const name = meta.full_name || meta.name || (email ? email.split("@")[0] : "Aspirant");
        const avatar = meta.avatar_url || meta.picture || null;
        let isNewUser = false;

        let existingProfile: any = null;
        let username: string | undefined = undefined;

        try {
          const { data: dbProfile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .maybeSingle();

          existingProfile = dbProfile;
          username = existingProfile?.username;

          if (!existingProfile) {
            isNewUser = true;
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
              email: email,
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
        } catch (dbErr) {
          console.error("Supabase profiles table query/insert notice:", dbErr);
        }

        // Sync into application store
        const syncedUser = db.syncUserFromAuth({
          id: user.id,
          display_name: existingProfile?.display_name || name,
          username: username || existingProfile?.username || ("aspirant_" + user.id.slice(0, 6)),
          avatar_url: existingProfile?.avatar_url || avatar,
          target_exam: existingProfile?.target_exam || "Railways (RRB NTPC & Group D)",
          preferred_examination_id: existingProfile?.preferred_examination_id || "exam-railway-ntpc",
          email: existingProfile?.email || email,
          language_preference: existingProfile?.language_preference || "en",
          onboarding_completed: existingProfile?.onboarding_completed ?? (existingProfile ? true : false),
        });

        // 3. Return client bridge HTML that instantly populates localStorage & dispatches event
        const successHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Completing Sign-In · Qz Loop</title>
  <style>
    body {
      background: #0b0f19;
      color: #f0f3fa;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
      text-align: center;
    }
    .spinner {
      width: 44px;
      height: 44px;
      border: 3.5px solid rgba(168, 85, 247, 0.2);
      border-top-color: #a855f7;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-bottom: 18px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    h2 { font-size: 19px; font-weight: 700; margin: 0 0 6px 0; }
    p { color: #94a3b8; font-size: 13px; margin: 0; }
  </style>
</head>
<body>
  <div class="spinner"></div>
  <h2>Welcome, ${name}!</h2>
  <p>Connecting to your practice loop...</p>
  <script>
    try {
      var uid = ${JSON.stringify(user.id)};
      var profileData = ${JSON.stringify(syncedUser)};
      localStorage.setItem("qz_user_id", uid);
      localStorage.setItem("qz_auth_user", JSON.stringify(profileData));
      ${!isNewUser ? 'localStorage.setItem("qz_onboarding_completed", "true");\n      localStorage.setItem("qz_details_submitted", "true");' : 'localStorage.setItem("qz_just_signed_up", "true");'}
      document.cookie = "qz_user_id=" + uid + "; path=/; max-age=2592000; SameSite=Lax";
      window.dispatchEvent(new CustomEvent("qz_auth_changed", { detail: { user: profileData } }));
    } catch(err) {
      console.error("Storage error:", err);
    }
    window.location.replace(${JSON.stringify(next)});
  </script>
</body>
</html>`;

        const response = new NextResponse(successHtml, {
          status: 200,
          headers: { "Content-Type": "text/html" },
        });
        response.cookies.set("qz_user_id", user.id, {
          path: "/",
          maxAge: 60 * 60 * 24 * 30, // 30 days
          sameSite: "lax",
        });
        return response;
      }
    }
  }

  // 4. Client-side hash or token fallback bridge
  const clientFallbackHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Verifying Sign-In · Qz Loop</title>
  <style>
    body {
      background: #0b0f19;
      color: #f0f3fa;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
      text-align: center;
    }
    .spinner {
      width: 44px;
      height: 44px;
      border: 3.5px solid rgba(168, 85, 247, 0.2);
      border-top-color: #a855f7;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-bottom: 18px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="spinner"></div>
  <h2>Finalizing Sign-In...</h2>
  <p style="color: #94a3b8; font-size: 13px;">Checking authentication credentials...</p>
  <script>
    // Check if error is in hash fragment
    if (window.location.hash && window.location.hash.includes("error")) {
      var params = new URLSearchParams(window.location.hash.substring(1));
      var err = params.get("error_description") || params.get("error");
      if (err) {
        document.body.innerHTML = '<div style="max-width:400px;background:#121724;border:1px solid #263046;border-radius:24px;padding:32px 24px;box-shadow:0 20px 40px rgba(0,0,0,0.4);"><div style="font-size:36px;margin-bottom:12px;">⚠️</div><h2 style="font-size:20px;font-weight:700;margin-bottom:8px;">Sign-In Notice</h2><p style="color:#94a3b8;font-size:13px;margin-bottom:20px;">' + err + '</p><a href="/" style="display:inline-block;width:100%;padding:14px;border-radius:14px;background:#a855f7;color:#fff;font-weight:700;font-size:14px;text-decoration:none;">Return to Qz Loop & Try Again</a></div>';
      } else {
        window.location.replace(${JSON.stringify(next)});
      }
    } else {
      setTimeout(function() {
        window.location.replace(${JSON.stringify(next)});
      }, 1000);
    }
  </script>
</body>
</html>`;

  return new NextResponse(clientFallbackHtml, {
    status: 200,
    headers: { "Content-Type": "text/html" },
  });
}

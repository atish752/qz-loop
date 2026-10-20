import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/data/store";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const cookieUserId = request.cookies.get("qz_user_id")?.value;
    const requestedUserId =
      searchParams.get("userId") || request.headers.get("x-user-id") || cookieUserId || undefined;

    if (!requestedUserId || requestedUserId === "guest") {
      return NextResponse.json({ success: true, friends: [], isGuest: true });
    }

    // 1. If searching users, query Supabase cloud database first to find cross-device peers
    if (search) {
      const cleanSearch = search.trim().toLowerCase().replace(/^@+/, "");
      try {
        const supabase = await createServerSupabaseClient();
        if (supabase && cleanSearch) {
          // Query by username and display_name without fragile PostgREST .or() URL encoding issues
          const { data: byUsername } = await supabase
            .from("profiles")
            .select("id, display_name, username, avatar_url, target_exam, current_streak, preferred_examination_id")
            .ilike("username", `%${cleanSearch}%`)
            .neq("id", requestedUserId)
            .limit(25);

          const { data: byName } = await supabase
            .from("profiles")
            .select("id, display_name, username, avatar_url, target_exam, current_streak, preferred_examination_id")
            .ilike("display_name", `%${cleanSearch}%`)
            .neq("id", requestedUserId)
            .limit(25);

          const combined = [...(byUsername || []), ...(byName || [])];
          const seen = new Set<string>();
          for (const rp of combined) {
            if (!seen.has(rp.id) && rp.id !== requestedUserId) {
              seen.add(rp.id);
              db.syncUserFromAuth({
                id: rp.id,
                display_name: rp.display_name,
                username: rp.username,
                avatar_url: rp.avatar_url,
                target_exam: rp.target_exam,
                preferred_examination_id: rp.preferred_examination_id,
              });
            }
          }
        }
      } catch (err) {
        console.error("Supabase user search notice:", err);
      }

      const searchResults = db.searchUsers(search, requestedUserId);
      return NextResponse.json({ success: true, users: searchResults });
    }

    // 2. Sync cloud friendships from Supabase
    try {
      const supabase = await createServerSupabaseClient();
      if (supabase) {
        const { data: cloudFriendships } = await supabase
          .from("friendships")
          .select("friend_id, status")
          .eq("user_id", requestedUserId);

        if (cloudFriendships && cloudFriendships.length > 0) {
          const localFriends = db.getFriends(requestedUserId);
          for (const cf of cloudFriendships) {
            const exists = localFriends.find((f) => f.id === cf.friend_id);
            if (!exists) {
              const friendProfile = db.getProfileById(cf.friend_id);
              if (friendProfile) {
                localFriends.push({
                  id: friendProfile.id,
                  display_name: friendProfile.display_name,
                  username: friendProfile.username,
                  avatar_url: friendProfile.avatar_url,
                  streak_days: friendProfile.current_streak,
                  target_exam: friendProfile.target_exam || "NEET UG",
                  status: cf.status === "friend" ? "friend" : "request_sent",
                  last_active: "Active recently",
                });
              }
            }
          }
        }
      }
    } catch (err) {
      console.error("Supabase friendships sync notice:", err);
    }

    const friends = db.getFriends(requestedUserId);
    return NextResponse.json({ success: true, friends });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load friends";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { target } = body;
    if (!target) {
      return NextResponse.json({ success: false, error: "Friend username or ID is required" }, { status: 400 });
    }
    const cookieUserId = request.cookies.get("qz_user_id")?.value;
    const currentUserId =
      body.userId || request.headers.get("x-user-id") || cookieUserId;

    if (!currentUserId || currentUserId === "guest") {
      return NextResponse.json({ success: false, error: "Unauthorized: User ID required" }, { status: 401 });
    }

    // Cloud recovery: if target is a username or ID not in memory, look up in Supabase
    try {
      const supabase = await createServerSupabaseClient();
      if (supabase) {
        const clean = target.trim().replace(/^@+/, "");
        const { data: remoteUser } = await supabase
          .from("profiles")
          .select("id, display_name, username, avatar_url, target_exam, preferred_examination_id")
          .or(`id.eq.${clean},username.ilike.${clean},display_name.ilike.${clean}`)
          .maybeSingle();

        if (remoteUser) {
          db.syncUserFromAuth({
            id: remoteUser.id,
            display_name: remoteUser.display_name,
            username: remoteUser.username,
            avatar_url: remoteUser.avatar_url,
            target_exam: remoteUser.target_exam,
            preferred_examination_id: remoteUser.preferred_examination_id,
          });
        }
      }
    } catch (err) {
      console.error("Supabase friend lookup notice:", err);
    }

    const result = db.sendFriendRequest(currentUserId, target);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.message }, { status: 400 });
    }

    // Persist mutual friendship to Supabase cloud
    try {
      const supabase = await createServerSupabaseClient();
      if (supabase && result.friend) {
        await supabase.from("friendships").upsert({
          user_id: currentUserId,
          friend_id: result.friend.id,
          status: "friend",
        });
        try {
          await supabase.from("friendships").upsert({
            user_id: result.friend.id,
            friend_id: currentUserId,
            status: "friend",
          });
        } catch {}
      }
    } catch (err) {
      console.error("Supabase friendship persist notice:", err);
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to send friend request";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { friendId, action } = body;
    if (!friendId || (action !== "accept" && action !== "decline")) {
      return NextResponse.json({ success: false, error: "Valid friendId and action are required" }, { status: 400 });
    }
    const cookieUserId = request.cookies.get("qz_user_id")?.value;
    const currentUserId =
      body.userId || request.headers.get("x-user-id") || cookieUserId;

    if (!currentUserId || currentUserId === "guest") {
      return NextResponse.json({ success: false, error: "Unauthorized: User ID required" }, { status: 401 });
    }

    const result = db.respondFriendRequest(currentUserId, friendId, action);

    // Sync to Supabase
    try {
      const supabase = await createServerSupabaseClient();
      if (supabase) {
        if (action === "accept") {
          await supabase.from("friendships").upsert([
            { user_id: currentUserId, friend_id: friendId, status: "friend" },
            { user_id: friendId, friend_id: currentUserId, status: "friend" },
          ]);
        } else {
          await supabase
            .from("friendships")
            .delete()
            .or(`and(user_id.eq.${currentUserId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${currentUserId})`);
        }
      }
    } catch (err) {
      console.error("Supabase friendship patch notice:", err);
    }

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update friend request";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

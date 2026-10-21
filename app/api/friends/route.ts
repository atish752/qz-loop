import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/data/store";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { FriendUser, UserProfile } from "@/types/database";

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

    let supabaseConnected = false;

    // 1. Always sync authoritative cloud friendships from Supabase first
    try {
      const supabase = await createServerSupabaseClient();
      if (supabase) {
        supabaseConnected = true;

        // Ensure current user profile is hydrated in local store
        if (!db.getProfileById(requestedUserId)) {
          const { data: myProf } = await supabase
            .from("profiles")
            .select("id, display_name, username, avatar_url, target_exam, current_streak, preferred_examination_id")
            .eq("id", requestedUserId)
            .maybeSingle();

          if (myProf) {
            db.syncUserFromAuth(myProf);
          }
        }

        const { data: cloudFriendships, error: fError } = await supabase
          .from("friendships")
          .select("user_id, friend_id, status")
          .or(`user_id.eq.${requestedUserId},friend_id.eq.${requestedUserId}`);

        if (!fError && cloudFriendships) {
          const peerIds = Array.from(
            new Set(
              cloudFriendships
                .map((cf) => (cf.user_id === requestedUserId ? cf.friend_id : cf.user_id))
                .filter((id) => id && id !== requestedUserId)
            )
          );

          if (peerIds.length > 0) {
            const { data: peerProfiles } = await supabase
              .from("profiles")
              .select("id, display_name, username, avatar_url, target_exam, current_streak, preferred_examination_id")
              .in("id", peerIds);

            if (peerProfiles && peerProfiles.length > 0) {
              for (const rp of peerProfiles) {
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

          // Build fresh friends list from Supabase cloud
          const syncedFriends: FriendUser[] = [];
          const seenPeers = new Set<string>();

          for (const cf of cloudFriendships) {
            const peerId: string = cf.user_id === requestedUserId ? cf.friend_id : cf.user_id;
            if (!peerId || peerId === requestedUserId || seenPeers.has(peerId)) continue;
            seenPeers.add(peerId);

            let effectiveStatus: "friend" | "request_sent" | "pending_incoming" = "friend";
            if (cf.status === "friend") {
              effectiveStatus = "friend";
            } else if (cf.status === "pending_incoming" || cf.status === "request_received") {
              effectiveStatus = cf.user_id === requestedUserId ? "pending_incoming" : "request_sent";
            } else if (cf.status === "request_sent") {
              effectiveStatus = cf.user_id === requestedUserId ? "request_sent" : "pending_incoming";
            } else {
              effectiveStatus = cf.user_id === requestedUserId ? "request_sent" : "pending_incoming";
            }

            const friendProfile = db.getProfileById(peerId);
            syncedFriends.push({
              id: peerId,
              display_name:
                friendProfile?.display_name ||
                `Aspirant ${peerId.replace(/[^0-9a-zA-Z]/g, "").slice(0, 4).toUpperCase() || "Study"}`,
              username:
                friendProfile?.username ||
                `aspirant_${peerId.replace(/[^0-9a-zA-Z]/g, "").slice(0, 6)}`,
              avatar_url: friendProfile?.avatar_url,
              streak_days: friendProfile?.current_streak || 1,
              target_exam: friendProfile?.target_exam || "NEET UG",
              status: effectiveStatus,
              last_active: "Active recently",
            });
          }

          // Update store with authoritative Supabase list
          db.syncFriendsList(requestedUserId, syncedFriends);
        }
      }
    } catch (err) {
      console.error("Supabase friendships sync notice:", err);
    }

    // 2. If searching users, query Supabase cloud database + memory
    if (search) {
      const cleanSearch = search.trim().toLowerCase().replace(/^@+/, "");
      const searchResults: (UserProfile & { isFriend: boolean; friendStatus?: string })[] = [];
      const seenSearchIds = new Set<string>();

      try {
        const supabase = await createServerSupabaseClient();
        if (supabase && cleanSearch) {
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
          for (const rp of combined) {
            if (!seenSearchIds.has(rp.id) && rp.id !== requestedUserId) {
              seenSearchIds.add(rp.id);
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

      const memoryResults = db.searchUsers(search, requestedUserId);
      return NextResponse.json({ success: true, users: memoryResults });
    }

    // 3. Return user's friends list
    const currentProf = requestedUserId ? db.getProfileById(requestedUserId) : null;
    const friends = db.getFriends(requestedUserId).filter(
      (f) =>
        f.id !== requestedUserId &&
        (!currentProf?.username || f.username?.toLowerCase() !== currentProf.username.toLowerCase()) &&
        (!currentProf?.display_name || f.display_name?.toLowerCase() !== currentProf.display_name.toLowerCase())
    );

    return NextResponse.json({ success: true, friends });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load friends";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { target, targetUserId } = body;
    const cleanTarget = (target || targetUserId || "").trim();
    if (!cleanTarget) {
      return NextResponse.json({ success: false, error: "Friend username or ID is required" }, { status: 400 });
    }

    const cookieUserId = request.cookies.get("qz_user_id")?.value;
    const currentUserId =
      body.userId || request.headers.get("x-user-id") || cookieUserId;

    if (!currentUserId || currentUserId === "guest") {
      return NextResponse.json({ success: false, error: "Unauthorized: User ID required" }, { status: 401 });
    }

    // 1. Recover current user profile and target profile from Supabase
    let remoteUser: any = null;
    let senderProfile = db.getProfileById(currentUserId);

    try {
      const supabase = await createServerSupabaseClient();
      if (supabase) {
        // Hydrate or ensure current user in Supabase
        if (!senderProfile) {
          const { data: myProf } = await supabase
            .from("profiles")
            .select("id, display_name, username, avatar_url, target_exam, preferred_examination_id")
            .eq("id", currentUserId)
            .maybeSingle();

          if (myProf) {
            senderProfile = db.syncUserFromAuth(myProf);
          } else {
            // Upsert baseline sender profile so recipient device can resolve sender display info
            const localMe = db.getCurrentUser();
            const { data: createdProf } = await supabase
              .from("profiles")
              .upsert({
                id: currentUserId,
                display_name: localMe.display_name || "Aspirant",
                username: localMe.username || `aspirant_${currentUserId.replace(/[^0-9a-zA-Z]/g, "").slice(0, 6)}`,
                avatar_url: localMe.avatar_url || null,
                target_exam: localMe.target_exam || "NEET UG",
                onboarding_completed: true,
              })
              .select()
              .maybeSingle();

            if (createdProf) {
              senderProfile = db.syncUserFromAuth(createdProf);
            }
          }
        }

        // Look up target user in Supabase safely (ID -> username -> display_name)
        const cleanNoAt = cleanTarget.replace(/^@+/, "");

        // 1a. By exact ID
        if (targetUserId) {
          const { data } = await supabase.from("profiles").select("*").eq("id", targetUserId).maybeSingle();
          if (data) remoteUser = data;
        }
        if (!remoteUser && cleanNoAt) {
          const { data } = await supabase.from("profiles").select("*").eq("id", cleanNoAt).maybeSingle();
          if (data) remoteUser = data;
        }
        // 1b. By username
        if (!remoteUser && cleanNoAt) {
          const { data } = await supabase.from("profiles").select("*").ilike("username", cleanNoAt).maybeSingle();
          if (data) remoteUser = data;
        }
        // 1c. By display name
        if (!remoteUser && cleanNoAt) {
          const { data } = await supabase.from("profiles").select("*").ilike("display_name", cleanNoAt).maybeSingle();
          if (data) remoteUser = data;
        }

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

    // 2. Prevent adding oneself
    const effectiveSender = senderProfile || db.getProfileById(currentUserId) || db.getCurrentUser();
    const resolvedTargetId = remoteUser?.id || cleanTarget;
    const resolvedTargetUsername = remoteUser?.username || cleanTarget.replace(/^@+/, "");

    if (
      resolvedTargetId === currentUserId ||
      (effectiveSender?.username &&
        resolvedTargetUsername.toLowerCase() === effectiveSender.username.toLowerCase())
    ) {
      return NextResponse.json({ success: false, error: "You cannot add yourself as a study partner" }, { status: 400 });
    }

    // 3. Update in-memory store
    const result = db.sendFriendRequest(currentUserId, resolvedTargetId);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.message }, { status: 400 });
    }

    // 4. Persist friendship request state strictly to Supabase cloud
    try {
      const supabase = await createServerSupabaseClient();
      if (supabase && result.friend) {
        const friendId = result.friend.id;
        const myStatus = result.friend.status || "request_sent";
        const peerStatus = myStatus === "friend" ? "friend" : "pending_incoming";

        // Row 1: Sender -> Recipient
        await supabase.from("friendships").upsert(
          {
            user_id: currentUserId,
            friend_id: friendId,
            status: myStatus,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,friend_id" }
        );

        // Row 2: Recipient -> Sender (reciprocal entry so recipient gets instant incoming alert)
        await supabase.from("friendships").upsert(
          {
            user_id: friendId,
            friend_id: currentUserId,
            status: peerStatus,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,friend_id" }
        );
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
    if (!friendId || (action !== "accept" && action !== "decline" && action !== "reject")) {
      return NextResponse.json({ success: false, error: "Valid friendId and action are required" }, { status: 400 });
    }
    const cookieUserId = request.cookies.get("qz_user_id")?.value;
    const currentUserId =
      body.userId || request.headers.get("x-user-id") || cookieUserId;

    if (!currentUserId || currentUserId === "guest") {
      return NextResponse.json({ success: false, error: "Unauthorized: User ID required" }, { status: 401 });
    }

    const normalizedAction = action === "reject" ? "decline" : action;
    const result = db.respondFriendRequest(currentUserId, friendId, normalizedAction);

    // Sync authoritative state to Supabase
    try {
      const supabase = await createServerSupabaseClient();
      if (supabase) {
        if (normalizedAction === "accept") {
          // Accept updates both reciprocal rows to 'friend'
          await supabase.from("friendships").upsert(
            [
              { user_id: currentUserId, friend_id: friendId, status: "friend", updated_at: new Date().toISOString() },
              { user_id: friendId, friend_id: currentUserId, status: "friend", updated_at: new Date().toISOString() },
            ],
            { onConflict: "user_id,friend_id" }
          );
        } else {
          // Decline / Reject deletes friendship rows from Supabase
          await supabase.from("friendships").delete().match({ user_id: currentUserId, friend_id: friendId });
          await supabase.from("friendships").delete().match({ user_id: friendId, friend_id: currentUserId });
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

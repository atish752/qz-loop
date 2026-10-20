import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/data/store";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const friendId = searchParams.get("friendId");
    const requestedUserId =
      searchParams.get("userId") ||
      request.headers.get("x-user-id") ||
      request.cookies.get("qz_user_id")?.value;

    if (!requestedUserId || requestedUserId === "guest") {
      return NextResponse.json({ success: true, messages: [], isGuest: true });
    }

    // Sync cloud direct messages from Supabase
    try {
      const supabase = await createServerSupabaseClient();
      if (supabase && requestedUserId) {
        const idsToHydrate = new Set<string>([requestedUserId]);
        if (friendId) idsToHydrate.add(friendId);

        let query = supabase.from("direct_messages").select("*");
        if (friendId) {
          query = query.or(
            `and(from_user_id.eq.${requestedUserId},to_user_id.eq.${friendId}),and(from_user_id.eq.${friendId},to_user_id.eq.${requestedUserId})`
          );
        } else {
          query = query.or(
            `from_user_id.eq.${requestedUserId},to_user_id.eq.${requestedUserId}`
          );
        }
        const { data: cloudMsgs } = await query
          .order("created_at", { ascending: true })
          .limit(50);

        if (cloudMsgs && cloudMsgs.length > 0) {
          for (const cm of cloudMsgs) {
            if (cm.from_user_id) idsToHydrate.add(cm.from_user_id);
            if (cm.to_user_id) idsToHydrate.add(cm.to_user_id);
          }
        }

        const participantIds = Array.from(idsToHydrate).filter(Boolean);
        if (participantIds.length > 0) {
          const { data: profilesData } = await supabase
            .from("profiles")
            .select("id, display_name, username, avatar_url, target_exam, current_streak, preferred_examination_id")
            .in("id", participantIds);

          if (profilesData && profilesData.length > 0) {
            for (const p of profilesData) {
              db.syncUserFromAuth({
                id: p.id,
                display_name: p.display_name,
                username: p.username,
                avatar_url: p.avatar_url,
                target_exam: p.target_exam,
                preferred_examination_id: p.preferred_examination_id,
              });
            }
          }
        }

        if (cloudMsgs && cloudMsgs.length > 0) {
          for (const cm of cloudMsgs) {
            const existingMsgs = db.getAllMessagesForUser(requestedUserId);
            if (!existingMsgs.some((m) => m.id === cm.id)) {
              db.sendMessage({
                fromUserId: cm.from_user_id,
                toUserId: cm.to_user_id,
                text: cm.text,
                questionId: cm.question_id || undefined,
              });
            }
          }
        }
      }
    } catch (err) {
      console.error("Supabase direct_messages sync notice:", err);
    }

    // Build peers dictionary for instant UI resolution
    const buildPeers = (msgs: Array<{ from_user_id: string; to_user_id: string }>) => {
      const peersMap: Record<string, any> = {};
      const allIds = Array.from(
        new Set([
          ...msgs.flatMap((m) => [m.from_user_id, m.to_user_id]),
          ...(friendId ? [friendId] : []),
          ...(requestedUserId ? [requestedUserId] : []),
        ].filter(Boolean))
      );
      for (const id of allIds) {
        const p = db.getProfileById(id);
        if (p) {
          peersMap[id] = {
            id: p.id,
            display_name: p.display_name,
            username: p.username,
            avatar_url: p.avatar_url,
            target_exam: p.target_exam,
            current_streak: p.current_streak,
          };
        }
      }
      return peersMap;
    };

    if (!friendId) {
      // Return all messages involving requested user
      const allMsgs = db.getAllMessagesForUser(requestedUserId);
      const enhanced = allMsgs.map((m) => {
        if (m.question_id) {
          const q = db.getQuestionById(m.question_id);
          return { ...m, question: q };
        }
        return m;
      });
      return NextResponse.json({ success: true, messages: enhanced, peers: buildPeers(allMsgs) });
    }

    const messages = db.getMessages(requestedUserId, friendId);

    // Enhance any question references with question preview
    const enhanced = messages.map((m) => {
      if (m.question_id) {
        const q = db.getQuestionById(m.question_id);
        return { ...m, question: q };
      }
      return m;
    });

    return NextResponse.json({ success: true, messages: enhanced, peers: buildPeers(messages) });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load study chat messages";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { toUserId, text, questionId } = body;
    if (!toUserId) {
      return NextResponse.json({ success: false, error: "Recipient user ID is required" }, { status: 400 });
    }
    const fromUserId =
      body.fromUserId ||
      request.headers.get("x-user-id") ||
      request.cookies.get("qz_user_id")?.value;

    if (!fromUserId || fromUserId === "guest") {
      return NextResponse.json({ success: false, error: "Unauthorized: Sender user ID required" }, { status: 401 });
    }

    const message = db.sendMessage({
      fromUserId,
      toUserId,
      text,
      questionId,
    });

    // Sync to Supabase direct_messages table
    try {
      const supabase = await createServerSupabaseClient();
      if (supabase) {
        await supabase.from("direct_messages").insert({
          id: message.id,
          from_user_id: fromUserId,
          to_user_id: toUserId,
          text: text || "",
          question_id: questionId || null,
        });
      }
    } catch (err) {
      console.error("Supabase direct message persist notice:", err);
    }

    return NextResponse.json({ success: true, message });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to send chat message";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

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

    let cloudMessages: any[] | null = null;

    // 1. Sync authoritative cloud direct messages from Supabase
    try {
      const supabase = await createServerSupabaseClient();
      if (supabase && requestedUserId) {
        let query = supabase.from("direct_messages").select("*");

        if (friendId) {
          // Robust query without fragile PostgREST .or(and(...)) encoding
          query = query
            .in("from_user_id", [requestedUserId, friendId])
            .in("to_user_id", [requestedUserId, friendId]);
        } else {
          query = query.or(
            `from_user_id.eq.${requestedUserId},to_user_id.eq.${requestedUserId}`
          );
        }

        const { data: cloudMsgs, error: msgsErr } = await query
          .order("created_at", { ascending: true })
          .limit(100);

        if (msgsErr) {
          console.error("Supabase direct_messages select notice:", msgsErr);
        } else if (cloudMsgs) {
          cloudMessages = cloudMsgs;
          const idsToHydrate = new Set<string>([requestedUserId]);
          if (friendId) idsToHydrate.add(friendId);

          for (const cm of cloudMsgs) {
            if (cm.from_user_id) idsToHydrate.add(cm.from_user_id);
            if (cm.to_user_id) idsToHydrate.add(cm.to_user_id);
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

          // Populate local memory store for fallback & acceptance tests
          for (const cm of cloudMsgs) {
            const existingMsgs = db.getAllMessagesForUser(requestedUserId);
            if (!existingMsgs.some((m) => m.id === cm.id)) {
              db.sendMessage({
                id: cm.id,
                fromUserId: cm.from_user_id,
                toUserId: cm.to_user_id,
                text: cm.text,
                questionId: cm.question_id || undefined,
                created_at: cm.created_at,
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
      const rawMsgs = cloudMessages || db.getAllMessagesForUser(requestedUserId);
      const enhanced = rawMsgs.map((m: any) => {
        const qId = m.question_id;
        if (qId) {
          const q = db.getQuestionById(qId);
          return { ...m, question: q };
        }
        return m;
      });
      return NextResponse.json({ success: true, messages: enhanced, peers: buildPeers(rawMsgs) });
    }

    const rawThread =
      cloudMessages || db.getMessages(requestedUserId, friendId);

    // Enhance any question references with question preview
    const enhanced = rawThread.map((m: any) => {
      const qId = m.question_id;
      if (qId) {
        const q = db.getQuestionById(qId);
        return { ...m, question: q };
      }
      return m;
    });

    return NextResponse.json({ success: true, messages: enhanced, peers: buildPeers(rawThread) });
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

    // Sync strictly to Supabase direct_messages table
    try {
      const supabase = await createServerSupabaseClient();
      if (supabase) {
        const { error: insErr } = await supabase.from("direct_messages").insert({
          id: message.id,
          from_user_id: fromUserId,
          to_user_id: toUserId,
          text: text || "",
          question_id: questionId || null,
        });

        if (insErr) {
          console.error("Supabase direct message insert notice:", insErr);
        }
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

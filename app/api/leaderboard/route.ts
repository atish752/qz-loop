import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/data/store";
import { LeaderboardEntry } from "@/types/database";

const DUMMY_USER_IDS = new Set(["user-amit", "user-priya", "user-vikram", "user-ananya"]);
const DUMMY_USERNAMES = new Set(["amit_ssc", "priya_quant", "vikram_p", "ananya_r"]);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const periodParam = searchParams.get("period") || "weekly";
    const period = periodParam === "monthly" ? "monthly" : "weekly";

    const cookieUserId = request.cookies.get("qz_user_id")?.value;
    const resolvedUserId = searchParams.get("userId") || request.headers.get("x-user-id") || cookieUserId || undefined;

    let standings: LeaderboardEntry[] = [];
    let loadedFromSupabase = false;

    // 1. Try querying real profiles & verified attempts from Supabase
    try {
      const { createServerSupabaseClient } = await import("@/lib/supabase/server");
      const supabase = await createServerSupabaseClient();
      if (supabase) {
        const cutoffDays = period === "monthly" ? 30 : 7;
        const cutoffDate = new Date(Date.now() - cutoffDays * 86400000).toISOString();

        const { data: profiles, error: profErr } = await supabase
          .from("profiles")
          .select("id, display_name, username, avatar_url, current_streak");

        if (!profErr && profiles && profiles.length > 0) {
          const realProfiles = profiles.filter(
            (p) => !DUMMY_USER_IDS.has(p.id) && !DUMMY_USERNAMES.has(p.username || "")
          );

          const { data: attempts, error: attErr } = await supabase
            .from("question_attempts")
            .select("user_id, is_correct, response_time_ms, created_at")
            .gte("created_at", cutoffDate);

          if (!attErr && attempts) {
            loadedFromSupabase = true;

            const userStats = new Map<
              string,
              { attempts: number; correct: number; totalTimeMs: number; fastCount: number }
            >();

            for (const p of realProfiles) {
              userStats.set(p.id, { attempts: 0, correct: 0, totalTimeMs: 0, fastCount: 0 });
            }

            for (const a of attempts) {
              if (DUMMY_USER_IDS.has(a.user_id)) continue;
              if (!userStats.has(a.user_id)) {
                userStats.set(a.user_id, { attempts: 0, correct: 0, totalTimeMs: 0, fastCount: 0 });
              }
              const stat = userStats.get(a.user_id)!;
              stat.attempts += 1;
              if (a.is_correct) {
                stat.correct += 1;
                if (a.response_time_ms < 15000) {
                  stat.fastCount += 1;
                }
              }
              stat.totalTimeMs += a.response_time_ms || 0;
            }

            const QUALIFICATION_THRESHOLD = 20;
            const entries: LeaderboardEntry[] = [];

            userStats.forEach((stat, uId) => {
              const profile = realProfiles.find((p) => p.id === uId);
              const attemptsCount = stat.attempts;
              if (attemptsCount === 0 && uId !== resolvedUserId) return;

              const correct = stat.correct;
              const accuracy = attemptsCount > 0 ? Math.round((correct / attemptsCount) * 100) : 0;
              const avgTime = attemptsCount > 0 ? Math.round(stat.totalTimeMs / attemptsCount / 1000) : 0;

              const basePoints = correct * 25;
              const accuracyBonus = Math.round(accuracy * 8);
              const speedBonus = Math.min(stat.fastCount * 5, 200);
              const totalScore = basePoints + accuracyBonus + speedBonus;
              const isQualified = attemptsCount >= QUALIFICATION_THRESHOLD;

              entries.push({
                rank: 0,
                user_id: uId,
                display_name: profile?.display_name || "Aspirant",
                username: profile?.username || undefined,
                avatar_url:
                  profile?.avatar_url ||
                  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80",
                total_attempts: attemptsCount,
                correct_count: correct,
                accuracy_percentage: accuracy,
                avg_time_seconds: avgTime,
                score: totalScore,
                streak_days: profile?.current_streak || 0,
                is_current_user: uId === resolvedUserId,
                is_qualified: isQualified,
              });
            });

            const qualified = entries.filter((e) => e.is_qualified);
            qualified.sort((a, b) => {
              if (b.score !== a.score) return b.score - a.score;
              if (b.accuracy_percentage !== a.accuracy_percentage) return b.accuracy_percentage - a.accuracy_percentage;
              return a.avg_time_seconds - b.avg_time_seconds;
            });
            qualified.forEach((e, idx) => {
              e.rank = idx + 1;
            });

            const unqualified = entries.filter((e) => !e.is_qualified);
            unqualified.sort((a, b) => b.total_attempts - a.total_attempts);
            unqualified.forEach((e) => {
              e.rank = 0;
            });

            standings = [...qualified, ...unqualified];
          }
        }
      }
    } catch (sbErr) {
      console.error("Leaderboard supabase fetch notice:", sbErr);
    }

    // 2. Fallback to in-memory store without mock dummy competitors
    if (!loadedFromSupabase) {
      const rawStandings = db.getLeaderboard(period);
      const filtered = rawStandings.filter(
        (s) => !DUMMY_USER_IDS.has(s.user_id) && !DUMMY_USERNAMES.has(s.username || "")
      );

      const qualified = filtered.filter((s) => s.is_qualified !== false);
      qualified.forEach((s, idx) => {
        s.rank = idx + 1;
        if (resolvedUserId) {
          s.is_current_user = s.user_id === resolvedUserId;
        }
      });

      const unqualified = filtered.filter((s) => s.is_qualified === false);
      unqualified.forEach((s) => {
        s.rank = 0;
        if (resolvedUserId) {
          s.is_current_user = s.user_id === resolvedUserId;
        }
      });

      standings = [...qualified, ...unqualified];
    }

    return NextResponse.json({
      success: true,
      period,
      standings,
      scoringRule: {
        description: "Deterministic transparent scoring formula",
        formula: "(Correct answers × 25) + (Accuracy % × 8) + Speed bonus (up to 200 pts)",
        minAttemptsThreshold: 20,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load leaderboard";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

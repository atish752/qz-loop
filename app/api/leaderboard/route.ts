import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/data/store";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const periodParam = searchParams.get("period") || "weekly";
    const period = periodParam === "monthly" ? "monthly" : "weekly";

    const standings = db.getLeaderboard(period);

    return NextResponse.json({
      success: true,
      period,
      standings,
      scoringRule: {
        description: "Deterministic transparent scoring formula",
        formula: "(Correct answers × 25) + (Accuracy % × 8) + Speed bonus (up to 200 pts)",
        minAttemptsThreshold: 5,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load leaderboard";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

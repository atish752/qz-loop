import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/data/store";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const periodParam = searchParams.get("period") || "week";
    const validPeriods = ["today", "week", "month", "lifetime"] as const;
    const period = validPeriods.includes(periodParam as (typeof validPeriods)[number])
      ? (periodParam as (typeof validPeriods)[number])
      : "week";

    const currentUser = db.getCurrentUser();
    const stats = db.getMatrixStats(currentUser.id, period);

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to calculate stats";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

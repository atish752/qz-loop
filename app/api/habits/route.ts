import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/data/store";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId =
      searchParams.get("userId") ||
      request.headers.get("x-user-id") ||
      request.cookies.get("qz_user_id")?.value;

    if (!userId || userId === "guest") {
      return NextResponse.json({ success: true, settings: null, isGuest: true });
    }
    const settings = db.getHabitSettings(userId);
    return NextResponse.json({ success: true, settings });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load habit settings";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dailyGoal, scheduleSlots } = body;
    const userId =
      body.userId ||
      request.headers.get("x-user-id") ||
      request.cookies.get("qz_user_id")?.value;

    if (!userId || userId === "guest") {
      return NextResponse.json({ success: false, error: "Unauthorized: User ID required" }, { status: 401 });
    }

    if (typeof dailyGoal === "number") {
      const updated = db.updateDailyGoal(userId, dailyGoal);
      return NextResponse.json({ success: true, settings: updated });
    }

    if (Array.isArray(scheduleSlots)) {
      const updated = db.updateHabitSchedule(userId, scheduleSlots);
      return NextResponse.json({ success: true, settings: updated });
    }

    const settings = db.getHabitSettings(userId);
    return NextResponse.json({ success: true, settings });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update habit settings";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

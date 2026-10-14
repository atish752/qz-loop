import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/data/store";

export async function GET() {
  try {
    const currentUser = db.getCurrentUser();
    const settings = db.getHabitSettings(currentUser.id);
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
    const currentUser = db.getCurrentUser();

    if (typeof dailyGoal === "number") {
      const updated = db.updateDailyGoal(currentUser.id, dailyGoal);
      return NextResponse.json({ success: true, settings: updated });
    }

    if (Array.isArray(scheduleSlots)) {
      const updated = db.updateHabitSchedule(currentUser.id, scheduleSlots);
      return NextResponse.json({ success: true, settings: updated });
    }

    const settings = db.getHabitSettings(currentUser.id);
    return NextResponse.json({ success: true, settings });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update habit settings";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

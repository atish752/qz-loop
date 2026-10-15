import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/data/store";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const userId = body.userId || db.getCurrentUser().id;

    const resetUser = db.resetUserData(userId);

    return NextResponse.json({
      success: true,
      user: resetUser,
      message: "User data has been successfully reset to absolute zero scratch!",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Reset failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

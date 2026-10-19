import { NextRequest, NextResponse } from "next/server";
import { detectTopicAndSyllabus } from "@/lib/utils/topicDetector";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text } = body;
    if (!text || typeof text !== "string" || text.trim().length < 4) {
      return NextResponse.json({ success: true, confidence: 0 });
    }

    const detected = detectTopicAndSyllabus(text);
    return NextResponse.json({
      success: true,
      ...detected,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Auto-detection failed";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/data/store";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { questionText, options } = body;

    if (!questionText || typeof questionText !== "string") {
      return NextResponse.json({
        success: true,
        is_exact_duplicate: false,
        is_similar: false,
        similarity_score: 0,
      });
    }

    const optionsText = Array.isArray(options)
      ? options.map((o: unknown) => (typeof o === "string" ? o : (o as { text?: string })?.text || "")).filter(Boolean)
      : undefined;

    const checkResult = db.checkDuplicate(questionText, optionsText);
    return NextResponse.json({
      success: true,
      ...checkResult,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Duplicate check failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

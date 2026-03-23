import { NextRequest, NextResponse } from "next/server";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Validates the common `channel`, `from`, and `to` query parameters.
 * Returns { channelIndex, from, to } on success, or a NextResponse error on failure.
 */
export function validateChannelDateParams(req: NextRequest):
  | { channelIndex: number; from: string; to: string }
  | NextResponse {
  const rawChannel = req.nextUrl.searchParams.get("channel") ?? "1";
  const channelIndex = parseInt(rawChannel, 10);
  if (isNaN(channelIndex) || channelIndex < 1 || channelIndex > 20) {
    return NextResponse.json({ error: "Invalid channel parameter" }, { status: 400 });
  }

  const from = req.nextUrl.searchParams.get("from") ?? "";
  const to = req.nextUrl.searchParams.get("to") ?? "";
  if (!DATE_RE.test(from) || !DATE_RE.test(to)) {
    return NextResponse.json({ error: "Invalid date format — expected YYYY-MM-DD" }, { status: 400 });
  }
  if (from > to) {
    return NextResponse.json({ error: "Invalid date range — from must be before to" }, { status: 400 });
  }

  return { channelIndex, from, to };
}

/**
 * Validates only the `channel` parameter (for routes without a date range).
 */
export function validateChannelParam(req: NextRequest):
  | { channelIndex: number }
  | NextResponse {
  const rawChannel = req.nextUrl.searchParams.get("channel") ?? "1";
  const channelIndex = parseInt(rawChannel, 10);
  if (isNaN(channelIndex) || channelIndex < 1 || channelIndex > 20) {
    return NextResponse.json({ error: "Invalid channel parameter" }, { status: 400 });
  }
  return { channelIndex };
}

/** Generic 500 handler — logs the real error server-side, returns a safe message. */
export function serverError(tag: string, err: unknown): NextResponse {
  console.error(`[${tag}]`, err);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

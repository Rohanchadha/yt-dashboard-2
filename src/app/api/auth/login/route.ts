import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  const secret = process.env.DASHBOARD_SECRET;

  if (!secret) {
    console.error("DASHBOARD_SECRET env var is not set");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  if (!password || password !== secret) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  const redirectTo = req.nextUrl.searchParams.get("redirect") ?? "/";
  // Validate redirect is a relative path to prevent open redirect
  const safePath = redirectTo.startsWith("/") && !redirectTo.startsWith("//")
    ? redirectTo
    : "/";

  const res = NextResponse.json({ ok: true, redirect: safePath });
  res.cookies.set("dashboard_token", secret, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    // In production, set secure: true. For local dev, omit it.
    ...(process.env.NODE_ENV === "production" ? { secure: true } : {}),
  });
  return res;
}

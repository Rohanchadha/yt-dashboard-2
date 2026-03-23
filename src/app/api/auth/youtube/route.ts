import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { getOAuth2Client } from "@/lib/youtube-client";

export async function GET() {
  const state = randomBytes(16).toString("hex");

  const auth = getOAuth2Client();
  const url = auth.generateAuthUrl({
    access_type: "offline",
    prompt: "consent", // forces refresh_token to be returned
    scope: [
      "https://www.googleapis.com/auth/youtube.readonly",
      "https://www.googleapis.com/auth/yt-analytics.readonly",
    ],
    state,
  });

  const res = NextResponse.redirect(url);
  res.cookies.set("oauth_state", state, {
    httpOnly: true,
    maxAge: 600, // 10 minutes
    sameSite: "lax",
    path: "/",
  });
  return res;
}

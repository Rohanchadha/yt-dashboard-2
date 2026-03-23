import { NextRequest, NextResponse } from "next/server";
import { getOAuth2Client } from "@/lib/youtube-client";

export async function GET(req: NextRequest) {
  // CSRF: validate state parameter
  const state = req.nextUrl.searchParams.get("state");
  const savedState = req.cookies.get("oauth_state")?.value;
  if (!state || !savedState || state !== savedState) {
    return NextResponse.json({ error: "Invalid state parameter" }, { status: 400 });
  }

  const code = req.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.json({ error: "No code provided" }, { status: 400 });
  }

  const auth = getOAuth2Client();
  const { tokens } = await auth.getToken(code);

  // Log token server-side only — NEVER render it in HTML
  if (tokens.refresh_token) {
    console.log("\n========================================");
    console.log("YouTube OAuth: refresh token obtained.");
    console.log("Add this to your .env.local:");
    console.log(`YOUTUBE_REFRESH_TOKEN=${tokens.refresh_token}`);
    console.log("========================================\n");
  } else {
    console.warn("No refresh token returned. Re-run auth with prompt=consent.");
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>YouTube Connected</title>
  <style>
    body { font-family: system-ui; background: #0d1117; color: #f0f4ff; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
    .card { background: #161b27; border: 1px solid #2a3345; border-radius: 12px; padding: 32px; max-width: 600px; width: 100%; }
    h2 { color: #22c55e; margin-top: 0; }
    .step { color: #8899bb; font-size: 14px; margin: 8px 0; }
    .highlight { color: #f59e0b; font-weight: bold; }
    .info-box { background: #0d1117; border: 1px solid #2a3345; border-radius: 8px; padding: 16px; font-family: monospace; font-size: 13px; color: #06b6d4; margin: 16px 0; }
  </style>
</head>
<body>
  <div class="card">
    <h2>&#10003; YouTube Connected!</h2>
    <p class="step">Your refresh token has been printed to the <span class="highlight">server terminal</span>.</p>
    <div class="info-box">Check your terminal for the YOUTUBE_REFRESH_TOKEN value,<br>then add it to <strong>.env.local</strong> and restart the dev server.</div>
    <p class="step">Once you have added the token, restart the dev server (<strong>Ctrl+C</strong> &rarr; <strong>npm run dev</strong>) and visit <a href="/" style="color:#06b6d4">the dashboard</a>.</p>
  </div>
</body>
</html>
`;

  const res = new NextResponse(html, { headers: { "Content-Type": "text/html" } });
  // Clear the state cookie
  res.cookies.set("oauth_state", "", { maxAge: 0, path: "/" });
  return res;
}

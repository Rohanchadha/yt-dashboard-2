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

  if (tokens.refresh_token) {
    console.log("\n========================================");
    console.log("YouTube OAuth: refresh token obtained.");
    console.log(`YOUTUBE_REFRESH_TOKEN=${tokens.refresh_token}`);
    console.log("========================================\n");
  } else {
    console.warn("No refresh token returned. Re-run auth with prompt=consent.");
  }

  const tokenSection = tokens.refresh_token
    ? `
    <p class="step">Copy the token below and update your <span class="highlight">Vercel environment variable</span> (or <code>.env.local</code> for local dev).</p>
    <div class="label">YOUTUBE_REFRESH_TOKEN</div>
    <div class="token-box" id="token">${tokens.refresh_token}</div>
    <button onclick="navigator.clipboard.writeText(document.getElementById('token').textContent).then(()=>this.textContent='Copied!')" class="copy-btn">Copy Token</button>
    <div class="info-box">
      In Vercel: <strong>Project Settings → Environment Variables</strong> → update <code>YOUTUBE_REFRESH_TOKEN</code>, then redeploy.
    </div>`
    : `<div class="info-box warn">No refresh token returned. This happens if you previously authorized this app. Go back and try again — Google will issue a new token with the <code>prompt=consent</code> parameter already set.</div>`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>YouTube Connected</title>
  <style>
    body { font-family: system-ui; background: #0d1117; color: #f0f4ff; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
    .card { background: #161b27; border: 1px solid #2a3345; border-radius: 12px; padding: 32px; max-width: 640px; width: 100%; }
    h2 { color: #22c55e; margin-top: 0; }
    .step { color: #8899bb; font-size: 14px; margin: 8px 0; }
    .highlight { color: #f59e0b; font-weight: bold; }
    .label { font-size: 12px; color: #8899bb; margin-top: 16px; margin-bottom: 4px; }
    .token-box { background: #0d1117; border: 1px solid #2a3345; border-radius: 8px; padding: 12px 16px; font-family: monospace; font-size: 12px; color: #06b6d4; word-break: break-all; }
    .copy-btn { margin-top: 8px; background: #1e40af; color: #fff; border: none; border-radius: 6px; padding: 6px 16px; cursor: pointer; font-size: 13px; }
    .copy-btn:hover { background: #1d4ed8; }
    .info-box { background: #0d1117; border: 1px solid #2a3345; border-radius: 8px; padding: 16px; font-size: 13px; color: #8899bb; margin: 16px 0; }
    .info-box.warn { border-color: #f59e0b44; color: #f59e0b; }
  </style>
</head>
<body>
  <div class="card">
    <h2>&#10003; YouTube Connected!</h2>
    ${tokenSection}
    <p class="step" style="margin-top:16px">After updating the environment variable, visit <a href="/" style="color:#06b6d4">the dashboard</a>.</p>
  </div>
</body>
</html>
`;

  const res = new NextResponse(html, { headers: { "Content-Type": "text/html" } });
  // Clear the state cookie
  res.cookies.set("oauth_state", "", { maxAge: 0, path: "/" });
  return res;
}

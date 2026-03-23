import { NextRequest, NextResponse } from "next/server";
import { isChannelConfigured, getAuthenticatedClientForChannel, resolveChannelId, youtubeAnalytics, youtube } from "@/lib/youtube-client";
import { validateChannelDateParams } from "@/lib/api-utils";

const PROGRESS_LABELS = ["1%","5%","10%","15%","20%","25%","30%","35%","40%","45%","50%","55%","60%","65%","70%","75%","80%","85%","90%","95%","100%"];

const ratioToLabel = (ratio: number): string | null => {
  const pct = Math.round(ratio * 100);
  const label = `${pct}%`;
  return PROGRESS_LABELS.includes(label) ? label : null;
};

export async function GET(req: NextRequest) {
  const validated = validateChannelDateParams(req);
  if (validated instanceof NextResponse) return validated;
  const { channelIndex, from, to } = validated;

  const videoId = req.nextUrl.searchParams.get("videoId")?.trim();
  if (!videoId) {
    return NextResponse.json({ error: "videoId is required" }, { status: 400 });
  }

  if (!isChannelConfigured(channelIndex)) {
    return NextResponse.json({ error: "not_configured" }, { status: 401 });
  }

  const auth = getAuthenticatedClientForChannel(channelIndex);
  const channelId = await resolveChannelId(auth, channelIndex);

  // Fetch video title
  const titleRes = await youtube.videos.list({ auth, part: ["snippet"], id: [videoId] });
  const title = (titleRes.data.items?.[0]?.snippet?.title ?? `Video ${videoId}`).slice(0, 30);

  // Fetch retention for the video
  const retentionRes = await youtubeAnalytics.reports.query({
    auth,
    ids: `channel==${channelId}`,
    startDate: from,
    endDate: to,
    metrics: "audienceWatchRatio,relativeRetentionPerformance",
    dimensions: "elapsedVideoTimeRatio",
    filters: `video==${videoId}`,
  }).catch(() => ({ data: { rows: [] } }));

  const rows = retentionRes.data.rows ?? [];
  if (rows.length === 0) {
    return NextResponse.json({ error: "No retention data found for this video in the selected date range." }, { status: 404 });
  }

  const color = "#ef4444";
  const watchMap: Record<string, number> = {};
  const relMap: Record<string, number> = {};

  for (const row of rows) {
    const [ratio, watchRatio, relPerf] = row as [number, number, number];
    const label = ratioToLabel(ratio);
    if (label) {
      watchMap[label] = Math.round(watchRatio * 100);
      relMap[label] = Math.round(relPerf * 100);
    }
  }

  const retentionData = PROGRESS_LABELS.map((progress) => ({
    progress,
    [title]: watchMap[progress] ?? null,
  }));

  const relativeData = PROGRESS_LABELS.map((progress) => ({
    progress,
    "YouTube Average": 65,
    [title]: relMap[progress] ?? null,
  }));

  const videoMeta = [{ title, color, videoId }];

  return NextResponse.json({ retentionData, relativeData, videoMeta });
}

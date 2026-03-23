import { NextRequest, NextResponse } from "next/server";
import { isChannelConfigured, getAuthenticatedClientForChannel, resolveChannelId, youtubeAnalytics, youtube } from "@/lib/youtube-client";
import { validateChannelDateParams } from "@/lib/api-utils";

const VIDEO_COLORS = ["#ef4444", "#06b6d4", "#a855f7", "#f97316", "#22c55e", "#f59e0b"];

export async function GET(req: NextRequest) {
  const validated = validateChannelDateParams(req);
  if (validated instanceof NextResponse) return validated;
  const { channelIndex, from, to } = validated;

  if (!isChannelConfigured(channelIndex)) {
    return NextResponse.json({ error: "not_configured" }, { status: 401 });
  }
  const auth = getAuthenticatedClientForChannel(channelIndex);
  const channelId = await resolveChannelId(auth, channelIndex);

  // Get top videos by views
  const videosRes = await youtubeAnalytics.reports.query({
    auth,
    ids: `channel==${channelId}`,
    startDate: from,
    endDate: to,
    metrics: "views",
    dimensions: "video",
    sort: "-views",
    maxResults: 5,
  });

  const videoIds = (videosRes.data.rows ?? []).map((r) => (r as string[])[0]);

  // Fetch titles
  const titlesRes = videoIds.length
    ? await youtube.videos.list({ auth, part: ["snippet"], id: videoIds })
    : { data: { items: [] } };
  const titleMap: Record<string, string> = {};
  for (const item of titlesRes.data.items ?? []) {
    if (item.id && item.snippet?.title) titleMap[item.id] = item.snippet.title;
  }

  // Fetch retention for each video in parallel
  const retentionResults = await Promise.all(
    videoIds.map((videoId) =>
      youtubeAnalytics.reports.query({
        auth,
        ids: `channel==${channelId}`,
        startDate: from,
        endDate: to,
        metrics: "audienceWatchRatio,relativeRetentionPerformance",
        dimensions: "elapsedVideoTimeRatio",
        filters: `video==${videoId}`,
      }).catch(() => ({ data: { rows: [] } }))
    )
  );

  // Build retention curve data: array of { progress, VideoTitle: pct, ... }
  const PROGRESS_LABELS = ["1%","5%","10%","15%","20%","25%","30%","35%","40%","45%","50%","55%","60%","65%","70%","75%","80%","85%","90%","95%","100%"];

  // Map ratio → percentage label
  const ratioToLabel = (ratio: number): string | null => {
    const pct = Math.round(ratio * 100);
    const label = `${pct}%`;
    return PROGRESS_LABELS.includes(label) ? label : null;
  };

  // For each video, build a map of label → watchRatio * 100
  const videoRetentionMaps: { title: string; color: string; map: Record<string, number> }[] = videoIds.map((id, i) => {
    const rows = retentionResults[i].data.rows ?? [];
    const map: Record<string, number> = {};
    for (const row of rows) {
      const [ratio, watchRatio] = row as [number, number];
      const label = ratioToLabel(ratio);
      if (label) map[label] = Math.round(watchRatio * 100);
    }
    return {
      title: (titleMap[id] ?? `Video ${i + 1}`).slice(0, 30),
      color: VIDEO_COLORS[i % VIDEO_COLORS.length],
      map,
    };
  });

  const retentionData = PROGRESS_LABELS.map((progress) => {
    const point: Record<string, string | number> = { progress };
    for (const v of videoRetentionMaps) {
      point[v.title] = v.map[progress] ?? null;
    }
    return point;
  });

  // Relative retention: relativeRetentionPerformance (index 1) for each video
  const relativeData = PROGRESS_LABELS.map((progress) => {
    const point: Record<string, string | number | null> = { progress, "YouTube Average": 65 };
    for (const v of videoRetentionMaps) {
      // use same map but with relative values (we need a second pass)
      point[v.title] = null;
    }
    return point;
  });

  // Rebuild relative retention using relativeRetentionPerformance
  for (let i = 0; i < videoIds.length; i++) {
    const rows = retentionResults[i].data.rows ?? [];
    const title = videoRetentionMaps[i].title;
    for (const row of rows) {
      const [ratio, , relPerf] = row as [number, number, number];
      const label = ratioToLabel(ratio);
      if (label) {
        const point = relativeData.find((p) => p.progress === label);
        if (point) point[title] = Math.round(relPerf * 100);
      }
    }
  }

  const videoMeta = videoRetentionMaps.map((v, i) => ({
    title: v.title,
    color: v.color,
    videoId: videoIds[i],
  }));

  return NextResponse.json({ retentionData, relativeData, videoMeta });
}

import { NextRequest, NextResponse } from "next/server";
import { isChannelConfigured, getAuthenticatedClientForChannel, resolveChannelId, youtubeAnalytics } from "@/lib/youtube-client";
import { validateChannelDateParams } from "@/lib/api-utils";

const SOURCE_COLORS: Record<string, string> = {
  "YT_SEARCH": "#06b6d4",
  "EXT_URL": "#f97316",
  "NO_LINK_OTHER": "#374151",
  "SUBSCRIBER": "#22c55e",
  "YT_CHANNEL": "#a855f7",
  "SHORTS": "#ef4444",
  "YT_OTHER_PAGE": "#ec4899",
  "NOTIFICATION": "#f59e0b",
  "PLAYLIST": "#84cc16",
  "YT_PLAYLIST_PAGE": "#8b5cf6",
};

const SOURCE_LABELS: Record<string, string> = {
  "YT_SEARCH": "YouTube Search",
  "EXT_URL": "External URL",
  "NO_LINK_OTHER": "Other Page",
  "SUBSCRIBER": "Subscriber",
  "YT_CHANNEL": "Channel Page",
  "SHORTS": "Shorts Feed",
  "YT_OTHER_PAGE": "Other YouTube",
  "NOTIFICATION": "Notification",
  "PLAYLIST": "Playlist",
  "YT_PLAYLIST_PAGE": "Playlist Page",
};

export async function GET(req: NextRequest) {
  const validated = validateChannelDateParams(req);
  if (validated instanceof NextResponse) return validated;
  const { channelIndex, from, to } = validated;

  if (!isChannelConfigured(channelIndex)) {
    return NextResponse.json({ error: "not_configured" }, { status: 401 });
  }
  const auth = getAuthenticatedClientForChannel(channelIndex);
  const channelId = await resolveChannelId(auth, channelIndex);

  // Traffic source totals
  const sourcesRes = await youtubeAnalytics.reports.query({
    auth,
    ids: `channel==${channelId}`,
    startDate: from,
    endDate: to,
    metrics: "views,estimatedMinutesWatched",
    dimensions: "insightTrafficSourceType",
    sort: "-views",
  });

  const rows = sourcesRes.data.rows ?? [];
  const totalViews = rows.reduce((sum, r) => sum + ((r as number[])[1] ?? 0), 0);

  const sources = rows.map((row) => {
    const [sourceType, views, watchMins] = row as [string, number, number];
    return {
      source: SOURCE_LABELS[sourceType] ?? sourceType,
      views: Math.round(views),
      watchTimeHours: Math.round((watchMins / 60) * 10) / 10,
      sharePct: totalViews > 0 ? Math.round((views / totalViews) * 1000) / 10 : 0,
      color: SOURCE_COLORS[sourceType] ?? "#6b7280",
    };
  });

  // Daily by source
  const dailyRes = await youtubeAnalytics.reports.query({
    auth,
    ids: `channel==${channelId}`,
    startDate: from,
    endDate: to,
    metrics: "views",
    dimensions: "day,insightTrafficSourceType",
    sort: "day",
  });

  // Pivot daily rows into { date, Source1: views, Source2: views, ... }
  const dailyMap: Record<string, Record<string, string | number>> = {};
  for (const row of dailyRes.data.rows ?? []) {
    const [date, sourceType, views] = row as [string, string, number];
    const label = (SOURCE_LABELS[sourceType] ?? sourceType).split(" ")[0]; // first word
    const d = new Date(date);
    const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    if (!dailyMap[key]) dailyMap[key] = { date: key };
    dailyMap[key][label] = Math.round(views);
  }
  const dailyTraffic = Object.values(dailyMap);

  return NextResponse.json({ sources, dailyTraffic });
}

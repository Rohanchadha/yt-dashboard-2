import { NextRequest, NextResponse } from "next/server";
import { isChannelConfigured, getAuthenticatedClientForChannel, resolveChannelId, youtubeAnalytics, youtube } from "@/lib/youtube-client";
import { parseDurationSec, indexByVideoId, offsetDate, computeDerived } from "@/lib/video-metrics";
import { validateChannelDateParams } from "@/lib/api-utils";

const VIDEO_COLORS = ["#ef4444", "#06b6d4", "#a855f7", "#f97316", "#22c55e", "#f59e0b"];

/** Safe wrapper: returns null rows if the analytics query fails (e.g. metric unavailable). */
async function safeQuery(
  label: string,
  fn: () => Promise<{ data: { rows?: unknown[][] | null } }>,
): Promise<unknown[][] | null> {
  try {
    const res = await fn();
    return (res.data.rows as unknown[][] | null | undefined) ?? null;
  } catch (err) {
    console.warn(`[videos] safeQuery "${label}" failed:`, err instanceof Error ? err.message : err);
    return null;
  }
}

export async function GET(req: NextRequest) {
  const validated = validateChannelDateParams(req);
  if (validated instanceof NextResponse) return validated;
  const { channelIndex, from, to } = validated;

  if (!isChannelConfigured(channelIndex)) {
    return NextResponse.json({ error: "not_configured" }, { status: 401 });
  }
  const auth = getAuthenticatedClientForChannel(channelIndex);
  const today = new Date();

  // Get channel ID
  const channelId = await resolveChannelId(auth, channelIndex);

  // Call A: core period metrics — always available for any channel
  const analyticsRes = await youtubeAnalytics.reports.query({
    auth,
    ids: `channel==${channelId}`,
    startDate: from,
    endDate: to,
    metrics: "views,estimatedMinutesWatched,averageViewDuration,likes,comments,shares,subscribersGained",
    dimensions: "video",
    sort: "-views",
    maxResults: 50,
  });

  const rows = analyticsRes.data.rows ?? [];
  const videoIds = rows.map((r) => (r as string[])[0]);

  if (videoIds.length === 0) {
    return NextResponse.json({ videos: [] });
  }

  const videoFilter = `video==${videoIds.join(",")}`;

  // All secondary calls run in parallel. Each is individually guarded via safeQuery
  // so a single failing metric doesn't crash the whole route.
  const [
    titlesRes,
    avgViewPctRows,
    last7Rows,
    prior7Rows,
    last30Rows,
    prior30Rows,
    last2Rows,
    dailyEventRows,
  ] = await Promise.all([
    // Titles, duration, lifetime stats
    youtube.videos.list({
      auth,
      part: ["snippet", "contentDetails", "statistics"],
      id: videoIds,
    }),
    // Avg view percentage
    safeQuery("avgViewPercentage", () =>
      youtubeAnalytics.reports.query({
        auth,
        ids: `channel==${channelId}`,
        startDate: from,
        endDate: to,
        metrics: "averageViewPercentage",
        dimensions: "video",
        filters: videoFilter,
      }),
    ),
    // Velocity windows — all guarded
    safeQuery("last7", () =>
      youtubeAnalytics.reports.query({
        auth,
        ids: `channel==${channelId}`,
        startDate: offsetDate(today, -7),
        endDate: offsetDate(today, -1),
        metrics: "views",
        dimensions: "video",
        filters: videoFilter,
      }),
    ),
    safeQuery("prior7", () =>
      youtubeAnalytics.reports.query({
        auth,
        ids: `channel==${channelId}`,
        startDate: offsetDate(today, -14),
        endDate: offsetDate(today, -8),
        metrics: "views",
        dimensions: "video",
        filters: videoFilter,
      }),
    ),
    safeQuery("last30", () =>
      youtubeAnalytics.reports.query({
        auth,
        ids: `channel==${channelId}`,
        startDate: offsetDate(today, -30),
        endDate: offsetDate(today, -1),
        metrics: "views",
        dimensions: "video",
        filters: videoFilter,
      }),
    ),
    safeQuery("prior30", () =>
      youtubeAnalytics.reports.query({
        auth,
        ids: `channel==${channelId}`,
        startDate: offsetDate(today, -60),
        endDate: offsetDate(today, -31),
        metrics: "views",
        dimensions: "video",
        filters: videoFilter,
      }),
    ),
    safeQuery("last2", () =>
      youtubeAnalytics.reports.query({
        auth,
        ids: `channel==${channelId}`,
        startDate: offsetDate(today, -2),
        endDate: offsetDate(today, -1),
        metrics: "views",
        dimensions: "video",
        filters: videoFilter,
      }),
    ),
    // EventScore: daily per-video breakdown for the first 7 days of the period
    safeQuery("dailyEvent", () =>
      youtubeAnalytics.reports.query({
        auth,
        ids: `channel==${channelId}`,
        startDate: from,
        endDate: offsetDate(new Date(from), 6) <= to ? offsetDate(new Date(from), 6) : to,
        metrics: "views",
        dimensions: "day,video",
        filters: videoFilter,
      }),
    ),
  ]);

  const avgViewPctMap: Record<string, number> = {};
  for (const row of avgViewPctRows ?? []) {
    const [videoId, avgViewPct] = row as [string, number];
    if (videoId) avgViewPctMap[videoId] = avgViewPct;
  }

  const last7Map = indexByVideoId(last7Rows);
  const prior7Map = indexByVideoId(prior7Rows);
  const last30Map = indexByVideoId(last30Rows);
  const prior30Map = indexByVideoId(prior30Rows);
  const last2Map = indexByVideoId(last2Rows);

  // Build metadata maps
  const titleMap: Record<string, string> = {};
  const publishedAtMap: Record<string, string> = {};
  const shortMap: Record<string, boolean> = {};
  const totalViewsMap: Record<string, number> = {};
  const totalLikesMap: Record<string, number> = {};
  const totalCommentsMap: Record<string, number> = {};
  const durationMap: Record<string, number> = {};

  for (const item of titlesRes.data.items ?? []) {
    if (!item.id) continue;
    titleMap[item.id] = item.snippet?.title ?? "";
    publishedAtMap[item.id] = item.snippet?.publishedAt ?? new Date().toISOString();
    shortMap[item.id] = parseDurationSec(item.contentDetails?.duration ?? "") <= 60;
    totalViewsMap[item.id] = parseInt(item.statistics?.viewCount ?? "0");
    totalLikesMap[item.id] = parseInt(item.statistics?.likeCount ?? "0");
    totalCommentsMap[item.id] = parseInt(item.statistics?.commentCount ?? "0");
    durationMap[item.id] = parseDurationSec(item.contentDetails?.duration ?? "");
  }

  // EventScore: views in first 3 days per video relative to each video's publish date
  const first3DaysMap: Record<string, number> = {};
  for (const row of dailyEventRows ?? []) {
    const [date, videoId, viewCount] = row as [string, string, number];
    if (!viewCount) continue;
    const publishedDate = publishedAtMap[videoId];
    if (!publishedDate) continue;
    const dayOffset = Math.floor(
      (new Date(date).getTime() - new Date(publishedDate).getTime()) / (1000 * 60 * 60 * 24),
    );
    if (dayOffset >= 0 && dayOffset < 3) {
      first3DaysMap[videoId] = (first3DaysMap[videoId] ?? 0) + viewCount;
    }
  }

  const videos = rows.map((row, i) => {
    const [videoId, views, watchMins, avgDur, likes, comments, shares, subsGained] =
      row as [string, ...number[]];

    const publishedAt = publishedAtMap[videoId] ?? new Date().toISOString();
    const totalViews = totalViewsMap[videoId] ?? Math.round(views);

    const derived = computeDerived({
      totalViews,
      publishedAt,
      today,
      viewsFirst3Days: first3DaysMap[videoId] ?? null,
      viewsLast30Days: last30Map[videoId] ?? null,
      viewsLast7Days: last7Map[videoId] ?? null,
      priorWeekViews: prior7Map[videoId] ?? null,
      priorMonthViews: prior30Map[videoId] ?? null,
    });

    return {
      id: videoId,
      title: titleMap[videoId] ?? `Video ${i + 1}`,
      titleShort: (titleMap[videoId] ?? `Video ${i + 1}`).slice(0, 30),
      color: VIDEO_COLORS[i % VIDEO_COLORS.length],
      isShort: shortMap[videoId] ?? false,
      publishedAt,
      totalViews,
      totalLikes: totalLikesMap[videoId] ?? 0,
      totalComments: totalCommentsMap[videoId] ?? 0,
      durationSeconds: durationMap[videoId] ?? Math.round(avgDur),
      views: Math.round(views),
      likes: Math.round(likes),
      comments: Math.round(comments),
      shares: Math.round(shares),
      watchTimeHours: Math.round((watchMins / 60) * 10) / 10,
      avgDurationSec: Math.round(avgDur),
      subsGained: Math.round(subsGained),
      avgViewDurationSeconds: avgDur != null ? Math.round(avgDur) : null,
      avgViewPercentage: avgViewPctMap[videoId] != null ? Math.round(avgViewPctMap[videoId] * 10) / 10 : null,
      viewsLast7Days: last7Map[videoId] ?? null,
      viewsLast28Days: last30Map[videoId] ?? null,
      viewsLast48Hours: last2Map[videoId] ?? null,
      derived,
    };
  });

  return NextResponse.json({ videos });
}

import { NextRequest, NextResponse } from "next/server";
import { isChannelConfigured, getAuthenticatedClientForChannel, resolveChannelId, youtubeAnalytics, youtube } from "@/lib/youtube-client";
import { parseDurationSec, indexByVideoId, offsetDate, computeDerived } from "@/lib/video-metrics";
import { validateChannelParam } from "@/lib/api-utils";

const VIDEO_COLORS = ["#ef4444", "#06b6d4", "#a855f7", "#f97316", "#22c55e", "#f59e0b"];

export async function GET(req: NextRequest) {
  const validated = validateChannelParam(req);
  if (validated instanceof NextResponse) return validated;
  const { channelIndex } = validated;

  if (!isChannelConfigured(channelIndex)) {
    return NextResponse.json({ error: "not_configured" }, { status: 401 });
  }

  const auth = getAuthenticatedClientForChannel(channelIndex);
  const today = new Date();

  // Get channel ID
  const channelId = await resolveChannelId(auth, channelIndex);

  // Step 1 & 2: 48h and prior-48h views for all videos (no video filter — get whatever is active)
  // YouTube Analytics has a ~2-day processing delay, so we shift both windows back by 2 days
  // to ensure data is actually available. last48h = days 3-4 ago, prior48h = days 5-6 ago.
  const [last48Res, prior48Res] = await Promise.all([
    youtubeAnalytics.reports.query({
      auth,
      ids: `channel==${channelId}`,
      startDate: offsetDate(today, -4),
      endDate: offsetDate(today, -3),
      metrics: "views",
      dimensions: "video",
      sort: "-views",
      maxResults: 25,
    }),
    youtubeAnalytics.reports.query({
      auth,
      ids: `channel==${channelId}`,
      startDate: offsetDate(today, -6),
      endDate: offsetDate(today, -5),
      metrics: "views",
      dimensions: "video",
      sort: "-views",
      maxResults: 25,
    }),
  ]);

  const last48Map = indexByVideoId(last48Res.data.rows);
  const prior48Map = indexByVideoId(prior48Res.data.rows);

  // Union of video IDs from both windows
  const videoIdSet = new Set([
    ...Object.keys(last48Map),
    ...Object.keys(prior48Map),
  ]);
  const videoIds = [...videoIdSet];

  if (videoIds.length === 0) {
    return NextResponse.json({ trending: [] });
  }

  const videoFilter = `video==${videoIds.join(",")}`;

  // Step 3 & 4: metadata + classification signals in parallel
  const [detailsRes, last7Res, prior7Res, last30Res, prior30Res] = await Promise.all([
    youtube.videos.list({
      auth,
      part: ["snippet", "contentDetails", "statistics"],
      id: videoIds,
    }),
    youtubeAnalytics.reports.query({
      auth,
      ids: `channel==${channelId}`,
      startDate: offsetDate(today, -7),
      endDate: offsetDate(today, -1),
      metrics: "views",
      dimensions: "video",
      filters: videoFilter,
    }),
    youtubeAnalytics.reports.query({
      auth,
      ids: `channel==${channelId}`,
      startDate: offsetDate(today, -14),
      endDate: offsetDate(today, -8),
      metrics: "views",
      dimensions: "video",
      filters: videoFilter,
    }),
    youtubeAnalytics.reports.query({
      auth,
      ids: `channel==${channelId}`,
      startDate: offsetDate(today, -30),
      endDate: offsetDate(today, -1),
      metrics: "views",
      dimensions: "video",
      filters: videoFilter,
    }),
    youtubeAnalytics.reports.query({
      auth,
      ids: `channel==${channelId}`,
      startDate: offsetDate(today, -60),
      endDate: offsetDate(today, -31),
      metrics: "views",
      dimensions: "video",
      filters: videoFilter,
    }),
  ]);

  const last7Map = indexByVideoId(last7Res.data.rows);
  const prior7Map = indexByVideoId(prior7Res.data.rows);
  const last30Map = indexByVideoId(last30Res.data.rows);
  const prior30Map = indexByVideoId(prior30Res.data.rows);

  // Metadata maps
  const titleMap: Record<string, string> = {};
  const publishedAtMap: Record<string, string> = {};
  const shortMap: Record<string, boolean> = {};
  const totalViewsMap: Record<string, number> = {};
  const durationMap: Record<string, number> = {};

  for (const item of detailsRes.data.items ?? []) {
    if (!item.id) continue;
    titleMap[item.id] = item.snippet?.title ?? "";
    publishedAtMap[item.id] = item.snippet?.publishedAt ?? new Date().toISOString();
    shortMap[item.id] = parseDurationSec(item.contentDetails?.duration ?? "") <= 60;
    totalViewsMap[item.id] = parseInt(item.statistics?.viewCount ?? "0");
    durationMap[item.id] = parseDurationSec(item.contentDetails?.duration ?? "");
  }

  const trending = videoIds.map((videoId, i) => {
    const viewsLast48h = last48Map[videoId] ?? 0;
    const viewsLast48hPrior = prior48Map[videoId] ?? 0;
    const velocity = Math.round((viewsLast48h / Math.max(viewsLast48hPrior, 1)) * 100) / 100;

    const publishedAt = publishedAtMap[videoId] ?? new Date().toISOString();
    const totalViews = totalViewsMap[videoId] ?? 0;

    const derived = computeDerived({
      totalViews,
      publishedAt,
      today,
      viewsFirst3Days: null, // not computed for trending tab
      viewsLast30Days: last30Map[videoId] ?? null,
      viewsLast7Days: last7Map[videoId] ?? null,
      priorWeekViews: prior7Map[videoId] ?? null,
      priorMonthViews: prior30Map[videoId] ?? null,
      ctr: null,
      channelAvgCtr: null,
    });

    return {
      id: videoId,
      title: titleMap[videoId] ?? `Video ${i + 1}`,
      titleShort: (titleMap[videoId] ?? `Video ${i + 1}`).slice(0, 30),
      color: VIDEO_COLORS[i % VIDEO_COLORS.length],
      isShort: shortMap[videoId] ?? false,
      publishedAt,
      viewsLast48h,
      viewsLast48hPrior,
      velocity,
      derived,
    };
  });

  // Sort by last48h views descending (most active first)
  trending.sort((a, b) => b.viewsLast48h - a.viewsLast48h);

  return NextResponse.json({ trending });
}

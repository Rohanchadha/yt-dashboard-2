import { NextRequest, NextResponse } from "next/server";
import { isChannelConfigured, getAuthenticatedClientForChannel, resolveChannelId, youtubeAnalytics, youtube } from "@/lib/youtube-client";
import { parseDurationSec, indexByVideoId, offsetDate, computeDerived } from "@/lib/video-metrics";
import { validateChannelParam } from "@/lib/api-utils";

const VIDEO_COLORS = ["#ef4444", "#06b6d4", "#a855f7", "#f97316", "#22c55e", "#f59e0b"];

/** Split an array into chunks of at most `size`. */
function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/**
 * Fetch an Analytics metric for a set of video IDs, batching into groups of 50
 * to stay within the YouTube Analytics filter URL-length limit.
 * Returns a merged videoId → views map.
 */
async function batchAnalyticsViews(
  auth: ReturnType<typeof import("@/lib/youtube-client").getAuthenticatedClientForChannel>,
  channelId: string,
  videoIds: string[],
  startDate: string,
  endDate: string,
): Promise<Record<string, number>> {
  const batches = chunk(videoIds, 50);
  const results = await Promise.all(
    batches.map((ids) =>
      youtubeAnalytics.reports.query({
        auth,
        ids: `channel==${channelId}`,
        startDate,
        endDate,
        metrics: "views",
        dimensions: "video",
        filters: `video==${ids.join(",")}`,
        maxResults: 200,
      }),
    ),
  );
  const merged: Record<string, number> = {};
  for (const res of results) {
    Object.assign(merged, indexByVideoId(res.data.rows));
  }
  return merged;
}

export async function GET(req: NextRequest) {
  const validated = validateChannelParam(req);
  if (validated instanceof NextResponse) return validated;
  const { channelIndex } = validated;

  if (!isChannelConfigured(channelIndex)) {
    return NextResponse.json({ error: "not_configured" }, { status: 401 });
  }

  const auth = getAuthenticatedClientForChannel(channelIndex);
  const today = new Date();

  const channelId = await resolveChannelId(auth, channelIndex);

  // Step 1: 48h and prior-48h views across all videos (no filter — discover active videos).
  // YouTube Analytics has a ~2-day processing delay, so both windows are shifted back 2 days
  // to ensure settled data. last48h = days 3–4 ago; prior48h = days 5–6 ago.
  const [last48Res, prior48Res] = await Promise.all([
    youtubeAnalytics.reports.query({
      auth,
      ids: `channel==${channelId}`,
      startDate: offsetDate(today, -4),
      endDate: offsetDate(today, -3),
      metrics: "views",
      dimensions: "video",
      sort: "-views",
      maxResults: 200,
    }),
    youtubeAnalytics.reports.query({
      auth,
      ids: `channel==${channelId}`,
      startDate: offsetDate(today, -6),
      endDate: offsetDate(today, -5),
      metrics: "views",
      dimensions: "video",
      sort: "-views",
      maxResults: 200,
    }),
  ]);

  const last48Map = indexByVideoId(last48Res.data.rows);
  const prior48Map = indexByVideoId(prior48Res.data.rows);

  // Union of video IDs from both windows
  const videoIds = [...new Set([...Object.keys(last48Map), ...Object.keys(prior48Map)])];

  if (videoIds.length === 0) {
    return NextResponse.json({ trending: [] });
  }

  // Step 2: metadata + classification signals.
  // youtube.videos.list accepts max 50 IDs per request — batch into chunks of 50.
  // Analytics filter queries are also batched at 50 IDs to stay within URL length limits.
  const [detailsItems, last7Map, prior7Map, last30Map, prior30Map] = await Promise.all([
    // Metadata: title, publishedAt, duration, totalViews
    Promise.all(
      chunk(videoIds, 50).map((ids) =>
        youtube.videos.list({
          auth,
          part: ["snippet", "contentDetails", "statistics"],
          id: ids,
        }),
      ),
    ).then((responses) => responses.flatMap((r) => r.data.items ?? [])),

    // Weekly velocity signals
    batchAnalyticsViews(auth, channelId, videoIds, offsetDate(today, -7), offsetDate(today, -1)),
    batchAnalyticsViews(auth, channelId, videoIds, offsetDate(today, -14), offsetDate(today, -8)),

    // Monthly velocity / evergreen signals
    batchAnalyticsViews(auth, channelId, videoIds, offsetDate(today, -30), offsetDate(today, -1)),
    batchAnalyticsViews(auth, channelId, videoIds, offsetDate(today, -60), offsetDate(today, -31)),
  ]);

  // Build metadata maps
  const titleMap: Record<string, string> = {};
  const publishedAtMap: Record<string, string> = {};
  const shortMap: Record<string, boolean> = {};
  const totalViewsMap: Record<string, number> = {};

  for (const item of detailsItems) {
    if (!item.id) continue;
    titleMap[item.id] = item.snippet?.title ?? "";
    publishedAtMap[item.id] = item.snippet?.publishedAt ?? new Date().toISOString();
    shortMap[item.id] = parseDurationSec(item.contentDetails?.duration ?? "") <= 60;
    totalViewsMap[item.id] = parseInt(item.statistics?.viewCount ?? "0");
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

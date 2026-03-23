import { NextRequest, NextResponse } from "next/server";
import { isChannelConfigured, getAuthenticatedClientForChannel, getChannelEnvConfig, youtubeAnalytics, youtube } from "@/lib/youtube-client";
import { parseDurationSec, indexByVideoId, offsetDate, computeDerived } from "@/lib/video-metrics";
import { validateChannelDateParams, serverError } from "@/lib/api-utils";

const VIDEO_COLORS = ["#ef4444", "#06b6d4", "#a855f7", "#f97316", "#22c55e", "#f59e0b"];

/** Safe wrapper: returns null rows if the analytics query fails (e.g. metric unavailable). */
async function safeQuery(
  fn: () => Promise<{ data: { rows?: unknown[][] | null } }>,
): Promise<unknown[][] | null> {
  try {
    const res = await fn();
    return (res.data.rows as unknown[][] | null | undefined) ?? null;
  } catch {
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

  try {
    const auth = getAuthenticatedClientForChannel(channelIndex);
    const today = new Date();

    const fromDate = new Date(`${from}T00:00:00Z`);
    const toDate = new Date(`${to}T23:59:59Z`);

    // Step 1: Get channel ID and uploads playlist ID
    const { channelId: envChannelId } = getChannelEnvConfig(channelIndex);
    const channelParams = envChannelId
      ? { auth, part: ["id", "contentDetails"] as string[], id: [envChannelId] }
      : { auth, part: ["id", "contentDetails"] as string[], mine: true };
    const channelRes = await youtube.channels.list(channelParams);
    const channelId = channelRes.data.items?.[0]?.id ?? envChannelId ?? "MINE";
    const uploadsPlaylistId =
      channelRes.data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

    if (!uploadsPlaylistId) {
      return NextResponse.json({ videos: [] });
    }

    // Step 2: Walk the uploads playlist (newest first) to collect videos in the date range.
    // Stop as soon as we see a video older than `from`.
    const matchingIds: string[] = [];
    const publishedAtById: Record<string, string> = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    type PlaylistItemsListFn = (params: any) => Promise<{ data: any }>;
    const listPlaylistItems = youtube.playlistItems.list.bind(youtube.playlistItems) as PlaylistItemsListFn;

    let pageToken: string | undefined;
    let done = false;

    while (!done) {
      // Sequential pagination — each page depends on the previous token
      // eslint-disable-next-line no-await-in-loop
      const pageRes = await listPlaylistItems({
        auth,
        part: ["snippet"],
        playlistId: uploadsPlaylistId,
        maxResults: 50,
        pageToken,
      });

      for (const item of pageRes.data.items ?? []) {
        const videoId = item.snippet?.resourceId?.videoId;
        const publishedAt = item.snippet?.publishedAt;
        if (!videoId || !publishedAt) continue;

        const publishedDate = new Date(publishedAt);

        if (publishedDate > toDate) {
          // Newer than our window — skip but keep paginating
          continue;
        }
        if (publishedDate < fromDate) {
          // Older than our window — stop entirely (playlist is newest-first)
          done = true;
          break;
        }

        matchingIds.push(videoId);
        publishedAtById[videoId] = publishedAt;
      }

      pageToken = pageRes.data.nextPageToken ?? undefined;
      if (!pageToken) done = true;
    }

    if (matchingIds.length === 0) {
      return NextResponse.json({ videos: [] });
    }

    const videoFilter = `video==${matchingIds.join(",")}`;

    // videos.list accepts at most 50 IDs per request — chunk if needed.
    const idChunks: string[][] = [];
    for (let i = 0; i < matchingIds.length; i += 50) {
      idChunks.push(matchingIds.slice(i, i + 50));
    }
    const detailsItems = (
      await Promise.all(
        idChunks.map((chunk) =>
          youtube.videos.list({
            auth,
            part: ["snippet", "contentDetails", "statistics"],
            id: chunk,
          }),
        ),
      )
    ).flatMap((res) => res.data.items ?? []);

    // All analytics calls in parallel. Each is individually guarded via safeQuery
    // so a single failing metric (e.g. impressions unavailable) doesn't crash the route.
    const [
      periodRows,
      extendedRows,
      last7Rows,
      prior7Rows,
      last30Rows,
      prior30Rows,
      last2Rows,
      dailyEventRows,
    ] = await Promise.all([
      // Core period analytics — views/engagement in the user-selected window
      safeQuery(() =>
        youtubeAnalytics.reports.query({
          auth,
          ids: `channel==${channelId}`,
          startDate: from,
          endDate: to,
          metrics: "views,estimatedMinutesWatched,averageViewDuration,likes,comments,shares,subscribersGained",
          dimensions: "video",
          filters: videoFilter,
        }),
      ),
      // Avg view percentage
      safeQuery(() =>
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
      // Fixed-window velocity calls
      safeQuery(() =>
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
      safeQuery(() =>
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
      safeQuery(() =>
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
      safeQuery(() =>
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
      safeQuery(() =>
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
      // EventScore: daily per-video breakdown for the full selected period
      safeQuery(() =>
        youtubeAnalytics.reports.query({
          auth,
          ids: `channel==${channelId}`,
          startDate: from,
          endDate: to,
          metrics: "views",
          dimensions: "day,video",
          filters: videoFilter,
        }),
      ),
    ]);

    // Build metadata maps from Data API
    const titleMap: Record<string, string> = {};
    const shortMap: Record<string, boolean> = {};
    const totalViewsMap: Record<string, number> = {};
    const totalLikesMap: Record<string, number> = {};
    const totalCommentsMap: Record<string, number> = {};
    const durationMap: Record<string, number> = {};

    for (const item of detailsItems) {
      if (!item.id) continue;
      titleMap[item.id] = item.snippet?.title ?? "";
      // Prefer publishedAt from playlistItems (already stored), fall back to snippet
      if (!publishedAtById[item.id] && item.snippet?.publishedAt) {
        publishedAtById[item.id] = item.snippet.publishedAt;
      }
      shortMap[item.id] = parseDurationSec(item.contentDetails?.duration ?? "") <= 60;
      totalViewsMap[item.id] = parseInt(item.statistics?.viewCount ?? "0");
      totalLikesMap[item.id] = parseInt(item.statistics?.likeCount ?? "0");
      totalCommentsMap[item.id] = parseInt(item.statistics?.commentCount ?? "0");
      durationMap[item.id] = parseDurationSec(item.contentDetails?.duration ?? "");
    }

    // Build core period analytics map
    // Row: [videoId, views, watchMins, avgDur, likes, comments, shares, subsGained]
    const periodMap: Record<string, (string | number)[]> = {};
    for (const row of periodRows ?? []) {
      const r = row as (string | number)[];
      periodMap[r[0] as string] = r;
    }

    // Build avgViewPercentage map: videoId → value
    const avgViewPctMap: Record<string, number> = {};
    for (const row of extendedRows ?? []) {
      const [videoId, avgViewPct] = row as [string, number];
      if (videoId) avgViewPctMap[videoId] = avgViewPct;
    }

    const last7Map = indexByVideoId(last7Rows);
    const prior7Map = indexByVideoId(prior7Rows);
    const last30Map = indexByVideoId(last30Rows);
    const prior30Map = indexByVideoId(prior30Rows);
    const last2Map = indexByVideoId(last2Rows);

    // EventScore: views in first 3 days per video (relative to each video's publish date)
    const first3DaysMap: Record<string, number> = {};
    for (const row of dailyEventRows ?? []) {
      const [date, videoId, viewCount] = row as [string, string, number];
      if (!viewCount) continue;
      const publishedAt = publishedAtById[videoId];
      if (!publishedAt) continue;
      const dayOffset = Math.floor(
        (new Date(date).getTime() - new Date(publishedAt).getTime()) / (1000 * 60 * 60 * 24),
      );
      if (dayOffset >= 0 && dayOffset < 3) {
        first3DaysMap[videoId] = (first3DaysMap[videoId] ?? 0) + viewCount;
      }
    }

    const videos = matchingIds.map((videoId, i) => {
      const r = periodMap[videoId];
      const views = (r?.[1] as number) ?? 0;
      const watchMins = (r?.[2] as number) ?? 0;
      const avgDur = (r?.[3] as number) ?? 0;
      const likes = (r?.[4] as number) ?? 0;
      const comments = (r?.[5] as number) ?? 0;
      const shares = (r?.[6] as number) ?? 0;
      const subsGained = (r?.[7] as number) ?? 0;

      const publishedAt = publishedAtById[videoId] ?? new Date().toISOString();
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
        avgViewDurationSeconds: avgDur ? Math.round(avgDur) : null,
        avgViewPercentage: avgViewPctMap[videoId] != null ? Math.round(avgViewPctMap[videoId] * 10) / 10 : null,
        viewsLast7Days: last7Map[videoId] ?? null,
        viewsLast28Days: last30Map[videoId] ?? null,
        viewsLast48Hours: last2Map[videoId] ?? null,
        derived,
      };
    });

    // Sort newest first
    videos.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    return NextResponse.json({ videos });
  } catch (err: unknown) {
    return serverError("/api/youtube/videos/created", err);
  }
}

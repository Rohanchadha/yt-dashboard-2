import { NextResponse } from "next/server";
import { isChannelConfigured, getAuthenticatedClientForChannel, youtube } from "@/lib/youtube-client";

const COMPETITOR_HANDLES = [
  "BtechCareers360",
  "MBACareers360",
  "collegedunia3635",
  "Careers360",
];

export interface CompetitorVideo {
  videoId: string;
  title: string;
  publishedAt: string;
  thumbnail: string;
  views: number;
  likes: number;
  url: string;
}

export interface CompetitorChannel {
  handle: string;
  channelId: string;
  channelName: string;
  thumbnail: string;
  channelUrl: string;
  videos: CompetitorVideo[];
}

export async function GET() {
  if (!isChannelConfigured(1)) {
    return NextResponse.json({ error: "not_configured" }, { status: 401 });
  }

  const auth = getAuthenticatedClientForChannel(1);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const cutoff = sevenDaysAgo.toISOString();

  const results: CompetitorChannel[] = await Promise.all(
    COMPETITOR_HANDLES.map(async (handle) => {
      try {
        // Resolve channel info from handle
        const channelRes = await youtube.channels.list({
          auth,
          part: ["snippet", "contentDetails"],
          forHandle: handle,
        });

        const channel = channelRes.data.items?.[0];
        if (!channel) {
          return {
            handle,
            channelId: "",
            channelName: handle,
            thumbnail: "",
            channelUrl: `https://www.youtube.com/@${handle}`,
            videos: [],
          };
        }

        const channelId = channel.id ?? "";
        const channelName = channel.snippet?.title ?? handle;
        const channelThumbnail = channel.snippet?.thumbnails?.default?.url ?? "";
        const uploadsPlaylistId = channel.contentDetails?.relatedPlaylists?.uploads ?? "";

        if (!uploadsPlaylistId) {
          return {
            handle,
            channelId,
            channelName,
            thumbnail: channelThumbnail,
            channelUrl: `https://www.youtube.com/@${handle}`,
            videos: [],
          };
        }

        // Fetch recent playlist items
        const playlistRes = await youtube.playlistItems.list({
          auth,
          part: ["snippet", "contentDetails"],
          playlistId: uploadsPlaylistId,
          maxResults: 30,
        });

        const items = playlistRes.data.items ?? [];

        // Filter to last 7 days
        const recentItems = items.filter((item) => {
          const published = item.snippet?.publishedAt ?? item.contentDetails?.videoPublishedAt ?? "";
          return published >= cutoff;
        });

        if (recentItems.length === 0) {
          return {
            handle,
            channelId,
            channelName,
            thumbnail: channelThumbnail,
            channelUrl: `https://www.youtube.com/@${handle}`,
            videos: [],
          };
        }

        // Fetch video statistics in one batch call
        const videoIds = recentItems
          .map((item) => item.contentDetails?.videoId ?? item.snippet?.resourceId?.videoId ?? "")
          .filter(Boolean);

        const statsRes = await youtube.videos.list({
          auth,
          part: ["statistics"],
          id: videoIds,
        });

        const statsMap: Record<string, { views: number; likes: number }> = {};
        for (const v of statsRes.data.items ?? []) {
          statsMap[v.id ?? ""] = {
            views: parseInt(v.statistics?.viewCount ?? "0", 10),
            likes: parseInt(v.statistics?.likeCount ?? "0", 10),
          };
        }

        const videos: CompetitorVideo[] = recentItems.map((item) => {
          const videoId = item.contentDetails?.videoId ?? item.snippet?.resourceId?.videoId ?? "";
          const stats = statsMap[videoId] ?? { views: 0, likes: 0 };
          return {
            videoId,
            title: item.snippet?.title ?? "",
            publishedAt: item.snippet?.publishedAt ?? item.contentDetails?.videoPublishedAt ?? "",
            thumbnail:
              item.snippet?.thumbnails?.medium?.url ??
              item.snippet?.thumbnails?.default?.url ??
              "",
            views: stats.views,
            likes: stats.likes,
            url: `https://www.youtube.com/watch?v=${videoId}`,
          };
        });

        // Sort newest first
        videos.sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));

        return {
          handle,
          channelId,
          channelName,
          thumbnail: channelThumbnail,
          channelUrl: `https://www.youtube.com/@${handle}`,
          videos,
        };
      } catch (err) {
        console.error(`[competitor-videos] Failed for handle ${handle}:`, err instanceof Error ? err.message : err);
        return {
          handle,
          channelId: "",
          channelName: handle,
          thumbnail: "",
          channelUrl: `https://www.youtube.com/@${handle}`,
          videos: [],
        };
      }
    })
  );

  return NextResponse.json({ channels: results });
}

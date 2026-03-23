import { NextRequest, NextResponse } from "next/server";
import { isChannelConfigured, getAuthenticatedClientForChannel, resolveChannelId, getChannelEnvConfig, youtubeAnalytics, youtube } from "@/lib/youtube-client";
import { validateChannelDateParams, serverError } from "@/lib/api-utils";

export async function GET(req: NextRequest) {
  const validated = validateChannelDateParams(req);
  if (validated instanceof NextResponse) return validated;
  const { channelIndex, from, to } = validated;

  if (!isChannelConfigured(channelIndex)) {
    return NextResponse.json({ error: "not_configured" }, { status: 401 });
  }
  const auth = getAuthenticatedClientForChannel(channelIndex);

  // Get channel ID and name
  const { channelId: envChannelId, channelName: envChannelName } = getChannelEnvConfig(channelIndex);
  const params = envChannelId
    ? { auth, part: ["id", "snippet"] as string[], id: [envChannelId] }
    : { auth, part: ["id", "snippet"] as string[], mine: true };
  const channelRes = await youtube.channels.list(params);
  const channelId = channelRes.data.items?.[0]?.id ?? envChannelId ?? "MINE";
  const channelName = envChannelName ?? channelRes.data.items?.[0]?.snippet?.title ?? "My Channel";

  // Summary totals
  const totalsRes = await youtubeAnalytics.reports.query({
    auth,
    ids: `channel==${channelId}`,
    startDate: from,
    endDate: to,
    metrics: "views,estimatedMinutesWatched,averageViewDuration,likes,shares,subscribersGained,subscribersLost",
  });

  const totalsRow = totalsRes.data.rows?.[0] ?? [0, 0, 0, 0, 0, 0, 0];
  const [totalViews, totalMinutes, avgDuration, likes, shares, subsGained, subsLost] = totalsRow as number[];

  // Daily breakdown
  const dailyRes = await youtubeAnalytics.reports.query({
    auth,
    ids: `channel==${channelId}`,
    startDate: from,
    endDate: to,
    metrics: "views,estimatedMinutesWatched,averageViewDuration,subscribersGained,subscribersLost",
    dimensions: "day",
    sort: "day",
  });

  const daily = (dailyRes.data.rows ?? []).map((row) => {
    const [date, views, watchMins, avgDur, sGained, sLost] = row as [string, number, number, number, number, number];
    const d = new Date(date);
    return {
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      views,
      watchTimeHours: Math.round((watchMins / 60) * 10) / 10,
      avgDurationSec: Math.round(avgDur),
      subsGained: sGained,
      subsLost: sLost,
    };
  });

  return NextResponse.json({
    channelName,
    summary: {
      totalViews: Math.round(totalViews),
      watchTimeHours: Math.round((totalMinutes / 60) * 10) / 10,
      watchTimeMinutes: Math.round(totalMinutes),
      avgViewDurationSec: Math.round(avgDuration),
      netSubscribers: Math.round(subsGained - subsLost),
      subsGained: Math.round(subsGained),
      subsLost: Math.round(subsLost),
      likes: Math.round(likes),
      shares: Math.round(shares),
      likeRate: totalViews > 0 ? Math.round((likes / totalViews) * 1000) / 10 : 0,
      shareBreakdown: `${Math.round(shares)} total shares`,
    },
    daily,
  });
}

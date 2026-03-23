import { NextRequest, NextResponse } from "next/server";
import { isChannelConfigured, getAuthenticatedClientForChannel, resolveChannelId, youtubeAnalytics } from "@/lib/youtube-client";
import { validateChannelDateParams } from "@/lib/api-utils";

const DEVICE_COLORS: Record<string, string> = {
  MOBILE: "#ef4444", DESKTOP: "#06b6d4", TABLET: "#a855f7", TV: "#22c55e", GAME_CONSOLE: "#f97316",
};
const OS_COLORS = ["#ef4444", "#06b6d4", "#a855f7", "#f97316", "#22c55e", "#f59e0b", "#ec4899", "#374151"];

function topN<T extends { value: number }>(items: T[], n = 6): T[] {
  const sorted = [...items].sort((a, b) => b.value - a.value);
  if (sorted.length <= n) return sorted;
  const top = sorted.slice(0, n - 1);
  const rest = sorted.slice(n - 1).reduce((sum, x) => sum + x.value, 0);
  return [...top, { ...sorted[0], name: "Other", value: rest } as T];
}

export async function GET(req: NextRequest) {
  const validated = validateChannelDateParams(req);
  if (validated instanceof NextResponse) return validated;
  const { channelIndex, from, to } = validated;

  if (!isChannelConfigured(channelIndex)) {
    return NextResponse.json({ error: "not_configured" }, { status: 401 });
  }
  const auth = getAuthenticatedClientForChannel(channelIndex);
  const channelId = await resolveChannelId(auth, channelIndex);

  const base = { auth, ids: `channel==${channelId}`, startDate: from, endDate: to, metrics: "views" };

  const [countryRes, deviceRes, osRes, subRes] = await Promise.all([
    youtubeAnalytics.reports.query({ ...base, dimensions: "country", sort: "-views", maxResults: 10 }),
    youtubeAnalytics.reports.query({ ...base, dimensions: "deviceType", sort: "-views" }),
    youtubeAnalytics.reports.query({ ...base, dimensions: "operatingSystem", sort: "-views", maxResults: 12 }),
    youtubeAnalytics.reports.query({
      auth, ids: `channel==${channelId}`, startDate: from, endDate: to,
      metrics: "views,estimatedMinutesWatched",
      dimensions: "subscribedStatus",
    }),
  ]);

  const toPercent = (rows: unknown[][], labelIdx = 0, valueIdx = 1) => {
    const total = rows.reduce((s, r) => s + ((r as number[])[valueIdx] ?? 0), 0);
    return rows.map((r) => ({
      name: String((r as string[])[labelIdx]),
      value: total > 0 ? Math.round(((r as number[])[valueIdx] / total) * 100) : 0,
    }));
  };

  const countryRows = (countryRes.data.rows ?? []) as unknown[][];
  const countries = topN(
    toPercent(countryRows).map((c, i) => ({ ...c, color: i === 0 ? "#ef4444" : "#374151" }))
  );

  const deviceRows = (deviceRes.data.rows ?? []) as unknown[][];
  const devices = toPercent(deviceRows).map((d) => ({
    ...d,
    name: d.name.charAt(0) + d.name.slice(1).toLowerCase(),
    color: DEVICE_COLORS[d.name] ?? "#6b7280",
  }));

  const osRows = (osRes.data.rows ?? []) as unknown[][];
  const operatingSystems = topN(
    toPercent(osRows).map((o, i) => ({
      ...o,
      name: o.name.charAt(0) + o.name.slice(1).toLowerCase(),
      color: OS_COLORS[i] ?? "#374151",
    }))
  );

  const subRows = (subRes.data.rows ?? []) as unknown[][];
  const subMap: Record<string, { views: number; watchMins: number }> = {};
  for (const r of subRows) {
    const [status, views, watchMins] = r as [string, number, number];
    subMap[status] = { views: Math.round(views), watchMins: Math.round(watchMins) };
  }
  const subs = subMap["SUBSCRIBED"] ?? { views: 0, watchMins: 0 };
  const nonSubs = subMap["UNSUBSCRIBED"] ?? { views: 0, watchMins: 0 };
  const subscriberVsNon = [
    { metric: "Views", subscribers: subs.views, nonSubscribers: nonSubs.views },
    { metric: "Watch Time (min)", subscribers: subs.watchMins, nonSubscribers: nonSubs.watchMins },
  ];

  return NextResponse.json({ countries, devices, operatingSystems, subscriberVsNon });
}

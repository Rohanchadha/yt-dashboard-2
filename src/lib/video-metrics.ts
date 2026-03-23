import type { DerivedMetrics, VideoClassification } from "@/types/dashboard";

/** Parse ISO 8601 duration string (e.g. "PT1M30S") to total seconds. */
export function parseDurationSec(iso: string): number {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return (parseInt(m[1] ?? "0") * 3600) + (parseInt(m[2] ?? "0") * 60) + parseInt(m[3] ?? "0");
}

/**
 * Build a videoId → value map from a YouTube Analytics rows array.
 * Rows are [videoId, ...metrics]. valueColIndex is the 0-based column of the desired metric
 * (0 = videoId, 1 = first metric, etc.).
 */
export function indexByVideoId(
  rows: unknown[] | null | undefined,
  valueColIndex: number = 1,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const row of rows ?? []) {
    const r = row as (string | number | null)[];
    const id = r[0] as string;
    const rawVal = r[valueColIndex];
    // Skip null/undefined/zero metric values so the video stays absent from the
    // map (→ null downstream) rather than being stored as 0 (→ misleading 0× velocity).
    if (!id || rawVal == null) continue;
    const val = Number(rawVal);
    if (isNaN(val) || val === 0) continue;
    out[id] = (out[id] ?? 0) + val;
  }
  return out;
}

/** Return ISO date string offset by `days` from the given date. */
export function offsetDate(base: Date, days: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

export function classify(metrics: Omit<DerivedMetrics, "classification">): VideoClassification {
  const {
    eventScore,
    evergreenScore,
    weeklyViewVelocity,
    monthlyViewVelocity,
    ctrEfficiency,
    viewsPerDayOfLife,
  } = metrics;

  // Not enough data (very new video or zero lifetime views)
  if (viewsPerDayOfLife < 1 && weeklyViewVelocity === null) return "too_new";

  // Event video: majority of views came in first 3 days
  if (eventScore !== null && eventScore > 70) return "event_video";

  // Evergreen: still generating meaningful views 45+ days after publish
  if (evergreenScore !== null && evergreenScore > 20 && (monthlyViewVelocity ?? 0) > 0.8)
    return "evergreen";

  // Slow burn: currently gaining traction
  if ((weeklyViewVelocity ?? 0) > 1.2 || (monthlyViewVelocity ?? 0) > 1.1) return "slow_burn";

  // Underperformer: low pace + below-avg CTR efficiency
  if (viewsPerDayOfLife < 5 && (ctrEfficiency ?? 1) < 0.7) return "underperformer";

  return "unknown";
}

export function computeDerived(params: {
  totalViews: number;
  publishedAt: string;
  today: Date;
  viewsFirst3Days: number | null;
  viewsLast30Days: number | null;
  viewsLast7Days: number | null;
  priorWeekViews: number | null;
  priorMonthViews: number | null;
  ctr: number | null;
  channelAvgCtr: number | null;
}): DerivedMetrics {
  const {
    totalViews,
    publishedAt,
    today,
    viewsFirst3Days,
    viewsLast30Days,
    viewsLast7Days,
    priorWeekViews,
    priorMonthViews,
    ctr,
    channelAvgCtr,
  } = params;

  const publishedDate = new Date(publishedAt);
  const ageInDays = Math.max(
    1,
    Math.floor((today.getTime() - publishedDate.getTime()) / (1000 * 60 * 60 * 24)),
  );

  const viewsPerDayOfLife = totalViews > 0 ? Math.round((totalViews / ageInDays) * 10) / 10 : 0;

  const eventScore =
    viewsFirst3Days !== null && totalViews > 0
      ? Math.round((viewsFirst3Days / totalViews) * 1000) / 10
      : null;

  // evergreenScore only meaningful if video is 45+ days old
  const evergreenScore =
    ageInDays >= 45 && viewsLast30Days !== null && totalViews > 0
      ? Math.round((viewsLast30Days / totalViews) * 1000) / 10
      : null;

  const weeklyViewVelocity =
    viewsLast7Days !== null && priorWeekViews !== null && priorWeekViews > 0
      ? Math.round((viewsLast7Days / priorWeekViews) * 100) / 100
      : null;

  const monthlyViewVelocity =
    viewsLast30Days !== null && priorMonthViews !== null && priorMonthViews > 0
      ? Math.round((viewsLast30Days / priorMonthViews) * 100) / 100
      : null;

  const ctrEfficiency =
    ctr !== null && channelAvgCtr !== null && channelAvgCtr > 0
      ? Math.round((ctr / channelAvgCtr) * 100) / 100
      : null;

  const withoutClassification = {
    eventScore,
    evergreenScore,
    weeklyViewVelocity,
    monthlyViewVelocity,
    ctrEfficiency,
    viewsPerDayOfLife,
  };

  return {
    ...withoutClassification,
    classification: classify(withoutClassification),
  };
}

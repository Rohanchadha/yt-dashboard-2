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

export function classify(
  metrics: Omit<DerivedMetrics, "classification">,
  ageInDays: number,
): VideoClassification {
  const { eventScore, evergreenScore, weeklyViewVelocity, viewsPerDayOfLife } = metrics;

  // Not enough data — video published less than 7 days ago
  if (ageInDays < 7) return "too_new";

  // Event video: majority of lifetime views came in the first 3 days
  if (eventScore !== null && eventScore > 70) return "event_video";

  // Evergreen: last-30d views ≥ 70% of average monthly views (age ≥ 90d)
  if (evergreenScore !== null && evergreenScore >= 70) return "evergreen";

  // Slow burn: currently gaining traction week-over-week
  if ((weeklyViewVelocity ?? 0) >= 1.2) return "slow_burn";

  // Underperformer: low daily pace with no growth signal
  if (viewsPerDayOfLife < 5) return "underperformer";

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
  } = params;

  const publishedDate = new Date(publishedAt);
  const ageInDays = Math.max(
    1,
    Math.floor((today.getTime() - publishedDate.getTime()) / (1000 * 60 * 60 * 24)),
  );

  const viewsPerDayOfLife = totalViews > 0 ? Math.round((totalViews / ageInDays) * 10) / 10 : 0;

  // Only meaningful once the early launch spike has fully settled (≥ 7 days)
  const eventScore =
    viewsFirst3Days !== null && totalViews > 0 && ageInDays >= 7
      ? Math.round((viewsFirst3Days / totalViews) * 1000) / 10
      : null;

  // Monthly Retention Ratio: last-30d views / avg-monthly-views × 100.
  // A value of 100 means the video is exactly keeping its historical monthly pace.
  // Only calculated at 90+ days so the avg-monthly baseline is not skewed by the launch spike.
  const avgMonthlyViews = totalViews / (ageInDays / 30);
  const evergreenScore =
    ageInDays >= 90 && viewsLast30Days !== null && totalViews > 0
      ? Math.round((viewsLast30Days / avgMonthlyViews) * 1000) / 10
      : null;

  // Only reliable once the prior-week window is fully outside the launch period (> 15 days)
  const weeklyViewVelocity =
    viewsLast7Days !== null && priorWeekViews !== null && priorWeekViews > 0 && ageInDays > 15
      ? Math.round((viewsLast7Days / priorWeekViews) * 100) / 100
      : null;

  // Only meaningful once a full prior-month window exists (≥ 60 days)
  const monthlyViewVelocity =
    viewsLast30Days !== null && priorMonthViews !== null && priorMonthViews > 0 && ageInDays >= 60
      ? Math.round((viewsLast30Days / priorMonthViews) * 100) / 100
      : null;

  const withoutClassification = {
    eventScore,
    evergreenScore,
    weeklyViewVelocity,
    monthlyViewVelocity,
    viewsPerDayOfLife,
  };

  return {
    ...withoutClassification,
    classification: classify(withoutClassification, ageInDays),
  };
}

export interface SummaryMetrics {
  totalViews: number;
  watchTimeHours: number;
  watchTimeMinutes: number;
  avgViewDurationSec: number;
  netSubscribers: number;
  subsGained: number;
  subsLost: number;
  likes: number;
  likeRate: number;
  shares: number;
  shareBreakdown: string;
}

export interface DailyPoint {
  date: string;
  views: number;
  watchTimeHours: number;
  avgDurationSec: number;
  subsGained: number;
  subsLost: number;
}

export type VideoClassification =
  | "event_video"
  | "evergreen"
  | "slow_burn"
  | "underperformer"
  | "too_new"
  | "unknown";

export interface DerivedMetrics {
  /** % of lifetime views that came in the first 3 days. null if video is < 7 days old. */
  eventScore: number | null;
  /** Monthly Retention Ratio: (last30d views / avg-monthly-views) × 100. null if video is < 90 days old. 100 = on historical average pace. */
  evergreenScore: number | null;
  /** last7d views / prior7d views. null if video is ≤ 15 days old or no prior-week data. */
  weeklyViewVelocity: number | null;
  /** last30d views / prior30d views. null if video is < 60 days old or no prior-month data. */
  monthlyViewVelocity: number | null;
  /** total lifetime views / days since publish */
  viewsPerDayOfLife: number;
  classification: VideoClassification;
}

export interface VideoWithMetrics {
  id: string;
  title: string;
  titleShort: string;
  color: string;
  isShort: boolean;
  publishedAt: string;
  // Lifetime stats (YouTube Data API)
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  durationSeconds: number;
  // Period analytics (Analytics API — selected period for top videos)
  views: number;
  likes: number;
  comments: number;
  shares: number;
  watchTimeHours: number;
  avgDurationSec: number;
  subsGained: number;
  // Deep analytics (Analytics API — fixed windows relative to today)
  avgViewDurationSeconds: number | null;
  avgViewPercentage: number | null;
  viewsLast7Days: number | null;
  viewsLast28Days: number | null;
  viewsLast48Hours: number | null;
  // Derived signals
  derived: DerivedMetrics;
}

export interface TrendingVideo {
  id: string;
  title: string;
  titleShort: string;
  color: string;
  isShort: boolean;
  publishedAt: string;
  viewsLast48h: number;
  viewsLast48hPrior: number;
  /** viewsLast48h / max(viewsLast48hPrior, 1) */
  velocity: number;
  derived: DerivedMetrics;
}

export interface TrafficSource {
  source: string;
  views: number;
  watchTimeHours: number;
  sharePct: number;
  color: string;
}

export interface AudienceData {
  countries: { name: string; value: number; color: string }[];
  devices: { name: string; value: number; color: string }[];
  operatingSystems: { name: string; value: number; color: string }[];
  subscriberVsNon: { metric: string; subscribers: number; nonSubscribers: number }[];
}

export interface DashboardData {
  channelName?: string;
  summary: SummaryMetrics;
  daily: DailyPoint[];
  videos: VideoWithMetrics[];
  trafficSources: TrafficSource[];
  dailyTraffic: Record<string, string | number>[];
  audience: AudienceData;
  retentionData: Record<string, string | number | null>[];
  relativeData: Record<string, string | number | null>[];
  videoMeta: { title: string; color: string }[];
}

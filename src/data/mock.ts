// MOCK DATA — shown only when no YouTube credentials are configured.
// All metrics are zeroed out so this cannot be mistaken for real channel data.

import type { VideoWithMetrics, TrendingVideo } from "@/types/dashboard";

export const channelInfo = {
  name: "Not Connected",
  dateRange: { from: "2026-01-01", to: "2026-01-01" },
};

export const summaryMetrics = {
  totalViews: 0,
  watchTimeHours: 0,
  watchTimeMinutes: 0,
  avgViewDurationSec: 0,
  netSubscribers: 0,
  subsGained: 0,
  subsLost: 0,
  likes: 0,
  likeRate: 0,
  shares: 0,
  shareBreakdown: "—",
};

export const dailyOverview = [
  { date: "Jan 1", views: 0, watchTimeHours: 0, subsGained: 0, subsLost: 0, avgDurationSec: 0 },
];

const mockDerived = {
  eventScore: null,
  evergreenScore: null,
  weeklyViewVelocity: null,
  monthlyViewVelocity: null,
  viewsPerDayOfLife: 0,
  classification: "unknown" as const,
};

export const videos: VideoWithMetrics[] = [
  {
    id: "mock-1",
    title: "— No data — connect your YouTube channel to see real videos",
    titleShort: "No data",
    color: "#6b7280",
    isShort: false,
    publishedAt: "2026-01-01T00:00:00Z",
    totalViews: 0,
    totalLikes: 0,
    totalComments: 0,
    durationSeconds: 0,
    views: 0,
    likes: 0,
    comments: 0,
    shares: 0,
    watchTimeHours: 0,
    avgDurationSec: 0,
    subsGained: 0,
    avgViewDurationSeconds: null,
    avgViewPercentage: null,
    viewsLast7Days: null,
    viewsLast28Days: null,
    viewsLast48Hours: null,
    derived: mockDerived,
  },
];

export const mockTrendingVideos: TrendingVideo[] = [
  {
    id: "mock-1",
    title: "— No data — connect your YouTube channel to see real videos",
    titleShort: "No data",
    color: "#6b7280",
    isShort: false,
    publishedAt: "2026-01-01T00:00:00Z",
    viewsLast48h: 0,
    viewsLast48hPrior: 0,
    velocity: 0,
    derived: mockDerived,
  },
];

export const trafficSources = [
  { source: "No data", views: 0, watchTimeHours: 0, sharePct: 100, color: "#6b7280" },
];

export const dailyTrafficSources = [
  { date: "Jan 1", "No data": 0 },
];

export const audienceData = {
  countries: [
    { name: "No data", value: 100, color: "#6b7280" },
  ],
  devices: [
    { name: "No data", value: 100, color: "#6b7280" },
  ],
  operatingSystems: [
    { name: "No data", value: 100, color: "#6b7280" },
  ],
  subscriberVsNon: [
    { metric: "Views", subscribers: 0, nonSubscribers: 0 },
    { metric: "Watch Time (min)", subscribers: 0, nonSubscribers: 0 },
  ],
};

const retentionPoints = ["1%","5%","10%","15%","20%","25%","30%","35%","40%","45%","50%","55%","60%","65%","70%","75%","80%","85%","90%","95%","100%"];

export const retentionData = retentionPoints.map((pct) => ({
  progress: pct,
  "No data": 0,
}));

export const relativeRetentionData = retentionPoints.map((pct) => ({
  progress: pct,
  "No data": 0,
  "YouTube Average": 65,
}));

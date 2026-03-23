// Mock data for YouTube Analytics Dashboard
// Inspired by a Health Insurance Shorts Channel with 3 videos (Mar 12–16, 2026)

import type { VideoWithMetrics, TrendingVideo } from "@/types/dashboard";

export const channelInfo = {
  name: "Dummy Data",
  dateRange: { from: "2026-03-12", to: "2026-03-16" },
};

export const summaryMetrics = {
  totalViews: 1369,
  engagedViews: 486,
  engagedPct: 35.5,
  watchTimeHours: 4.4,
  watchTimeMinutes: 258,
  avgViewDurationSec: 29,
  netSubscribers: 38,
  subsGained: 39,
  subsLost: 1,
  likes: 64,
  likeRate: 4.7,
  shares: 7,
  shareBreakdown: "4 WhatsApp, 3 copy-paste",
};

export const dailyOverview = [
  { date: "Mar 12", views: 310, engaged: 120, watchTimeHours: 1.2, subsGained: 10, subsLost: 0, avgDurationSec: 30 },
  { date: "Mar 13", views: 335, engaged: 130, watchTimeHours: 1.2, subsGained: 10, subsLost: 0, avgDurationSec: 31 },
  { date: "Mar 14", views: 500, engaged: 150, watchTimeHours: 1.1, subsGained: 12, subsLost: 1, avgDurationSec: 26 },
  { date: "Mar 15", views: 155, engaged: 60, watchTimeHours: 0.6, subsGained: 5, subsLost: 0, avgDurationSec: 26 },
  { date: "Mar 16", views: 69, engaged: 26, watchTimeHours: 0.3, subsGained: 2, subsLost: 0, avgDurationSec: 25 },
];

export const videos: VideoWithMetrics[] = [
  {
    id: "v1",
    title: "हेल्थ इंश्योरेंस क्यों जरूरी है? (Health Insurance Explained)",
    titleShort: "Health Insurance Explained",
    color: "#ef4444",
    isShort: true,
    publishedAt: "2026-03-12T10:00:00Z",
    totalViews: 443,
    totalLikes: 24,
    totalComments: 0,
    durationSeconds: 31,
    views: 443,
    engaged: 160,
    likes: 24,
    comments: 0,
    shares: 1,
    watchTimeHours: 1.5,
    avgDurationSec: 31,
    subsGained: 6,
    avgViewDurationSeconds: 31,
    avgViewPercentage: 82.1,
    impressions: 2100,
    ctr: 4.2,
    viewsLast7Days: 38,
    viewsLast28Days: 443,
    viewsLast48Hours: 12,
    derived: {
      eventScore: 78.3,
      evergreenScore: null,
      weeklyViewVelocity: 0.4,
      monthlyViewVelocity: null,
      ctrEfficiency: 1.0,
      viewsPerDayOfLife: 40.3,
      classification: "event_video",
    },
  },
  {
    id: "v2",
    title: "कैशलेस vs Reimbursement (Cashless vs Reimbursement Claim)",
    titleShort: "Cashless vs Reimbursement",
    color: "#06b6d4",
    isShort: true,
    publishedAt: "2026-03-13T10:00:00Z",
    totalViews: 403,
    totalLikes: 19,
    totalComments: 1,
    durationSeconds: 32,
    views: 403,
    engaged: 183,
    likes: 19,
    comments: 1,
    shares: 3,
    watchTimeHours: 1.7,
    avgDurationSec: 32,
    subsGained: 8,
    avgViewDurationSeconds: 32,
    avgViewPercentage: 85.4,
    impressions: 1900,
    ctr: 4.1,
    viewsLast7Days: 42,
    viewsLast28Days: 403,
    viewsLast48Hours: 15,
    derived: {
      eventScore: 72.0,
      evergreenScore: null,
      weeklyViewVelocity: 0.5,
      monthlyViewVelocity: null,
      ctrEfficiency: 0.98,
      viewsPerDayOfLife: 37.7,
      classification: "event_video",
    },
  },
  {
    id: "v3",
    title: "Insurance होते हुए भी पैसे क्यों? (Insurance Claim Terms)",
    titleShort: "Insurance Claim Terms",
    color: "#a855f7",
    isShort: true,
    publishedAt: "2026-03-14T10:00:00Z",
    totalViews: 316,
    totalLikes: 18,
    totalComments: 2,
    durationSeconds: 29,
    views: 316,
    engaged: 104,
    likes: 18,
    comments: 2,
    shares: 3,
    watchTimeHours: 0.9,
    avgDurationSec: 29,
    subsGained: 11,
    avgViewDurationSeconds: 29,
    avgViewPercentage: 79.0,
    impressions: 1600,
    ctr: 4.5,
    viewsLast7Days: 55,
    viewsLast28Days: 316,
    viewsLast48Hours: 20,
    derived: {
      eventScore: 65.2,
      evergreenScore: null,
      weeklyViewVelocity: 1.3,
      monthlyViewVelocity: null,
      ctrEfficiency: 1.07,
      viewsPerDayOfLife: 35.1,
      classification: "slow_burn",
    },
  },
];

export const mockTrendingVideos: TrendingVideo[] = [
  {
    id: "v3",
    title: "Insurance होते हुए भी पैसे क्यों? (Insurance Claim Terms)",
    titleShort: "Insurance Claim Terms",
    color: "#a855f7",
    isShort: true,
    publishedAt: "2026-03-14T10:00:00Z",
    viewsLast48h: 20,
    viewsLast48hPrior: 14,
    velocity: 1.43,
    derived: {
      eventScore: 65.2,
      evergreenScore: null,
      weeklyViewVelocity: 1.3,
      monthlyViewVelocity: null,
      ctrEfficiency: 1.07,
      viewsPerDayOfLife: 35.1,
      classification: "slow_burn",
    },
  },
  {
    id: "v2",
    title: "कैशलेस vs Reimbursement (Cashless vs Reimbursement Claim)",
    titleShort: "Cashless vs Reimbursement",
    color: "#06b6d4",
    isShort: true,
    publishedAt: "2026-03-13T10:00:00Z",
    viewsLast48h: 15,
    viewsLast48hPrior: 18,
    velocity: 0.83,
    derived: {
      eventScore: 72.0,
      evergreenScore: null,
      weeklyViewVelocity: 0.5,
      monthlyViewVelocity: null,
      ctrEfficiency: 0.98,
      viewsPerDayOfLife: 37.7,
      classification: "event_video",
    },
  },
  {
    id: "v1",
    title: "हेल्थ इंश्योरेंस क्यों जरूरी है? (Health Insurance Explained)",
    titleShort: "Health Insurance Explained",
    color: "#ef4444",
    isShort: true,
    publishedAt: "2026-03-12T10:00:00Z",
    viewsLast48h: 12,
    viewsLast48hPrior: 19,
    velocity: 0.63,
    derived: {
      eventScore: 78.3,
      evergreenScore: null,
      weeklyViewVelocity: 0.4,
      monthlyViewVelocity: null,
      ctrEfficiency: 1.0,
      viewsPerDayOfLife: 40.3,
      classification: "event_video",
    },
  },
];

export const trafficSources = [
  { source: "Shorts Feed", views: 948, engaged: 218, watchTimeHours: 1.8, sharePct: 69.2, color: "#ef4444" },
  { source: "External URL", views: 188, engaged: 134, watchTimeHours: 1.3, sharePct: 13.7, color: "#f97316" },
  { source: "YouTube Search", views: 136, engaged: 74, watchTimeHours: 0.8, sharePct: 9.9, color: "#06b6d4" },
  { source: "Channel Page", views: 73, engaged: 44, watchTimeHours: 0.4, sharePct: 5.3, color: "#a855f7" },
  { source: "Subscriber", views: 19, engaged: 17, watchTimeHours: 0.1, sharePct: 1.4, color: "#22c55e" },
  { source: "Other Page", views: 7, engaged: 2, watchTimeHours: 0.0, sharePct: 0.5, color: "#ec4899" },
];

export const dailyTrafficSources = [
  { date: "Mar 12", Shorts: 210, External: 55, Search: 30, Channel: 10, Subscriber: 5 },
  { date: "Mar 13", Shorts: 230, External: 50, Search: 35, Channel: 12, Subscriber: 8 },
  { date: "Mar 14", Shorts: 340, External: 65, Search: 55, Channel: 28, Subscriber: 4 },
  { date: "Mar 15", Shorts: 115, External: 14, Search: 12, Channel: 10, Subscriber: 2 },
  { date: "Mar 16", Shorts: 53,  External: 4,  Search: 4,  Channel: 4,  Subscriber: 0 },
];

export const audienceData = {
  countries: [
    { name: "India", value: 96, color: "#ef4444" },
    { name: "Other", value: 4, color: "#374151" },
  ],
  devices: [
    { name: "Mobile", value: 88, color: "#ef4444" },
    { name: "Desktop", value: 9, color: "#06b6d4" },
    { name: "Tablet", value: 2, color: "#a855f7" },
    { name: "TV", value: 1, color: "#22c55e" },
  ],
  operatingSystems: [
    { name: "Android", value: 82, color: "#ef4444" },
    { name: "iOS", value: 9, color: "#06b6d4" },
    { name: "Windows", value: 6, color: "#a855f7" },
    { name: "WebOS", value: 2, color: "#f97316" },
    { name: "Other", value: 1, color: "#374151" },
  ],
  subscriberVsNon: [
    { metric: "Views", subscribers: 74, nonSubscribers: 1295 },
    { metric: "Engaged", subscribers: 45, nonSubscribers: 441 },
    { metric: "Watch Time (min)", subscribers: 38, nonSubscribers: 220 },
  ],
};

// Retention data: 21 points from 1% to 100% video progress
const retentionPoints = ["1%","5%","10%","15%","20%","25%","30%","35%","40%","45%","50%","55%","60%","65%","70%","75%","80%","85%","90%","95%","100%"];

export const retentionData = retentionPoints.map((pct, i) => ({
  progress: pct,
  "Health Insurance Explained": Math.round(120 - i * 2.8 + Math.sin(i * 0.4) * 4),
  "Cashless vs Reimbursement":  Math.round(118 - i * 3.4 + Math.sin(i * 0.5) * 3),
  "Insurance Claim Terms":      Math.round(115 - i * 4.2 + Math.sin(i * 0.3) * 3),
}));

export const relativeRetentionData = retentionPoints.map((pct, i) => ({
  progress: pct,
  "Health Insurance Explained": Math.round(60 + i * 1.1 + Math.sin(i * 0.5) * 5),
  "Cashless vs Reimbursement":  Math.round(58 + i * 0.65 + Math.sin(i * 0.4) * 4),
  "Insurance Claim Terms":      Math.round(55 - i * 0.3 + Math.sin(i * 0.3) * 3),
  "YouTube Average":            65,
}));

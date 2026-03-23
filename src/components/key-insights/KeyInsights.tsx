import { videos as mockVideos, trafficSources as mockSources, dailyOverview as mockDaily, summaryMetrics as mockSummary, audienceData as mockAudience } from "@/data/mock";
import { TrendingUp, Users, Clock, Share2, Trophy, Target, Zap } from "lucide-react";
import type { DashboardData } from "@/types/dashboard";

export default function KeyInsights({ data }: { data?: Partial<DashboardData> }) {
  const videos = data?.videos ?? mockVideos;
  const sources = data?.trafficSources ?? mockSources;
  const daily = data?.daily ?? mockDaily;
  const summary = data?.summary ?? mockSummary;
  const audience = data?.audience ?? mockAudience;

  const shortsCount = videos.filter((v) => v.isShort).length;
  const longsCount = videos.filter((v) => !v.isShort).length;

  const bestVideo = [...videos].sort((a, b) => b.views - a.views)[0];
  const topSource = [...sources].sort((a, b) => b.views - a.views)[0];
  const peakDay = [...daily].sort((a, b) => b.views - a.views)[0];
  const bestRetentionVideo = [...videos].sort((a, b) => b.avgDurationSec - a.avgDurationSec)[0];
  const subConversionRate = ((summary.netSubscribers / summary.totalViews) * 100).toFixed(2);
  const topDevice = audience.devices[0];
  const highestSubsVideo = [...videos].sort((a, b) => b.subsGained - a.subsGained)[0];

  if (!bestVideo || !topSource || !peakDay) return null;

  const insights = [
    { icon: Trophy, color: "#f59e0b", bg: "#f59e0b22", title: "Best Performing Video", value: bestVideo.title, detail: `${bestVideo.views.toLocaleString()} views · ${bestVideo.derived.classification.replace("_", " ")}` },
    { icon: TrendingUp, color: "#ef4444", bg: "#ef444422", title: "Top Traffic Source", value: topSource.source, detail: `${topSource.sharePct}% of all views (${topSource.views.toLocaleString()} views)` },
    { icon: Zap, color: "#06b6d4", bg: "#06b6d422", title: "Peak Day", value: peakDay.date, detail: `${peakDay.views.toLocaleString()} views · ${peakDay.watchTimeHours}h watch time` },
    { icon: Clock, color: "#a855f7", bg: "#a855f722", title: "Longest Avg Watch Time", value: bestRetentionVideo.title, detail: `${bestRetentionVideo.avgDurationSec}s avg · ${bestRetentionVideo.watchTimeHours}h total` },
    { icon: Users, color: "#22c55e", bg: "#22c55e22", title: "Subscriber Conversion", value: `${subConversionRate}%`, detail: `${summary.netSubscribers} net subs from ${summary.totalViews.toLocaleString()} views` },
    { icon: Target, color: "#ec4899", bg: "#ec489922", title: "Top Device", value: topDevice?.name ?? "Mobile", detail: `${topDevice?.value ?? 0}% of views come from ${topDevice?.name ?? "Mobile"} devices` },
    { icon: Share2, color: "#06b6d4", bg: "#06b6d422", title: "Most Subscribers Gained", value: highestSubsVideo.title, detail: `${highestSubsVideo.subsGained} subscribers gained from this video` },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="card p-5 flex flex-col gap-3">
        <div>
          <h3 className="text-base font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Key Insights</h3>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Auto-derived highlights from your channel analytics for the selected date range.</p>
        </div>
        <div className="flex items-center gap-4 text-sm pt-1" style={{ borderTop: "1px solid var(--border)" }}>
          <span style={{ color: "var(--text-secondary)" }}>Videos published in period:</span>
          <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
            {shortsCount} Short{shortsCount !== 1 ? "s" : ""}
          </span>
          <span style={{ color: "var(--text-secondary)" }}>·</span>
          <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
            {longsCount} Long-form
          </span>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {insights.map((insight) => {
          const Icon = insight.icon;
          return (
            <div key={insight.title} className="card p-5 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: insight.bg }}>
                  <Icon size={18} color={insight.color} />
                </div>
                <div className="text-xs font-semibold tracking-wider" style={{ color: "var(--text-secondary)" }}>{insight.title.toUpperCase()}</div>
              </div>
              <div className="text-base font-bold leading-snug" style={{ color: "var(--text-primary)", wordBreak: "break-word" }}>{insight.value}</div>
              <div className="text-xs" style={{ color: "var(--text-secondary)" }}>{insight.detail}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

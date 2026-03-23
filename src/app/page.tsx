"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Header from "@/components/layout/Header";
import TabNav, { Tab } from "@/components/layout/TabNav";
import OverviewTab from "@/components/overview/OverviewTab";
import VideoPerformanceTab from "@/components/video-performance/VideoPerformanceTab";
import TrafficSourcesTab from "@/components/traffic-sources/TrafficSourcesTab";
import AudienceTab from "@/components/audience/AudienceTab";
import RetentionTab from "@/components/retention/RetentionTab";
import KeyInsights from "@/components/key-insights/KeyInsights";
import GlossaryTab from "@/components/glossary/GlossaryTab";
import type { DashboardData } from "@/types/dashboard";

function toDateStr(d: Date) {
  return d.toISOString().split("T")[0];
}

const today = new Date();
const defaultTo = toDateStr(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7));
const defaultFrom = toDateStr(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 14));

export default function Home() {
  const cacheRef = useRef<Map<string, Partial<DashboardData>>>(new Map());
  const [tab, setTab] = useState<Tab>("overview");
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const [data, setData] = useState<Partial<DashboardData> | null>(null);
  const [loading, setLoading] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [activeYears, setActiveYears] = useState<{ year: number; views: number }[]>([]);
  const [channelIndex, setChannelIndex] = useState(1);
  const [channels, setChannels] = useState<{ index: number; name: string; id: string }[]>([]);

  useEffect(() => {
    fetch("/api/youtube/channels")
      .then((r) => r.json())
      .then((d) => setChannels(d.channels ?? []))
      .catch(() => {});
  }, []);

  const fetchAll = useCallback(async (f: string, t: string, ci: number) => {
    if (!f || !t || f > t) return; // guard against invalid ranges

    const cacheKey = `${f}|${t}|${ci}`;
    const cached = cacheRef.current.get(cacheKey);
    if (cached) {
      setData(cached);
      setConfigured(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [overviewRes, videosRes, trafficRes, audienceRes, retentionRes] = await Promise.all([
        fetch(`/api/youtube/overview?from=${f}&to=${t}&channel=${ci}`),
        fetch(`/api/youtube/videos?from=${f}&to=${t}&channel=${ci}`),
        fetch(`/api/youtube/traffic?from=${f}&to=${t}&channel=${ci}`),
        fetch(`/api/youtube/audience?from=${f}&to=${t}&channel=${ci}`),
        fetch(`/api/youtube/retention?from=${f}&to=${t}&channel=${ci}`),
      ]);

      // If any returns 401 not_configured, fall back to mock
      if (overviewRes.status === 401) {
        setConfigured(false);
        setData(null);
        return;
      }

      setConfigured(true);
      const safeJson = (r: Response, fallback: unknown = {}) =>
        r.ok ? r.json().catch(() => fallback) : Promise.resolve(fallback);
      const [overview, videos, traffic, audience, retention] = await Promise.all([
        safeJson(overviewRes, { summary: null, daily: [], channelName: undefined }),
        safeJson(videosRes, { videos: [] }),
        safeJson(trafficRes, { sources: [], dailyTraffic: [] }),
        safeJson(audienceRes, {}),
        safeJson(retentionRes, {}),
      ]);

      if ((overview.summary?.totalViews ?? 0) === 0) {
        fetch(`/api/youtube/active-years?channel=${ci}`)
          .then((r) => r.json())
          .then((d) => setActiveYears(d.activeYears ?? []))
          .catch(() => {});
      } else {
        setActiveYears([]);
      }

      const newData: Partial<DashboardData> = {
        channelName: overview.channelName,
        summary: overview.summary,
        daily: overview.daily,
        videos: videos.videos,
        trafficSources: traffic.sources,
        dailyTraffic: traffic.dailyTraffic,
        audience: {
          countries: audience.countries,
          devices: audience.devices,
          operatingSystems: audience.operatingSystems,
          subscriberVsNon: audience.subscriberVsNon,
        },
        retentionData: retention.retentionData,
        relativeData: retention.relativeData,
        videoMeta: retention.videoMeta,
      };
      cacheRef.current.set(cacheKey, newData);
      setData(newData);
    } catch (err) {
      // fetchAll already set configured=true above, so only reset on genuine 401s.
      // Unexpected JS errors (parse failures, network blips) shouldn't wipe the dashboard.
      console.error("fetchAll error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll(from, to, channelIndex);
  }, [from, to, channelIndex, fetchAll]);

  const handleApply = (f: string, t: string) => {
    setFrom(f);
    setTo(t);
  };

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "var(--bg-page)" }}>
      <Header
        from={from}
        to={to}
        onApply={handleApply}
        channelName={data?.channelName}
        channels={channels}
        channelIndex={channelIndex}
        onChannelChange={setChannelIndex}
      />
      <TabNav active={tab} onChange={setTab} />

      {!configured && (
        <div
          className="mx-6 mt-4 px-4 py-3 rounded-lg text-sm flex items-center gap-3"
          style={{ background: "#f59e0b22", border: "1px solid #f59e0b44", color: "#f59e0b" }}
        >
          <span>⚠</span>
          <span>
            YouTube not connected — showing mock data.{" "}
            <a href="/setup" className="underline font-semibold">Connect your channel →</a>
          </span>
        </div>
      )}

      {loading && (
        <div className="mx-6 mt-4 px-4 py-3 rounded-lg text-sm flex items-center gap-2" style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
          <span className="animate-spin inline-block w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent shrink-0" />
          Loading analytics…
        </div>
      )}

      {!loading && configured && data?.summary?.totalViews === 0 && (
        <div
          className="mx-6 mt-4 px-4 py-3 rounded-lg text-sm"
          style={{ background: "#06b6d422", border: "1px solid #06b6d444", color: "#06b6d4" }}
        >
          <div className="flex items-start gap-3">
            <span>ℹ</span>
            <div className="flex flex-col gap-2">
              <span>
                Channel connected, but no views found for <strong>{from}</strong> → <strong>{to}</strong>.
              </span>
              {activeYears.length > 0 ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span>Jump to a year with data:</span>
                  {activeYears.sort((a, b) => b.views - a.views).map(({ year, views }) => (
                    <button
                      key={year}
                      onClick={() => {
                        setFrom(`${year}-01-01`);
                        setTo(`${year}-12-31`);
                      }}
                      className="px-2 py-0.5 rounded font-semibold text-xs"
                      style={{ background: "#06b6d444", border: "1px solid #06b6d4", cursor: "pointer", color: "#06b6d4" }}
                    >
                      {year} ({views.toLocaleString()} views)
                    </button>
                  ))}
                </div>
              ) : (
                <span>Checking which years have data…</span>
              )}
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 p-6 max-w-[1400px] w-full mx-auto">
        {tab === "overview" && <OverviewTab summary={data?.summary} daily={data?.daily} />}
        {tab === "video-performance" && <VideoPerformanceTab data={data?.videos} from={from} to={to} />}
        {tab === "traffic-sources" && <TrafficSourcesTab sources={data?.trafficSources} />}
        {tab === "audience" && <AudienceTab data={data?.audience} />}
        {tab === "retention" && <RetentionTab retentionData={data?.retentionData} relativeData={data?.relativeData} videoMeta={data?.videoMeta} from={from} to={to} channelIndex={channelIndex} />}
        {tab === "key-insights" && <KeyInsights data={data ?? undefined} />}
        {tab === "glossary" && <GlossaryTab />}
      </main>
    </div>
  );
}

"use client";

import { useState, useCallback } from "react";
import VideoCards from "./VideoCard";
import ViewsByVideoDonut from "./ViewsByVideoDonut";
import EngagementComparison from "./EngagementComparison";
import CreatedInPeriodList from "./CreatedInPeriodList";
import TrendingVideoList from "./TrendingVideoList";
import type { VideoWithMetrics, TrendingVideo } from "@/types/dashboard";

type SubTab = "top" | "created" | "trending";

const SUB_TABS: { id: SubTab; label: string }[] = [
  { id: "top", label: "Top Videos" },
  { id: "created", label: "Created in Period" },
  { id: "trending", label: "Trending" },
];

export default function VideoPerformanceTab({
  data,
  from,
  to,
}: {
  data?: VideoWithMetrics[];
  from: string;
  to: string;
}) {
  const [subTab, setSubTab] = useState<SubTab>("top");
  const [createdData, setCreatedData] = useState<VideoWithMetrics[] | null>(null);
  const [createdLoading, setCreatedLoading] = useState(false);
  const [trendingData, setTrendingData] = useState<TrendingVideo[] | null>(null);
  const [trendingLoading, setTrendingLoading] = useState(false);

  const handleSubTabChange = useCallback(
    async (tab: SubTab) => {
      setSubTab(tab);

      // Don't fetch sub-tabs when not configured (data=undefined means mock mode)
      if (!data) return;

      if (tab === "created" && createdData === null && !createdLoading) {
        setCreatedLoading(true);
        try {
          const res = await fetch(`/api/youtube/videos/created?from=${from}&to=${to}`);
          if (res.ok) {
            const json = await res.json();
            setCreatedData(json.videos ?? []);
          }
          // On error/401, keep createdData=null so components fall back to mock
        } finally {
          setCreatedLoading(false);
        }
      }

      if (tab === "trending" && trendingData === null && !trendingLoading) {
        setTrendingLoading(true);
        try {
          const res = await fetch("/api/youtube/videos/trending");
          if (res.ok) {
            const json = await res.json();
            setTrendingData(json.trending ?? []);
          }
          // On error/401, keep trendingData=null so components fall back to mock
        } finally {
          setTrendingLoading(false);
        }
      }
    },
    [from, to, createdData, createdLoading, trendingData, trendingLoading],
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Sub-tab navigation */}
      <div className="flex gap-1 p-1 rounded-lg w-fit" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        {SUB_TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => handleSubTabChange(id)}
            className="px-4 py-1.5 rounded-md text-sm font-medium transition-colors"
            style={
              subTab === id
                ? { background: "#ef4444", color: "#fff" }
                : { color: "var(--text-secondary)", cursor: "pointer" }
            }
          >
            {label}
          </button>
        ))}
      </div>

      {/* Top Videos */}
      {subTab === "top" && (
        <>
          <VideoCards data={data} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ViewsByVideoDonut data={data} />
            <EngagementComparison data={data} />
          </div>
        </>
      )}

      {/* Created in Period */}
      {subTab === "created" && (
        createdLoading ? (
          <div className="card p-6 text-sm" style={{ color: "var(--text-secondary)" }}>
            Loading videos published in this period…
          </div>
        ) : (
          <CreatedInPeriodList data={createdData ?? undefined} from={from} to={to} />
        )
      )}

      {/* Trending */}
      {subTab === "trending" && (
        trendingLoading ? (
          <div className="card p-6 text-sm" style={{ color: "var(--text-secondary)" }}>
            Loading trending videos…
          </div>
        ) : (
          <TrendingVideoList data={trendingData ?? undefined} />
        )
      )}
    </div>
  );
}

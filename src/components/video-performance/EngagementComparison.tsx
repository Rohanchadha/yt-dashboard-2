"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { videos as mockVideos } from "@/data/mock";
import type { VideoWithMetrics } from "@/types/dashboard";

export default function EngagementComparison({ data }: { data?: VideoWithMetrics[] }) {
  const videos = data ?? mockVideos;
  const chartData = videos.map((v) => ({
    name: v.titleShort.split(" ").slice(0, 2).join(" "),
    Likes: v.likes,
    Shares: v.shares,
    Subs: v.subsGained,
  }));
  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Engagement Comparison</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} barCategoryGap="30%" barGap={3}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--text-secondary)" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12, fill: "var(--text-secondary)" }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-primary)" }} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="Likes" fill="#ef4444" radius={[3, 3, 0, 0]} />
          <Bar dataKey="Shares" fill="#06b6d4" radius={[3, 3, 0, 0]} />
          <Bar dataKey="Subs" fill="#22c55e" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { videos as mockVideos } from "@/data/mock";
import type { VideoWithMetrics } from "@/types/dashboard";

export default function ViewsByVideoDonut({ data }: { data?: VideoWithMetrics[] }) {
  const videos = data ?? mockVideos;
  const sorted = [...videos].sort((a, b) => b.views - a.views);
  const top10 = sorted.slice(0, 10);
  const othersViews = sorted.slice(10).reduce((sum, v) => sum + v.views, 0);
  const chartData = [
    ...top10.map((v) => ({ name: v.titleShort, value: v.views, color: v.color })),
    ...(othersViews > 0 ? [{ name: "Others", value: othersViews, color: "#6b7280" }] : []),
  ];
  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Views by Video</h3>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie data={chartData} cx="50%" cy="45%" innerRadius={70} outerRadius={110} dataKey="value" paddingAngle={2}>
            {chartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
          </Pie>
          <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-primary)" }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

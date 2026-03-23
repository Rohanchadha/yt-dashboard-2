"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { retentionData as mockRetention, videos as mockVideos } from "@/data/mock";

interface Props {
  data?: Record<string, string | number | null>[];
  videoMeta?: { title: string; color: string }[];
}

export default function RetentionCurves({ data, videoMeta }: Props) {
  const chartData = data ?? mockRetention;
  const videos = videoMeta ?? mockVideos.map((v) => ({ title: v.titleShort, color: v.color }));
  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
        Audience Retention Curves (all {videos.length} videos)
      </h3>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="progress" tick={{ fontSize: 11, fill: "var(--text-secondary)" }} axisLine={false} tickLine={false} interval={1} />
          <YAxis label={{ value: "% of viewers watching", angle: -90, position: "insideLeft", style: { fontSize: 11, fill: "var(--text-secondary)" }, offset: 10 }} tick={{ fontSize: 11, fill: "var(--text-secondary)" }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-primary)" }} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {videos.map((v) => (
            <Line key={v.title} type="monotone" dataKey={v.title} stroke={v.color} strokeWidth={2} dot={false} connectNulls />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

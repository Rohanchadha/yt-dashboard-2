"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { relativeRetentionData as mockRelative, videos as mockVideos } from "@/data/mock";

interface Props {
  data?: Record<string, string | number | null>[];
  videoMeta?: { title: string; color: string }[];
}

export default function RelativeRetention({ data, videoMeta }: Props) {
  const chartData = data ?? mockRelative;
  const videos = videoMeta ?? mockVideos.map((v) => ({ title: v.titleShort, color: v.color }));
  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Relative Retention vs YouTube Average</h3>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="progress" tick={{ fontSize: 11, fill: "var(--text-secondary)" }} axisLine={false} tickLine={false} interval={1} />
          <YAxis label={{ value: "Retention performance", angle: -90, position: "insideLeft", style: { fontSize: 11, fill: "var(--text-secondary)" }, offset: 10 }} tick={{ fontSize: 11, fill: "var(--text-secondary)" }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-primary)" }} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {videos.map((v) => (
            <Line key={v.title} type="monotone" dataKey={v.title} stroke={v.color} strokeWidth={2} dot={false} connectNulls />
          ))}
          <Line type="monotone" dataKey="YouTube Average" stroke="#6b7280" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

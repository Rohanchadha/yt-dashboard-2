"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { dailyTrafficSources as mockDaily, trafficSources as mockSources } from "@/data/mock";
import type { TrafficSource } from "@/types/dashboard";

interface Props {
  data?: Record<string, string | number>[];
  sources?: TrafficSource[];
}

export default function DailyTrafficChart({ data, sources }: Props) {
  const daily = data ?? mockDaily;
  // Derive keys from data or sources
  const keys = sources
    ? sources.map((s) => s.source.split(" ")[0])
    : Object.keys(daily[0] ?? {}).filter((k) => k !== "date");
  const colors = sources
    ? sources.map((s) => s.color)
    : ["#ef4444", "#f97316", "#06b6d4", "#a855f7", "#22c55e"];

  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Daily Views by Traffic Source</h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={daily} barCategoryGap="30%">
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 12, fill: "var(--text-secondary)" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12, fill: "var(--text-secondary)" }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-primary)" }} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {keys.map((key, i) => (
            <Bar key={key} dataKey={key} stackId="a" fill={colors[i] ?? "#6b7280"} radius={i === keys.length - 1 ? [3, 3, 0, 0] : undefined} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

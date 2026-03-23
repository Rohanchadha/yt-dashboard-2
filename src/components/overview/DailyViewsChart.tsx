"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { dailyOverview as mockDaily } from "@/data/mock";
import type { DailyPoint } from "@/types/dashboard";

export default function DailyViewsChart({ data }: { data?: DailyPoint[] }) {
  const daily = data ?? mockDaily;
  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Daily Views</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={daily} barCategoryGap="30%" barGap={3}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 12, fill: "var(--text-secondary)" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12, fill: "var(--text-secondary)" }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-primary)" }} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="views" name="Views" fill="#ef4444" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { trafficSources as mockSources } from "@/data/mock";
import type { TrafficSource } from "@/types/dashboard";

export default function TrafficDonut({ data }: { data?: TrafficSource[] }) {
  const sources = data ?? mockSources;
  const chartData = sources.map((s) => ({ name: s.source.split(" ")[0], value: s.views, color: s.color }));
  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Traffic Source Distribution</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie data={chartData} cx="50%" cy="45%" innerRadius={80} outerRadius={120} dataKey="value" paddingAngle={2}>
            {chartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
          </Pie>
          <Tooltip formatter={(value) => [`${value} views`]} contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-primary)" }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

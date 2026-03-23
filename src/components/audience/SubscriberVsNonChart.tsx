"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { audienceData as mockAudience } from "@/data/mock";
import type { AudienceData } from "@/types/dashboard";

export default function SubscriberVsNonChart({ data }: { data?: AudienceData }) {
  const subscriberVsNon = data?.subscriberVsNon ?? mockAudience.subscriberVsNon;
  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Subscriber vs Non-Subscriber</h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={subscriberVsNon} layout="vertical" barCategoryGap="30%" barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 12, fill: "var(--text-secondary)" }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="metric" tick={{ fontSize: 12, fill: "var(--text-secondary)" }} axisLine={false} tickLine={false} width={110} />
          <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text-primary)" }} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="subscribers" name="Subscribers" fill="#22c55e" radius={[0, 3, 3, 0]} />
          <Bar dataKey="nonSubscribers" name="Non-Subscribers" fill="#ef4444" radius={[0, 3, 3, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

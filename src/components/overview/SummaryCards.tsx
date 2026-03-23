import { summaryMetrics as mockMetrics } from "@/data/mock";
import type { SummaryMetrics } from "@/types/dashboard";

export default function SummaryCards({ data }: { data?: SummaryMetrics }) {
  const m = data ?? mockMetrics;

  const cards = [
    { label: "TOTAL VIEWS", value: m.totalViews.toLocaleString(), sub: "total plays in period", color: "var(--text-primary)" },
    { label: "WATCH TIME", value: `${m.watchTimeHours}h`, sub: `${m.watchTimeMinutes} minutes total`, color: "var(--text-primary)" },
    { label: "AVG VIEW DURATION", value: `0:${String(m.avgViewDurationSec).padStart(2, "0")}`, sub: `${m.avgViewDurationSec} seconds per view`, color: "#ef4444" },
    { label: "NET SUBSCRIBERS", value: `+${m.netSubscribers}`, sub: `${m.subsGained} gained, ${m.subsLost} lost`, color: "#22c55e" },
    { label: "LIKES", value: m.likes.toString(), sub: `${m.likeRate}% like rate`, color: "var(--text-primary)" },
    { label: "SHARES", value: m.shares.toString(), sub: m.shareBreakdown, color: "var(--text-primary)" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card) => (
        <div key={card.label} className="card p-4">
          <div className="text-xs font-semibold tracking-wider mb-2" style={{ color: "var(--text-secondary)" }}>{card.label}</div>
          <div className="text-3xl font-bold mb-1" style={{ color: card.color }}>{card.value}</div>
          <div className="text-xs" style={{ color: "var(--text-secondary)" }}>{card.sub}</div>
        </div>
      ))}
    </div>
  );
}

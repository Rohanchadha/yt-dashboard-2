import { trafficSources as mockSources } from "@/data/mock";
import type { TrafficSource } from "@/types/dashboard";

export default function TrafficTable({ data }: { data?: TrafficSource[] }) {
  const sources = data ?? mockSources;
  const max = Math.max(...sources.map((s) => s.sharePct));
  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Traffic Source Detail</h3>
      <table className="w-full text-sm">
        <thead>
          <tr style={{ color: "var(--text-secondary)" }}>
            <th className="text-left py-2 font-semibold text-xs tracking-wider">SOURCE</th>
            <th className="text-right py-2 font-semibold text-xs tracking-wider">VIEWS</th>
            <th className="text-right py-2 font-semibold text-xs tracking-wider">ENGAGED</th>
            <th className="text-right py-2 font-semibold text-xs tracking-wider">WATCH TIME</th>
            <th className="text-right py-2 font-semibold text-xs tracking-wider w-40">SHARE</th>
          </tr>
        </thead>
        <tbody>
          {sources.map((s) => (
            <tr key={s.source} style={{ borderTop: "1px solid var(--border)" }}>
              <td className="py-3" style={{ color: "var(--text-primary)" }}>{s.source}</td>
              <td className="py-3 text-right font-semibold" style={{ color: "var(--text-primary)" }}>{s.views}</td>
              <td className="py-3 text-right" style={{ color: "var(--text-secondary)" }}>{s.engaged}</td>
              <td className="py-3 text-right" style={{ color: "var(--text-secondary)" }}>{s.watchTimeHours}h</td>
              <td className="py-3">
                <div className="flex items-center justify-end gap-2">
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--border)", maxWidth: 100 }}>
                    <div className="h-full rounded-full" style={{ width: `${(s.sharePct / max) * 100}%`, background: s.color }} />
                  </div>
                  <span className="text-xs font-semibold w-10 text-right" style={{ color: "var(--text-primary)" }}>{s.sharePct}%</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

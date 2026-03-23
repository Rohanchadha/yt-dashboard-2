"use client";

import { useState, useMemo } from "react";
import { mockTrendingVideos } from "@/data/mock";
import type { TrendingVideo, VideoClassification } from "@/types/dashboard";
import { HeaderTooltip } from "@/components/ui/HeaderTooltip";

const CLASSIFICATION_STYLES: Record<VideoClassification, { bg: string; color: string; label: string }> = {
  event_video:    { bg: "#f97316" + "22", color: "#f97316", label: "EVENT" },
  evergreen:      { bg: "#22c55e" + "22", color: "#22c55e", label: "EVERGREEN" },
  slow_burn:      { bg: "#06b6d4" + "22", color: "#06b6d4", label: "SLOW BURN" },
  underperformer: { bg: "#ef4444" + "22", color: "#ef4444", label: "UNDERPERFORMER" },
  too_new:        { bg: "#6b728022", color: "#9ca3af", label: "TOO NEW" },
  unknown:        { bg: "#6b728022", color: "#9ca3af", label: "UNKNOWN" },
};

const TIPS: Record<string, string> = {
  TITLE: "Video title and content type (SHORT or VIDEO).",
  PUBLISHED: "Date the video was published.",
  "48H VIEWS": "Views in the most recently available 48-hour window (~3–4 days ago due to YouTube's ~2-day data processing delay).",
  "PRIOR 48H": "Views in the 48-hour window before the 48H window (~5–6 days ago). Used as the baseline for velocity.",
  VELOCITY: "48H Views ÷ Prior 48H. >1× = gaining momentum, <1× = slowing down.",
  CLASSIFICATION: "Lifecycle label derived from long-term view patterns: EVERGREEN, SLOW BURN, EVENT, UNDERPERFORMER, TOO NEW.",
};

type SortDir = "asc" | "desc";

function VelocityDisplay({ velocity }: { velocity: number }) {
  const color = velocity >= 1.1 ? "#22c55e" : velocity < 0.9 ? "#ef4444" : "#9ca3af";
  const arrow = velocity >= 1.1 ? "↑" : velocity < 0.9 ? "↓" : "→";
  return <span className="font-bold" style={{ color }}>{arrow}{velocity}×</span>;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function SortIndicator({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <span style={{ marginLeft: "4px", fontSize: "9px", opacity: active ? 1 : 0.3 }}>
      {active ? (dir === "asc" ? "▲" : "▼") : "▲"}
    </span>
  );
}

function getValue(video: TrendingVideo, col: string): string | number {
  switch (col) {
    case "TITLE":          return video.title;
    case "PUBLISHED":      return video.publishedAt;
    case "48H VIEWS":      return video.viewsLast48h;
    case "PRIOR 48H":      return video.viewsLast48hPrior;
    case "VELOCITY":       return video.velocity;
    case "CLASSIFICATION": return video.derived.classification;
    default:               return 0;
  }
}

export default function TrendingVideoList({ data }: { data?: TrendingVideo[] }) {
  const trending = data ?? mockTrendingVideos;
  const [sortCol, setSortCol] = useState("48H VIEWS");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [infoExpanded, setInfoExpanded] = useState(false);

  const handleSort = (col: string) => {
    if (col === sortCol) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortDir("desc");
    }
  };

  const sorted = useMemo(() => {
    return [...trending].sort((a, b) => {
      const av = getValue(a, sortCol);
      const bv = getValue(b, sortCol);
      const cmp = typeof av === "string" && typeof bv === "string"
        ? av.localeCompare(bv)
        : (av as number) - (bv as number);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [trending, sortCol, sortDir]);

  if (trending.length === 0) {
    return (
      <div className="card p-8 text-center" style={{ color: "var(--text-secondary)" }}>
        No recent view activity found in the last 48 hours.
      </div>
    );
  }

  const thStyle = (align: "left" | "right"): React.CSSProperties => ({
    padding: "10px 14px",
    textAlign: align,
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.07em",
    color: "var(--text-secondary)",
    whiteSpace: "nowrap",
    borderBottom: "2px solid var(--border)",
    cursor: "pointer",
    userSelect: "none",
  });

  const renderTH = (label: string, align: "left" | "right" = "right") => {
    const isActive = sortCol === label;
    const isLeft = align === "left";
    return (
      <th style={thStyle(align)} onClick={() => handleSort(label)}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "2px", flexDirection: isLeft ? "row" : "row-reverse" }}>
          <HeaderTooltip label={label} tip={TIPS[label] ?? label} />
          <SortIndicator active={isActive} dir={sortDir} />
        </span>
      </th>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Info card */}
      <div className="card overflow-hidden">
        {/* Always-visible header row */}
        <button
          onClick={() => setInfoExpanded((v) => !v)}
          className="w-full flex items-center justify-between px-5 py-3"
          style={{ background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
        >
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>About this list</span>
            <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
              Sorted by <strong style={{ color: "var(--text-primary)" }}>48H VIEWS</strong> · velocity = recent 48h ÷ prior 48h ·{" "}
              <span style={{ color: "#22c55e" }}>↑ &gt;1×</span> growing,{" "}
              <span style={{ color: "#9ca3af" }}>→ ~1×</span> steady,{" "}
              <span style={{ color: "#ef4444" }}>↓ &lt;1×</span> fading
            </span>
          </div>
          <span className="text-xs ml-4 shrink-0" style={{ color: "var(--text-secondary)" }}>
            {infoExpanded ? "▲ less" : "▼ more"}
          </span>
        </button>

        {/* Expandable detail */}
        {infoExpanded && (
          <div
            className="px-5 pb-5 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs"
            style={{ color: "var(--text-secondary)", borderTop: "1px solid var(--border)" }}
          >
            <div className="flex flex-col gap-1 pt-4">
              <div className="font-semibold" style={{ color: "var(--text-primary)" }}>Which videos appear here</div>
              <p className="leading-relaxed">
                Your top 200 most-viewed videos are checked across two back-to-back 48-hour snapshots. Any
                video with views in <em>either</em> snapshot makes the list — including videos that were active
                earlier but have since slowed down.
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-4">
              <div className="font-semibold" style={{ color: "var(--text-primary)" }}>The two 48-hour snapshots</div>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 shrink-0 font-bold" style={{ color: "#06b6d4" }}>48H VIEWS</span>
                  <span className="leading-relaxed">The more recent snapshot — views from 3 to 4 days ago. Your video's current activity level.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 shrink-0 font-bold" style={{ color: "var(--text-primary)" }}>PRIOR 48H</span>
                  <span className="leading-relaxed">The older snapshot — views from 5 to 6 days ago. The baseline you are comparing against.</span>
                </div>
                <p className="leading-relaxed" style={{ opacity: 0.7 }}>
                  Both windows are shifted ~2 days into the past because YouTube takes about 2 days to fully
                  process view data. Querying today or yesterday would return incomplete numbers.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-1 pt-4">
              <div className="font-semibold" style={{ color: "var(--text-primary)" }}>Velocity — is it growing?</div>
              <p className="leading-relaxed">
                <strong style={{ color: "#22c55e" }}>↑ above 1×</strong> — more views in the recent snapshot than the prior one. Momentum is building.
              </p>
              <p className="leading-relaxed mt-1">
                <strong style={{ color: "#9ca3af" }}>→ around 1×</strong> — roughly the same views in both snapshots. Holding steady.
              </p>
              <p className="leading-relaxed mt-1">
                <strong style={{ color: "#ef4444" }}>↓ below 1×</strong> — fewer views in the recent snapshot. The video is losing traction.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="card" style={{ overflow: "auto", maxHeight: "70vh" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "auto" }}>
          <thead>
            <tr>
              <th style={{ ...thStyle("left"), cursor: "default", minWidth: "40px" }}>#</th>
              {renderTH("TITLE", "left")}
              {renderTH("PUBLISHED", "left")}
              {renderTH("48H VIEWS")}
              {renderTH("PRIOR 48H")}
              {renderTH("VELOCITY")}
              {renderTH("CLASSIFICATION")}
            </tr>
          </thead>
          <tbody>
            {sorted.map((video, i) => {
              const cls = CLASSIFICATION_STYLES[video.derived.classification];
              return (
                <tr key={video.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td className="px-4 py-3 font-bold" style={{ color: "var(--text-secondary)" }}>
                    {i + 1}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <a
                        href={`https://www.youtube.com/watch?v=${video.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium"
                        style={{ color: video.color, textDecoration: "none" }}
                      >
                        {video.title}
                      </a>
                      <span
                        className="text-xs font-bold px-1.5 py-0.5 rounded"
                        style={{ background: video.isShort ? "#7c3aed22" : "#0e748122", color: video.isShort ? "#a855f7" : "#06b6d4" }}
                      >
                        {video.isShort ? "SHORT" : "VIDEO"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3" style={{ color: "var(--text-secondary)", fontSize: "12px", whiteSpace: "nowrap" }}>
                    {formatDate(video.publishedAt)}
                  </td>
                  <td className="px-4 py-3 text-right font-bold" style={{ color: "#06b6d4" }}>
                    {video.viewsLast48h.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right" style={{ color: "var(--text-secondary)" }}>
                    {video.viewsLast48hPrior.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <VelocityDisplay velocity={video.velocity} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: cls.bg, color: cls.color }}>
                      {cls.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

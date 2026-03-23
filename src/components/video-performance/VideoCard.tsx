"use client";

import { useState, useMemo } from "react";
import { videos as mockVideos } from "@/data/mock";
import type { VideoWithMetrics, VideoClassification } from "@/types/dashboard";
import { HeaderTooltip } from "@/components/ui/HeaderTooltip";

const CLASSIFICATION_STYLES: Record<VideoClassification, { bg: string; color: string; label: string }> = {
  event_video:    { bg: "#f97316" + "22", color: "#f97316", label: "EVENT" },
  evergreen:      { bg: "#22c55e" + "22", color: "#22c55e", label: "EVERGREEN" },
  slow_burn:      { bg: "#06b6d4" + "22", color: "#06b6d4", label: "SLOW BURN" },
  underperformer: { bg: "#ef4444" + "22", color: "#ef4444", label: "UNDERPERFORMER" },
  too_new:        { bg: "#6b728022", color: "#9ca3af", label: "TOO NEW" },
  unknown:        { bg: "#6b728022", color: "#9ca3af", label: "UNKNOWN" },
};

function formatDuration(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function VelocityValue({ value }: { value: number | null }) {
  if (value === null) return <span style={{ color: "var(--text-secondary)" }}>—</span>;
  const color = value >= 1.1 ? "#22c55e" : value < 0.9 ? "#ef4444" : "#9ca3af";
  const arrow = value >= 1.1 ? "↑" : value < 0.9 ? "↓" : "→";
  return <span style={{ color }}>{arrow}{value}×</span>;
}

const TIPS: Record<string, string> = {
  TITLE: "Video title and content type (SHORT or VIDEO).",
  PUBLISHED: "Date the video was published.",
  TYPE: "SHORT = content ≤ 60 s. VIDEO = standard long-form content.",
  CLASS: "Lifecycle label derived from view patterns: EVERGREEN, SLOW BURN, EVENT, UNDERPERFORMER, TOO NEW.",
  VIEWS: "Total views in the selected date range.",
  LIKES: "Total likes received in the period.",
  COMMENTS: "Total comments left on the video.",
  SHARES: "Total times the video was shared.",
  "WATCH TIME": "Total hours watched = estimatedMinutesWatched ÷ 60.",
  "AVG DUR": "Average watch time per view (MM:SS).",
  SUBS: "Net new subscribers gained from this video.",
  "AVG VIEW %": "Average percentage of the video each viewer watched.",
  "EVENT SCORE": "% of lifetime views that came in the first 3 days. Null for videos < 7 days old.",
  "EVERGREEN": "Monthly Retention Ratio: last-30d views ÷ avg-monthly-views × 100. 100 = on historical average pace. Null for videos < 90 days old.",
  "LAST 30D": "Total views in the last 30 days.",
  "AVG MONTHLY": "Average monthly views over the video's lifetime = Lifetime Views ÷ Age-in-Months.",
  "VIEWS/DAY": "Average daily views over the video's entire lifetime.",
  "AGE": "Number of days since the video was published.",
  "WEEKLY VEL": "Views (last 7 days) ÷ views (prior 7 days). >1× = growing. Null for videos ≤ 15 days old.",
  "MONTHLY VEL": "Views (last 30 days) ÷ views (prior 30 days). >1× = growing. Null for videos < 60 days old.",
};

type SortDir = "asc" | "desc";

const TH_BASE: React.CSSProperties = {
  padding: "10px 14px",
  fontSize: "11px",
  fontWeight: 700,
  letterSpacing: "0.07em",
  color: "var(--text-secondary)",
  whiteSpace: "nowrap",
  borderBottom: "2px solid var(--border)",
  background: "var(--bg-card)",
  position: "sticky",
  top: 0,
  zIndex: 2,
  cursor: "pointer",
  userSelect: "none",
};

const TH_STYLE: React.CSSProperties = { ...TH_BASE, textAlign: "right" };
const TH_LEFT_STYLE: React.CSSProperties = { ...TH_BASE, textAlign: "left", left: 0, zIndex: 3 };

const TD_STYLE: React.CSSProperties = {
  padding: "12px 14px",
  textAlign: "right",
  fontSize: "14px",
  fontWeight: 600,
  color: "#06b6d4",
  whiteSpace: "nowrap",
  borderBottom: "1px solid var(--border)",
};

const TD_LEFT_STYLE: React.CSSProperties = {
  ...TD_STYLE,
  textAlign: "left",
  position: "sticky",
  left: 0,
  background: "var(--bg-card)",
  zIndex: 1,
  maxWidth: "280px",
};

function SortIndicator({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <span style={{ marginLeft: "4px", fontSize: "9px", opacity: active ? 1 : 0.3 }}>
      {active ? (dir === "asc" ? "▲" : "▼") : "▲"}
    </span>
  );
}

function TH({
  label, sortKey, sortCol, sortDir, onSort, style,
}: {
  label: string;
  sortKey: string;
  sortCol: string;
  sortDir: SortDir;
  onSort: (k: string) => void;
  style: React.CSSProperties;
}) {
  const isActive = sortCol === sortKey;
  const isLeft = style.textAlign === "left";
  return (
    <th style={style} onClick={() => onSort(sortKey)}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: "2px", flexDirection: isLeft ? "row" : "row-reverse" }}>
        <HeaderTooltip label={label} tip={TIPS[label] ?? label} />
        <SortIndicator active={isActive} dir={sortDir} />
      </span>
    </th>
  );
}

function ageInDays(publishedAt: string): number {
  return Math.max(1, Math.floor((Date.now() - new Date(publishedAt).getTime()) / 86400000));
}

function avgMonthlyViews(video: VideoWithMetrics): number {
  const age = ageInDays(video.publishedAt);
  return video.totalViews > 0 ? Math.round(video.totalViews / (age / 30)) : 0;
}

function getValue(video: VideoWithMetrics, col: string): string | number {
  switch (col) {
    case "TITLE":        return video.title;
    case "PUBLISHED":    return video.publishedAt;
    case "TYPE":         return video.isShort ? 0 : 1;
    case "CLASS":        return video.derived.classification;
    case "VIEWS":        return video.views;
    case "LIKES":        return video.likes;
    case "COMMENTS":     return video.comments;
    case "SHARES":       return video.shares;
    case "WATCH TIME":   return video.watchTimeHours;
    case "AVG DUR":      return video.avgDurationSec;
    case "SUBS":         return video.subsGained;
    case "AVG VIEW %":   return video.avgViewPercentage ?? -1;
    case "EVENT SCORE":  return video.derived.eventScore ?? -1;
    case "EVERGREEN":    return video.derived.evergreenScore ?? -1;
    case "LAST 30D":     return video.viewsLast28Days ?? -1;
    case "AVG MONTHLY":  return avgMonthlyViews(video);
    case "VIEWS/DAY":    return video.derived.viewsPerDayOfLife;
    case "AGE":          return ageInDays(video.publishedAt);
    case "WEEKLY VEL":   return video.derived.weeklyViewVelocity ?? -1;
    case "MONTHLY VEL":  return video.derived.monthlyViewVelocity ?? -1;
    default:             return 0;
  }
}

export default function VideoCards({ data }: { data?: VideoWithMetrics[] }) {
  const videos = data ?? mockVideos;
  const [sortCol, setSortCol] = useState("VIEWS");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const handleSort = (col: string) => {
    if (col === sortCol) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortDir("desc");
    }
  };

  const sorted = useMemo(() => {
    return [...videos].sort((a, b) => {
      const av = getValue(a, sortCol);
      const bv = getValue(b, sortCol);
      const cmp = typeof av === "string" && typeof bv === "string"
        ? av.localeCompare(bv)
        : (av as number) - (bv as number);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [videos, sortCol, sortDir]);

  const thProps = (label: string, style: React.CSSProperties) => ({
    label, sortKey: label, sortCol, sortDir, onSort: handleSort, style,
  });

  return (
    <div className="card" style={{ overflow: "auto", maxHeight: "70vh" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "auto" }}>
        <thead>
          <tr>
            <TH {...thProps("TITLE", TH_LEFT_STYLE)} />
            <TH {...thProps("PUBLISHED", { ...TH_STYLE, textAlign: "left" })} />
            <TH {...thProps("TYPE", TH_STYLE)} />
            <TH {...thProps("CLASS", TH_STYLE)} />
            <TH {...thProps("VIEWS", TH_STYLE)} />
            <TH {...thProps("LIKES", TH_STYLE)} />
            <TH {...thProps("COMMENTS", TH_STYLE)} />
            <TH {...thProps("SHARES", TH_STYLE)} />
            <TH {...thProps("WATCH TIME", TH_STYLE)} />
            <TH {...thProps("AVG DUR", TH_STYLE)} />
            <TH {...thProps("SUBS", TH_STYLE)} />
            <TH {...thProps("AVG VIEW %", TH_STYLE)} />
            <TH {...thProps("EVENT SCORE", TH_STYLE)} />
            <TH {...thProps("EVERGREEN", TH_STYLE)} />
            <TH {...thProps("LAST 30D", TH_STYLE)} />
            <TH {...thProps("AVG MONTHLY", TH_STYLE)} />
            <TH {...thProps("VIEWS/DAY", TH_STYLE)} />
            <TH {...thProps("AGE", TH_STYLE)} />
            <TH {...thProps("WEEKLY VEL", TH_STYLE)} />
            <TH {...thProps("MONTHLY VEL", TH_STYLE)} />
          </tr>
        </thead>
        <tbody>
          {sorted.map((video, idx) => {
            const cls = CLASSIFICATION_STYLES[video.derived.classification];
            const rowBg = idx % 2 === 0 ? "var(--bg-card)" : "color-mix(in srgb, var(--bg-card) 97%, white)";
            return (
              <tr key={video.id} style={{ background: idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)" }}>
                {/* Title */}
                <td style={{ ...TD_LEFT_STYLE, background: rowBg }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ color: "var(--text-secondary)", fontSize: "12px", minWidth: "18px" }}>{idx + 1}</span>
                    <a
                      href={`https://www.youtube.com/watch?v=${video.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: video.color,
                        fontSize: "13px",
                        fontWeight: 600,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        maxWidth: "240px",
                        display: "block",
                        textDecoration: "none",
                      }}
                      title={video.title}
                    >
                      {video.title}
                    </a>
                  </div>
                </td>

                {/* Published date */}
                <td style={{ ...TD_STYLE, textAlign: "left", color: "var(--text-secondary)", fontSize: "12px" }}>
                  {formatDate(video.publishedAt)}
                </td>

                {/* Type badge */}
                <td style={{ ...TD_STYLE, textAlign: "center" }}>
                  <span style={{
                    fontSize: "11px", fontWeight: 700, padding: "2px 7px", borderRadius: "4px",
                    background: video.isShort ? "#7c3aed22" : "#0e748122",
                    color: video.isShort ? "#a855f7" : "#06b6d4",
                  }}>
                    {video.isShort ? "SHORT" : "VIDEO"}
                  </span>
                </td>

                {/* Classification badge */}
                <td style={{ ...TD_STYLE, textAlign: "center" }}>
                  {video.derived.classification !== "unknown" ? (
                    <span style={{
                      fontSize: "11px", fontWeight: 700, padding: "2px 7px", borderRadius: "4px",
                      background: cls.bg, color: cls.color, whiteSpace: "nowrap",
                    }}>
                      {cls.label}
                    </span>
                  ) : (
                    <span style={{ color: "var(--text-secondary)" }}>—</span>
                  )}
                </td>

                <td style={TD_STYLE}>{video.views.toLocaleString()}</td>
                <td style={TD_STYLE}>{video.likes.toLocaleString()}</td>
                <td style={TD_STYLE}>{video.comments.toLocaleString()}</td>
                <td style={TD_STYLE}>{video.shares.toLocaleString()}</td>
                <td style={TD_STYLE}>{video.watchTimeHours}h</td>
                <td style={TD_STYLE}>{formatDuration(video.avgDurationSec)}</td>
                <td style={TD_STYLE}>{video.subsGained.toLocaleString()}</td>
                <td style={{ ...TD_STYLE, color: video.avgViewPercentage != null ? "#06b6d4" : "var(--text-secondary)" }}>
                  {video.avgViewPercentage != null ? `${video.avgViewPercentage}%` : "—"}
                </td>
                <td style={{ ...TD_STYLE, color: video.derived.eventScore != null ? "#06b6d4" : "var(--text-secondary)" }}>
                  {video.derived.eventScore != null ? `${video.derived.eventScore}%` : "—"}
                </td>
                <td style={{ ...TD_STYLE, color: video.derived.evergreenScore != null ? "#22c55e" : "var(--text-secondary)" }}>
                  {video.derived.evergreenScore != null ? `${video.derived.evergreenScore}` : "—"}
                </td>
                <td style={{ ...TD_STYLE, color: video.viewsLast28Days != null ? "#06b6d4" : "var(--text-secondary)" }}>
                  {video.viewsLast28Days != null ? video.viewsLast28Days.toLocaleString() : "—"}
                </td>
                <td style={TD_STYLE}>{avgMonthlyViews(video).toLocaleString()}</td>
                <td style={TD_STYLE}>{video.derived.viewsPerDayOfLife}</td>
                <td style={{ ...TD_STYLE, color: "var(--text-secondary)" }}>{ageInDays(video.publishedAt)}d</td>
                <td style={TD_STYLE}><VelocityValue value={video.derived.weeklyViewVelocity} /></td>
                <td style={TD_STYLE}><VelocityValue value={video.derived.monthlyViewVelocity} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

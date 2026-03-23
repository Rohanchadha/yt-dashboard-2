"use client";

import { useState } from "react";
import RetentionCurves from "./RetentionCurves";
import RelativeRetention from "./RelativeRetention";

interface Props {
  retentionData?: Record<string, string | number | null>[];
  relativeData?: Record<string, string | number | null>[];
  videoMeta?: { title: string; color: string }[];
  from?: string;
  to?: string;
  channelIndex?: number;
}

export default function RetentionTab({ retentionData, relativeData, videoMeta, from, to, channelIndex = 1 }: Props) {
  const [videoId, setVideoId] = useState("");
  const [lookupData, setLookupData] = useState<{
    retentionData: Record<string, string | number | null>[];
    relativeData: Record<string, string | number | null>[];
    videoMeta: { title: string; color: string }[];
  } | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState("");

  const handleLookup = async () => {
    const id = videoId.trim();
    if (!id) return;
    setLookupLoading(true);
    setLookupError("");
    setLookupData(null);
    try {
      const res = await fetch(
        `/api/youtube/retention/video?videoId=${encodeURIComponent(id)}&from=${from ?? ""}&to=${to ?? ""}&channel=${channelIndex}`
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setLookupError(body.error ?? "Failed to load retention data for this video.");
        return;
      }
      const data = await res.json();
      setLookupData(data);
    } catch {
      setLookupError("Network error. Please try again.");
    } finally {
      setLookupLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* How to read */}
      <div className="card p-5 flex flex-col gap-2">
        <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>How to read this chart</div>
        <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          The <strong>X-axis</strong> shows progress through the video (1% → 100%). The <strong>Y-axis</strong> shows
          the % of viewers still watching at that point. A <strong>flat curve</strong> means strong retention — viewers
          are staying. A <strong>steep drop</strong> means viewers are leaving. Look for sudden dips — these mark moments
          where interest falls off. On the <strong>Relative Retention</strong> chart, 100 = exactly average for
          similar-length YouTube videos; above 100 = better than average.
        </p>
      </div>

      {/* Video ID lookup */}
      <div className="card p-5 flex flex-col gap-4">
        <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Look up a specific video</div>
        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
          Enter a YouTube Video ID (e.g. <span style={{ fontFamily: "monospace" }}>dQw4w9WgXcQ</span>) to view its retention curve for the selected date range.
        </p>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="YouTube Video ID"
            value={videoId}
            onChange={(e) => setVideoId(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLookup()}
            style={{
              background: "var(--bg-page)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
              borderRadius: 6,
              padding: "6px 12px",
              fontSize: 13,
              width: 240,
              outline: "none",
            }}
          />
          <button
            onClick={handleLookup}
            disabled={lookupLoading || !videoId.trim()}
            style={{
              background: lookupLoading || !videoId.trim() ? "var(--bg-page)" : "#ef4444",
              border: `1px solid ${lookupLoading || !videoId.trim() ? "var(--border)" : "#ef4444"}`,
              color: lookupLoading || !videoId.trim() ? "var(--text-secondary)" : "#fff",
              borderRadius: 6,
              padding: "6px 16px",
              fontSize: 13,
              fontWeight: 600,
              cursor: lookupLoading || !videoId.trim() ? "default" : "pointer",
              transition: "all 0.15s",
            }}
          >
            {lookupLoading ? (
              <span className="flex items-center gap-1.5">
                <span className="animate-spin inline-block w-3 h-3 rounded-full border-2 border-current border-t-transparent" />
                Loading…
              </span>
            ) : "Load"}
          </button>
        </div>
        {lookupError && (
          <p className="text-xs" style={{ color: "#ef4444" }}>{lookupError}</p>
        )}
      </div>

      {/* Custom video retention result */}
      {lookupData && (
        <>
          <RetentionCurves data={lookupData.retentionData} videoMeta={lookupData.videoMeta} titleOverride="Custom Video — Audience Retention" />
          <RelativeRetention data={lookupData.relativeData} videoMeta={lookupData.videoMeta} />
        </>
      )}

      {/* Top-videos retention curves */}
      <RetentionCurves data={retentionData} videoMeta={videoMeta} />
      <RelativeRetention data={relativeData} videoMeta={videoMeta} />
    </div>
  );
}

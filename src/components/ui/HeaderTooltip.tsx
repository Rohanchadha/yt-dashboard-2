"use client";

import { useState } from "react";

/**
 * Wraps a header label with a hover tooltip.
 * Uses position:fixed so it is never clipped by overflow:auto/hidden ancestors.
 */
export function HeaderTooltip({ label, tip }: { label: string; tip: string }) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  return (
    <span
      style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: "3px", cursor: "default" }}
      onMouseEnter={(e) => {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        setPos({ x: rect.left + rect.width / 2, y: rect.top });
      }}
      onMouseLeave={() => setPos(null)}
    >
      {label}
      {/* info icon */}
      <svg
        width="11" height="11" viewBox="0 0 16 16" fill="currentColor"
        style={{ opacity: 0.45, flexShrink: 0, marginTop: "1px" }}
        aria-hidden="true"
      >
        <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zm1 12H7V7h2v5zm0-6H7V4h2v2z" />
      </svg>

      {pos && (
        <span
          style={{
            position: "fixed",
            left: pos.x,
            top: pos.y - 8,
            transform: "translateX(-50%) translateY(-100%)",
            background: "#0f172a",
            color: "#cbd5e1",
            fontSize: "11px",
            lineHeight: "1.5",
            fontWeight: 400,
            letterSpacing: 0,
            padding: "6px 10px",
            borderRadius: "6px",
            width: "210px",
            whiteSpace: "normal",
            textAlign: "center",
            pointerEvents: "none",
            zIndex: 9999,
            border: "1px solid #1e293b",
            boxShadow: "0 4px 12px rgba(0,0,0,0.6)",
          }}
        >
          {tip}
        </span>
      )}
    </span>
  );
}

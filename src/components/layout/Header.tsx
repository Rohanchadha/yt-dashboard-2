"use client";

import { Moon, Sun, ChevronDown, Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { channelInfo } from "@/data/mock";

interface HeaderProps {
  from: string;
  to: string;
  onApply: (from: string, to: string) => void;
  channelName?: string;
  channels?: { index: number; name: string; id: string }[];
  channelIndex?: number;
  onChannelChange?: (index: number) => void;
}

export default function Header({ from, to, onApply, channelName, channels = [], channelIndex = 1, onChannelChange }: HeaderProps) {
  const [theme, setTheme] = useState<"dark" | "light">("light");
  const [draftFrom, setDraftFrom] = useState(from);
  const [draftTo, setDraftTo] = useState(to);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [dropdownOpen]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const formatBadge = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
  };

  const isDirty = draftFrom !== from || draftTo !== to;

  const rangeDays =
    draftFrom && draftTo && draftTo >= draftFrom
      ? Math.round((new Date(draftTo).getTime() - new Date(draftFrom).getTime()) / 86400000) + 1
      : 0;
  const rangeError = rangeDays > 60 ? "Date range cannot exceed 60 days." : null;

  const handleApply = () => {
    if (draftFrom && draftTo && draftFrom <= draftTo && !rangeError) {
      onApply(draftFrom, draftTo);
    }
  };

  return (
    <header
      style={{
        background: "var(--bg-card)",
        borderBottom: "1px solid var(--border)",
      }}
      className="px-6 py-3 flex items-center justify-between sticky top-0 z-50"
    >
      {/* Left: Logo + title */}
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Logo" width={40} height={40} style={{ borderRadius: 8, objectFit: "contain" }} />
        <div>
          <div className="font-bold text-base" style={{ color: "var(--text-primary)" }}>
            YouTube Analytics Dashboard
          </div>
          {/* Channel selector */}
          {channels.length > 1 ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((o) => !o)}
                className="flex items-center gap-1 text-xs cursor-pointer"
                style={{ color: "var(--text-secondary)", background: "none", border: "none", padding: 0 }}
              >
                {channelName ?? channelInfo.name}
                <ChevronDown size={12} />
              </button>
              {dropdownOpen && (
                <div
                  className="absolute left-0 top-full mt-1 rounded-lg overflow-hidden z-50"
                  style={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    minWidth: 180,
                    boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
                  }}
                >
                  {channels.map((ch) => (
                    <button
                      key={ch.index}
                      onClick={() => { onChannelChange?.(ch.index); setDropdownOpen(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors"
                      style={{
                        background: ch.index === channelIndex ? "var(--bg-page)" : "transparent",
                        color: "var(--text-primary)",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      <Check size={12} style={{ opacity: ch.index === channelIndex ? 1 : 0 }} color="#ef4444" />
                      {ch.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
              {channelName ?? channelInfo.name}
            </div>
          )}
        </div>
      </div>

      {/* Right: date range + toggle + badge */}
      <div className="flex items-center gap-4">
        {/* Date inputs + apply */}
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
            <span>From:</span>
            <input
              type="date"
              value={draftFrom}
              onChange={(e) => setDraftFrom(e.target.value)}
              style={{
                background: "var(--bg-page)",
                border: `1px solid ${rangeError ? "#ef4444" : "var(--border)"}`,
                color: "var(--text-primary)",
                borderRadius: 6,
                padding: "3px 8px",
                fontSize: 13,
              }}
            />
            <span>To:</span>
            <input
              type="date"
              value={draftTo}
              onChange={(e) => setDraftTo(e.target.value)}
              style={{
                background: "var(--bg-page)",
                border: `1px solid ${rangeError ? "#ef4444" : "var(--border)"}`,
                color: "var(--text-primary)",
                borderRadius: 6,
                padding: "3px 8px",
                fontSize: 13,
              }}
            />
            <button
              onClick={handleApply}
              disabled={!isDirty || !draftFrom || !draftTo || draftFrom > draftTo || !!rangeError}
              style={{
                background: isDirty && !rangeError ? "#ef4444" : "var(--bg-page)",
                border: `1px solid ${isDirty && !rangeError ? "#ef4444" : "var(--border)"}`,
                color: isDirty && !rangeError ? "#fff" : "var(--text-secondary)",
                borderRadius: 6,
                padding: "3px 12px",
                fontSize: 13,
                fontWeight: 600,
                cursor: isDirty && !rangeError ? "pointer" : "default",
                transition: "all 0.15s",
              }}
            >
              Apply
            </button>
          </div>
          {rangeError && (
            <div style={{ fontSize: 12, color: "#ef4444", fontWeight: 500 }}>
              ⚠ {rangeError}
            </div>
          )}
        </div>

        {/* Dark/Light toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          style={{
            background: "var(--bg-page)",
            border: "1px solid var(--border)",
            color: "var(--text-secondary)",
          }}
        >
          {theme === "dark" ? <Moon size={14} /> : <Sun size={14} />}
          <span
            className="w-3 h-3 rounded-full"
            style={{ background: "#ef4444" }}
          />
          <span className="text-sm" style={{ color: "var(--text-primary)" }}>
            {theme === "dark" ? "Dark" : "Light"}
          </span>
        </button>

        {/* Date range badge — shows committed range */}
        <div
          className="text-sm font-semibold px-3 py-1 rounded-lg"
          style={{ background: "#ef444422", color: "#ef4444", border: "1px solid #ef444444" }}
        >
          {formatBadge(from)} – {formatBadge(to)}
        </div>
      </div>
    </header>
  );
}

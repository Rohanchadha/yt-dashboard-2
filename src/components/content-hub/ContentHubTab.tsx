"use client";

import { useState, useEffect } from "react";

type SubTab = "upcoming-events" | "competitor-videos" | "ideas";

interface Event {
  date: string;
  exam: string;
  category: string;
  eventType: string;
}

const events: Event[] = [
  { date: "Anytime", exam: "MAH CET", category: "MBA", eventType: "City intimation/admit card to release" },
  { date: "23-Mar-26", exam: "TSICET", category: "MBA", eventType: "Registration without late fee ends" },
  { date: "24-Mar-26", exam: "TSICET", category: "MBA", eventType: "Registration with late fee starts" },
  { date: "23-Mar-26", exam: "APICET", category: "MBA", eventType: "Registration ends without late fee" },
  { date: "24-Mar-26", exam: "APICET", category: "MBA", eventType: "Registration with late fee starts" },
  { date: "22-Mar-26", exam: "OJEE", category: "MBA", eventType: "Registration last date" },
  { date: "Ongoing", exam: "TANCET", category: "MBA", eventType: "Registration" },
  { date: "Ongoing", exam: "ATMA", category: "MBA", eventType: "Registration" },
  { date: "Ongoing", exam: "SET", category: "BBA", eventType: "Registration" },
  { date: "Mar 21 – Apr 1", exam: "NID", category: "Design", eventType: "Mains Exam M.Des Interview" },
  { date: "25-Mar-26", exam: "MAH HM CET", category: "Hospitality", eventType: "Registration ends" },
  { date: "25-Mar-26", exam: "NCHMCT JEE", category: "Hospitality", eventType: "Registration ends" },
  { date: "24-Mar-26", exam: "AP EAMCET", category: "Engg", eventType: "Last date for registration" },
  { date: "28-Mar-26", exam: "AP EAMCET", category: "Engg", eventType: "Last date for registration with late fee of INR 1000" },
  { date: "1-Apr-26", exam: "AP EAMCET", category: "Engg", eventType: "Last date for registration with late fee of INR 2000" },
  { date: "31-Mar-26", exam: "IPU CET", category: "Engg", eventType: "Last date for registration" },
  { date: "25-Mar-26", exam: "LPU NEST", category: "Engg", eventType: "Last date for registration and slot booking – Current Schedule" },
  { date: "31-Mar-26", exam: "LPU NEST", category: "Engg", eventType: "Exam Last Date – Current Schedule" },
  { date: "20-Mar-26", exam: "COMEDK UGET", category: "Engg", eventType: "Last date for registration" },
  { date: "19-Mar-26", exam: "BITSAT", category: "Engg", eventType: "Last date for registration – Session 1" },
  { date: "March 21 to 22, 2026", exam: "BITSAT", category: "Engg", eventType: "Form Correction – Session 1" },
  { date: "26-Mar-26", exam: "BITSAT", category: "Engg", eventType: "Release of City intimation slip" },
  { date: "March 27 to 31, 2026", exam: "BITSAT", category: "Engg", eventType: "Slot booking – Session 1" },
  { date: "26-Mar-26", exam: "UPESEAT", category: "Engg", eventType: "Last date for registration – Phase 2" },
  { date: "20-Mar-26", exam: "MHT CET", category: "Engg", eventType: "Last date for registration with late fee" },
  { date: "23-Mar-26", exam: "MET", category: "Engg", eventType: "Last date to apply – Phase 1" },
  { date: "March 31 to April 2, 2026", exam: "MET", category: "Engg", eventType: "Slot Booking – Phase 1" },
  { date: "31-Mar-26", exam: "VITEEE", category: "Engg", eventType: "Last date to apply" },
  { date: "March 28 & 29, 2026", exam: "SEE", category: "Engg", eventType: "Exam Dates – Phase 2" },
  { date: "31-Mar-26", exam: "IIITH UGEE", category: "Engg", eventType: "Last date to apply" },
  { date: "2-Apr-26", exam: "JEE Main", category: "Engg", eventType: "Exam Start Date – Session 2" },
  { date: "25-Mar-26", exam: "CUSAT CAT", category: "Engg", eventType: "Last date for registration" },
  { date: "21-Mar-26", exam: "KEAM", category: "Engg", eventType: "Last date for application form correction" },
  { date: "1-Apr-26", exam: "KEAM", category: "Engg", eventType: "Release of admit card" },
  { date: "25-Mar-26", exam: "GITAM GAT", category: "Engg", eventType: "Last date for registration" },
  { date: "29-Mar-26", exam: "GITAM GAT", category: "Engg", eventType: "Exam Date" },
  { date: "29-Mar-26", exam: "GUJCET", category: "Engg", eventType: "Exam Date" },
  { date: "27-Mar-26", exam: "CG PET", category: "Engg", eventType: "Last date for registration" },
  { date: "March 28 to 30, 2026", exam: "CG PET", category: "Engg", eventType: "Correction facility to open" },
  { date: "Anytime Soon", exam: "MHT CET", category: "Engg", eventType: "Release of city intimation slip" },
  { date: "Anytime Soon", exam: "JEE Main", category: "Engg", eventType: "Release of city intimation slip" },
  { date: "Anytime Soon", exam: "VITEEE", category: "Engg", eventType: "Mock Test to release" },
  { date: "Anytime Soon", exam: "MAH MCA CET", category: "IT & Software", eventType: "Release of admit card" },
  { date: "Anytime Soon", exam: "MAH BCA CET", category: "IT & Software", eventType: "Release of admit card" },
  { date: "30-Mar-26", exam: "MAH MCA CET", category: "IT & Software", eventType: "Exam Date" },
  { date: "Anytime Soon", exam: "BIT MCA", category: "IT & Software", eventType: "Release of notification" },
  { date: "30-Mar-26", exam: "NEET MDS", category: "Medicine", eventType: "Last date for application" },
  { date: "Anytime Soon", exam: "INI CET", category: "Medicine", eventType: "Notification and application form release" },
  { date: "1-Apr", exam: "AIIMS Paramedical", category: "Medicine", eventType: "Registration expected to Start" },
  { date: "Anytime Soon", exam: "UP CNET", category: "Nursing", eventType: "Notification and application form release" },
  { date: "16-Mar", exam: "MH Nursing CET", category: "Nursing", eventType: "Registration Ends" },
  { date: "Anytime Soon", exam: "AIIMS Nursing", category: "Nursing", eventType: "Notification and application form release" },
  { date: "23-Mar", exam: "JEST", category: "Science", eventType: "Registration Ends" },
  { date: "26-Mar", exam: "UPES PAT", category: "Science", eventType: "Registration Ends" },
  { date: "27-Mar", exam: "AIFSET", category: "Science", eventType: "Registration Ends" },
  { date: "28-Mar", exam: "AIFSET", category: "Science", eventType: "Exam Date" },
  { date: "30-Mar", exam: "AIFSET", category: "Science", eventType: "Result Date" },
  { date: "13-Apr", exam: "IISER", category: "Science", eventType: "Registration Ends" },
  { date: "Anytime soon", exam: "Pantnagar University Entrance Exam", category: "Science", eventType: "Application to Start" },
  { date: "March anytime soon", exam: "OUAT", category: "Science", eventType: "Registration process starts" },
  { date: "March anytime soon", exam: "UPCATET", category: "Science", eventType: "Registration process starts" },
  { date: "20-Mar-26", exam: "APLAWCET", category: "Law", eventType: "Application Process End" },
  { date: "31-Mar-26", exam: "MHCET Law (5-year)", category: "Law", eventType: "Application process ends" },
  { date: "24-Mar-26", exam: "SLS Noida", category: "Law", eventType: "3rd Merit List" },
  { date: "23-Mar-26", exam: "NLSAT", category: "Law", eventType: "Application Process Ends" },
  { date: "1-Apr-26", exam: "TSLAWCET", category: "Law", eventType: "Application Process Ends" },
  { date: "01-Apr-2026 & 2-Apr-2026", exam: "MHCET Law (3-year LLB)", category: "Law", eventType: "Exam Day" },
  { date: "22-Mar-26", exam: "NMIMS LAT", category: "Law", eventType: "Application Process Ends" },
  { date: "Anytime Soon", exam: "RRB Group D", category: "Railways", eventType: "Result to be released" },
  { date: "March 16 to 27", exam: "RRB NTPC", category: "Railways", eventType: "Exam for Graduate posts (06/2025)" },
  { date: "Anytime Soon", exam: "CSIR NET", category: "Teaching", eventType: "Notification for June session" },
  { date: "Anytime Soon", exam: "CTET", category: "Teaching", eventType: "Result to release" },
  { date: "Anytime Soon", exam: "UGC NET", category: "Teaching", eventType: "Notification for June session" },
  { date: "Anytime Soon", exam: "SSC GD", category: "SSC", eventType: "Exam Date" },
  { date: "Anytime Soon", exam: "SSC CGL", category: "SSC", eventType: "Notification to release" },
  { date: "Anytime Soon", exam: "SSC CGL", category: "SSC", eventType: "Tier 2 Result (2025) to release" },
  { date: "Anytime Soon", exam: "SSC MTS", category: "SSC", eventType: "Notification to release" },
  { date: "Anytime Soon", exam: "NDA", category: "Defence", eventType: "Admit card to release" },
  { date: "Anytime Soon", exam: "SBI PO", category: "Banking", eventType: "Notification to release" },
  { date: "Any time soon", exam: "NIOS", category: "Boards", eventType: "Date sheet expected" },
  { date: "End of March", exam: "Goa HSSC", category: "Boards", eventType: "Result expected" },
  { date: "End of March", exam: "NIOS", category: "Boards", eventType: "Hall ticket expected" },
  { date: "First week of April", exam: "Karnataka 2nd PUC", category: "Boards", eventType: "Result expected soon" },
  { date: "6-Apr", exam: "TS Inter", category: "Boards", eventType: "Result expected soon" },
  { date: "Anytime Soon", exam: "RBSE 10th", category: "Boards", eventType: "Result expected soon" },
  { date: "Anytime Soon", exam: "RBSE 12th", category: "Boards", eventType: "Result expected soon" },
  { date: "Anytime Soon", exam: "BSEB 10th & 12", category: "Boards", eventType: "Result expected soon" },
  { date: "Anytime Soon", exam: "CBSE 10th", category: "Boards", eventType: "Result expected soon" },
  { date: "Anytime Soon", exam: "Assam HSLC", category: "Boards", eventType: "Result expected soon" },
];

const categories = ["All", ...Array.from(new Set(events.map((e) => e.category))).sort()];

const categoryColors: Record<string, string> = {
  MBA: "#6366f1",
  BBA: "#8b5cf6",
  Design: "#ec4899",
  Hospitality: "#f59e0b",
  Engg: "#3b82f6",
  "IT & Software": "#06b6d4",
  Medicine: "#10b981",
  Nursing: "#14b8a6",
  Science: "#84cc16",
  Law: "#f97316",
  Railways: "#a78bfa",
  Teaching: "#fb923c",
  SSC: "#e11d48",
  Defence: "#0ea5e9",
  Banking: "#22c55e",
  Boards: "#94a3b8",
};

function isUrgent(date: string): boolean {
  const lower = date.toLowerCase();
  if (lower.includes("anytime") || lower === "ongoing") return false;
  // Try to parse a simple date
  const match = date.match(/(\d{1,2})-([A-Za-z]{3})-?(\d{2,4})?/);
  if (match) {
    const day = parseInt(match[1]);
    const monthMap: Record<string, number> = {
      Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
      Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
    };
    const month = monthMap[match[2]];
    const year = match[3] ? (match[3].length === 2 ? 2000 + parseInt(match[3]) : parseInt(match[3])) : 2026;
    if (month !== undefined) {
      const eventDate = new Date(year, month, day);
      const now = new Date();
      const diffDays = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays >= 0 && diffDays <= 5;
    }
  }
  return false;
}

function DateBadge({ date }: { date: string }) {
  const urgent = isUrgent(date);
  const lower = date.toLowerCase();
  const isOngoing = lower === "ongoing";
  const isAnytime = lower.includes("anytime") || lower.includes("any time");

  let bg = "var(--bg-page)";
  let color = "var(--text-secondary)";
  let border = "var(--border)";

  if (urgent) { bg = "#ef444422"; color = "#ef4444"; border = "#ef444444"; }
  else if (isOngoing) { bg = "#10b98122"; color = "#10b981"; border = "#10b98144"; }
  else if (isAnytime) { bg = "#f59e0b22"; color = "#f59e0b"; border = "#f59e0b44"; }

  return (
    <span
      className="inline-block px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap"
      style={{ background: bg, color, border: `1px solid ${border}` }}
    >
      {date}
    </span>
  );
}

function CategoryBadge({ category }: { category: string }) {
  const color = categoryColors[category] ?? "#94a3b8";
  return (
    <span
      className="inline-block px-2 py-0.5 rounded text-xs font-semibold"
      style={{ background: `${color}22`, color, border: `1px solid ${color}44` }}
    >
      {category}
    </span>
  );
}

function UpcomingEventsTab() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");

  const filtered = events.filter((e) => {
    const matchCat = activeCategory === "All" || e.category === activeCategory;
    const matchSearch =
      search === "" ||
      e.exam.toLowerCase().includes(search.toLowerCase()) ||
      e.eventType.toLowerCase().includes(search.toLowerCase()) ||
      e.category.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Filters */}
      <div className="flex flex-col gap-3">
        <input
          type="text"
          placeholder="Search exam, category, or event type..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm px-3 py-2 rounded-lg text-sm outline-none"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            color: "var(--text-primary)",
          }}
        />
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className="px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer"
              style={
                activeCategory === cat
                  ? {
                      background: cat === "All" ? "#ef4444" : categoryColors[cat] ?? "#ef4444",
                      color: "#fff",
                      border: "1px solid transparent",
                    }
                  : {
                      background: "var(--bg-card)",
                      color: "var(--text-secondary)",
                      border: "1px solid var(--border)",
                    }
              }
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs" style={{ color: "var(--text-secondary)" }}>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: "#ef4444" }} />
          Due within 5 days
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: "#10b981" }} />
          Ongoing
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: "#f59e0b" }} />
          Anytime Soon
        </span>
      </div>

      {/* Table */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: "1px solid var(--border)" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border)" }}>
                {["Event Date", "Exam", "Category", "Event Type"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm" style={{ color: "var(--text-secondary)" }}>
                    No events match your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((event, i) => (
                  <tr
                    key={i}
                    style={{
                      borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none",
                      background: i % 2 === 0 ? "var(--bg-page)" : "var(--bg-card)",
                    }}
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <DateBadge date={event.date} />
                    </td>
                    <td className="px-4 py-3 font-medium" style={{ color: "var(--text-primary)" }}>
                      {event.exam}
                    </td>
                    <td className="px-4 py-3">
                      <CategoryBadge category={event.category} />
                    </td>
                    <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>
                      {event.eventType}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div
          className="px-4 py-2 text-xs"
          style={{ borderTop: "1px solid var(--border)", color: "var(--text-secondary)", background: "var(--bg-card)" }}
        >
          Showing {filtered.length} of {events.length} events
        </div>
      </div>
    </div>
  );
}

interface CompetitorVideo {
  videoId: string;
  title: string;
  publishedAt: string;
  thumbnail: string;
  views: number;
  likes: number;
  url: string;
}

interface CompetitorChannel {
  handle: string;
  channelId: string;
  channelName: string;
  thumbnail: string;
  channelUrl: string;
  videos: CompetitorVideo[];
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function CompetitorVideosTab() {
  const [channels, setChannels] = useState<CompetitorChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeHandle, setActiveHandle] = useState<string>("All");
  const [tooltipVisible, setTooltipVisible] = useState(false);

  useEffect(() => {
    fetch("/api/youtube/competitor-videos")
      .then((r) => {
        if (r.status === 401) throw new Error("not_configured");
        if (!r.ok) throw new Error("fetch_failed");
        return r.json();
      })
      .then((d) => setChannels(d.channels ?? []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-12 justify-center text-sm" style={{ color: "var(--text-secondary)" }}>
        <span className="animate-spin inline-block w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent" />
        Loading competitor videos…
      </div>
    );
  }

  if (error === "not_configured") {
    return (
      <div className="py-12 flex flex-col items-center gap-3 text-sm" style={{ color: "var(--text-secondary)" }}>
        <span className="text-2xl">🔌</span>
        <span>YouTube not connected — <a href="/setup" className="underline" style={{ color: "#ef4444" }}>Connect your channel</a> to see competitor videos.</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center text-sm" style={{ color: "var(--text-secondary)" }}>
        Failed to load competitor videos. Please try again.
      </div>
    );
  }

  const visibleChannels = activeHandle === "All" ? channels : channels.filter((c) => c.handle === activeHandle);
  const totalVideos = visibleChannels.reduce((sum, c) => sum + c.videos.length, 0);

  return (
    <div className="flex flex-col gap-5">
      {/* Channel filter pills + tooltip */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveHandle("All")}
            className="px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer"
            style={
              activeHandle === "All"
                ? { background: "#ef4444", color: "#fff", border: "1px solid transparent" }
                : { background: "var(--bg-card)", color: "var(--text-secondary)", border: "1px solid var(--border)" }
            }
          >
            All
          </button>
          {channels.map((channel) => (
            <button
              key={channel.handle}
              onClick={() => setActiveHandle(channel.handle)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer"
              style={
                activeHandle === channel.handle
                  ? { background: "#ef4444", color: "#fff", border: "1px solid transparent" }
                  : { background: "var(--bg-card)", color: "var(--text-secondary)", border: "1px solid var(--border)" }
              }
            >
              {channel.thumbnail && (
                <img src={channel.thumbnail} alt="" className="w-4 h-4 rounded-full" />
              )}
              {channel.channelName}
            </button>
          ))}
        </div>

        {/* Info tooltip */}
        <div className="relative ml-auto" onMouseEnter={() => setTooltipVisible(true)} onMouseLeave={() => setTooltipVisible(false)}>
          <span
            className="flex items-center justify-center w-4 h-4 rounded-full text-xs font-bold cursor-default select-none"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
          >
            i
          </span>
          {tooltipVisible && (
            <div
              className="absolute right-0 top-6 z-10 w-52 rounded-lg px-3 py-2 text-xs shadow-lg"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
            >
              Shows videos published by competitor channels in the <strong style={{ color: "var(--text-primary)" }}>last 7 days</strong>.
            </div>
          )}
        </div>
      </div>

      {/* Summary line */}
      <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
        {totalVideos} video{totalVideos !== 1 ? "s" : ""} in the last 7 days
        {activeHandle !== "All" && ` from ${visibleChannels[0]?.channelName ?? activeHandle}`}
      </div>

      {visibleChannels.map((channel) => (
        <div key={channel.handle} className="flex flex-col gap-3">
          {/* Channel header — only shown when "All" is selected */}
          {activeHandle === "All" && (
          <div className="flex items-center gap-3">
            {channel.thumbnail ? (
              <img src={channel.thumbnail} alt={channel.channelName} className="w-7 h-7 rounded-full" />
            ) : (
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ background: "#ef4444" }}
              >
                {channel.channelName.charAt(0)}
              </div>
            )}
            <a
              href={channel.channelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold hover:underline"
              style={{ color: "var(--text-primary)" }}
            >
              {channel.channelName}
            </a>
            <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
              {channel.videos.length} video{channel.videos.length !== 1 ? "s" : ""} this week
            </span>
          </div>
          )}

          {channel.videos.length === 0 ? (
            <div
              className="rounded-lg px-4 py-6 text-center text-sm"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
            >
              No videos published in the last 7 days
            </div>
          ) : (
            <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
              {channel.videos.map((video) => (
                <a
                  key={video.videoId}
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col rounded-xl overflow-hidden transition-opacity hover:opacity-80"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
                >
                  {video.thumbnail ? (
                    <img src={video.thumbnail} alt={video.title} className="w-full aspect-video object-cover" />
                  ) : (
                    <div className="w-full aspect-video flex items-center justify-center" style={{ background: "var(--bg-page)" }}>
                      <span style={{ color: "var(--text-secondary)" }}>▶</span>
                    </div>
                  )}
                  <div className="p-3 flex flex-col gap-2">
                    <div className="text-sm font-medium leading-snug line-clamp-2" style={{ color: "var(--text-primary)" }}>
                      {video.title}
                    </div>
                    <div className="flex items-center gap-3 text-xs" style={{ color: "var(--text-secondary)" }}>
                      <span>{video.views.toLocaleString()} views</span>
                      <span>{video.likes.toLocaleString()} likes</span>
                      <span className="ml-auto">{timeAgo(video.publishedAt)}</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function IdeasTab() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
      >
        💡
      </div>
      <div className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
        Coming Soon
      </div>
      <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
        Video ideas and brainstorming tools will appear here.
      </div>
    </div>
  );
}

const subTabs: { id: SubTab; label: string }[] = [
  { id: "upcoming-events", label: "Upcoming Events" },
  { id: "competitor-videos", label: "Competitor Videos" },
  { id: "ideas", label: "Video Ideas" },
];

export default function ContentHubTab() {
  const [subTab, setSubTab] = useState<SubTab>("upcoming-events");

  return (
    <div className="flex flex-col gap-5">
      {/* Sub-tab navigation */}
      <div className="flex gap-1 p-1 rounded-lg w-fit" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        {subTabs.map((st) => (
          <button
            key={st.id}
            onClick={() => setSubTab(st.id)}
            className="px-4 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer"
            style={
              subTab === st.id
                ? { background: "#ef4444", color: "#fff" }
                : { background: "transparent", color: "var(--text-secondary)" }
            }
          >
            {st.label}
          </button>
        ))}
      </div>

      {subTab === "upcoming-events" && <UpcomingEventsTab />}
      {subTab === "competitor-videos" && <CompetitorVideosTab />}
      {subTab === "ideas" && <IdeasTab />}
    </div>
  );
}

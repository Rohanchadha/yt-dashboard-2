"use client";

export type Tab = "overview" | "video-performance" | "traffic-sources" | "audience" | "retention" | "key-insights" | "glossary" | "content-hub";

const tabs: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "video-performance", label: "Video Performance" },
  { id: "traffic-sources", label: "Traffic Sources" },
  { id: "audience", label: "Audience" },
  { id: "retention", label: "Retention" },
  { id: "key-insights", label: "Key Insights" },
  { id: "content-hub", label: "Content Hub" },
  { id: "glossary", label: "Glossary" },
];

interface TabNavProps {
  active: Tab;
  onChange: (tab: Tab) => void;
}

export default function TabNav({ active, onChange }: TabNavProps) {
  return (
    <nav
      className="flex gap-6 px-6 border-b"
      style={{ borderColor: "var(--border)", background: "var(--bg-card)" }}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className="py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer"
            style={{
              borderColor: isActive ? "#ef4444" : "transparent",
              color: isActive ? "#ef4444" : "var(--text-secondary)",
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}

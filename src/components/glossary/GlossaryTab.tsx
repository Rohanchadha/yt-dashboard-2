interface GlossaryTerm {
  term: string;
  description: string;
  formula?: string;
}

interface GlossaryGroup {
  group: string;
  terms: GlossaryTerm[];
}

const GLOSSARY: GlossaryGroup[] = [
  {
    group: "Viewing Metrics",
    terms: [
      { term: "Views", description: "Total number of times a video was played for at least a few seconds." },
      { term: "Watch Time", description: "Total hours watched by all viewers across the selected period.", formula: "Σ view_duration" },
      { term: "Avg View Duration", description: "Average amount of time each viewer spent watching before leaving.", formula: "Watch Time / Views" },
      { term: "Avg View %", description: "Average percentage of each video that viewers watched, as reported by YouTube." },
    ],
  },
  {
    group: "Growth Metrics",
    terms: [
      { term: "Net Subscribers", description: "Total new subscribers gained minus subscribers lost in the period.", formula: "Gained − Lost" },
      { term: "Subscriber Conversion Rate", description: "Percentage of viewers who subscribed after watching.", formula: "Net Subscribers / Views × 100" },
    ],
  },
  {
    group: "Velocity & Lifecycle",
    terms: [
      { term: "Event Score", description: "Percentage of a video's lifetime views that came in the first 3 days. High = viral/topical burst. Only calculated for videos 7+ days old.", formula: "First-3-day Views / Lifetime Views × 100" },
      { term: "Evergreen Score (Monthly Retention Ratio)", description: "How close the last 30 days of views are to the video's average monthly pace over its entire lifetime. 100 = exactly on historical average. Only calculated for videos 90+ days old, so the baseline is not skewed by the launch spike.", formula: "Last-30d Views / (Lifetime Views ÷ Age-in-Months) × 100" },
      { term: "Weekly View Velocity", description: "How views in the last 7 days compare to the prior 7 days. Above 1× = growing week-over-week. Only calculated for videos older than 15 days.", formula: "Last 7d Views / Prior 7d Views" },
      { term: "Monthly View Velocity", description: "How views in the last 30 days compare to the prior 30 days. Only calculated for videos 60+ days old so a full prior-month window exists.", formula: "Last 30d Views / Prior 30d Views" },
      { term: "Views per Day of Life", description: "Average daily views over the video's entire lifetime on YouTube.", formula: "Lifetime Views / Days Since Publish" },
    ],
  },
  {
    group: "Video Classification",
    terms: [
      { term: "TOO NEW", description: "Published less than 7 days ago. Not enough data to classify — check back after a week.", formula: "Age < 7 days" },
      { term: "EVENT", description: "Most of the video's lifetime views came in the first 3 days — typically news, trends, or viral content. Evaluated after TOO NEW check.", formula: "Event Score > 70%" },
      { term: "EVERGREEN", description: "The video is still pulling views at ≥70% of its average monthly pace, 90+ days after publishing. Tutorials, how-tos, and timeless topics typically land here.", formula: "Age ≥ 90d  AND  Evergreen Score ≥ 70" },
      { term: "SLOW BURN", description: "Views are growing week-over-week — the algorithm is gradually picking it up. Evaluated after EVENT and EVERGREEN.", formula: "Weekly Velocity ≥ 1.2×" },
      { term: "UNDERPERFORMER", description: "Low daily velocity and no week-over-week growth — the video is not getting meaningful traction.", formula: "Views/Day < 5  AND  Weekly Velocity < 1.2×" },
    ],
  },
  {
    group: "Retention",
    terms: [
      { term: "Audience Retention Curve", description: "Shows the percentage of viewers still watching at each point in the video. A flat line = strong retention; a steep drop = viewers leaving." },
      { term: "Relative Retention", description: "Compares your video's retention to YouTube's average for similar-length videos. 100 = exactly average; above 100 = better than average." },
      { term: "YouTube Average (baseline)", description: "Set to 65 in this dashboard as an approximate mid-tier benchmark for comparison on the relative retention chart." },
    ],
  },
  {
    group: "Traffic Sources",
    terms: [
      { term: "YouTube Search", description: "Viewers who found the video by searching on YouTube." },
      { term: "External URL", description: "Viewers who came from outside YouTube — websites, apps, social media links." },
      { term: "Subscriber", description: "Viewers who found the video through their subscription feed or homepage because they already subscribe." },
      { term: "Shorts Feed", description: "Views driven by YouTube's Shorts vertical feed algorithm." },
      { term: "Channel Page", description: "Viewers who navigated directly to the channel page and clicked a video." },
      { term: "Notification", description: "Viewers who tapped a YouTube bell notification." },
      { term: "Playlist", description: "Views that came from a playlist where the video was included." },
    ],
  },
];

export default function GlossaryTab() {
  return (
    <div className="flex flex-col gap-8">
      <div className="card p-5">
        <h3 className="text-base font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Glossary</h3>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Plain-English definitions and formulas for every metric and term used in this dashboard.
        </p>
      </div>

      {GLOSSARY.map((section) => (
        <div key={section.group} className="flex flex-col gap-3">
          <h4 className="text-xs font-bold tracking-widest uppercase px-1" style={{ color: "var(--text-secondary)" }}>
            {section.group}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {section.terms.map((item) => (
              <div key={item.term} className="card p-4 flex flex-col gap-2">
                <div className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{item.term}</div>
                <div className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>{item.description}</div>
                {item.formula && (
                  <div
                    className="text-xs font-mono px-2 py-1 rounded mt-1 self-start"
                    style={{ background: "var(--bg-page)", border: "1px solid var(--border)", color: "#ef4444" }}
                  >
                    {item.formula}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

# YouTube Analytics Dashboard

A self-hosted YouTube analytics dashboard built with Next.js that pulls real data from your channel via the YouTube Data API v3 and YouTube Analytics API v2. Covers channel overview, video performance, traffic sources, audience demographics, retention curves, and auto-derived key insights.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| Charts | Recharts 3 |
| YouTube APIs | googleapis 171 (`youtube` v3 + `youtubeAnalytics` v2) |
| Auth | Google OAuth 2.0 (offline refresh token) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A Google account that owns the YouTube channel you want to analyse
- A Google Cloud project (free tier is fine)

### Installation

```bash
npm install
```

### Environment Variables

Create `.env.local` in the project root:

```env
YOUTUBE_CLIENT_ID=your_oauth_client_id
YOUTUBE_CLIENT_SECRET=your_oauth_client_secret
YOUTUBE_REFRESH_TOKEN=your_refresh_token   # obtained during setup — see below
```

### Run the Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). If `YOUTUBE_REFRESH_TOKEN` is not yet set, the dashboard loads with mock data and a yellow warning banner. Follow the setup flow below to connect your channel.

---

## Authentication Setup

### Step 1 — Google Cloud Project

1. Go to [console.cloud.google.com](https://console.cloud.google.com) and create (or select) a project.
2. Enable both APIs in **APIs & Services → Library**:
   - **YouTube Data API v3**
   - **YouTube Analytics API**

### Step 2 — OAuth 2.0 Credentials

1. Go to **APIs & Services → Credentials → Create Credentials → OAuth client ID**.
2. Choose **Web application** as the application type.
3. Under **Authorised redirect URIs**, add:
   ```
   http://localhost:3000/api/auth/youtube/callback
   ```
4. Copy the **Client ID** and **Client Secret** into `.env.local`.

### Step 3 — Connect Your Channel

1. Start the dev server and visit [http://localhost:3000/setup](http://localhost:3000/setup).
2. Click **Connect YouTube Channel**. This calls `GET /api/auth/youtube`, which builds a Google OAuth URL with:
   - `access_type: "offline"` — so Google issues a refresh token
   - `prompt: "consent"` — forces the consent screen even on repeat visits
   - **Scopes:**
     - `https://www.googleapis.com/auth/youtube.readonly`
     - `https://www.googleapis.com/auth/yt-analytics.readonly`
3. You are redirected to Google's consent screen. Approve access.
4. Google redirects to `GET /api/auth/youtube/callback?code=...`. The route exchanges the code for tokens (`auth.getToken(code)`) and displays the refresh token on screen.
5. Copy the refresh token and add it to `.env.local` as `YOUTUBE_REFRESH_TOKEN`.
6. Restart the dev server. The dashboard now fetches live data.

### How the App Checks Auth

Every API route calls `isConfigured()` from [src/lib/youtube-client.ts](src/lib/youtube-client.ts) before doing anything:

```ts
// Returns true only when all three env vars are present
!!(YOUTUBE_CLIENT_ID && YOUTUBE_CLIENT_SECRET && YOUTUBE_REFRESH_TOKEN)
```

If this returns `false`, the route immediately returns `HTTP 401 { error: "not_configured" }`. The dashboard detects any 401 and falls back to mock data automatically.

---

## Architecture

```
src/
├── app/
│   ├── page.tsx              # Main dashboard — client component, tabbed layout
│   ├── layout.tsx            # Root layout with metadata
│   ├── globals.css           # Tailwind + CSS custom properties (theme vars)
│   ├── setup/
│   │   └── page.tsx          # 5-step setup wizard (server component)
│   └── api/
│       ├── auth/youtube/
│       │   ├── route.ts      # GET — generate OAuth URL & redirect
│       │   └── callback/
│       │       └── route.ts  # GET — exchange code for tokens, display refresh token
│       └── youtube/
│           ├── overview/route.ts
│           ├── videos/
│           │   ├── route.ts          # Top videos by views in selected period
│           │   ├── created/route.ts  # Videos published within selected period
│           │   └── trending/route.ts # Currently active videos ranked by 48h velocity
│           ├── traffic/route.ts
│           ├── audience/route.ts
│           ├── retention/route.ts
│           ├── active-years/route.ts # Years with non-zero views (2016–present)
│           └── debug/route.ts        # Multi-step connectivity diagnostic
├── components/
│   ├── layout/
│   │   ├── Header.tsx
│   │   └── TabNav.tsx
│   ├── ui/
│   │   └── HeaderTooltip.tsx
│   ├── overview/             # OverviewTab, SummaryCards, DailyViewsChart, WatchTimeChart, ...
│   ├── video-performance/    # VideoPerformanceTab, VideoCard, ViewsByVideoDonut,
│   │                         # EngagementComparison, CreatedInPeriodList, TrendingVideoList
│   ├── traffic-sources/      # TrafficSourcesTab, TrafficDonut, TrafficTable, DailyTrafficChart
│   ├── audience/             # AudienceTab, AudienceDonut, SubscriberVsNonChart
│   ├── retention/            # RetentionTab, RetentionCurves, RelativeRetention
│   └── key-insights/
│       └── KeyInsights.tsx
├── lib/
│   ├── youtube-client.ts     # OAuth2 client factory, isConfigured(), API client exports
│   └── video-metrics.ts      # Shared utilities: parseDurationSec, indexByVideoId,
│                             # offsetDate, computeDerived, classify
├── types/
│   └── dashboard.ts          # All TypeScript interfaces
└── data/
    └── mock.ts               # Fallback mock data (shown when not authenticated)
```

**Data flow:**
```
Browser (page.tsx)
  → fetch /api/youtube/{endpoint}?from=&to=   ×5 in parallel
  → route checks isConfigured()
  → getAuthenticatedClient() sets refresh token on OAuth2 client
  → googleapis calls YouTube Data API v3 / YouTube Analytics API v2
  → transformed JSON returned to browser
  → React state updated → charts re-render
```

---

## YouTube API Data Fetching

All analytics endpoints accept `from` and `to` query parameters (ISO date strings, e.g. `2026-02-23`). The main dashboard page validates these before calling any endpoint:

```ts
if (!f || !t || f > t) return   // abort if range is invalid
```

The default date range on load is **days −14 to −7** relative to today (a one-week window ending one week ago, to ensure YouTube Analytics processing is complete).

---

### `GET /api/youtube/overview`

**Source file:** [src/app/api/youtube/overview/route.ts](src/app/api/youtube/overview/route.ts)

**API calls made (in order):**

1. **`youtube.channels.list`** — fetches the authenticated channel's ID and display name
   ```ts
   { part: ["id", "snippet"], mine: true }
   ```

2. **`youtubeAnalytics.reports.query`** — aggregate totals for the date range
   - `dimensions`: _(none — single aggregate row)_
   - `metrics`: `views, estimatedMinutesWatched, averageViewDuration, likes, shares, subscribersGained, subscribersLost`

3. **`youtubeAnalytics.reports.query`** — daily breakdown
   - Same metrics as above
   - `dimensions`: `day`

**Transformations applied:**
- Watch time: minutes → hours (`minutes / 60`)
- Engaged views: `Math.round(totalViews * 0.35)` (35% of views treated as engaged)
- Like rate: `Math.round((likes / totalViews) * 1000) / 10` → percentage to 1 decimal place

**Response shape:**
```ts
{ channelName: string, summary: SummaryMetrics, daily: DailyPoint[] }
```

---

### `GET /api/youtube/videos`

**Source file:** [src/app/api/youtube/videos/route.ts](src/app/api/youtube/videos/route.ts)

Returns the top 10 videos by views in the selected date range.

**API calls made:**

1. **`youtube.channels.list`** — get channel ID
2. **`youtubeAnalytics.reports.query`** — per-video metrics
   - `dimensions`: `video`
   - `metrics`: `views, estimatedMinutesWatched, averageViewDuration, likes, comments, shares, subscribersGained`
   - `sort`: `-views` (highest views first)
   - `maxResults`: `10`
3. **`youtube.videos.list`** — fetch human-readable titles for the returned video IDs

**Response shape:**
```ts
{ videos: VideoWithMetrics[] }
```

---

### `GET /api/youtube/videos/created`

**Source file:** [src/app/api/youtube/videos/created/route.ts](src/app/api/youtube/videos/created/route.ts)

Returns all videos **published** within the selected date range, with full deep analytics.

**API calls made:**

1. **`youtube.channels.list`** — get channel ID and `uploads` playlist ID
2. **`youtube.playlistItems.list`** (paginated) — walk uploads playlist newest-first, collecting video IDs with `publishedAt` inside the date window; stops as soon as a video older than `from` is found
3. **`youtube.videos.list`** (chunked in batches of 50) — snippet, contentDetails, statistics per video
4. **Eight `youtubeAnalytics.reports.query` calls in `Promise.all`:**
   - Core period metrics (`views, watchMins, avgDur, likes, comments, shares, subsGained`)
   - Extended metrics (`impressions, impressionClickThroughRate, averageViewPercentage`) — guarded via `safeQuery`; skipped silently if unavailable
   - Fixed-window velocity: last 7d views, prior 7d views, last 30d views, prior 30d views
   - Last 48h views
   - Daily per-video breakdown (for first-3-days event score calculation)

**Computed per video (via `computeDerived`):**
- `eventScore` — % of lifetime views in first 3 days after publish
- `evergreenScore` — % of lifetime views in last 30 days (only for videos ≥ 45 days old)
- `weeklyViewVelocity` — last7d / prior7d views ratio
- `monthlyViewVelocity` — last30d / prior30d views ratio
- `ctrEfficiency` — video CTR / mean CTR of the fetched batch
- `viewsPerDayOfLife` — total lifetime views / days since publish
- `classification` — `event_video | evergreen | slow_burn | underperformer | too_new | unknown`

**Response shape:**
```ts
{ videos: VideoWithMetrics[] }   // sorted newest-first
```

---

### `GET /api/youtube/videos/trending`

**Source file:** [src/app/api/youtube/videos/trending/route.ts](src/app/api/youtube/videos/trending/route.ts)

Returns currently active videos ranked by 48h view velocity. Does not accept `from`/`to` parameters — always uses fixed windows relative to today. YouTube Analytics has a ~2 day processing delay, so both windows are shifted back by 2 days: `last48h = days −4 to −3`, `prior48h = days −6 to −5`.

**API calls made:**

1. **`youtubeAnalytics.reports.query`** — top 25 videos by views in `last48h` window
2. **`youtubeAnalytics.reports.query`** — top 25 videos by views in `prior48h` window
3. **`youtube.videos.list`** — metadata for the union of video IDs
4. **Four more analytics calls in parallel:** last 7d, prior 7d, last 30d, prior 30d views (for `computeDerived`)

**Velocity formula:**
```ts
velocity = viewsLast48h / Math.max(viewsLast48hPrior, 1)
```

**Response shape:**
```ts
{ trending: TrendingVideo[] }   // sorted by viewsLast48h descending
```

---

### `GET /api/youtube/traffic`

**Source file:** [src/app/api/youtube/traffic/route.ts](src/app/api/youtube/traffic/route.ts)

**API calls made:**

1. **`youtube.channels.list`** — get channel ID
2. **`youtubeAnalytics.reports.query`** — traffic source totals
   - `dimensions`: `insightTrafficSourceType`
   - `metrics`: `views, estimatedMinutesWatched`
   - `sort`: `-views`
3. **`youtubeAnalytics.reports.query`** — daily traffic by source
   - `dimensions`: `day,insightTrafficSourceType`
   - Same metrics

**Source type mapping** (`SOURCE_LABELS`):

| YouTube API value | Display label |
|---|---|
| `YT_SEARCH` | YouTube Search |
| `EXT_URL` | External URL |
| `SHORTS` | Shorts Feed |
| `YT_CHANNEL` | Channel Page |
| `SUBSCRIBER` | Subscriber |
| `RELATED_VIDEO` | Suggested Video |
| `NO_LINK_OTHER` | Other |

**Response shape:**
```ts
{ sources: TrafficSource[], dailyTraffic: Record<string, string | number>[] }
```

---

### `GET /api/youtube/audience`

**Source file:** [src/app/api/youtube/audience/route.ts](src/app/api/youtube/audience/route.ts)

**API calls made (all 4 in parallel via `Promise.all`):**

1. **Country breakdown** — `dimensions: "country"`, `maxResults: 10`, metric: `views`
2. **Device breakdown** — `dimensions: "deviceType"`, metric: `views`
3. **OS breakdown** — `dimensions: "operatingSystem"`, `maxResults: 12`, metric: `views`
4. **Subscriber vs non-subscriber** — `dimensions: "subscribedStatus"`, metrics: `views, estimatedMinutesWatched`

**Response shape:**
```ts
{ countries: AudienceSegment[], devices: AudienceSegment[], operatingSystems: AudienceSegment[], subscriberVsNon: SubscriberComparison[] }
```

---

### `GET /api/youtube/retention`

**Source file:** [src/app/api/youtube/retention/route.ts](src/app/api/youtube/retention/route.ts)

**API calls made:**

1. **`youtubeAnalytics.reports.query`** — top 5 videos by views for the date range
2. **`youtube.videos.list`** — fetch titles for those 5 video IDs
3. **Per-video retention queries** — one `youtubeAnalytics.reports.query` per video, all in `Promise.all`:
   - `dimensions`: `elapsedVideoTimeRatio`
   - `metrics`: `audienceWatchRatio, relativeRetentionPerformance`
   - `filters`: `video=={videoId}`
   - Errors silently caught so a single video failure does not break the tab

**Response shape:**
```ts
{ retentionData: RetentionPoint[], relativeData: RetentionPoint[], videoMeta: VideoMeta[] }
```

---

### `GET /api/youtube/active-years`

**Source file:** [src/app/api/youtube/active-years/route.ts](src/app/api/youtube/active-years/route.ts)

Probes each year from 2016 to the current year and returns those with at least one view. Called automatically by the dashboard when the selected date range returns zero views, to populate "jump to a year with data" buttons.

**Response shape:**
```ts
{ activeYears: { year: number; views: number }[] }
```

---

### `GET /api/youtube/debug`

**Source file:** [src/app/api/youtube/debug/route.ts](src/app/api/youtube/debug/route.ts)

Multi-step connectivity diagnostic — useful for troubleshooting auth issues. Always returns HTTP 200 with a JSON object containing a result for each step:

| Step | What it checks |
|---|---|
| `step1_config` | Presence of the three env vars |
| `step2_accessToken` | Whether a valid access token can be obtained |
| `step3_channel` | Channel ID, name, subscriber count, video count |
| `step4_analytics_last365` | Aggregate views for the last 365 days |
| `step5_analytics_last28days` | Daily views for the last 28 days (first 5 rows) |
| `step6_views_by_year` | Per-year view counts 2018–2026 with suggested date ranges |

---

## Shared Utilities — `src/lib/video-metrics.ts`

| Export | Purpose |
|---|---|
| `parseDurationSec(iso)` | Converts ISO 8601 duration strings (e.g. `"PT1M30S"`) to total seconds |
| `indexByVideoId(rows, col?)` | Builds a `videoId → number` map from a YouTube Analytics rows array |
| `offsetDate(base, days)` | Returns an ISO date string offset by N days from a given `Date` |
| `computeDerived(params)` | Computes all `DerivedMetrics` fields (scores, velocities, classification) from raw inputs |
| `classify(metrics)` | Maps computed metrics to a `VideoClassification` enum value |

---

## Data Storage

There is no database. All data lives in React state on the main dashboard page ([src/app/page.tsx](src/app/page.tsx)):

```ts
const [data, setData] = useState<Partial<DashboardData> | null>(null)
```

On mount (and whenever the date range changes), the page fetches all 5 core endpoints in parallel:

```ts
const [overviewRes, videosRes, trafficRes, audienceRes, retentionRes] = await Promise.all([
  fetch(`/api/youtube/overview?from=${f}&to=${t}`),
  fetch(`/api/youtube/videos?from=${f}&to=${t}`),
  fetch(`/api/youtube/traffic?from=${f}&to=${t}`),
  fetch(`/api/youtube/audience?from=${f}&to=${t}`),
  fetch(`/api/youtube/retention?from=${f}&to=${t}`),
])
```

If any endpoint returns 401, `configured` is set to `false` and mock data from [src/data/mock.ts](src/data/mock.ts) is used instead.

The Video Performance sub-tabs ("Created in Period" and "Trending") fetch their own endpoints lazily on first activation.

---

## Dashboard Display

### Pages

| Route | File | Type |
|---|---|---|
| `/` | [src/app/page.tsx](src/app/page.tsx) | Client component |
| `/setup` | [src/app/setup/page.tsx](src/app/setup/page.tsx) | Server component |

### Layout Components

**[Header.tsx](src/components/layout/Header.tsx)**
- Displays channel name (from API, or mock name if not configured)
- Date range `from` / `to` inputs (drives all data fetches)
- Dark / light theme toggle (sets `data-theme` attribute on `<html>`)

**[TabNav.tsx](src/components/layout/TabNav.tsx)**
- Six tabs: Overview, Video Performance, Traffic Sources, Audience, Retention, Key Insights
- Active tab highlighted in red (`#ef4444`)

### Tab Components

#### Overview
| Component | Chart type | Data shown |
|---|---|---|
| `SummaryCards` | KPI cards (×6) | Total Views, Watch Time, Avg Duration, Net Subscribers, Likes, Shares |
| `DailyViewsChart` | Grouped bar | Views (red) vs Engaged (cyan) per day |
| `WatchTimeChart` | Area | Watch time in hours, gradient fill |
| `SubscribersChart` | Stacked bar | Gained (green) vs Lost (red) per day |
| `AvgDurationChart` | Line | Average view duration in seconds per day |

#### Video Performance

Has three sub-tabs:

**Top Videos** (default)
| Component | Chart type | Data shown |
|---|---|---|
| `VideoCard` | Metrics grid | Per-video: views, engaged, likes, comments, shares, watch time, avg duration, view share %, subs gained, impressions, CTR, avg view % |
| `ViewsByVideoDonut` | Pie / donut | Views distribution across top 10 videos |
| `EngagementComparison` | Grouped bar | Likes, Shares, Subs Gained compared across videos |

**Created in Period** — videos published within the selected date range, fetched lazily from `/api/youtube/videos/created`
| Component | Data shown |
|---|---|
| `CreatedInPeriodList` | Per-video card with deep analytics and `VideoClassification` badge |

**Trending** — currently active videos, fetched lazily from `/api/youtube/videos/trending`
| Component | Data shown |
|---|---|
| `TrendingVideoList` | Per-video card with 48h views, velocity ratio, and `VideoClassification` badge |

#### Traffic Sources
| Component | Chart type | Data shown |
|---|---|---|
| `TrafficDonut` | Pie / donut | Traffic source distribution by views |
| `TrafficTable` | Table | Source, Views, Engaged, Watch Time, Share % (with inline bar) |
| `DailyTrafficChart` | Stacked bar | Daily views broken down by traffic source |

#### Audience
| Component | Chart type | Data shown |
|---|---|---|
| `AudienceDonut` (×3) | Pie / donut | Country, Device type, Operating system breakdown |
| `SubscriberVsNonChart` | Horizontal bar | Views and Watch Time compared between subscribers and non-subscribers |

#### Retention
| Component | Chart type | Data shown |
|---|---|---|
| `RetentionCurves` | Multi-line | Per-video audience watch ratio at each % of video progress |
| `RelativeRetention` | Multi-line | Per-video relative retention performance vs YouTube average baseline (65) |

#### Key Insights
Auto-derived text insight cards computed from the loaded data ([src/components/key-insights/KeyInsights.tsx](src/components/key-insights/KeyInsights.tsx)):

1. Best performing video (most views)
2. Top traffic source (most views)
3. Peak day (highest single-day views)
4. Longest average watch time (video with highest `avgDurationSec`)
5. Subscriber conversion rate: `netSubscribers / totalViews × 100`
6. Engagement rate (`engagedPct`)
7. Top device type
8. Most subscribers gained (video with highest `subsGained`)

---

## Conditions & Guards

| Check | Where | Behaviour |
|---|---|---|
| `isConfigured()` returns false | Every API route | Returns `HTTP 401 { error: "not_configured" }` immediately, no YouTube API call made |
| `!f \|\| !t \|\| f > t` | `page.tsx` before fetch | Aborts — no API calls triggered |
| Any endpoint returns 401 | `page.tsx` after fetch | Sets `configured = false`, renders yellow warning banner, loads mock data |
| `totalViews === 0` | `page.tsx` | Calls `/api/youtube/active-years` and renders a blue info banner with clickable year buttons |
| Per-video retention query fails | `retention/route.ts` | Error silently swallowed via `.catch(() => ({ data: { rows: [] } }))` — tab still renders with remaining videos |
| Extended metrics unavailable | `videos/created/route.ts` | `safeQuery` wrapper returns `null`; impressions/CTR/avgViewPct fields set to `null` on each video |
| Video title not found | `videos/route.ts`, `videos/created/route.ts`, `videos/trending/route.ts` | Falls back to `"Video 1"`, `"Video 2"`, etc. |

---

## TypeScript Types

Defined in [src/types/dashboard.ts](src/types/dashboard.ts):

```ts
SummaryMetrics       // totalViews, engagedViews, engagedPct, watchTimeHours, watchTimeMinutes,
                     // avgViewDurationSec, netSubscribers, subsGained, subsLost,
                     // likes, likeRate, shares, shareBreakdown

DailyPoint           // date, views, engaged, watchTimeHours, avgDurationSec, subsGained, subsLost

VideoClassification  // "event_video" | "evergreen" | "slow_burn" | "underperformer" | "too_new" | "unknown"

DerivedMetrics       // eventScore, evergreenScore, weeklyViewVelocity, monthlyViewVelocity,
                     // ctrEfficiency, viewsPerDayOfLife, classification

VideoWithMetrics     // id, title, titleShort, color, isShort, publishedAt
                     // Lifetime: totalViews, totalLikes, totalComments, durationSeconds
                     // Period: views, engaged, likes, comments, shares, watchTimeHours,
                     //         avgDurationSec, subsGained
                     // Deep: avgViewDurationSeconds, avgViewPercentage, impressions, ctr,
                     //       viewsLast7Days, viewsLast28Days, viewsLast48Hours
                     // derived: DerivedMetrics

TrendingVideo        // id, title, titleShort, color, isShort, publishedAt,
                     // viewsLast48h, viewsLast48hPrior, velocity, derived

TrafficSource        // source, views, engaged, watchTimeHours, sharePct, color

AudienceData         // countries, devices, operatingSystems, subscriberVsNon

DashboardData        // Combines all of the above:
                     // { channelName, summary, daily, videos, trafficSources, dailyTraffic,
                     //   audience, retentionData, relativeData, videoMeta }
```

---

## Mock Data

[src/data/mock.ts](src/data/mock.ts) provides fallback data shown when the YouTube credentials are not configured. It represents a fictional Indian health insurance Shorts channel with:
- 3 Hindi-language videos
- 1,369 total views over 5 days (Mar 12–16, 2026)
- 4.4 hours watch time, +38 net subscribers
- 96% India, 88% Mobile, 82% Android audience
- 6 traffic sources including YouTube Search and Shorts Feed
- Retention curves across 21 progress points (1%–100%)

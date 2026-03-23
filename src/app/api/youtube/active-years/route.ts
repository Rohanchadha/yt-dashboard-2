import { NextRequest, NextResponse } from "next/server";
import { isChannelConfigured, getAuthenticatedClientForChannel, resolveChannelId, youtubeAnalytics } from "@/lib/youtube-client";
import { validateChannelParam, serverError } from "@/lib/api-utils";

export async function GET(req: NextRequest) {
  const validated = validateChannelParam(req);
  if (validated instanceof NextResponse) return validated;
  const { channelIndex } = validated;

  if (!isChannelConfigured(channelIndex)) {
    return NextResponse.json({ error: "not_configured" }, { status: 401 });
  }

  try {
    const auth = getAuthenticatedClientForChannel(channelIndex);
    const channelId = await resolveChannelId(auth, channelIndex);

    const currentYear = new Date().getFullYear();
    const yearlyViews: { year: number; views: number }[] = [];

    for (let year = 2016; year <= currentYear; year++) {
      try {
        const res = await youtubeAnalytics.reports.query({
          auth,
          ids: `channel==${channelId}`,
          startDate: `${year}-01-01`,
          endDate: `${year}-12-31`,
          metrics: "views",
        });
        const views = (res.data.rows?.[0]?.[0] as number) ?? 0;
        if (views > 0) yearlyViews.push({ year, views });
      } catch {
        // skip years that error
      }
    }

    return NextResponse.json({ activeYears: yearlyViews });
  } catch (err: unknown) {
    return serverError("/api/youtube/active-years", err);
  }
}

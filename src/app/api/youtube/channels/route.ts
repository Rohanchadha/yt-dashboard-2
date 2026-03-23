import { NextResponse } from "next/server";
import {
  getConfiguredChannels,
  getChannelEnvConfig,
  getAuthenticatedClientForChannel,
  youtube,
} from "@/lib/youtube-client";

export async function GET() {
  const configured = getConfiguredChannels().filter((c) => c.configured);

  const channels = await Promise.all(
    configured.map(async ({ index }) => {
      const { channelId: envChannelId, channelName: envChannelName } = getChannelEnvConfig(index);

      try {
        const auth = getAuthenticatedClientForChannel(index);
        const params = envChannelId
          ? { auth, part: ["id", "snippet"] as string[], id: [envChannelId] }
          : { auth, part: ["id", "snippet"] as string[], mine: true };
        const res = await youtube.channels.list(params);
        const item = res.data.items?.[0];
        return {
          index,
          name: envChannelName ?? item?.snippet?.title ?? `Channel ${index}`,
          id: envChannelId ?? item?.id ?? "",
        };
      } catch {
        return { index, name: envChannelName ?? `Channel ${index}`, id: envChannelId ?? "" };
      }
    })
  );

  return NextResponse.json({ channels });
}

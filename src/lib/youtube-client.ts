import { google } from "googleapis";

/** Call once at app start (or in instrumentation.ts) to fail fast on missing config. */
export function assertYouTubeConfig() {
  const required = ["YOUTUBE_CLIENT_ID", "YOUTUBE_CLIENT_SECRET", "YOUTUBE_OAUTH_REDIRECT_URI"];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
}

export function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.YOUTUBE_CLIENT_ID,
    process.env.YOUTUBE_CLIENT_SECRET,
    process.env.YOUTUBE_OAUTH_REDIRECT_URI
  );
}

export interface ChannelEnvConfig {
  refreshToken: string | undefined;
  channelId: string | undefined;
  channelName: string | undefined;
}

export function getChannelEnvConfig(index: number): ChannelEnvConfig {
  const refreshToken =
    process.env[`YOUTUBE_CHANNEL_${index}_REFRESH_TOKEN`] ??
    (index === 1 ? process.env.YOUTUBE_REFRESH_TOKEN : undefined);
  const channelId = process.env[`YOUTUBE_CHANNEL_${index}_ID`];
  const channelName = process.env[`YOUTUBE_CHANNEL_${index}_NAME`];
  return { refreshToken, channelId, channelName };
}

export function getAuthenticatedClientForChannel(index: number) {
  const { refreshToken } = getChannelEnvConfig(index);
  const auth = getOAuth2Client();
  auth.setCredentials({ refresh_token: refreshToken });
  return auth;
}

export function getConfiguredChannels(): { index: number; configured: boolean }[] {
  const results: { index: number; configured: boolean }[] = [];
  const hasOAuth = !!(process.env.YOUTUBE_CLIENT_ID && process.env.YOUTUBE_CLIENT_SECRET);
  for (let index = 1; index <= 20; index++) {
    const { refreshToken } = getChannelEnvConfig(index);
    if (!refreshToken) break; // stop at first gap
    results.push({ index, configured: hasOAuth && !!refreshToken });
  }
  return results;
}

// Backward-compat aliases (channel 1)
export function getAuthenticatedClient() {
  return getAuthenticatedClientForChannel(1);
}

export function isConfigured() {
  return getConfiguredChannels().some((c) => c.index === 1 && c.configured);
}

export function isChannelConfigured(index: number): boolean {
  const { refreshToken } = getChannelEnvConfig(index);
  return !!(
    process.env.YOUTUBE_CLIENT_ID &&
    process.env.YOUTUBE_CLIENT_SECRET &&
    refreshToken
  );
}

export const youtube = google.youtube("v3");
export const youtubeAnalytics = google.youtubeAnalytics("v2");

/** Resolves the channel ID for a given channel index.
 *  Uses the env-pinned channel ID (for brand accounts) or fetches via `mine: true`. */
export async function resolveChannelId(
  auth: ReturnType<typeof getOAuth2Client>,
  index: number
): Promise<string> {
  const { channelId: envChannelId } = getChannelEnvConfig(index);
  if (envChannelId) return envChannelId;
  const res = await youtube.channels.list({ auth, part: ["id"], mine: true });
  return res.data.items?.[0]?.id ?? "MINE";
}

// Fetch a channel's real badge images (global + channel-custom sub/bit badges)
// from the Twitch Helix API, so chat renders the EXACT badges you'd see natively.
// Needs the signed-in streamer's token (badge images aren't public). Returns a
// map of "setId/version" -> image URL. Tokens arrive over the local WS only.

interface BadgeArgs {
  broadcasterId: string;
  token: string;
  clientId: string;
}

interface HelixBadges {
  data?: { set_id: string; versions: { id: string; image_url_2x?: string; image_url_4x?: string }[] }[];
}

export async function fetchTwitchBadges({ broadcasterId, token, clientId }: BadgeArgs): Promise<Record<string, string>> {
  if (!token || !clientId) throw new Error("Not signed in to Twitch");
  const headers = { Authorization: `Bearer ${token}`, "Client-Id": clientId };
  const map: Record<string, string> = {};

  const load = async (url: string) => {
    const res = await fetch(url, { headers });
    if (!res.ok) return;
    const j = (await res.json()) as HelixBadges;
    for (const set of j.data ?? []) {
      for (const v of set.versions ?? []) {
        const u = v.image_url_2x || v.image_url_4x;
        if (u) map[`${set.set_id}/${v.id}`] = u;
      }
    }
  };

  // Global first, then channel-specific (channel sub/bit badges override globals).
  await load("https://api.twitch.tv/helix/chat/badges/global");
  if (broadcasterId) await load(`https://api.twitch.tv/helix/chat/badges?broadcaster_id=${broadcasterId}`);
  return map;
}

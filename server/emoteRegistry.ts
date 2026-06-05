// Per-channel + global emote registry: 7TV, BetterTTV, FrankerFaceZ (Twitch) and 7TV (Kick).
// Builds a word -> image-url map so chat words like "OMEGALUL" / "catJAM" / sub emotes
// render as images. Native Twitch/Kick emotes are handled separately by the adapters.
type EmoteMap = Map<string, string>;

const TTL = 30 * 60 * 1000; // re-fetch a channel's sets every 30 min
const channelCache = new Map<string, { map: EmoteMap; at: number }>();
let globalTwitch: EmoteMap | null = null;
let globalSeven: EmoteMap | null = null;

async function getJson(url: string): Promise<any | null> {
  try {
    const r = await fetch(url, { headers: { Accept: "application/json" } });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

const add = (map: EmoteMap, name: string | undefined, url: string) => {
  if (name && !map.has(name)) map.set(name, url);
};

function loadSeven(map: EmoteMap, emotes: any[] | undefined) {
  for (const e of emotes ?? []) {
    const id = e?.id ?? e?.data?.id;
    const name = e?.name ?? e?.data?.name;
    if (id) add(map, name, `https://cdn.7tv.app/emote/${id}/2x.webp`);
  }
}

function loadBttv(map: EmoteMap, arr: any[] | undefined) {
  for (const e of arr ?? []) add(map, e?.code, `https://cdn.betterttv.net/emote/${e?.id}/2x`);
}

function loadFfz(map: EmoteMap, data: any) {
  for (const set of Object.values(data?.sets ?? {}) as any[]) {
    for (const e of set?.emoticons ?? []) add(map, e?.name, `https://cdn.frankerfacez.com/emote/${e?.id}/2`);
  }
}

async function twitchGlobals(): Promise<EmoteMap> {
  if (globalTwitch) return globalTwitch;
  const map: EmoteMap = new Map();
  const [seven, bttv, ffz] = await Promise.all([
    getJson("https://7tv.io/v3/emote-sets/global"),
    getJson("https://api.betterttv.net/3/cached/emotes/global"),
    getJson("https://api.frankerfacez.com/v1/set/global"),
  ]);
  loadSeven(map, seven?.emotes);
  loadBttv(map, bttv);
  loadFfz(map, ffz);
  globalTwitch = map;
  return map;
}

async function sevenGlobals(): Promise<EmoteMap> {
  if (globalSeven) return globalSeven;
  const map: EmoteMap = new Map();
  const seven = await getJson("https://7tv.io/v3/emote-sets/global");
  loadSeven(map, seven?.emotes);
  globalSeven = map;
  return map;
}

export async function getTwitchEmotes(channelId: string, channelName: string): Promise<EmoteMap> {
  const key = `tw:${channelId}`;
  const hit = channelCache.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit.map;

  const map: EmoteMap = new Map(await twitchGlobals());
  const [seven, bttv, ffz] = await Promise.all([
    getJson(`https://7tv.io/v3/users/twitch/${channelId}`),
    getJson(`https://api.betterttv.net/3/cached/users/twitch/${channelId}`),
    channelName ? getJson(`https://api.frankerfacez.com/v1/room/${channelName.toLowerCase()}`) : null,
  ]);
  loadSeven(map, seven?.emote_set?.emotes);
  loadBttv(map, [...(bttv?.channelEmotes ?? []), ...(bttv?.sharedEmotes ?? [])]);
  if (ffz) loadFfz(map, ffz);

  channelCache.set(key, { map, at: Date.now() });
  return map;
}

export async function getKickEmotes(kickChannelId?: string): Promise<EmoteMap> {
  const key = `kick:${kickChannelId ?? "global"}`;
  const hit = channelCache.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit.map;

  const map: EmoteMap = new Map(await sevenGlobals());
  if (kickChannelId) {
    const seven = await getJson(`https://7tv.io/v3/users/kick/${kickChannelId}`);
    loadSeven(map, seven?.emote_set?.emotes);
  }
  channelCache.set(key, { map, at: Date.now() });
  return map;
}

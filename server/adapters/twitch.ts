// Twitch adapter — anonymous IRC read via tmi.js. No auth, any public channel.
import tmi from "tmi.js";
import type { BadgeInfo, MessageFlags, UnifiedMessage } from "../../shared/types";
import { analyze } from "../../shared/intelligence";
import { twitchParts } from "../../shared/emotes";
import type { Adapter, Emit, StatusFn } from "./types";

export function createTwitchAdapter(channel: string, emit: Emit, status: StatusFn): Adapter {
  const chan = channel.replace(/^#/, "").toLowerCase().trim();
  status("twitch", "connecting");

  const client = new tmi.Client({
    options: { skipUpdatingEmotesets: true },
    connection: { reconnect: true, secure: true },
    channels: [chan],
  });

  client.on("connected", () => status("twitch", "connected", chan));
  client.on("disconnected", (reason) => status("twitch", "disconnected", reason));

  client.on("message", (_channel, tags, message, self) => {
    if (self) return;
    const b = (tags.badges ?? {}) as Record<string, string | undefined>;

    const flags: MessageFlags = {
      broadcaster: !!b.broadcaster,
      moderator: !!(tags.mod || b.moderator),
      vip: !!(b.vip || (tags as any).vip),
      subscriber: !!(tags.subscriber || b.subscriber),
      verified: false,
    };

    const badges: BadgeInfo[] = [];
    if (flags.broadcaster) badges.push({ type: "broadcaster", label: "Host" });
    if (flags.moderator) badges.push({ type: "moderator", label: "Mod" });
    if (flags.vip) badges.push({ type: "vip", label: "VIP" });
    if (flags.subscriber) {
      badges.push({ type: "subscriber", label: "Sub", count: b.subscriber ? Number(b.subscriber) : undefined });
    }

    const msg: UnifiedMessage = {
      id: tags.id ?? `tw_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      platform: "twitch",
      channel: chan,
      username: tags.username ?? "unknown",
      displayName: tags["display-name"] ?? tags.username ?? "unknown",
      color: tags.color ?? undefined,
      text: message,
      timestamp: Date.now(),
      badges,
      flags,
      parts: twitchParts(message, tags.emotes),
    };
    msg.intelligence = analyze(message, flags);
    emit(msg);
  });

  client.connect().catch((e) => status("twitch", "error", String(e)));

  return {
    stop: () => {
      client.disconnect().catch(() => {});
    },
  };
}

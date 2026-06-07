// Twitch adapter — anonymous IRC read via tmi.js. No auth, any public channel.
import tmi from "tmi.js";
import type { BadgeInfo, EventInfo, MessageFlags, UnifiedMessage } from "../../shared/types";
import { analyze } from "../../shared/intelligence";
import { twitchParts, expandWordEmotes } from "../../shared/emotes";
import { getTwitchEmotes } from "../emoteRegistry";
import type { Adapter, Emit, StatusFn } from "./types";

function twitchBadgeMeta(setId: string, version: string): { type: BadgeInfo["type"]; label: string; count?: number } {
  switch (setId) {
    case "broadcaster":
      return { type: "broadcaster", label: "Host" };
    case "moderator":
      return { type: "moderator", label: "Mod" };
    case "vip":
      return { type: "vip", label: "VIP" };
    case "subscriber":
      return { type: "subscriber", label: "Sub", count: Number(version) || undefined };
    case "founder":
      return { type: "founder", label: "Founder" };
    case "bits":
    case "bits-leader":
      return { type: "bits", label: "Bits" };
    case "partner":
      return { type: "verified", label: "Verified" };
    case "staff":
    case "admin":
    case "global_mod":
      return { type: "staff", label: "Staff" };
    case "og":
      return { type: "og", label: "OG" };
    default:
      return { type: "unknown", label: setId.replace(/[-_]/g, " ") };
  }
}

export function createTwitchAdapter(channel: string, emit: Emit, status: StatusFn): Adapter {
  const chan = channel.replace(/^#/, "").toLowerCase().trim();
  status("twitch", "connecting");

  let emoteMap: Map<string, string> | null = null;
  let loadStarted = false;

  const client = new tmi.Client({
    options: { skipUpdatingEmotesets: true },
    connection: { reconnect: true, secure: true },
    channels: [chan],
  });

  client.on("connected", () => status("twitch", "connected", chan));
  client.on("disconnected", (reason) => status("twitch", "disconnected", reason));

  client.on("message", (_channel, tags, message, self) => {
    if (self) return;
    if (!loadStarted && tags["room-id"]) {
      loadStarted = true;
      getTwitchEmotes(String(tags["room-id"]), chan)
        .then((m) => {
          emoteMap = m;
          status("twitch", "connected", `${chan} · ${m.size} emotes`);
        })
        .catch(() => {});
    }
    const b = (tags.badges ?? {}) as Record<string, string | undefined>;

    const flags: MessageFlags = {
      broadcaster: !!b.broadcaster,
      moderator: !!(tags.mod || b.moderator),
      vip: !!(b.vip || (tags as any).vip),
      subscriber: !!(tags.subscriber || b.subscriber),
      verified: false,
    };

    const badges: BadgeInfo[] = Object.entries(b)
      .filter(([, version]) => version != null)
      .map(([setId, version]) => ({ ...twitchBadgeMeta(setId, String(version)), setId, version: String(version) }));

    const msg: UnifiedMessage = {
      id: tags.id ?? `tw_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      platform: "twitch",
      channel: chan,
      channelId: tags["room-id"] ? String(tags["room-id"]) : undefined,
      authorId: tags["user-id"] ? String(tags["user-id"]) : undefined,
      username: tags.username ?? "unknown",
      displayName: tags["display-name"] ?? tags.username ?? "unknown",
      color: tags.color ?? undefined,
      text: message,
      timestamp: Date.now(),
      badges,
      flags,
      parts: expandWordEmotes(twitchParts(message, tags.emotes), message, emoteMap),
    };
    msg.intelligence = analyze(message, flags);
    emit(msg);
  });

  const emitEvent = (username: string, ev: EventInfo) => {
    emit({
      id: `tw_ev_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      platform: "twitch",
      channel: chan,
      username: username || "someone",
      displayName: username || "someone",
      text: ev.label,
      timestamp: Date.now(),
      badges: [],
      flags: { broadcaster: false, moderator: false, vip: false, subscriber: ev.kind !== "raid", verified: false },
      event: ev,
    });
  };
  client.on("subscription", (_c, username) => emitEvent(username, { kind: "sub", label: "just subscribed!" }));
  client.on("resub", (_c, username, months) =>
    emitEvent(username, { kind: "resub", label: `resubscribed for ${months} months!`, amount: months }),
  );
  client.on("subgift", (_c, username, _streak, recipient) =>
    emitEvent(username, { kind: "giftsub", label: `gifted a sub to ${recipient}!` }),
  );
  client.on("submysterygift", (_c, username, count) =>
    emitEvent(username, { kind: "giftsub", label: `gifted ${count} subs!`, amount: count }),
  );
  client.on("cheer", (_c, userstate) =>
    emitEvent(userstate["display-name"] || userstate.username || "someone", {
      kind: "bits",
      label: `cheered ${userstate.bits} bits!`,
      amount: Number(userstate.bits),
    }),
  );
  client.on("raided", (_c, username, viewers) =>
    emitEvent(username, { kind: "raid", label: `raided with ${viewers} viewers!`, amount: viewers }),
  );

  client.connect().catch((e) => status("twitch", "error", String(e)));

  return {
    stop: () => {
      client.disconnect().catch(() => {});
    },
  };
}

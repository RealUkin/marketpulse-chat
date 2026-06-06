// Kick adapter — unofficial Pusher WebSocket (the same one kick.com uses).
// No auth needed to READ a public chatroom.
import WebSocket from "ws";
import type { BadgeInfo, EventInfo, MessageFlags, UnifiedMessage } from "../../shared/types";
import { analyze } from "../../shared/intelligence";
import { kickParts, cleanKickText, expandWordEmotes } from "../../shared/emotes";
import type { Adapter, Emit, StatusFn } from "./types";
import { newPlainContext } from "../browser";
import { getKickEmotes } from "../emoteRegistry";

const PUSHER_URL =
  "wss://ws-us2.pusher.com/app/32cbd69e4b950bf97679?protocol=7&client=js&version=8.4.0&flash=false";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

interface KickIds {
  chatroomId: number;
  channelId?: number; // broadcaster user id, for 7TV
}

function parseKick(data: any): KickIds | null {
  if (!data?.chatroom?.id) return null;
  return { chatroomId: data.chatroom.id, channelId: data.user_id ?? data.user?.id ?? data.id };
}

async function resolveKickChannel(slug: string): Promise<KickIds | null> {
  // 0) Manual override (guaranteed demo reliability): KICK_CHATROOM_<SLUG> or KICK_CHATROOM_ID
  const override =
    process.env[`KICK_CHATROOM_${slug.toUpperCase()}`] ?? process.env.KICK_CHATROOM_ID;
  if (override && !Number.isNaN(Number(override))) return { chatroomId: Number(override) };

  // 1) Plain fetch — works from residential IPs; 403s behind Cloudflare on datacenter IPs.
  try {
    const res = await fetch(`https://kick.com/api/v2/channels/${encodeURIComponent(slug)}`, {
      headers: { "User-Agent": UA, Accept: "application/json" },
    });
    if (res.ok) {
      const r = parseKick(await res.json());
      if (r) return r;
    }
  } catch {
    /* fall through to browser */
  }

  // 2) Headless-browser fallback — a real browser passes Cloudflare's JS challenge.
  try {
    const ctx = await newPlainContext();
    const page = await ctx.newPage();
    await page.goto(`https://kick.com/api/v2/channels/${encodeURIComponent(slug)}`, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });
    const txt = await page.evaluate(() => document.body.innerText);
    await ctx.close();
    return parseKick(JSON.parse(txt));
  } catch {
    return null;
  }
}

function badgeType(t: string): BadgeInfo["type"] {
  const known = ["broadcaster", "moderator", "vip", "subscriber", "sub_gifter", "founder", "og", "staff"];
  return (known.includes(t) ? t : "unknown") as BadgeInfo["type"];
}

export function createKickAdapter(slug: string, emit: Emit, status: StatusFn): Adapter {
  const clean = slug.replace(/^#/, "").toLowerCase().trim();
  let ws: WebSocket | null = null;
  let stopped = false;
  let emoteMap: Map<string, string> | null = null;
  status("kick", "connecting");

  const emitKickEvent = (username: string, ev: EventInfo) => {
    emit({
      id: `kick_ev_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      platform: "kick",
      channel: clean,
      username,
      displayName: username,
      text: ev.label,
      timestamp: Date.now(),
      badges: [],
      flags: { broadcaster: false, moderator: false, vip: false, subscriber: ev.kind !== "raid", verified: false },
      event: ev,
    });
  };

  (async () => {
    const ch = await resolveKickChannel(clean);
    if (stopped) return;
    if (!ch) {
      status("kick", "error", "Couldn't resolve chatroom (Cloudflare). Try Demo Mode or set KICK_CHATROOM_<SLUG>.");
      return;
    }

    getKickEmotes(ch.channelId ? String(ch.channelId) : undefined)
      .then((m) => {
        emoteMap = m;
      })
      .catch(() => {});

    ws = new WebSocket(PUSHER_URL, { headers: { "User-Agent": UA } });

    ws.on("open", () => {
      status("kick", "connected", clean);
      ws?.send(JSON.stringify({ event: "pusher:subscribe", data: { auth: "", channel: `chatrooms.${ch.chatroomId}.v2` } }));
    });

    ws.on("message", (raw) => {
      let frame: any;
      try {
        frame = JSON.parse(raw.toString());
      } catch {
        return;
      }
      // Sub / gift events (unofficial Pusher event names; defensive parsing).
      if (frame.event === "App\\Events\\SubscriptionEvent" || frame.event === "App\\Events\\GiftedSubscriptionsEvent") {
        try {
          const d = JSON.parse(frame.data);
          if (frame.event.includes("Gifted")) {
            const n = Array.isArray(d.gifted_usernames) ? d.gifted_usernames.length : d.gifted_count || 1;
            emitKickEvent(d.gifter_username || "someone", { kind: "giftsub", label: `gifted ${n} subs!`, amount: n });
          } else {
            emitKickEvent(d.username || "someone", {
              kind: "sub",
              label: `subscribed for ${d.months || 1} months!`,
              amount: d.months,
            });
          }
        } catch {
          /* ignore malformed event */
        }
        return;
      }
      if (frame.event !== "App\\Events\\ChatMessageEvent") return;

      let d: any;
      try {
        d = JSON.parse(frame.data); // Kick double-encodes the payload
      } catch {
        return;
      }

      const rawBadges: any[] = d?.sender?.identity?.badges ?? [];
      const has = (t: string) => rawBadges.some((bd) => bd.type === t);
      const flags: MessageFlags = {
        broadcaster: has("broadcaster"),
        moderator: has("moderator"),
        vip: has("vip"),
        subscriber: has("subscriber"),
        verified: false,
      };
      const badges: BadgeInfo[] = rawBadges.map((bd) => ({
        type: badgeType(bd.type),
        label: bd.text ?? bd.type,
        count: bd.count,
      }));

      const rawContent: string = d?.content ?? "";
      const text = cleanKickText(rawContent);
      const msg: UnifiedMessage = {
        id: d?.id ?? `kick_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        platform: "kick",
        channel: clean,
        username: d?.sender?.username ?? "unknown",
        displayName: d?.sender?.username ?? "unknown",
        color: d?.sender?.identity?.color ?? undefined,
        text,
        timestamp: d?.created_at ? new Date(d.created_at).getTime() : Date.now(),
        badges,
        flags,
        parts: expandWordEmotes(kickParts(rawContent), text, emoteMap),
      };
      msg.intelligence = analyze(text, flags);
      emit(msg);
    });

    ws.on("close", () => {
      if (!stopped) status("kick", "disconnected", clean);
    });
    ws.on("error", (e) => status("kick", "error", String(e)));
  })();

  return {
    stop: () => {
      stopped = true;
      try {
        ws?.close();
      } catch {
        /* noop */
      }
    },
  };
}

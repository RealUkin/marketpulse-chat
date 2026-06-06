// YouTube Live adapter — no API key (innertube via youtube-chat).
// Accepts a channelId (UC...), a video/live ID, or a YouTube URL.
import { LiveChat } from "youtube-chat";
import type { BadgeInfo, MessageFlags, MessagePart, UnifiedMessage } from "../../shared/types";
import { analyze } from "../../shared/intelligence";
import type { Adapter, Emit, StatusFn } from "./types";

function parseTarget(input: string): { channelId?: string; liveId?: string } {
  const s = input.trim();
  if (/^UC[\w-]{20,}$/.test(s)) return { channelId: s };
  const url = s.match(/(?:v=|youtu\.be\/|live\/|shorts\/)([\w-]{11})/);
  if (url) return { liveId: url[1] };
  if (/^[\w-]{11}$/.test(s)) return { liveId: s };
  const ch = s.match(/channel\/(UC[\w-]+)/);
  if (ch) return { channelId: ch[1] };
  return { channelId: s };
}

export function createYouTubeAdapter(input: string, emit: Emit, status: StatusFn): Adapter {
  status("youtube", "connecting");
  const target = parseTarget(input);

  let chat: LiveChat;
  try {
    chat = new LiveChat(target as { channelId: string });
  } catch (e) {
    status("youtube", "error", `YouTube: ${(e as Error).message}`);
    return { stop: () => {} };
  }

  chat.on("start", () => status("youtube", "connected", target.channelId ?? target.liveId ?? ""));
  chat.on("end", () => status("youtube", "disconnected"));
  chat.on("error", (err: unknown) =>
    status("youtube", "error", String((err as Error)?.message ?? err)),
  );

  chat.on("chat", (item: any) => {
    const parts: MessagePart[] = [];
    let text = "";
    for (const run of item.message ?? []) {
      if (typeof run.text === "string") {
        parts.push({ t: "text", v: run.text });
        text += run.text;
      } else if (run.url) {
        const name = run.alt || run.emojiText || ":emoji:";
        parts.push({ t: "emote", name, url: run.url });
        text += name;
      }
    }

    const flags: MessageFlags = {
      broadcaster: !!item.isOwner,
      moderator: !!item.isModerator,
      vip: false,
      subscriber: !!item.isMembership,
      verified: !!item.isVerified,
    };
    const badges: BadgeInfo[] = [];
    if (flags.broadcaster) badges.push({ type: "broadcaster", label: "Host" });
    if (flags.moderator) badges.push({ type: "moderator", label: "Mod" });
    if (item.isMembership) badges.push({ type: "member", label: item.author?.badge?.label || "Member" });
    if (flags.verified) badges.push({ type: "verified", label: "Verified" });

    const msg: UnifiedMessage = {
      id: item.id || `yt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      platform: "youtube",
      channel: target.channelId ?? target.liveId ?? "youtube",
      username: item.author?.name ?? "viewer",
      displayName: item.author?.name ?? "viewer",
      avatarUrl: item.author?.thumbnail?.url,
      text,
      timestamp: Date.now(),
      badges,
      flags,
      parts: parts.length ? parts : undefined,
      event: item.superchat
        ? { kind: "superchat", label: `Super Chat ${item.superchat.amount}${text ? ` — ${text}` : ""}` }
        : undefined,
    };
    msg.intelligence = analyze(text, flags);
    emit(msg);
  });

  chat
    .start()
    .then((ok: boolean) => {
      if (!ok) status("youtube", "error", "No active live chat (is the channel/video live?)");
    })
    .catch((e: unknown) => status("youtube", "error", String((e as Error)?.message ?? e)));

  return {
    stop: () => {
      try {
        chat.stop();
      } catch {
        /* noop */
      }
    },
  };
}

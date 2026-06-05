// Turn each platform's emote codes into renderable {text|emote} parts.
import type { MessagePart } from "./types";

export const TWITCH_EMOTE = (id: string) =>
  `https://static-cdn.jtvnw.net/emoticons/v2/${id}/default/dark/2.0`;
export const KICK_EMOTE = (id: string) => `https://files.kick.com/emotes/${id}/fullsize`;

// Twitch IRC tags.emotes = { "<id>": ["start-end", ...] } with CODE-POINT indices.
export function twitchParts(
  message: string,
  emotes?: { [id: string]: string[] } | null,
): MessagePart[] | undefined {
  if (!emotes || Object.keys(emotes).length === 0) return undefined;
  const chars = Array.from(message); // split by code point (handles emoji)
  const ranges: { start: number; end: number; id: string }[] = [];
  for (const [id, list] of Object.entries(emotes)) {
    for (const r of list) {
      const [s, e] = r.split("-").map(Number);
      if (Number.isFinite(s) && Number.isFinite(e)) ranges.push({ start: s, end: e, id });
    }
  }
  ranges.sort((a, b) => a.start - b.start);

  const parts: MessagePart[] = [];
  let cursor = 0;
  for (const r of ranges) {
    if (r.start > cursor) parts.push({ t: "text", v: chars.slice(cursor, r.start).join("") });
    parts.push({ t: "emote", name: chars.slice(r.start, r.end + 1).join(""), url: TWITCH_EMOTE(r.id) });
    cursor = r.end + 1;
  }
  if (cursor < chars.length) parts.push({ t: "text", v: chars.slice(cursor).join("") });
  return parts;
}

const KICK_RE = /\[emote:(\d+):([^\]]+)\]/g;

// Kick inlines emotes in content as [emote:<id>:<name>].
export function kickParts(content: string): MessagePart[] | undefined {
  if (!content.includes("[emote:")) return undefined;
  const parts: MessagePart[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  KICK_RE.lastIndex = 0;
  while ((m = KICK_RE.exec(content)) !== null) {
    if (m.index > last) parts.push({ t: "text", v: content.slice(last, m.index) });
    parts.push({ t: "emote", name: m[2], url: KICK_EMOTE(m[1]) });
    last = m.index + m[0].length;
  }
  if (last < content.length) parts.push({ t: "text", v: content.slice(last) });
  return parts;
}

// Plain-text version (for search / intelligence / fallback): [emote:id:name] -> name.
export function cleanKickText(content: string): string {
  return content.replace(/\[emote:\d+:([^\]]+)\]/g, "$1");
}

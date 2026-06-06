// Coordinated scam-wave detection. The real 2025/26 attack on crypto chats
// isn't single bots — it's many (often compromised) accounts posting the SAME
// message at once. We group recent messages by normalized text and flag when a
// single message is being spammed by several distinct users in a short window.
import type { UnifiedMessage } from "./types";

export interface ScamWave {
  text: string; // a sample of the original text
  count: number; // distinct users posting it
  messages: UnifiedMessage[]; // the offending messages (for one-click action)
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function detectScamWave(
  messages: UnifiedMessage[],
  now: number,
  windowMs = 30_000,
  minUsers = 4,
): ScamWave | null {
  const groups = new Map<string, { users: Set<string>; msgs: UnifiedMessage[]; text: string }>();
  for (const m of messages) {
    if (m.event) continue;
    if (now - m.timestamp > windowMs) continue;
    const norm = normalize(m.text);
    if (norm.length < 6) continue;
    let g = groups.get(norm);
    if (!g) {
      g = { users: new Set(), msgs: [], text: m.text };
      groups.set(norm, g);
    }
    g.users.add(`${m.platform}:${m.username.toLowerCase()}`);
    g.msgs.push(m);
  }
  let best: ScamWave | null = null;
  for (const g of groups.values()) {
    if (g.users.size >= minUsers && (!best || g.users.size > best.count)) {
      best = { text: g.text, count: g.users.size, messages: g.msgs };
    }
  }
  return best;
}

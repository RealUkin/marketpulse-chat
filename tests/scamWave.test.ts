import { describe, it, expect } from "vitest";
import { detectScamWave } from "../shared/scamWave";
import type { UnifiedMessage } from "../shared/types";

const now = 1_000_000;
const msg = (username: string, text: string, over: Partial<UnifiedMessage> = {}): UnifiedMessage => ({
  id: `${username}-${Math.random()}`,
  platform: "twitch",
  channel: "c",
  username,
  displayName: username,
  text,
  timestamp: now,
  badges: [],
  flags: { broadcaster: false, moderator: false, vip: false, subscriber: false, verified: false },
  ...over,
});

describe("detectScamWave()", () => {
  it("flags the same message from >= 4 distinct users", () => {
    const scam = "claim your FREE airdrop at scam-site connect wallet";
    const msgs = ["a", "b", "c", "d", "e"].map((u) => msg(u, scam));
    const w = detectScamWave(msgs, now);
    expect(w).not.toBeNull();
    expect(w!.count).toBe(5);
  });

  it("ignores the same user repeating themselves", () => {
    const scam = "gm gm gm everyone";
    const msgs = [msg("a", scam), msg("a", scam), msg("a", scam), msg("a", scam)];
    expect(detectScamWave(msgs, now)).toBeNull();
  });

  it("normalizes punctuation / URLs so near-identical spam still groups", () => {
    const msgs = [
      msg("a", "Claim FREE crypto at http://x.io !!!"),
      msg("b", "claim free crypto at http://y.io"),
      msg("c", "CLAIM free crypto at http://z.io??"),
      msg("d", "claim free crypto at  http://w.io"),
    ];
    const w = detectScamWave(msgs, now);
    expect(w).not.toBeNull();
    expect(w!.count).toBe(4);
  });

  it("does not flag normal varied chat", () => {
    const msgs = [msg("a", "gg that was sick"), msg("b", "bullish on sol"), msg("c", "W stream"), msg("d", "lol")];
    expect(detectScamWave(msgs, now)).toBeNull();
  });

  it("ignores messages outside the time window", () => {
    const scam = "free nitro at scam dot link claim now";
    const old = ["a", "b", "c", "d"].map((u) => msg(u, scam, { timestamp: now - 60_000 }));
    expect(detectScamWave(old, now)).toBeNull();
  });
});

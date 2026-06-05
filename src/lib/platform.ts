import type { Platform } from "@shared/types";

export const PLATFORM_META: Record<
  Platform,
  { label: string; letter: string; color: string }
> = {
  twitch: { label: "Twitch", letter: "T", color: "#9146FF" },
  kick: { label: "Kick", letter: "K", color: "#53FC18" },
  x: { label: "X", letter: "𝕏", color: "#E7E9EA" },
};

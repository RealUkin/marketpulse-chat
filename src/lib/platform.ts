import type { Platform } from "@shared/types";

export const PLATFORM_META: Record<
  Platform,
  { label: string; letter: string; color: string; fg: string }
> = {
  twitch: { label: "Twitch", letter: "T", color: "#9146FF", fg: "#ffffff" },
  kick: { label: "Kick", letter: "K", color: "#53FC18", fg: "#0b0b0b" },
  x: { label: "X", letter: "𝕏", color: "#E7E9EA", fg: "#000000" },
  youtube: { label: "YouTube", letter: "YT", color: "#FF0033", fg: "#ffffff" },
};

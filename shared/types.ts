// Shared between the Node ingestion server and the Next.js client.

export type Platform = "twitch" | "kick" | "x" | "youtube";

export type ConnectionState = "connecting" | "connected" | "disconnected" | "error";

export type BadgeType =
  | "broadcaster"
  | "moderator"
  | "vip"
  | "subscriber"
  | "member"
  | "verified"
  | "sub_gifter"
  | "founder"
  | "og"
  | "staff"
  | "bits"
  | "unknown";

export interface BadgeInfo {
  type: BadgeType;
  label: string;
  count?: number; // e.g. subscriber months / gifted subs
}

export interface MessageFlags {
  broadcaster: boolean;
  moderator: boolean;
  vip: boolean;
  subscriber: boolean;
  verified: boolean;
}

export interface Intelligence {
  tickers: string[]; // e.g. ["$SOL", "$BTC"]
  sentiment: "bullish" | "bearish" | "neutral";
  isQuestion: boolean;
  isHighValueUser: boolean;
  priorityScore: number;
  risk: "none" | "link" | "scam"; // crypto-grade scam/link flag for moderators
}

// Sub / gift / bits / raid / superchat alert that "pops" in the feed + overlay.
export interface EventInfo {
  kind: "sub" | "resub" | "giftsub" | "bits" | "raid" | "superchat" | "member" | "follow";
  label: string;
  amount?: number;
}

export type MessagePart =
  | { t: "text"; v: string }
  | { t: "emote"; name: string; url: string };

export interface UnifiedMessage {
  id: string;
  platform: Platform;
  channel: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  color?: string; // user name color (hex)
  text: string;
  timestamp: number; // ms epoch
  badges: BadgeInfo[];
  flags: MessageFlags;
  parts?: MessagePart[]; // pre-tokenized text + emote images for rendering
  intelligence?: Intelligence;
  event?: EventInfo; // sub / gift / bits / raid / superchat alert
}

export interface ChannelConfig {
  twitch?: string;
  kick?: string;
  x?: string;
  youtube?: string;
}

// Client -> Server
export type ClientCommand =
  | { type: "subscribe"; channels: ChannelConfig; demo: boolean }
  | { type: "feature"; data: UnifiedMessage }
  | { type: "unfeature" }
  | { type: "ping" };

export interface MarketInfo {
  id: string;
  question: string;
  outcomes: string[];
  prices: number[]; // aligned with outcomes, 0..1
  volume: number;
  url: string;
}

// Server -> Client
export type ServerEvent =
  | { type: "hello"; ok: true }
  | { type: "message"; data: UnifiedMessage }
  | { type: "status"; platform: Platform; state: ConnectionState; detail?: string }
  | { type: "markets"; data: MarketInfo[] }
  | { type: "featured"; data: UnifiedMessage | null };

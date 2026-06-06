// Demo adapter — realistic synthetic chat across all 3 platforms.
// This is the always-on failsafe so the app works instantly with zero API setup.
import type { BadgeInfo, EventInfo, MessageFlags, MessagePart, Platform, UnifiedMessage } from "../../shared/types";
import { analyze } from "../../shared/intelligence";
import { TWITCH_EMOTE } from "../../shared/emotes";
import { getGlobalEmoteList } from "../emoteRegistry";
import type { Adapter, Emit, StatusFn } from "./types";

const NAMES = [
  "satoshi_fan", "degenmike", "crypto_kate", "wifguy", "0xchad", "ansem_intern",
  "pumpamentalist", "bagholder99", "moonboi", "liquidated_larry", "polymkt_pro",
  "gm_gary", "frens_only", "serial_aper", "vibecoder", "wagmi_wendy", "based_dept",
];

const LINES: Record<Platform, string[]> = {
  twitch: [
    "Ansem is cooking again LULW", "chat is at $430k KEKW", "that polymarket pick was insane",
    "Pog this unified chat is clean", "subbed 6 months gg", "is $SOL sending today?",
    "W stream", "this UI goes hard", "bullish on $WIF ngl", "when moon ser",
  ],
  kick: [
    "HYPE just different on kick", "green candles only", "is $BTC gonna break 100k?",
    "kick chat best chat", "mods asleep again", "gifted 5 subs lets go",
    "what's the play on $ETH", "clean overlay btw", "🚀🚀🚀", "W",
  ],
  x: [
    "thanks for the polymarket picks 🔥", "this aggregator is actually clean",
    "Ansem cooking again", "what are the odds on $SOL hitting 200?", "gm degens",
    "Polymarket has this at 62% rn", "is this open source?", "LFG", "bullish", "real",
  ],
  youtube: [
    "first!", "W stream", "is $ETH a buy here?", "member emotes go hard",
    "polymarket odds looking spicy", "gm from youtube", "$BTC to 100k EOY 🚀",
    "notification squad where you at", "best multistream tool fr", "🎉🎉",
  ],
};

const COLORS = ["#9146FF", "#53FC18", "#1d9bf0", "#e3b341", "#22c55e", "#ef4444", "#f472b6", "#38bdf8"];

const EMOTES = [
  { name: "Kappa", url: TWITCH_EMOTE("25") },
  { name: "LUL", url: TWITCH_EMOTE("425618") },
  { name: "PogChamp", url: TWITCH_EMOTE("305954156") },
];

// Occasional scam/phishing lines so the Safety filter is demonstrable.
const SCAM_LINES = [
  "claim your FREE $SOL airdrop at sol-drop.fun connect wallet",
  "double your crypto x2 instantly at solx2-claim.xyz 🚀",
  "free subs + viewers at buy-grow.link dm me to claim",
  "GIVEAWAY claim now → nitro-gift.gg/free",
];

const pick = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)];

const EVENT_KINDS: (() => EventInfo)[] = [
  () => ({ kind: "sub", label: "just subscribed!" }),
  () => ({ kind: "resub", label: `resubscribed for ${1 + Math.floor(Math.random() * 30)} months!` }),
  () => ({ kind: "giftsub", label: `gifted ${1 + Math.floor(Math.random() * 20)} subs!` }),
  () => ({ kind: "bits", label: `cheered ${pick([100, 500, 1000, 5000])} bits!` }),
  () => ({ kind: "superchat", label: `Super Chat $${pick([2, 5, 10, 20, 50])}` }),
  () => ({ kind: "raid", label: `raided with ${50 + Math.floor(Math.random() * 2000)} viewers!` }),
];

function makeBadges(platform: Platform): { badges: BadgeInfo[]; flags: MessageFlags } {
  const badges: BadgeInfo[] = [];
  const flags: MessageFlags = {
    broadcaster: false, moderator: false, vip: false, subscriber: false, verified: false,
  };
  const r = Math.random();
  if (platform === "x") {
    if (r < 0.5) { badges.push({ type: "verified", label: "Verified" }); flags.verified = true; }
  } else if (platform === "youtube") {
    if (r < 0.05) { badges.push({ type: "broadcaster", label: "Host" }); flags.broadcaster = true; }
    else if (r < 0.16) { badges.push({ type: "moderator", label: "Mod" }); flags.moderator = true; }
    if (Math.random() < 0.45) { badges.push({ type: "member", label: "Member" }); flags.subscriber = true; }
    if (Math.random() < 0.25) { badges.push({ type: "verified", label: "Verified" }); flags.verified = true; }
  } else {
    if (r < 0.06) { badges.push({ type: "broadcaster", label: "Host" }); flags.broadcaster = true; }
    else if (r < 0.18) { badges.push({ type: "moderator", label: "Mod" }); flags.moderator = true; }
    else if (r < 0.3) { badges.push({ type: "vip", label: "VIP" }); flags.vip = true; }
    if (Math.random() < 0.4) {
      badges.push({ type: "subscriber", label: "Sub", count: 1 + Math.floor(Math.random() * 30) });
      flags.subscriber = true;
    }
  }
  return { badges, flags };
}

export function createDemoAdapter(emit: Emit, status: StatusFn): Adapter {
  status("twitch", "connected", "demo");
  status("kick", "connected", "demo");
  status("x", "connected", "demo");
  status("youtube", "connected", "demo");

  // Pull real global emotes (7TV/BTTV/FFZ) so the demo looks like real chat.
  let pool: { name: string; url: string }[] = EMOTES;
  getGlobalEmoteList()
    .then((list) => {
      if (list.length) pool = list;
    })
    .catch(() => {});

  const platforms: Platform[] = ["twitch", "kick", "x", "youtube"];

  const fire = () => {
    const platform = pick(platforms);
    const name = pick(NAMES);

    // ~7% of demo activity is a sub/gift/bits/raid/superchat event.
    if (Math.random() < 0.07) {
      const ev = pick(EVENT_KINDS)();
      const flags: MessageFlags = {
        broadcaster: false,
        moderator: false,
        vip: false,
        subscriber: ev.kind !== "raid",
        verified: false,
      };
      const evMsg: UnifiedMessage = {
        id: `demo_ev_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        platform,
        channel: "demo",
        username: name,
        displayName: name,
        color: pick(COLORS),
        text: ev.label,
        timestamp: Date.now(),
        badges: [],
        flags,
        event: ev,
      };
      evMsg.intelligence = analyze(ev.label, flags);
      emit(evMsg);
      return;
    }

    let text = pick(LINES[platform]);
    if (Math.random() < 0.08) text = pick(SCAM_LINES);
    const { badges, flags } = makeBadges(platform);
    let parts: MessagePart[] | undefined;
    if (Math.random() < 0.5) {
      const e = pick(pool);
      parts = [
        { t: "text", v: `${text} ` },
        { t: "emote", name: e.name, url: e.url },
      ];
    }
    const msg: UnifiedMessage = {
      id: `demo_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      platform,
      channel: "demo",
      username: name,
      displayName: name,
      color: pick(COLORS),
      text,
      timestamp: Date.now(),
      badges,
      flags,
      parts,
    };
    msg.intelligence = analyze(text, flags);
    emit(msg);
  };

  // Bursty cadence for a lively feel.
  const interval = setInterval(() => {
    const n = 1 + Math.floor(Math.random() * 2);
    for (let i = 0; i < n; i++) setTimeout(fire, Math.random() * 450);
  }, 850);

  return { stop: () => clearInterval(interval) };
}

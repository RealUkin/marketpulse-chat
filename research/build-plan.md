# Build Plan — Unified Crypto-Native Chat Command Center

Working name: **MarketPulse Chat** (TBD — alternatives: PulseDeck, OmniChat, Cauldron, ChatPit). Synthesized + fact-checked from Claude research + 5 cross-checked AIs. See [technical-findings.md](technical-findings.md) for protocol details.

## Thesis
*"The first beautiful, web-native, crypto-intelligent chat command center — and the only one that genuinely reads X **live-broadcast** chat."* Built for crypto multi-streamers (Banks/Ansem/Polymarket).

## Locked decisions (verified)
- **X auth:** guest tokens are DEAD (since 2023-07-01). Reading needs a logged-in **burner account**. → Playwright (headful) + WebSocket-frame interception is PRIMARY. Do NOT build the raw guest-token Node driver.
- **X framing in the PUBLIC repo:** ship it as a pluggable, honestly-labeled `XLiveConnector (experimental)` adapter. Always keep **Demo Mode** + replay fallback so the live demo NEVER depends on the scrape. [decision: confirm with user]
- **Twitch:** `tmi.js` anonymous IRC (no auth). Architect badges so we can later swap to EventSub.
- **Kick:** unofficial Pusher WS (`32cbd69e4b950bf97679`, channel `chatrooms.{id}.v2`, `auth:""`). Cloudflare on slug→id lookup → headless fetch or hardcode demo IDs.
- **All pasted AI code is blueprint-only** (transcription artifacts). Write clean; confirm X frame schema live.

## Architecture
```
TwitchAdapter ─┐
KickAdapter   ─┤→ normalizeMessage() → intelligenceEngine() → WS server → { Dashboard, OBS overlay }
XAdapter      ─┤
DemoAdapter   ─┘
```
Node backend runs all adapters (tmi.js, Pusher, Playwright), normalizes, runs the intelligence pass, fans out over ONE WebSocket. Next.js frontend renders dashboard + `/overlay` route.

## Unified message schema (final)
```ts
type Platform = 'twitch' | 'kick' | 'x';
interface UnifiedMessage {
  id: string; platform: Platform; roomId: string;
  username: string; displayName?: string; avatarUrl?: string; userColor?: string;
  text: string; timestamp: number;
  badges: { type: 'broadcaster'|'moderator'|'vip'|'subscriber'|'verified'|'sub_gifter'|'bits'|'staff'|'unknown'; label: string; count?: number }[];
  flags: { sub: boolean; mod: boolean; vip: boolean; broadcaster: boolean; verified: boolean };
  intelligence?: { tickers: string[]; sentiment: 'bullish'|'bearish'|'neutral'; isQuestion: boolean; isHighValueUser: boolean; priorityScore: number };
  raw?: unknown;
}
```

## Feature priorities
**P0 — must be flawless for the demo**
- One real-time feed, Twitch + Kick + X, with source labels + platform colors (Twitch `#9146FF`, Kick `#53fc18`, X mono white/black).
- Normalized badges: broadcaster/mod/VIP/sub/verified/sub-gifter.
- Filter by platform, search, pause feed, pin/highlight.
- OBS overlay route (`/overlay?...`, transparent, auto-expire, slide-in animation).
- **Demo Mode** — works instantly, zero API setup (the failsafe for judging).

**P1 — the crypto-native edge (Hype Intelligence panel)**
- `$ticker`/cashtag detection (regex `\$[A-Z]{2,6}`).
- Top tickers leaderboard (10-min sliding window).
- Bullish/bearish/neutral sentiment (lexicon + emoji: 🚀📈"moon/long/alpha" vs 🐻📉"dump/rug/scam").
- Hype velocity (msgs/min by platform) + cross-platform heat (who's driving convo).
- High-value users (verified X / Twitch subs / Kick mods+VIPs).
- Unanswered questions (ends with `?`, ranked by user weight, not yet pinned).
- Alert feed ("$BTC mentioned 30× in 60s").
- **💎 Polymarket live odds** — when a topic/ticker spikes, show the matching market's Yes/No probability. Direct sponsor tie-in.

**P2 — only if core is stable**
- Accounts/saved rooms, custom themes, transcript export, AI summary, reply-back/moderation, user profile drawer.

## Performance & resilience (signals real engineering — bake in from start)
- Throttle sockets → `useRef` buffer → flush to React state every ~100ms.
- Sliding window: cap rendered messages at ~150, evict oldest.
- Virtualized list (`@tanstack/react-virtual`).
- Reconnect: exponential backoff + jitter `min(30s, 1s·2^attempt) ± jitter`.
- Sanitize every message with DOMPurify before render.
- Tests: Vitest for parsers, Playwright E2E for disconnect/reconnect.

## Demo video (~3 min, hook-first)
1. Open ON the live running app (no slides). Twitch + Kick + X messages flowing into one feed.
2. Source labels + platform colors + normalized badges.
3. Filter to one platform; search `$BTC` / "Polymarket".
4. Pin a message; open the OBS overlay.
5. Hype Intelligence: tickers, sentiment, top users, unanswered questions — **Polymarket odds** lighting up.
6. Simulate a disconnect → graceful auto-reconnect (proves it's not fragile vibe code).
7. Close on GitHub repo (clean structure, README, tests).
Tagline: *"Existing tools merge chat. This one helps crypto streamers understand it."*

## Repo structure
```
.github/workflows/   # lint + unit tests on push
src/
  adapters/          # twitch.ts kick.ts x.ts demo.ts
  lib/               # normalizer.ts intelligence.ts security.ts (DOMPurify)
  server/            # ws server + connection manager
  app/               # Next.js: dashboard + /overlay
  components/        # ChatFeed, MessageRow, HypePanel, Controls
  types/             # unified schema
tests/               # unit (parsers) + e2e (reconnect)
README.md            # architecture + protocols + demo embed
```

## 7-day timeline (Thu Jun 4 → submit Wed Jun 10)
- **D1 (today):** scaffold + Twitch + Kick → unified feed + Demo Mode. (X spike once burner ready.)
- **D2:** X spike (Playwright WS-intercept) → X adapter.
- **D3:** per-platform styling, badges, virtualized feed + batching.
- **D4:** creator controls + OBS overlay.
- **D5:** Hype Intelligence + Polymarket odds.
- **D6:** polish, README, tests, deploy + dry-run.
- **D7 (Wed):** record demo, final QA, submit.

## Build-time confirmations (don't block planning)
- Exact X live video-broadcast chat text field (sniff one live broadcast).
- Polymarket public API endpoints (Gamma markets / CLOB prices).
- Kick `kick.com/api/v2/channels/{slug}` reachable from Node vs needs headless.

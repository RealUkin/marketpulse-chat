# Technical Findings — MarketBubble Unified Chat Aggregator

Verified across Claude deep-research + repo-mining agent + cross-checked AI input (Gemini/ChatGPT/DeepSeek/Grok). Last updated 2026-06-04.

## TL;DR risk map
- **Twitch — LOW risk.** Anonymous IRC via `tmi.js`. ~30-line adapter, no auth. Done in <1 day.
- **Kick — LOW/MED risk.** Unofficial Pusher WebSocket; copyable MIT code exists. Only snag: Cloudflare on the slug→id lookup. ~1 day.
- **X — HIGH risk (the whole game).** Two paths: a semi-API (Periscope/pscp.tv "chatman") that **must be validated Day 1**, with **Playwright DOM scraping as the safe default fallback**.

---

## TWITCH (low risk)
- Endpoint: `wss://irc-ws.chat.twitch.tv:443`
- Anonymous read: connect as `NICK justinfan<random>` (no token). `tmi.js` does this automatically — just `new tmi.Client({ channels: [...] })`.
- Request tags: `CAP REQ :twitch.tv/tags twitch.tv/commands twitch.tv/membership` (tmi.js handles this).
- Message metadata arrives in `tags`: `badges` (`broadcaster/1`, `moderator/1`, `subscriber/N`, `vip/1`, `founder/0`), `color` (hex), `display-name`, `mod`, `subscriber`, `emotes`.
- Library: **`tmi.js`** (low-maintenance but works fine for anon read). Upgrade to `@twurple/eventsub-ws` only if we later add sub/raid/follow events (needs app token — heavier).

## KICK (low/med risk)
- Pusher WebSocket: `wss://ws-us2.pusher.com/app/32cbd69e4b950bf97679?protocol=7&client=js&version=7.6.0&flash=false`
  - App key `32cbd69e4b950bf97679`, cluster `us2`.
- Subscribe (anonymous, no auth): `{"event":"pusher:subscribe","data":{"auth":"","channel":"chatrooms.{chatroomId}.v2"}}`
- Chat event: `App\Events\ChatMessageEvent`. **Kick double-encodes** — the chat object is a JSON *string* inside the Pusher frame's `data`, so `JSON.parse` twice.
- Resolve slug → chatroomId: `GET https://kick.com/api/v2/channels/{slug}` → `chatroom.id`.
  - ⚠️ **Cloudflare-fronted** — Node `fetch` may 403. Mitigations: browser-like UA/headers, headless fetch (Playwright), or **hardcode chatroom IDs for demo channels**.
- Badges: `sender.identity.badges` = array of `{ type, text, count? }`. Roles (priority high→low): `broadcaster, moderator, staff, founder, og, vip, subscriber, sub_gifter`. Detect: `mod = type==="moderator"`, `vip = type==="vip"`, `sub = type==="subscriber"` (count = months). Color: `sender.identity.color`.
- Library: **`@retconned/kick-js`** (TypeScript, **MIT**) — copy `src/core/websocket.ts`, `src/core/kickApi.ts`, `src/core/messageHandling.ts`, `src/types/events.ts`. Or `pusher-js` if rolling our own.

## X / TWITTER (high risk, but CRACKED — clear 8/10 demo path)
**Confirmed: X "Go Live" video broadcasts still expose a public live chat in 2026.** Any logged-in account can read it (gated only by host audience controls; chat auto-disables above ~5,000 concurrent viewers). No official API — but a reliable unofficial path exists.

**Hard constraints:**
- **Guest-token access died 2023-07-01.** Reading now requires **logged-in session cookies** (`auth_token` + `ct0`) → we need a **dedicated burner X account** (small ToS/ban risk; fine for a demo). Never use the main account.
- Transport is a **"chatman" WebSocket** (no longer PubNub): `wss://{endpoint}/chatapi/v1/chatnow`, `Origin: https://x.com`.

### ✅ Recommended — Playwright (HEADFUL, logged-in) + WebSocket-frame interception  [robustness 8/10 — SPIKE FIRST]
- Run **headful** Chromium (X flags headless), logged in via a persisted burner `storageState`.
- Open the live broadcast page; attach `page.on('websocket')` → read `framereceived` on the `chatapi/v1/chatnow` socket.
- You get the **exact structured JSON** the native app sees — immune to DOM/`data-testid` churn. Relay frames into our own `ws` feed. The browser does all the auth/token/cookie work; failure mode (re-login) is recoverable.
- Handshake/frame reference: **elizaOS `agent-twitter-client`** `ChatClient` (Spaces + video broadcasts share this transport).
- ⚠️ Spike gap (~1hr): confirm the exact **text** field for *video-broadcast* chat bodies (vs Spaces reactions) by sniffing one live broadcast in DevTools.

### Fallbacks (in order)
- **Native API port (no browser)** [6/10]: `live_video_stream/status/{media_key}` → `POST proxsee.pscp.tv/api/v2/accessChatPublic {chat_token}` → chatman WS, sending cookies + bearer + `x-csrf-token: ct0` (+ header `X-Periscope-User-Agent: Twitter/m5`). Leaner/native real-time; brittle on auth. Optional production target *after* the spike proves the data shape.
- **Replay history** [7/10, NOT live]: `POST chatman-replay-{region}.pscp.tv/chatapi/v1/history {access_token, cursor, limit, since}` → 1000-entry batches. Useless live, but great to **build/test the message UI offline** + backfill. Schema ref: `IgnatBeresnev/periscope-chat-downloader` (Kotlin, MIT).
- **DOM scrape** [3/10]: last resort; selectors churn.
- **Demo Mode** (always-on net): `DemoAdapter` emits realistic mock messages for all 3 platforms so judges see it working instantly. Real adapters behind env vars.

**Demo-day hygiene:** pre-log-in the burner account; keep viewer concurrency low (5k cutoff + rate limits); keep the replay/demo path canned as a fallback if the live room is quiet.
**Dead — don't bother:** old Periscope/PubNub (`OpenPeriscope`), guest-token paths [1/10].

---

## Unified message schema
```ts
type PlatformSource = 'twitch' | 'kick' | 'x';
interface UnifiedChatMessage {
  source: PlatformSource;
  id: string;
  user: { username: string; displayName: string; color?: string; avatarUrl?: string };
  text: string;
  badges: { sub: boolean; mod: boolean; vip: boolean; broadcaster: boolean; verified?: boolean; raw: string[] };
  timestamp: number; // ms epoch
}
```
One **adapter per source** maps native payload → this; fan all three into one `ws` stream to the Next.js client. (Mirrors Social Stream Ninja's architecture without copying its GPL code.)

## Architecture & performance patterns (adopt these — they signal real engineering)
- **Throttled batching:** push socket events into a `useRef` buffer; flush to React state every ~100ms in one pass (avoids per-message re-render).
- **Sliding window:** keep ~150 messages in DOM; evict oldest.
- **Virtualized list:** `@tanstack/react-virtual` or `react-window` — render only visible rows.
- **Reconnect:** exponential backoff + jitter `min(maxDelay, base * 2^attempt) ± jitter`.
- **Security:** sanitize every message with **DOMPurify** before render (chat = untrusted → XSS). Never `dangerouslySetInnerHTML` raw.
- **Tests:** Vitest unit tests for each parser; Playwright E2E for disconnect/reconnect. Shows judges it's not happy-path-only vibe code.

## Reusable repos + LICENSE rules (we publish a PUBLIC repo)
| Repo | Lang | License | Use |
|---|---|---|---|
| `retconned/kick-js` | TS | **MIT** | **Copy** Kick core files |
| `IgnatBeresnev/periscope-chat-downloader` | Kotlin | **MIT** | Port X/Periscope flow |
| `Fixlation/Mergerino` | C++ | **MIT** | Port/cross-check logic |
| `Bukk94/KickLib` | C# | **MIT** | Cross-check Kick model |
| `steveseguin/social_stream` | JS | **GPL-3.0** | ⚠️ Patterns ONLY (don't copy) |
| `Enubia/ghost-chat` | TS | **NOASSERTION** | ⚠️ Patterns ONLY (no license = unsafe) |
| `tmi.js` | JS | MIT | Twitch dependency |

Rule: **MIT/Apache = safe to copy. GPL/AGPL = read for patterns, write our own. No-license = do not copy.**

## npm dependencies (planned)
`next react react-dom tailwindcss` · `ws` (server↔client feed) · `tmi.js` (Twitch) · `@retconned/kick-js` or `pusher-js` (Kick) · `playwright` (X scrape + Cloudflare-bypass fetch) · `isomorphic-dompurify` (XSS) · `@tanstack/react-virtual` (perf) · dev: `vitest @playwright/test`

## Day-1 validation checklist
1. **X spike (priority):** Playwright headful + logged-in burner `storageState` → open a live X broadcast → `page.on('websocket')` → capture `chatapi/v1/chatnow` `framereceived` → confirm the live chat text message JSON shape.
2. Confirm Kick `kick.com/api/v2/channels/{slug}` is reachable from Node or needs a headless fetch (Cloudflare).
3. Stand up `tmi.js` anon read on a busy channel → messages in console.

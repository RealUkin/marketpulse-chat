# MarketPulse Chat

**The first beautiful, web-native, crypto-intelligent chat command center — and the only one that genuinely reads X _live-broadcast_ chat.**

Built for the [Market Bubble](https://x.com/MarketBubble) **$10,000 Vibe Code Challenge**: a unified, real-time chat aggregator that merges **Twitch + X + Kick** (plus a bonus **YouTube** adapter) into one feed with per-source labels — then goes further with full emote support (incl. 7TV/BTTV/FFZ + sub emotes), normalized roles, a crypto-native intelligence panel, live Polymarket odds, and an OBS overlay.

> Existing tools (Restream, Streamlabs, StreamElements, Social Stream Ninja, Streamer.bot) *merge* chat. MarketPulse helps crypto streamers **understand** it.

---

## ✨ Features

- **Unified real-time feed** — Twitch, X, Kick, and YouTube in one stream, each message tagged with a colored source badge (Twitch purple, Kick green, X mono, YouTube red) and a per-user avatar.
- **Normalized identity & roles** — broadcaster / mod / VIP / subscriber (with months) / member / verified, mapped to one consistent badge system across every platform.
- **Full emote support** — native emotes + **channel sub emotes** + **7TV / BTTV / FFZ** (Twitch) and **7TV** (Kick) third-party emotes + YouTube emojis, all rendered as images. Plus an **emote "pop"** effect in the overlay when chat spams.
- **🔥 Hype Intelligence panel** (built for a trading audience):
  - Live **$ticker / cashtag** detection, highlighted inline + ranked leaderboard
  - **Bullish / bearish / neutral** sentiment meter
  - **Hype velocity** (messages/min) and most-active users
  - **Unanswered questions** queue, weighted by user role
- **💸 Live Polymarket odds** — pulls active markets from Polymarket's public API and shows live Yes/No probabilities (the challenge is *presented by Polymarket*).
- **Crypto = optional** — the whole Hype Intelligence panel toggles off for a clean, non-crypto-friendly chat. Most streamers aren't traders; the chat is the hero.
- **🛡️ Crypto scam/link defense** — flags phishing links, wallet/contract addresses, and scam phrases (free-nitro, "double your", airdrop / connect-wallet) with a ⚠ marker + a Safety panel. Nobody else protects crypto chats.
- **🎛️ Connect-platforms modal** — toggle each platform on/off and add your channel (your multistream picker). No login needed to read chat — the key edge over Restream.
- **⭐ Feature-on-stream** — star any message to broadcast it as a large featured banner on the OBS overlay.
- **💬 Reply from the app** — sign in with Twitch (your token stays in *your* browser) and post to your chat without leaving the command center.
- **🛡️ Moderate from the app** — delete, timeout, or ban from any Twitch message (official Helix API), so you can run chat without your native dock. Pairs with scam detection for **one-click bans**.
- **Creator controls** — per-platform filters, search, keyword/@mention highlight, sound-on-new-message, pause/clear, and a 5-preset accent **theme switcher**.
- **🎥 OBS overlay mode** — a transparent `/overlay` route (browser source) with emote "pop" + the featured banner.
- **🧪 Demo Mode** — realistic synthetic chat across all four platforms, so the app works **instantly with zero API keys** (and never breaks on camera).
- **Production-grade plumbing** — throttled batch rendering, capped sliding-window buffer, exponential-backoff reconnect — smooth even under heavy chat.

## 🏗️ Architecture

```
 Twitch (tmi.js)  ─┐
 Kick (Pusher WS) ─┤→ normalize() → intelligence() → WS server :3001 → ┬→ Dashboard (Next.js :3000)
 X (Playwright)   ─┤                                                    └→ OBS overlay (/overlay)
 Demo generator   ─┘
```

A standalone **Node ingestion server** connects to each platform, maps every message into one `UnifiedMessage` schema, annotates it with chat intelligence, and fans it out to browser clients over a single WebSocket. The **Next.js** client renders the dashboard and the OBS overlay.

## 🔌 Platform integrations

| Platform | How it reads chat | Auth |
|---|---|---|
| **Twitch** | Anonymous IRC over WebSocket via `tmi.js` | None — any public channel |
| **Kick** | Unofficial Pusher WebSocket (`chatrooms.{id}.v2`); chatroom ID resolved via Kick's API with a **headless-browser fallback** for Cloudflare | None (read-only) |
| **X / Twitter** | **Playwright** opens the live broadcast and **intercepts the `chatapi/v1/chatnow` WebSocket frames** — the same structured JSON the native client receives | Logged-in **burner** session (see below) |
| **YouTube** *(bonus)* | Live chat via no-key **innertube** (`youtube-chat`) — messages, member/mod/owner badges, native emojis | None |

> **Why Playwright for X?** X has no official live-chat API, and guest-token access was removed in 2023. Letting a logged-in browser do the auth and reading the chat *socket frames* (not the DOM) is the most robust path — immune to UI redesigns.

## 🚀 Quick start

```bash
npm install
npm run dev          # starts the Next.js app (:3000) + ingestion server (:3001)
# open http://localhost:3000  — Demo Mode is on by default
```

To connect **real** channels, enter a Twitch and/or Kick channel name, untick **Demo Mode**, and hit **Connect**.

## 🎥 OBS overlay

Add a **Browser Source** in OBS pointing at:

```
http://localhost:3000/overlay?twitch=<channel>&kick=<channel>&youtube=<channelId>&x=<broadcastId>&max=18
```

Transparent background, compact chips, source-colored, newest at the bottom. Use `?demo=1` to preview.

## 🐦 Enabling X live chat (burner account)

X requires a logged-in session to read live-broadcast chat. **Use a throwaway account, never your main.**

```bash
npm run x:login      # opens a browser — log into your burner, press Enter to save x-auth.json
```

Then enter the broadcast URL (or ID) in the **X** field and Connect. `x-auth.json` is gitignored and never committed.

## 💬 Reply from the app (Twitch sign-in)

Reading chat needs **no login**. To *reply* and *moderate* (delete / timeout / ban) from inside the app, sign in with your own Twitch account — a 2-minute, one-time setup:

1. Go to the [Twitch Developer Console](https://dev.twitch.tv/console/apps) → **Register Your Application**.
2. Set **OAuth Redirect URL** to exactly `http://localhost:3000`, category *Application Integration*.
3. Copy the **Client ID** and put it in a local `.env.local` file (see [`.env.example`](.env.example)):
   ```
   NEXT_PUBLIC_TWITCH_CLIENT_ID=your_client_id_here
   ```
4. Restart `npm run dev`, then click **Sign in with Twitch** under the feed and authorize.

Your access token is stored only in your browser's `localStorage` and sent only to your local ingestion server to post or moderate. It is **never committed** and there is no client secret. Scopes requested: `chat:read chat:edit` (read + post) plus `moderator:manage:banned_users` and `moderator:manage:chat_messages` (timeout / ban / delete, on channels you moderate).

## ⚙️ Environment variables

| Var | Purpose |
|---|---|
| `WS_PORT` | Ingestion server port (default `3001`) |
| `NEXT_PUBLIC_WS_URL` | WS URL the client connects to (default `ws://localhost:3001`) |
| `NEXT_PUBLIC_TWITCH_CLIENT_ID` | Twitch app Client ID — enables **Sign in with Twitch** to reply (read-only works without it) |
| `X_HEADLESS=1` | Run the X browser headless (default headful; X flags headless) |
| `KICK_CHATROOM_<SLUG>` | Hardcode a Kick chatroom ID for guaranteed demo reliability |

## 🧪 Tests

```bash
npm test             # Vitest unit tests for the intelligence engine
```

## 🧱 Tech stack

Next.js 14 · React 18 · TypeScript · Tailwind CSS · Node `ws` · `tmi.js` · Playwright · Vitest.

## 📦 Project layout

```
server/            Node ingestion server
  adapters/        twitch.ts · kick.ts · x.ts · demo.ts
  polymarket.ts    Polymarket Gamma API client
  browser.ts       shared Playwright provider
shared/            types.ts (UnifiedMessage) · intelligence.ts
src/app/           dashboard (page.tsx) + /overlay
src/components/    ChatFeed · MessageRow · Badge · HypePanel
src/lib/           useChatSocket (WS client) · platform meta
```

## 🔒 Security & privacy

- **No credentials in this repo.** Reading chat needs no login (Twitch / Kick / YouTube are read anonymously), so nothing sensitive is ever committed.
- **Your X session stays local.** `npm run x:login` saves a *burner* session to `x-auth.json`, which is **gitignored and never committed** — clone the repo and you'll find no trace of anyone's account.
- **Account tokens (future OAuth)** live only in local, gitignored files (`.env.local` / `.auth/`); the app reads them at runtime and they never enter git history.
- Chat messages are **sanitized before render** (no raw HTML injection), and the ingestion server only relays chat/feature events — it persists nothing.

## ⚠️ Notes

The Kick (Pusher) and X (broadcast chat) integrations use unofficial/undocumented endpoints and are intended for personal/educational use. Demo Mode requires nothing and always works.

---

Built with [Claude Code](https://claude.com/claude-code) for the Market Bubble $10K Vibe Code Challenge · MIT licensed.

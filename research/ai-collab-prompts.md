# Multi-AI Collaboration Prompts

Paste each prompt into the matching AI, then bring the answers back to Claude to fact-check and integrate.
**Priority order:** Grok (X chat) > Gemini (Kick) > ChatGPT (strategy) > DeepSeek (Kick code).

---

## 🟦 GROK — X live-chat internals (HIGHEST PRIORITY)

```
I'm building a tool that reads the LIVE CHAT from an X (Twitter) live VIDEO broadcast in real time and shows it in my own web app. I need the exact technical mechanism as of 2026.

1. When someone goes Live on X (video), how is the live chat delivered to viewers technically — the Periscope-derived "chatman" websocket, a GraphQL endpoint, or something else?
2. What are the exact internal endpoints (e.g. a live_video_stream/status or accessChat call that returns a chat token + websocket URL), and what auth (guest token, bearer, cookies) is needed to subscribe READ-ONLY as a viewer?
3. The JSON format of incoming chat messages (fields for username, text, timestamp, badges/superfans).
4. Any maintained open-source repos (ANY language) that already read X/Periscope live broadcast chat — link them.
5. If there's no clean API, the most robust Playwright approach: exact DOM selectors for the live-chat container on a broadcast page, and whether a logged-in session is required.
Be specific and technical, give code if you can, and flag anything X changed recently.
```

---

## 🟩 GEMINI — Kick Pusher + best repos

```
I'm building a TypeScript/Node + Next.js real-time chat aggregator merging Twitch, X, and Kick live chat. Do deep web research WITH SOURCE LINKS:

1. The current (2025-2026) way to read Kick.com live chat client-side via their Pusher websocket: the public Pusher app key, the cluster, the channel name format (e.g. chatrooms.<id>.v2), how to get a channel's chatroom_id from its slug, and the JSON shape of chat messages — including how subscriber / moderator / VIP / OG badges appear.
2. Has Kick shipped official client-side WebSocket chat yet (vs webhooks-only) as of mid-2026? Check docs.kick.com changelog + GitHub issues.
3. The best-maintained open-source repos for multi-platform chat aggregation, Kick chat, and Twitch chat — note each repo's LICENSE.
Be precise about exact keys/strings/endpoints and cite every fact.
```

---

## 🟧 ChatGPT — strategy + demo video

```
Act as a senior engineer + hackathon coach. I have ONE WEEK to build and demo a unified live-chat aggregator (Twitch + X + Kick → one real-time feed) for a $10,000 "vibe code" challenge judged by crypto/streamer personalities (ex-FaZe CEO Banks, crypto trader Ansem) who stream on X + Twitch weekly. Stack: Next.js + Node + WebSocket + Playwright.

Give me: (1) a critique of this architecture + the top 3 technical risks with mitigations; (2) the 5 features most likely to win THESE judges (polish, on-stream usefulness, crypto-native vibe); (3) a shot-by-shot script for a 3-minute demo video that would wow them; (4) a README structure that signals quality fast. Be concrete and opinionated.
```

---

## 🟪 DeepSeek — Kick Pusher implementation (second opinion)

```
You're a senior TypeScript engineer. Give me a robust implementation plan + working code to read Kick.com live chat in Node via their Pusher websocket (no official client WS exists; webhooks need a hosted endpoint I want to avoid).

Provide: (1) Node/TS code to connect to Kick's Pusher, resolve a channel's chatroom_id from its slug, subscribe to the chat channel, and emit normalized {platform, user, color, text, badges, timestamp} objects; (2) how to detect subscriber/moderator/VIP from the payload; (3) reconnect/heartbeat + rate-limit handling. Note any assumptions about Kick's current Pusher key/protocol I should verify.
```

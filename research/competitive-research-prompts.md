# Competitive & Next-Feature Research Kit (for multi-AI collaboration)

How to use: paste the **PROJECT CONTEXT** block at the top of any AI chat first, then paste one of the research prompts below. Bring answers back to Claude to verify + integrate.

---

## 🔵 PROJECT CONTEXT (paste this first, every time)

```
I'm building a web-based unified live-chat aggregator for the MarketBubble $10,000 "Vibe Code Challenge" (deadline June 11, 2026). It merges Twitch + X + Kick live chat into ONE real-time feed with per-source labels and normalized sub/mod/VIP/verified badges.

Planned features: creator controls (filter by platform, search, pin/highlight, keyword alerts), an OBS overlay mode, and a crypto-native "Hype Intelligence" panel (live $ticker mentions, bullish/bearish sentiment, top/most-active users, and questions the streamer hasn't answered).

Stack: Next.js + React + Tailwind + Node + WebSocket. Twitch via tmi.js (anonymous IRC), Kick via the Pusher WebSocket, X via Playwright WebSocket-frame interception of the live broadcast chat.

The judges are crypto/streamer personalities (FaZe Banks, Ansem) who multi-stream on X + Twitch for a Polymarket prediction-market show. My goal is to BEAT existing tools (Restream, Streamlabs, StreamElements, OWN3D, Social Stream Ninja, Streamer.bot, Chatterino) specifically on X support, design polish, and crypto-native intelligence.
```

---

## ♻️ REUSABLE REQUEST TEMPLATE (fill in the blanks for any future research)

```
[paste PROJECT CONTEXT first]

WHAT WE'RE ALREADY DOING:
- <current / planned features>

WHAT WE'RE CONSIDERING DOING NEXT:
- <the new idea or direction>

YOUR RESEARCH TASK:
- <the specific questions you want answered>

DELIVER: <format — comparison table / ranked list / pros-cons / code approach>, with source links.
```

---

## 🟩 PROMPT A — Competitive teardown  (best for: Gemini)

```
[paste PROJECT CONTEXT first]

Research my competitors and give me a SOURCED comparison. For each of: Restream Chat, Streamlabs Chat Box, StreamElements, OWN3D Pro Multi-Chat, Social Stream Ninja, Streamer.bot, Chatterino —
1. Which platforms it reads chat from (and SPECIFICALLY whether it supports X/Twitter live chat and Kick).
2. Pricing / free tier.
3. Standout features.
4. Its biggest limitations and the most common user complaints (pull from reviews, Reddit, forums).

Then give me a "GAPS NOBODY FILLS" list — things streamers want that none of these do well.
DELIVER: a comparison table + the gaps list, with source links.
```

## 🟧 PROMPT B — Differentiation strategy  (best for: ChatGPT)

```
[paste PROJECT CONTEXT first]

Given those competitors, brainstorm 10 features that would make a crypto/trading streamer choose MY tool over Restream/Streamlabs. For each feature, rate:
(a) impact for THESE specific judges (Banks / Ansem / Polymarket audience), and
(b) how realistically I can build it in the remaining ~6 days.
Then label each: "table stakes", "strong differentiator", or "wow-factor".
Recommend the 3 to prioritize and the 3 to skip. Be opinionated.
```

## 🟦 PROMPT C — Crypto-native intelligence  (best for: Grok)

```
[paste PROJECT CONTEXT first]

I want my "Hype Intelligence" panel tuned for a crypto/Polymarket audience watching live chat. What real-time signals matter most to crypto streamers and traders? Consider: $ticker/cashtag mentions, contract/wallet addresses, bullish vs bearish sentiment, "alpha"/call-out detection, scam/spam/shill detection, references to Polymarket markets or odds, and whale/known-influencer detection.

For each signal: is it feasible to detect in real time from chat text alone? How would you detect it (regex, keyword lists, lightweight ML, or an LLM call)? And how should it be displayed to be genuinely useful live?
DELIVER: a list ranked by usefulness-to-effort.
```

## 🟪 PROMPT D — Power features / cross-platform actions  (best for: DeepSeek)

```
[paste PROJECT CONTEXT first]

Research the technical feasibility of three "power" features and give me concrete approaches + libraries + required auth for each platform (Twitch, Kick, X):
1. Replying to and moderating chat FROM my unified feed back out to each native platform.
2. Matching the same human across platforms (cross-platform identity / leaderboard).
3. Real-time spam / toxicity / scam filtering of incoming messages.
For each: what's realistic in a 1-week build vs what to defer, plus any ToS risks.
```

---

## Reference: our differentiation thesis
- **X live chat** — incumbents can't / do it badly. Our headline.
- **Design** — they're widgets/desktop/clunky; we're a beautiful web command center.
- **Intelligence** — they're dumb pipes; we add sentiment / $ticker / whale / hype.
- **Crypto-native** — none target a trading/Polymarket community; we do.
- **Web-native & shareable** — no install vs desktop + OBS setup.
- One-liner: *"The first beautiful, web-native, crypto-intelligent chat command center — and the only one that genuinely does X."*

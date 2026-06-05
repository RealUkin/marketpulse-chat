# Feature Roadmap (research-backed)

From the streamer pain-point research (Capterra/G2 reviews, OBS forum, competitor analysis of Restream, StreamElements, Streamlabs, Social Stream Ninja, OWN3D, Streamer.bot, Fusion Chat, SleepyChat, Chat Merger ext.).

## The wedge
No single competitor nails ALL of: **clean pro overlay + reliable (no dropped msgs) + cross-platform reply + cross-platform moderation/ban-sync + crypto scam/link defense + X support + turnkey UX.** Our biggest openings: **X support** (rare), **crypto scam defense** (unmet), **reliability**, **free/no YouTube quota**, **pro look out-of-box**.

## Pain points → our status
1. Window juggling / missing messages → unified feed ✅
2. No platform attribution → per-source colored badges ✅
3. **No cross-platform reply from one box** → TODO ("holy grail")
4. **No cross-platform moderation / ban sync** → TODO (biggest moat; needs write auth)
5. Emote breakage (BTTV/7TV/FFZ) → ✅ full support
6. Overlays look cheap/dated → polish in progress (needs user screenshots)
7. Performance/CPU → throttled batching + sliding window ✅
8. Latency / double-posting → reconnect + dedupe-friendly ✅
9. YouTube API quota anxiety → we use **no-key innertube** ✅ (selling point)
10. Paywalls on basics → we're free/OSS ✅
11. TTS abuse → TODO (TTS w/ anti-spam)
12. **Crypto scam/link spam** → ✅ **shipped** (scam/link detection + Safety card + ⚠ markers)

## Build next (ranked, impact / effort)
- **Cross-platform reply box** w/ routing toggle — HIGH / med *(needs per-platform write auth)*
- **Cross-platform ban/timeout sync** — HIGH / high *(moat; Twitch+Kick first)*
- **"Feature this message" → overlay** (gentle fade, queue) — HIGH / med
- **Preset themes + role/theme styling** (no-code, CSS escape hatch) — HIGH / low *(polish; "looks pro instantly")*
- **Unified TTS** w/ char limit + profanity + cooldown + dedupe — med-high / med
- **Bot/command filter + first-time/returning-viewer highlight** — med / low

## Quick wins (~a day each, do during polish)
- 5–10 clean **preset themes** (HIGH/low)
- **Keyword / @mention / VIP highlight** in feed
- **Bot/command filter** toggle + exclude-user list
- **Sound on new message** + threshold alert
- **Density / font-size / timestamp** display controls
- **URL auto-delete toggle** + starter crypto-scam blocklist (detection ✅ done; auto-action TODO)
- **"Feature message" overlay** MVP

## Shipped this phase
✅ Crypto-grade **scam/link detection** (URL + contract/wallet address + scam-phrase regex) → `intelligence.risk`, surfaced as ⚠ markers in the feed + a **Safety card** in the Hype panel. Unit-tested + stream-verified.

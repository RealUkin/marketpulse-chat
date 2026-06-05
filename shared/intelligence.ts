// Lightweight, dependency-free chat intelligence — runs on the server per message.
import type { Intelligence, MessageFlags } from "./types";

// $TICKER / cashtag: 2-6 letters. Avoids matching plain "$5".
const TICKER_RE = /\$[A-Za-z]{2,6}\b/g;

const BULLISH = [
  "moon", "bull", "bullish", "long", "pump", "lfg", "alpha", "buy", "wagmi",
  "ath", "send", "sending", "up only", "gm", "🚀", "📈", "🟢", "💎", "🔥",
];
const BEARISH = [
  "bear", "bearish", "short", "dump", "rug", "scam", "sell", "ngmi", "rekt",
  "crash", "down bad", "dead", "🐻", "📉", "🔴", "💀",
];

export function analyze(text: string, flags: MessageFlags): Intelligence {
  const tickers = Array.from(
    new Set((text.match(TICKER_RE) ?? []).map((t) => t.toUpperCase())),
  );

  const lower = ` ${text.toLowerCase()} `;
  let score = 0;
  for (const w of BULLISH) if (lower.includes(w)) score++;
  for (const w of BEARISH) if (lower.includes(w)) score--;
  const sentiment = score > 0 ? "bullish" : score < 0 ? "bearish" : "neutral";

  const isQuestion = text.trim().endsWith("?");
  const isHighValueUser =
    flags.broadcaster || flags.moderator || flags.vip || flags.verified;

  const priorityScore =
    (flags.broadcaster ? 100 : 0) +
    (flags.moderator ? 40 : 0) +
    (flags.vip ? 25 : 0) +
    (flags.verified ? 25 : 0) +
    (flags.subscriber ? 10 : 0) +
    (isQuestion ? 15 : 0) +
    tickers.length * 5;

  return { tickers, sentiment, isQuestion, isHighValueUser, priorityScore };
}

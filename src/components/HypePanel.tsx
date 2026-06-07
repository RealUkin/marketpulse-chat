"use client";
import { useMemo, type ReactNode } from "react";
import type { MarketInfo, PriceInfo, UnifiedMessage } from "@shared/types";
import { PLATFORM_META } from "@/lib/platform";

const pct = (n: number, d: number) => Math.round((n / (d || 1)) * 100);

const STOP = new Set(
  "the a an and or but to of in on at it is im you your u my me we us he she they them this that for with so do did just got get gonna no yes yeah yep nah lol lmao lmfao omg gg wp ez wtf rip pog poggers kekw lulw based real true fr ngl bro bruh man dude chat stream guys hey hi hello yo sup what when where why how who all out up was are be been have has had not can will would here there now then like oh ok okay too any one".split(
    " ",
  ),
);

function computeStats(messages: UnifiedMessage[]) {
  const tickers: Record<string, number> = {};
  const chatters: Record<string, { count: number; color?: string }> = {};
  const words: Record<string, number> = {};
  let bull = 0;
  let bear = 0;
  let neu = 0;
  const questions: UnifiedMessage[] = [];
  const flaggedMsgs: UnifiedMessage[] = [];
  const events: UnifiedMessage[] = [];
  const now = Date.now();
  let rate = 0;
  for (const m of messages) {
    if (m.event) {
      events.push(m);
      continue;
    }
    for (const t of m.intelligence?.tickers ?? []) tickers[t] = (tickers[t] ?? 0) + 1;
    for (const w of m.text.toLowerCase().split(/[^a-z0-9']+/)) {
      if (w.length < 3 || STOP.has(w) || /^\d+$/.test(w)) continue;
      words[w] = (words[w] ?? 0) + 1;
    }
    const se = m.intelligence?.sentiment;
    if (se === "bullish") bull++;
    else if (se === "bearish") bear++;
    else neu++;
    if (m.intelligence?.isQuestion) questions.push(m);
    if (m.intelligence?.risk === "scam") flaggedMsgs.push(m);
    if (now - m.timestamp < 60_000) rate++;
    const c = chatters[m.displayName] ?? (chatters[m.displayName] = { count: 0, color: m.color });
    c.count++;
  }
  const topTickers = Object.entries(tickers).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const topChatters = Object.entries(chatters).sort((a, b) => b[1].count - a[1].count).slice(0, 5);
  const topWords = Object.entries(words).sort((a, b) => b[1] - a[1]).slice(0, 8);
  return {
    topTickers,
    maxTicker: topTickers.length ? topTickers[0][1] : 1,
    topChatters,
    maxChatter: topChatters.length ? topChatters[0][1].count : 1,
    topWords,
    bull,
    bear,
    neu,
    total: bull + bear + neu,
    rate,
    questions: questions.slice(-4).reverse(),
    flagged: flaggedMsgs.length,
    flaggedMsgs: flaggedMsgs.slice(-3).reverse(),
    events: events.slice(-5).reverse(),
  };
}

const EVENT_ICON: Record<string, string> = {
  sub: "🎉",
  resub: "🎉",
  giftsub: "🎁",
  bits: "💎",
  superchat: "💵",
  raid: "🚀",
  member: "⭐",
  follow: "➕",
};

export function HypePanel({
  messages,
  markets,
  prices,
  crypto,
}: {
  messages: UnifiedMessage[];
  markets: MarketInfo[];
  prices: PriceInfo[];
  crypto: boolean;
}) {
  const s = useMemo(() => computeStats(messages), [messages]);
  const priceMap = useMemo(
    () => Object.fromEntries(prices.map((p) => [p.symbol.toUpperCase(), p])) as Record<string, PriceInfo>,
    [prices],
  );
  const divergence = useMemo(() => {
    for (const [t] of s.topTickers) {
      const p = priceMap[t.replace(/^\$/, "").toUpperCase()];
      if (!p) continue;
      if (p.change24h <= -3) return `🔥 Chat's loud on ${t} while it's ${p.change24h.toFixed(1)}% (24h) — divergence.`;
      if (p.change24h >= 3) return `📈 ${t} is running +${p.change24h.toFixed(1)}% (24h) and chat's on it.`;
    }
    return null;
  }, [s.topTickers, priceMap]);

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between px-0.5">
        <span className="text-[13px] font-bold tracking-tight">
          {crypto ? "🔥 Hype Intelligence" : "📡 Stream Pulse"}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-accent ring-1 ring-accent/25">
          <span className="h-1 w-1 rounded-full bg-accent animate-pulse-dot" /> live
        </span>
      </div>

      <Card title="Chat Velocity">
        <div className="flex items-end gap-2">
          <span className="text-3xl font-black tabular-nums text-bull">{s.rate}</span>
          <span className="mb-1 text-xs text-zinc-500">msgs / min</span>
        </div>
      </Card>

      <Card title="Top Chatters">
        {s.topChatters.length === 0 ? (
          <Empty />
        ) : (
          <div className="flex flex-col gap-1.5">
            {s.topChatters.map(([name, c]) => (
              <div key={name} className="flex items-center gap-2">
                <span className="w-24 shrink-0 truncate text-[13px] font-semibold" style={{ color: c.color ?? "#d4d4d8" }}>
                  {name}
                </span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-800">
                  <div
                    className="h-full rounded-full bg-accent/70"
                    style={{ width: `${Math.min(100, (c.count / s.maxChatter) * 100)}%` }}
                  />
                </div>
                <span className="w-6 shrink-0 text-right text-xs tabular-nums text-zinc-500">{c.count}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title="Trending Now">
        {s.topWords.length === 0 ? (
          <Empty hint="what chat's buzzing about shows up here" />
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {s.topWords.map(([w, c]) => (
              <span
                key={w}
                className="inline-flex items-center gap-1 rounded-full bg-white/[0.06] px-2 py-0.5 text-[12px] text-zinc-300 ring-1 ring-white/5"
              >
                {w}
                <span className="text-[10px] text-zinc-500">{c}</span>
              </span>
            ))}
          </div>
        )}
      </Card>

      <Card title="Recent Moments">
        {s.events.length === 0 ? (
          <Empty hint="subs · gifts · raids · tips show up here" />
        ) : (
          <ul className="flex flex-col gap-1.5">
            {s.events.map((e) => (
              <li key={e.id} className="flex items-center gap-2 text-[12px]">
                <span className="shrink-0">{EVENT_ICON[e.event?.kind ?? "sub"] ?? "✨"}</span>
                <span className="shrink-0 font-semibold text-zinc-200">{e.displayName}</span>
                <span className="truncate text-zinc-400">{e.event?.label}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Chat Mood">
        <div className="flex h-3 overflow-hidden rounded-full bg-ink-800">
          <div className="bg-bull" style={{ width: `${pct(s.bull, s.total)}%` }} />
          <div className="bg-zinc-600" style={{ width: `${pct(s.neu, s.total)}%` }} />
          <div className="bg-bear" style={{ width: `${pct(s.bear, s.total)}%` }} />
        </div>
        <div className="mt-1.5 flex justify-between text-[11px]">
          <span className="text-bull">▲ {pct(s.bull, s.total)}% positive</span>
          <span className="text-zinc-500">{pct(s.neu, s.total)}%</span>
          <span className="text-bear">▼ {pct(s.bear, s.total)}% negative</span>
        </div>
      </Card>

      <Card title="Unanswered Questions">
        {s.questions.length === 0 ? (
          <Empty hint="questions from chat land here so you don't miss them" />
        ) : (
          <ul className="flex flex-col gap-1.5">
            {s.questions.map((q) => (
              <li key={q.id} className="rounded bg-ink-800 px-2 py-1 text-[12px]">
                <span className="font-semibold" style={{ color: q.color ?? "#aaa" }}>
                  {q.displayName}
                </span>
                <span className="text-zinc-400">: {q.text}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {s.flagged > 0 && (
        <Card title="🛡️ Safety — flagged">
          <div className="flex items-end gap-2">
            <span className="text-2xl font-black tabular-nums text-bear">{s.flagged}</span>
            <span className="mb-1 text-xs text-zinc-500">scam / phishing caught</span>
          </div>
          <ul className="mt-2 flex flex-col gap-1">
            {s.flaggedMsgs.map((q) => (
              <li key={q.id} className="truncate rounded bg-red-950/40 px-2 py-1 text-[11px] text-red-200">
                <span className="font-semibold">{q.displayName}</span>: {q.text}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {crypto && (
        <>
          <div className="mt-1 flex items-center gap-2 px-0.5 pt-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-accent">◆ Crypto add-on</span>
            <div className="h-px flex-1 bg-accent/15" />
          </div>

          <Card title="📈 Chat × Market">
            {s.topTickers.length === 0 ? (
              <Empty hint="$tickers mentioned in chat appear here with live prices" />
            ) : (
              <div className="flex flex-col gap-2">
                {s.topTickers.slice(0, 5).map(([t, c]) => {
                  const p = priceMap[t.replace(/^\$/, "").toUpperCase()];
                  return (
                    <div key={t} className="flex items-center gap-2">
                      <span className="w-12 shrink-0 font-mono text-sm font-semibold text-gold">{t}</span>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-800">
                        <div
                          className="h-full rounded-full bg-gold"
                          style={{ width: `${Math.min(100, (c / s.maxTicker) * 100)}%` }}
                        />
                      </div>
                      {p ? (
                        <span className="flex shrink-0 items-baseline gap-1 tabular-nums">
                          <span className="text-[11px] text-zinc-300">{fmtPrice(p.price)}</span>
                          <span className={`text-[11px] ${p.change24h >= 0 ? "text-bull" : "text-bear"}`}>
                            {p.change24h >= 0 ? "▲" : "▼"}
                            {Math.abs(p.change24h).toFixed(1)}%
                          </span>
                        </span>
                      ) : (
                        <span className="w-6 shrink-0 text-right text-xs text-zinc-500">{c}</span>
                      )}
                    </div>
                  );
                })}
                {divergence && (
                  <div className="mt-1 rounded-lg bg-accent/10 px-2 py-1.5 text-[11px] leading-snug text-accent ring-1 ring-accent/20">
                    {divergence}
                  </div>
                )}
              </div>
            )}
          </Card>

          <Card title="Polymarket — Live Odds">
            {markets.length === 0 ? (
              <Empty />
            ) : (
              <div className="flex flex-col gap-2">
                {markets.slice(0, 3).map((mk) => {
                  const yesIdx = mk.outcomes.findIndex((o) => /yes/i.test(o));
                  const yi = yesIdx >= 0 ? yesIdx : 0;
                  const yes = Math.round((mk.prices[yi] ?? 0) * 100);
                  return (
                    <a
                      key={mk.id}
                      href={mk.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block rounded bg-ink-800 p-2 transition-colors hover:bg-ink-700"
                    >
                      <div className="mb-1 line-clamp-2 text-[12px] text-zinc-300">{mk.question}</div>
                      <div className="flex h-2 overflow-hidden rounded-full bg-ink-900">
                        <div className="bg-bull" style={{ width: `${yes}%` }} />
                        <div className="bg-bear" style={{ width: `${100 - yes}%` }} />
                      </div>
                      <div className="mt-1 flex justify-between text-[10px]">
                        <span className="text-bull">YES {yes}%</span>
                        <span className="text-bear">NO {100 - yes}%</span>
                      </div>
                    </a>
                  );
                })}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3.5 shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset]">
      <div className="mb-2.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">{title}</div>
      {children}
    </div>
  );
}

const Empty = ({ hint }: { hint?: string }) =>
  hint ? <div className="text-[11px] leading-snug text-zinc-600">{hint}</div> : <div className="text-xs text-zinc-600">—</div>;

function fmtPrice(n: number): string {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  if (n >= 1) return `$${n.toFixed(2)}`;
  if (n >= 0.01) return `$${n.toFixed(3)}`;
  return `$${n.toPrecision(2)}`;
}

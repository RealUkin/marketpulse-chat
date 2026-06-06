"use client";
import { useMemo, type ReactNode } from "react";
import type { MarketInfo, PriceInfo, UnifiedMessage } from "@shared/types";

const pct = (n: number, d: number) => Math.round((n / (d || 1)) * 100);

function computeStats(messages: UnifiedMessage[]) {
  const tickers: Record<string, number> = {};
  let bull = 0,
    bear = 0,
    neu = 0;
  const questions: UnifiedMessage[] = [];
  const flaggedMsgs: UnifiedMessage[] = [];
  const now = Date.now();
  let rate = 0;
  for (const m of messages) {
    for (const t of m.intelligence?.tickers ?? []) tickers[t] = (tickers[t] ?? 0) + 1;
    const se = m.intelligence?.sentiment;
    if (se === "bullish") bull++;
    else if (se === "bearish") bear++;
    else neu++;
    if (m.intelligence?.isQuestion) questions.push(m);
    if (m.intelligence?.risk === "scam") flaggedMsgs.push(m);
    if (now - m.timestamp < 60_000) rate++;
  }
  const topTickers = Object.entries(tickers).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const maxTicker = topTickers.length ? topTickers[0][1] : 1;
  return {
    topTickers,
    maxTicker,
    bull,
    bear,
    neu,
    total: bull + bear + neu,
    rate,
    questions: questions.slice(-4).reverse(),
    flagged: flaggedMsgs.length,
    flaggedMsgs: flaggedMsgs.slice(-3).reverse(),
  };
}

export function HypePanel({
  messages,
  markets,
  prices,
}: {
  messages: UnifiedMessage[];
  markets: MarketInfo[];
  prices: PriceInfo[];
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
      <div className="flex items-center gap-2 px-0.5">
        <span className="text-[13px] font-bold tracking-tight">🔥 Hype Intelligence</span>
        <span className="rounded-full bg-accent/20 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-accent ring-1 ring-accent/30">
          live
        </span>
      </div>

      <Card title="Hype Velocity">
        <div className="flex items-end gap-2">
          <span className="text-3xl font-black tabular-nums text-bull">{s.rate}</span>
          <span className="mb-1 text-xs text-zinc-500">msgs / min</span>
        </div>
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

      <Card title="📈 Chat × Market">
        {s.topTickers.length === 0 ? (
          <Empty />
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

      <Card title="Sentiment">
        <div className="flex h-3 overflow-hidden rounded-full bg-ink-800">
          <div className="bg-bull" style={{ width: `${pct(s.bull, s.total)}%` }} />
          <div className="bg-zinc-600" style={{ width: `${pct(s.neu, s.total)}%` }} />
          <div className="bg-bear" style={{ width: `${pct(s.bear, s.total)}%` }} />
        </div>
        <div className="mt-1.5 flex justify-between text-[11px]">
          <span className="text-bull">▲ {pct(s.bull, s.total)}% bull</span>
          <span className="text-zinc-500">{pct(s.neu, s.total)}%</span>
          <span className="text-bear">▼ {pct(s.bear, s.total)}% bear</span>
        </div>
      </Card>

      <Card title="Unanswered Questions">
        {s.questions.length === 0 ? (
          <Empty />
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

const Empty = () => <div className="text-xs text-zinc-600">—</div>;

function fmtPrice(n: number): string {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  if (n >= 1) return `$${n.toFixed(2)}`;
  if (n >= 0.01) return `$${n.toFixed(3)}`;
  return `$${n.toPrecision(2)}`;
}

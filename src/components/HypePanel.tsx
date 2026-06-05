"use client";
import { useMemo, type ReactNode } from "react";
import type { MarketInfo, UnifiedMessage } from "@shared/types";

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

export function HypePanel({ messages, markets }: { messages: UnifiedMessage[]; markets: MarketInfo[] }) {
  const s = useMemo(() => computeStats(messages), [messages]);

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold">🔥 Hype Intelligence</span>
        <span className="rounded bg-fuchsia-500/20 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-fuchsia-300">
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

      <Card title="Top Tickers">
        {s.topTickers.length === 0 ? (
          <Empty />
        ) : (
          <div className="flex flex-col gap-1.5">
            {s.topTickers.map(([t, c]) => (
              <div key={t} className="flex items-center gap-2">
                <span className="w-14 font-mono text-sm font-semibold text-gold">{t}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink-800">
                  <div
                    className="h-full rounded-full bg-gold"
                    style={{ width: `${Math.min(100, (c / s.maxTicker) * 100)}%` }}
                  />
                </div>
                <span className="w-6 text-right text-xs text-zinc-500">{c}</span>
              </div>
            ))}
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
    <div className="rounded-lg border border-ink-800 bg-ink-850 p-3">
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{title}</div>
      {children}
    </div>
  );
}

const Empty = () => <div className="text-xs text-zinc-600">—</div>;

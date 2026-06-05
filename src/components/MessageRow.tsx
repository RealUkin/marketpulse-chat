import { memo, type ReactNode } from "react";
import type { UnifiedMessage } from "@shared/types";
import { PLATFORM_META } from "@/lib/platform";
import { Badge } from "@/components/Badge";

function renderText(text: string, tickers: string[]): ReactNode {
  if (tickers.length === 0) return text;
  const parts = text.split(/(\$[A-Za-z]{2,6})\b/g);
  return parts.map((p, i) =>
    /^\$[A-Za-z]{2,6}$/.test(p) ? (
      <span key={i} className="font-semibold text-gold">
        {p.toUpperCase()}
      </span>
    ) : (
      <span key={i}>{p}</span>
    ),
  );
}

function renderBody(m: UnifiedMessage): ReactNode {
  const tickers = m.intelligence?.tickers ?? [];
  if (m.parts && m.parts.length > 0) {
    return m.parts.map((p, i) =>
      p.t === "emote" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={i}
          src={p.url}
          alt={p.name}
          title={p.name}
          loading="lazy"
          className="mx-0.5 inline-block h-5 w-auto align-text-bottom"
        />
      ) : (
        <span key={i}>{renderText(p.v, tickers)}</span>
      ),
    );
  }
  return renderText(m.text, tickers);
}

function Row({ m }: { m: UnifiedMessage }) {
  const meta = PLATFORM_META[m.platform];
  return (
    <div
      className="group flex animate-slide-in gap-2.5 border-l-2 px-3 py-1.5 hover:bg-ink-850/70"
      style={{ borderColor: meta.color }}
    >
      <span
        className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-[11px] font-bold"
        style={{ backgroundColor: meta.color, color: meta.fg }}
        title={meta.label}
      >
        {meta.letter}
      </span>
      <div className="min-w-0 flex-1 text-[14px] leading-snug">
        {m.badges.length > 0 && (
          <span className="mr-1 inline-flex flex-wrap items-center gap-1 align-middle">
            {m.badges.map((b, i) => (
              <Badge key={i} badge={b} />
            ))}
          </span>
        )}
        <span className="font-semibold" style={{ color: m.color ?? meta.color }}>
          {m.displayName}
        </span>
        <span className="text-zinc-500">: </span>
        <span className="break-words text-zinc-200">{renderBody(m)}</span>
      </div>
      <span className="mt-0.5 shrink-0 self-start text-[10px] tabular-nums text-zinc-600 opacity-0 transition-opacity group-hover:opacity-100">
        {new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </span>
    </div>
  );
}

export const MessageRow = memo(Row);

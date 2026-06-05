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

function Row({ m }: { m: UnifiedMessage }) {
  const meta = PLATFORM_META[m.platform];
  return (
    <div
      className="group flex animate-slide-in gap-2.5 border-l-2 px-3 py-1.5 hover:bg-ink-850/70"
      style={{ borderColor: meta.color }}
    >
      <span
        className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-[11px] font-bold"
        style={{ backgroundColor: meta.color, color: m.platform === "x" ? "#000" : "#0b0b0b" }}
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
        <span className="break-words text-zinc-200">
          {renderText(m.text, m.intelligence?.tickers ?? [])}
        </span>
      </div>
    </div>
  );
}

export const MessageRow = memo(Row);

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
          className="-my-1 mx-0.5 inline-block h-6 w-auto align-text-bottom"
        />
      ) : (
        <span key={i}>{renderText(p.v, tickers)}</span>
      ),
    );
  }
  return renderText(m.text, tickers);
}

function Row({ m, highlight }: { m: UnifiedMessage; highlight: string[] }) {
  const meta = PLATFORM_META[m.platform];
  const scam = m.intelligence?.risk === "scam";
  const userColor = m.color ?? meta.color;
  const initial = (m.displayName || "?").charAt(0).toUpperCase();
  const hit =
    !scam && highlight.length > 0 && highlight.some((k) => m.text.toLowerCase().includes(k));

  return (
    <div
      className={`group flex items-start gap-3 px-4 py-1.5 transition-colors animate-slide-in hover:bg-white/[0.035] ${
        scam ? "bg-red-950/30" : hit ? "bg-accent/[0.08] ring-1 ring-inset ring-accent/25" : ""
      }`}
    >
      {/* Avatar with platform badge */}
      <div className="relative mt-0.5 shrink-0">
        {m.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={m.avatarUrl}
            alt=""
            className="h-7 w-7 rounded-full border-2 object-cover"
            style={{ borderColor: `${meta.color}aa` }}
          />
        ) : (
          <div
            className="grid h-7 w-7 place-items-center rounded-full border-2 text-[12px] font-bold"
            style={{ backgroundColor: `${userColor}26`, color: userColor, borderColor: `${meta.color}aa` }}
          >
            {initial}
          </div>
        )}
        <span
          className="absolute -bottom-1 -right-1 grid h-3.5 w-3.5 place-items-center rounded-full text-[7px] font-black ring-2 ring-ink-950"
          style={{ backgroundColor: meta.color, color: meta.fg }}
          title={meta.label}
        >
          {meta.letter.slice(0, 1)}
        </span>
      </div>

      {/* Body */}
      <div className="min-w-0 flex-1 text-[14px] leading-snug">
        <div className="flex items-center gap-1.5">
          {scam && (
            <span
              className="rounded bg-red-500/25 px-1 text-[10px] font-bold uppercase leading-none text-red-300 ring-1 ring-red-500/50"
              title="Flagged: possible scam / phishing"
            >
              ⚠ scam?
            </span>
          )}
          {m.intelligence?.risk === "link" && (
            <span className="text-[11px] text-amber-400/80" title="Contains a link or wallet/contract address">
              🔗
            </span>
          )}
          {m.badges.map((b, i) => (
            <Badge key={i} badge={b} />
          ))}
          <span className="truncate font-semibold" style={{ color: userColor }}>
            {m.displayName}
          </span>
          <span className="ml-auto shrink-0 pl-2 text-[10px] tabular-nums text-zinc-600 opacity-0 transition-opacity group-hover:opacity-100">
            {new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
        <div className="break-words text-[14px] text-zinc-200">{renderBody(m)}</div>
      </div>
    </div>
  );
}

export const MessageRow = memo(Row);

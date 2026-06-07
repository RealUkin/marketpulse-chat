import { memo, type ReactNode } from "react";
import type { EventInfo, UnifiedMessage } from "@shared/types";
import { PLATFORM_META } from "@/lib/platform";
import { Badge } from "@/components/Badge";
import { ITrash, IClock, IBan, IStar, IPin, IGlobe } from "@/components/icons";
import { PlatformLogo } from "@/components/platformLogos";

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

function Row({
  m,
  highlight,
  onFeature,
  canModerate,
  onModerate,
  pinned,
  onPin,
  aiEnabled,
  translation,
  onTranslate,
  badges,
}: {
  m: UnifiedMessage;
  highlight: string[];
  onFeature?: (m: UnifiedMessage) => void;
  canModerate?: boolean;
  onModerate?: (action: "delete" | "timeout" | "ban", m: UnifiedMessage) => void;
  pinned?: boolean;
  onPin?: (m: UnifiedMessage) => void;
  aiEnabled?: boolean;
  translation?: string;
  onTranslate?: (m: UnifiedMessage) => void;
  badges?: Record<string, string>;
}) {
  if (m.event) return <EventRow m={m} />;
  const meta = PLATFORM_META[m.platform];
  const scam = m.intelligence?.risk === "scam";
  const userColor = m.color ?? meta.color;
  const hit =
    !scam && highlight.length > 0 && highlight.some((k) => m.text.toLowerCase().includes(k));

  return (
    <div
      className={`group flex items-start gap-3 px-4 py-1.5 transition-colors animate-slide-in hover:bg-white/[0.035] ${
        scam ? "bg-red-950/30" : hit ? "bg-accent/[0.08] ring-1 ring-inset ring-accent/25" : ""
      } ${pinned ? "opacity-40" : ""}`}
    >
      {/* Platform identity: real avatar (X/YouTube) with a platform corner, else a clean platform chip (native Twitch/Kick have no avatars) */}
      <div className="relative mt-0.5 shrink-0">
        {m.avatarUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={m.avatarUrl}
              alt=""
              className="h-7 w-7 rounded-full border-2 object-cover"
              style={{ borderColor: `${meta.color}aa` }}
            />
            <span
              className="absolute -bottom-1 -right-1 grid h-4 w-4 place-items-center rounded-full ring-2 ring-ink-950"
              style={{ backgroundColor: meta.color, color: meta.fg }}
              title={meta.label}
            >
              <PlatformLogo platform={m.platform} className="h-2.5 w-2.5" />
            </span>
          </>
        ) : (
          <div
            className="grid h-7 w-7 place-items-center rounded-lg"
            style={{ backgroundColor: meta.color, color: meta.fg }}
            title={meta.label}
          >
            <PlatformLogo platform={m.platform} className="h-4 w-4" />
          </div>
        )}
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
          {m.badges.map((b, i) => {
            const img = b.setId && b.version ? badges?.[`${b.setId}/${b.version}`] : undefined;
            return img ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={img}
                alt={b.label}
                title={b.count ? `${b.label} (${b.count})` : b.label}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
                className="inline-block h-[18px] w-[18px] shrink-0 align-text-bottom"
              />
            ) : (
              <Badge key={i} badge={b} />
            );
          })}
          {m.regular ? (
            <span
              className="rounded bg-gold/20 px-1 text-[10px] font-bold uppercase leading-none text-gold ring-1 ring-gold/40"
              title="Regular — a returning viewer"
            >
              ★ regular
            </span>
          ) : m.firstSeen ? (
            <span
              className="rounded bg-emerald-500/20 px-1 text-[10px] font-bold uppercase leading-none text-emerald-300 ring-1 ring-emerald-500/40"
              title="First time chatting this session"
            >
              👋 new
            </span>
          ) : null}
          <span className="truncate font-semibold" style={{ color: userColor }}>
            {m.displayName}
          </span>
          <span className="ml-auto shrink-0 pl-2 text-[10px] tabular-nums text-zinc-600 opacity-0 transition-opacity group-hover:opacity-100">
            {new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
          {m.platform === "twitch" && canModerate && onModerate && (
            <span className="flex shrink-0 items-center gap-1.5 pl-1 opacity-0 transition group-hover:opacity-100">
              <button onClick={() => onModerate("delete", m)} title="Delete message" className="inline-flex items-center text-zinc-500 transition hover:text-amber-400">
                <ITrash />
              </button>
              <button onClick={() => onModerate("timeout", m)} title="Timeout 10 min" className="inline-flex items-center text-zinc-500 transition hover:text-orange-400">
                <IClock />
              </button>
              <button onClick={() => onModerate("ban", m)} title="Ban user" className="inline-flex items-center text-zinc-500 transition hover:text-red-400">
                <IBan />
              </button>
            </span>
          )}
          {onFeature && (
            <button
              onClick={() => onFeature(m)}
              title="Feature this message on stream"
              className="inline-flex shrink-0 items-center pl-1 text-zinc-500 opacity-0 transition hover:text-accent group-hover:opacity-100"
            >
              <IStar />
            </button>
          )}
          {onPin && (
            <button
              onClick={() => onPin(m)}
              title={pinned ? "Unpin" : "Pin to top"}
              className={`inline-flex shrink-0 items-center pl-1 transition hover:text-accent ${
                pinned ? "text-accent opacity-100" : "text-zinc-500 opacity-0 group-hover:opacity-100"
              }`}
            >
              <IPin />
            </button>
          )}
          {aiEnabled && onTranslate && !translation && (
            <button
              onClick={() => onTranslate(m)}
              title="Translate to English"
              className="inline-flex shrink-0 items-center pl-1 text-zinc-500 opacity-0 transition hover:text-accent group-hover:opacity-100"
            >
              <IGlobe />
            </button>
          )}
        </div>
        <div className="break-words text-[14px] text-zinc-200">{renderBody(m)}</div>
        {translation && (
          <div className="mt-0.5 flex items-center gap-1 text-[13px] italic text-zinc-400">
            <IGlobe className="h-3 w-3 shrink-0" /> {translation}
          </div>
        )}
      </div>
    </div>
  );
}

export const MessageRow = memo(Row);

const EVENT_STYLE: Record<EventInfo["kind"], { icon: string; cls: string }> = {
  sub: { icon: "🎉", cls: "from-fuchsia-600/25 to-purple-600/10 text-fuchsia-200 ring-fuchsia-500/40" },
  resub: { icon: "🎉", cls: "from-fuchsia-600/25 to-purple-600/10 text-fuchsia-200 ring-fuchsia-500/40" },
  giftsub: { icon: "🎁", cls: "from-pink-600/25 to-rose-600/10 text-pink-200 ring-pink-500/40" },
  bits: { icon: "💎", cls: "from-cyan-600/25 to-sky-600/10 text-cyan-200 ring-cyan-500/40" },
  superchat: { icon: "💵", cls: "from-emerald-600/25 to-green-600/10 text-emerald-200 ring-emerald-500/40" },
  raid: { icon: "🚀", cls: "from-orange-600/25 to-amber-600/10 text-orange-200 ring-orange-500/40" },
  member: { icon: "⭐", cls: "from-emerald-600/25 to-green-600/10 text-emerald-200 ring-emerald-500/40" },
  follow: { icon: "➕", cls: "from-zinc-600/25 to-zinc-600/10 text-zinc-200 ring-zinc-500/40" },
};

function EventRow({ m }: { m: UnifiedMessage }) {
  const meta = PLATFORM_META[m.platform];
  const ev = m.event!;
  const s = EVENT_STYLE[ev.kind] ?? EVENT_STYLE.sub;
  return (
    <div className={`mx-2 my-1 flex animate-slide-in items-center gap-2.5 rounded-lg bg-gradient-to-r px-3 py-2 ring-1 ${s.cls}`}>
      <span className="text-lg leading-none">{s.icon}</span>
      <span
        className="grid h-4 w-4 shrink-0 place-items-center rounded"
        style={{ backgroundColor: meta.color, color: meta.fg }}
        title={meta.label}
      >
        <PlatformLogo platform={m.platform} className="h-2.5 w-2.5" />
      </span>
      <span className="font-bold text-white">{m.displayName}</span>
      <span className="font-semibold">{ev.label}</span>
    </div>
  );
}

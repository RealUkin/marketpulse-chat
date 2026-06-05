"use client";
import { useEffect, useState, useRef, memo } from "react";
import type { UnifiedMessage } from "@shared/types";
import { useChatSocket } from "@/lib/useChatSocket";
import { PLATFORM_META } from "@/lib/platform";
import { Badge } from "@/components/Badge";

// OBS browser-source overlay: transparent background, compact chips, newest at bottom.
// URL params: ?twitch=<ch>&kick=<ch>&x=<broadcastId>&demo=1&max=18
export default function Overlay() {
  const { messages, subscribe } = useChatSocket();
  const [max, setMax] = useState(18);
  const [pops, setPops] = useState<{ id: string; url: string; left: number }[]>([]);
  const comboRef = useRef<Map<string, { n: number; t: number }>>(new Map());
  const lastIdRef = useRef<string | null>(null);
  const seqRef = useRef(0);

  useEffect(() => {
    document.documentElement.style.background = "transparent";
    document.body.style.background = "transparent";
    const p = new URLSearchParams(window.location.search);
    const twitch = p.get("twitch") ?? undefined;
    const kick = p.get("kick") ?? undefined;
    const x = p.get("x") ?? undefined;
    const demo = p.get("demo") === "1" || (!twitch && !kick && !x);
    const m = parseInt(p.get("max") ?? "18", 10);
    if (!Number.isNaN(m)) setMax(m);
    subscribe({ twitch, kick, x }, demo);
  }, [subscribe]);

  // Emote "pop": when chat spams the same emote, float a big one up the screen.
  useEffect(() => {
    if (messages.length === 0) return;
    let start = 0;
    if (lastIdRef.current) {
      const i = messages.findIndex((m) => m.id === lastIdRef.current);
      start = i >= 0 ? i + 1 : 0;
    }
    const fresh = messages.slice(start);
    lastIdRef.current = messages[messages.length - 1].id;
    const now = Date.now();
    const spawned: { id: string; url: string; left: number }[] = [];
    for (const m of fresh) {
      for (const part of m.parts ?? []) {
        if (part.t !== "emote") continue;
        const rec = comboRef.current.get(part.url);
        if (rec && now - rec.t < 6000) {
          rec.n += 1;
          rec.t = now;
        } else {
          comboRef.current.set(part.url, { n: 1, t: now });
        }
        const cur = comboRef.current.get(part.url)!;
        if (cur.n >= 2) {
          cur.n = 0;
          spawned.push({ id: `pop_${seqRef.current++}`, url: part.url, left: 6 + Math.random() * 80 });
        }
      }
    }
    if (spawned.length) {
      setPops((prev) => [...prev, ...spawned].slice(-14));
      for (const sp of spawned) {
        setTimeout(() => setPops((prev) => prev.filter((x) => x.id !== sp.id)), 2400);
      }
    }
  }, [messages]);

  const shown = messages.slice(-max);

  return (
    <>
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        {pops.map((p) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={p.id}
            src={p.url}
            alt=""
            className="emote-pop absolute bottom-28 h-16 w-auto"
            style={{ left: `${p.left}%` }}
          />
        ))}
      </div>
      <div className="flex min-h-screen flex-col justify-end gap-1 p-3">
        {shown.map((m) => (
          <OverlayRow key={m.id} m={m} />
        ))}
      </div>
    </>
  );
}

const OverlayRow = memo(function OverlayRow({ m }: { m: UnifiedMessage }) {
  const meta = PLATFORM_META[m.platform];
  return (
    <div
      className="flex animate-slide-in items-start gap-2 rounded-lg bg-black/55 px-2.5 py-1.5 text-[15px] leading-snug backdrop-blur-sm"
      style={{ boxShadow: `inset 3px 0 0 ${meta.color}` }}
    >
      <span
        className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-[11px] font-bold"
        style={{ backgroundColor: meta.color, color: meta.fg }}
      >
        {meta.letter}
      </span>
      <div className="min-w-0">
        {m.badges.slice(0, 3).map((b, i) => (
          <span key={i} className="mr-1">
            <Badge badge={b} />
          </span>
        ))}
        <span
          className="font-bold"
          style={{ color: m.color ?? meta.color, textShadow: "0 1px 2px rgba(0,0,0,.85)" }}
        >
          {m.displayName}
        </span>
        <span className="text-white/60">: </span>
        <span className="text-white" style={{ textShadow: "0 1px 2px rgba(0,0,0,.85)" }}>
          {m.parts && m.parts.length > 0
            ? m.parts.map((p, i) =>
                p.t === "emote" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={p.url}
                    alt={p.name}
                    className="mx-0.5 inline-block h-6 w-auto align-text-bottom"
                  />
                ) : (
                  <span key={i}>{p.v}</span>
                ),
              )
            : m.text}
        </span>
      </div>
    </div>
  );
});

"use client";
import { useEffect, useMemo, useState } from "react";
import type { Platform } from "@shared/types";
import { useChatSocket, type StatusMap } from "@/lib/useChatSocket";
import { PLATFORM_META } from "@/lib/platform";
import { ChatFeed } from "@/components/ChatFeed";
import { HypePanel } from "@/components/HypePanel";

const ALL: Platform[] = ["twitch", "kick", "youtube", "x"];

const THEMES = [
  { name: "Violet", rgb: "139 92 246" },
  { name: "Mint", rgb: "34 197 94" },
  { name: "Cyan", rgb: "34 211 238" },
  { name: "Sunset", rgb: "249 115 22" },
  { name: "Gold", rgb: "227 179 65" },
];

export default function Dashboard() {
  const { messages, socketState, status, markets, subscribe, setPaused, clear } = useChatSocket();
  const [twitch, setTwitch] = useState("");
  const [kick, setKick] = useState("");
  const [x, setX] = useState("");
  const [youtube, setYoutube] = useState("");
  const [demo, setDemo] = useState(true);
  const [filters, setFilters] = useState<Set<Platform>>(new Set(ALL));
  const [search, setSearch] = useState("");
  const [paused, setPausedState] = useState(false);
  const [themeIdx, setThemeIdx] = useState(0);
  const [showHype, setShowHype] = useState(true);

  // Apply + persist the accent theme.
  useEffect(() => {
    const saved = Number(window.localStorage.getItem("mp-theme"));
    if (!Number.isNaN(saved) && THEMES[saved]) setThemeIdx(saved);
  }, []);
  useEffect(() => {
    document.documentElement.style.setProperty("--accent", THEMES[themeIdx].rgb);
    window.localStorage.setItem("mp-theme", String(themeIdx));
  }, [themeIdx]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return messages.filter(
      (m) =>
        filters.has(m.platform) &&
        (q === "" || m.text.toLowerCase().includes(q) || m.displayName.toLowerCase().includes(q)),
    );
  }, [messages, filters, search]);

  const toggleFilter = (p: Platform) =>
    setFilters((prev) => {
      const n = new Set(prev);
      if (n.has(p)) n.delete(p);
      else n.add(p);
      return n;
    });

  const togglePause = () => {
    const next = !paused;
    setPausedState(next);
    setPaused(next);
  };

  const onConnect = () =>
    subscribe(
      {
        twitch: twitch.trim() || undefined,
        kick: kick.trim() || undefined,
        x: x.trim() || undefined,
        youtube: youtube.trim() || undefined,
      },
      demo,
    );

  return (
    <main className="flex h-screen flex-col bg-ink-950">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-white/5 bg-ink-950/80 px-5 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-accent to-accent/40 text-sm font-black text-white shadow-lg shadow-accent/25 ring-1 ring-white/10">
            MP
          </div>
          <div>
            <h1 className="text-[15px] font-extrabold leading-none tracking-tight">
              MarketPulse <span className="font-medium text-zinc-500">Chat</span>
            </h1>
            <p className="mt-1 text-[11px] text-zinc-500">
              Twitch · Kick · YouTube · X — one real-time feed
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {ALL.map((p) => (
            <span
              key={p}
              className="hidden items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1 text-[11px] ring-1 ring-white/5 sm:inline-flex"
              title={`${PLATFORM_META[p].label}: ${status[p]}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${dotColor(status[p])}`} />
              <span className="text-zinc-300">{PLATFORM_META[p].label}</span>
            </span>
          ))}
          <div className="ml-1 hidden items-center gap-1.5 border-l border-white/10 pl-3 md:flex">
            {THEMES.map((t, i) => (
              <button
                key={t.name}
                onClick={() => setThemeIdx(i)}
                title={`Theme: ${t.name}`}
                aria-label={`Theme ${t.name}`}
                className="h-3.5 w-3.5 rounded-full ring-1 ring-white/20 transition-transform hover:scale-125"
                style={{
                  background: `rgb(${t.rgb})`,
                  outline: themeIdx === i ? "2px solid rgba(255,255,255,0.85)" : "none",
                  outlineOffset: "1px",
                }}
              />
            ))}
          </div>
        </div>
      </header>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/5 bg-ink-900/50 px-5 py-2.5 text-sm">
        <ChannelInput value={twitch} onChange={setTwitch} placeholder="twitch channel" accent="#9146FF" />
        <ChannelInput value={kick} onChange={setKick} placeholder="kick channel" accent="#53FC18" />
        <ChannelInput value={youtube} onChange={setYoutube} placeholder="youtube id/url" accent="#FF0033" />
        <ChannelInput value={x} onChange={setX} placeholder="x broadcast url/id" accent="#E7E9EA" />

        <label className="flex cursor-pointer select-none items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-1.5 ring-1 ring-white/5">
          <input
            type="checkbox"
            checked={demo}
            onChange={(e) => setDemo(e.target.checked)}
            className="accent-accent"
          />
          <span className={demo ? "text-accent" : "text-zinc-400"}>Demo</span>
        </label>
        <button
          onClick={onConnect}
          className="rounded-lg bg-accent px-3.5 py-1.5 font-semibold text-white shadow-lg shadow-accent/25 transition hover:opacity-90"
        >
          Connect
        </button>

        <div className="mx-1 h-5 w-px bg-white/10" />

        {ALL.map((p) => (
          <button
            key={p}
            onClick={() => toggleFilter(p)}
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 transition ${
              filters.has(p) ? "ring-transparent" : "text-zinc-500 opacity-50 ring-white/10 hover:opacity-80"
            }`}
            style={
              filters.has(p)
                ? { backgroundColor: `${PLATFORM_META[p].color}22`, color: PLATFORM_META[p].color }
                : undefined
            }
          >
            {PLATFORM_META[p].label}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setShowHype((v) => !v)}
            title="Toggle the crypto Hype Intelligence panel (optional)"
            className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold ring-1 transition ${
              showHype
                ? "bg-accent/15 text-accent ring-accent/30"
                : "bg-white/5 text-zinc-400 ring-white/5 hover:bg-white/10"
            }`}
          >
            📊 Hype
          </button>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search messages…"
            className="w-44 rounded-lg bg-white/5 px-3 py-1.5 text-sm outline-none ring-1 ring-white/5 transition focus:ring-2 focus:ring-accent/60"
          />
          <button
            onClick={togglePause}
            className="rounded-lg bg-white/5 px-2.5 py-1.5 text-xs ring-1 ring-white/5 transition hover:bg-white/10"
          >
            {paused ? "▶ Resume" : "⏸ Pause"}
          </button>
          <button
            onClick={clear}
            className="rounded-lg bg-white/5 px-2.5 py-1.5 text-xs ring-1 ring-white/5 transition hover:bg-white/10"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex min-h-0 flex-1">
        <section className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center justify-between px-4 py-2 text-[11px] text-zinc-500">
            <span className="inline-flex items-center gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full ${paused ? "bg-amber-400" : "bg-green-500 animate-pulse-dot"}`} />
              {filtered.length} messages {paused ? "· paused" : "· live"}
            </span>
            <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-wide text-zinc-500 ring-1 ring-white/5">
            {socketState}
          </span>
          </div>
          <div className="min-h-0 flex-1 border-t border-white/5">
            <ChatFeed messages={filtered} paused={paused} />
          </div>
        </section>
        {showHype && (
          <aside className="scrollbar-thin hidden w-80 shrink-0 overflow-y-auto border-l border-white/5 bg-ink-900/40 lg:block">
            <HypePanel messages={messages} markets={markets} />
          </aside>
        )}
      </div>
    </main>
  );
}

function dotColor(state: StatusMap[Platform]) {
  switch (state) {
    case "connected":
      return "bg-green-500 animate-pulse-dot";
    case "connecting":
      return "bg-amber-400 animate-pulse-dot";
    case "error":
      return "bg-red-500";
    case "disconnected":
      return "bg-zinc-600";
    default:
      return "bg-zinc-700";
  }
}

function ChannelInput({
  value,
  onChange,
  placeholder,
  accent,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  accent: string;
}) {
  return (
    <div className="flex items-center gap-1.5 rounded-lg bg-white/5 pl-2 pr-1 ring-1 ring-white/5 transition focus-within:ring-2 focus-within:ring-accent/60">
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: accent }} />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-32 bg-transparent py-1.5 text-sm outline-none placeholder:text-zinc-600"
      />
    </div>
  );
}

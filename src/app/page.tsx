"use client";
import { useMemo, useState } from "react";
import type { Platform } from "@shared/types";
import { useChatSocket, type StatusMap } from "@/lib/useChatSocket";
import { PLATFORM_META } from "@/lib/platform";
import { ChatFeed } from "@/components/ChatFeed";
import { HypePanel } from "@/components/HypePanel";

const ALL: Platform[] = ["twitch", "kick", "youtube", "x"];

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
      <header className="flex items-center justify-between border-b border-ink-800 px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-twitch via-fuchsia-500 to-kick font-black text-black">
            M
          </div>
          <div>
            <h1 className="text-lg font-bold leading-none">
              MarketPulse <span className="font-normal text-zinc-500">Chat</span>
            </h1>
            <p className="text-[11px] text-zinc-500">Twitch · X · Kick — one crypto-native feed</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs">
          {ALL.map((p) => (
            <div key={p} className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${dotColor(status[p])}`} />
              <span className="text-zinc-400">{PLATFORM_META[p].label}</span>
            </div>
          ))}
          <span className="ml-1 rounded px-2 py-0.5 text-[10px] uppercase tracking-wide text-zinc-400 ring-1 ring-ink-700">
            {socketState}
          </span>
        </div>
      </header>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2 border-b border-ink-800 bg-ink-900 px-5 py-2.5 text-sm">
        <ChannelInput value={twitch} onChange={setTwitch} placeholder="twitch channel" accent="#9146FF" />
        <ChannelInput value={kick} onChange={setKick} placeholder="kick channel" accent="#53FC18" />
        <ChannelInput value={youtube} onChange={setYoutube} placeholder="youtube id/url" accent="#FF0033" />
        <ChannelInput value={x} onChange={setX} placeholder="x broadcast url/id" accent="#E7E9EA" />
        <label className="flex cursor-pointer select-none items-center gap-1.5 rounded-md bg-ink-800 px-2.5 py-1.5">
          <input
            type="checkbox"
            checked={demo}
            onChange={(e) => setDemo(e.target.checked)}
            className="accent-fuchsia-500"
          />
          <span className={demo ? "text-fuchsia-300" : "text-zinc-400"}>Demo Mode</span>
        </label>
        <button
          onClick={onConnect}
          className="rounded-md bg-fuchsia-600 px-3 py-1.5 font-semibold text-white hover:bg-fuchsia-500"
        >
          Connect
        </button>

        <div className="mx-1 h-5 w-px bg-ink-700" />

        {ALL.map((p) => (
          <button
            key={p}
            onClick={() => toggleFilter(p)}
            className={`rounded-md px-2 py-1 text-xs font-medium ring-1 ${
              filters.has(p) ? "ring-transparent" : "opacity-40 ring-ink-700"
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

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="search…"
          className="ml-auto w-40 rounded-md bg-ink-800 px-2.5 py-1.5 text-sm outline-none focus:ring-1 focus:ring-fuchsia-500"
        />
        <button onClick={togglePause} className="rounded-md bg-ink-800 px-2.5 py-1.5 text-xs hover:bg-ink-700">
          {paused ? "▶ Resume" : "⏸ Pause"}
        </button>
        <button onClick={clear} className="rounded-md bg-ink-800 px-2.5 py-1.5 text-xs hover:bg-ink-700">
          Clear
        </button>
      </div>

      {/* Body */}
      <div className="flex min-h-0 flex-1">
        <section className="flex min-w-0 flex-1 flex-col border-r border-ink-800">
          <div className="flex items-center justify-between px-4 py-1.5 text-[11px] text-zinc-500">
            <span>{filtered.length} messages</span>
            {paused && <span className="text-amber-400">paused</span>}
          </div>
          <div className="min-h-0 flex-1">
            <ChatFeed messages={filtered} paused={paused} />
          </div>
        </section>
        <aside className="scrollbar-thin hidden w-80 shrink-0 overflow-y-auto bg-ink-900 lg:block">
          <HypePanel messages={messages} markets={markets} />
        </aside>
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
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-36 rounded-md bg-ink-800 px-2.5 py-1.5 text-sm outline-none focus:ring-1 focus:ring-fuchsia-500"
      style={{ borderLeft: `2px solid ${accent}` }}
    />
  );
}

"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChannelConfig, Platform, UnifiedMessage } from "@shared/types";
import { useChatSocket, type StatusMap } from "@/lib/useChatSocket";
import { PLATFORM_META } from "@/lib/platform";
import { ChatFeed } from "@/components/ChatFeed";
import { HypePanel } from "@/components/HypePanel";
import { ConnectModal } from "@/components/ConnectModal";
import { Composer } from "@/components/Composer";
import { consumeTwitchRedirect, getStoredTwitchAuth, twitchClientId, type TwitchAuth } from "@/lib/twitchAuth";
import { isBot } from "@/lib/bots";

const ALL: Platform[] = ["twitch", "kick", "youtube", "x"];

const THEMES = [
  { name: "Violet", rgb: "139 92 246" },
  { name: "Mint", rgb: "34 197 94" },
  { name: "Cyan", rgb: "34 211 238" },
  { name: "Sunset", rgb: "249 115 22" },
  { name: "Gold", rgb: "227 179 65" },
];

export default function Dashboard() {
  const { messages, socketState, status, markets, featured, subscribe, setPaused, clear, feature, unfeature, sendMessage, sendError, moderate, modResult, clearModResult } = useChatSocket();
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
  const [connectOpen, setConnectOpen] = useState(false);
  const [highlight, setHighlight] = useState("");
  const [soundOn, setSoundOn] = useState(false);
  const [ttsOn, setTtsOn] = useState(false);
  const [hideBots, setHideBots] = useState(false);
  const [auth, setAuth] = useState<TwitchAuth | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const lastBeepRef = useRef(0);
  const prevLenRef = useRef(0);
  const ttsLastIdRef = useRef<string | null>(null);

  useEffect(() => {
    const saved = Number(window.localStorage.getItem("mp-theme"));
    if (!Number.isNaN(saved) && THEMES[saved]) setThemeIdx(saved);
  }, []);
  // Twitch sign-in: handle the OAuth redirect on load, else restore a saved session.
  useEffect(() => {
    consumeTwitchRedirect().then((a) => setAuth(a ?? getStoredTwitchAuth()));
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
        (!hideBots || m.event || !isBot(m.username)) &&
        (q === "" || m.text.toLowerCase().includes(q) || m.displayName.toLowerCase().includes(q)),
    );
  }, [messages, filters, search, hideBots]);

  const highlightList = useMemo(
    () => highlight.toLowerCase().split(",").map((s) => s.trim()).filter(Boolean),
    [highlight],
  );

  // Sound on new message (throttled), opt-in.
  useEffect(() => {
    if (!soundOn || paused) {
      prevLenRef.current = messages.length;
      return;
    }
    if (messages.length > prevLenRef.current && audioCtxRef.current) {
      const now = Date.now();
      if (now - lastBeepRef.current > 600) {
        lastBeepRef.current = now;
        try {
          const ctx = audioCtxRef.current;
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = "sine";
          o.frequency.value = 880;
          g.gain.value = 0.04;
          o.connect(g);
          g.connect(ctx.destination);
          o.start();
          o.stop(ctx.currentTime + 0.05);
        } catch {
          /* ignore */
        }
      }
    }
    prevLenRef.current = messages.length;
  }, [messages.length, soundOn, paused]);

  // Read new chat aloud (opt-in) via the browser SpeechSynthesis API.
  useEffect(() => {
    const synth = typeof window !== "undefined" ? window.speechSynthesis : undefined;
    if (!ttsOn || paused || !synth) {
      ttsLastIdRef.current = messages.length ? messages[messages.length - 1].id : ttsLastIdRef.current;
      return;
    }
    let start = messages.length; // on enable, skip the backlog
    if (ttsLastIdRef.current) {
      const i = messages.findIndex((m) => m.id === ttsLastIdRef.current);
      start = i >= 0 ? i + 1 : Math.max(0, messages.length - 1);
    }
    ttsLastIdRef.current = messages.length ? messages[messages.length - 1].id : ttsLastIdRef.current;
    const fresh = messages
      .slice(start)
      .filter((m) => !m.event && m.intelligence?.risk !== "scam" && m.text.trim());
    if (!fresh.length) return;
    // Stay near real-time: if speech is backed up, only voice the latest.
    const toSpeak = synth.speaking || synth.pending ? fresh.slice(-1) : fresh.slice(-2);
    for (const m of toSpeak) {
      const u = new SpeechSynthesisUtterance(`${m.displayName} says ${m.text}`.slice(0, 160));
      u.rate = 1.05;
      synth.speak(u);
    }
  }, [messages, ttsOn, paused]);

  const toggleTts = () =>
    setTtsOn((v) => {
      const next = !v;
      if (!next && typeof window !== "undefined") window.speechSynthesis?.cancel();
      return next;
    });

  const toggleSound = () => {
    setSoundOn((v) => {
      const next = !v;
      if (next && !audioCtxRef.current) {
        try {
          const Ctx =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          audioCtxRef.current = new Ctx();
        } catch {
          /* ignore */
        }
      }
      audioCtxRef.current?.resume?.();
      return next;
    });
  };

  const channelsFromState = (): ChannelConfig => ({
    twitch: twitch.trim() || undefined,
    kick: kick.trim() || undefined,
    x: x.trim() || undefined,
    youtube: youtube.trim() || undefined,
  });

  const handleApply = (channels: ChannelConfig, demoFlag: boolean) => {
    setTwitch(channels.twitch ?? "");
    setKick(channels.kick ?? "");
    setX(channels.x ?? "");
    setYoutube(channels.youtube ?? "");
    setDemo(demoFlag);
    subscribe(channels, demoFlag);
  };

  const toggleDemo = (v: boolean) => {
    setDemo(v);
    subscribe(channelsFromState(), v);
  };

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

  const featureTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleFeature = useCallback(
    (m: UnifiedMessage) => {
      feature(m);
      if (featureTimer.current) clearTimeout(featureTimer.current);
      featureTimer.current = setTimeout(() => unfeature(), 15000);
    },
    [feature, unfeature],
  );

  const handleModerate = useCallback(
    (action: "delete" | "timeout" | "ban", m: UnifiedMessage) => {
      if (!auth) return;
      moderate({
        action,
        broadcasterId: m.channelId ?? "",
        moderatorId: auth.userId,
        targetUserId: m.authorId,
        messageId: m.id,
        durationSec: action === "timeout" ? 600 : undefined,
        token: auth.token,
        clientId: twitchClientId(),
      });
    },
    [auth, moderate],
  );

  // Auto-dismiss the moderation toast.
  useEffect(() => {
    if (!modResult) return;
    const t = setTimeout(() => clearModResult(), 3500);
    return () => clearTimeout(t);
  }, [modResult, clearModResult]);

  const connectedCount = [twitch, kick, x, youtube].filter(Boolean).length;

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
        <button
          onClick={() => setConnectOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-1.5 font-semibold text-white shadow-lg shadow-accent/25 transition hover:opacity-90"
        >
          <span className="text-base leading-none">＋</span> Connect platforms
        </button>
        {connectedCount > 0 && (
          <span className="text-[11px] text-zinc-500">{connectedCount} connected</span>
        )}
        <label className="flex cursor-pointer select-none items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-1.5 ring-1 ring-white/5">
          <input
            type="checkbox"
            checked={demo}
            onChange={(e) => toggleDemo(e.target.checked)}
            className="accent-accent"
          />
          <span className={demo ? "text-accent" : "text-zinc-400"}>Demo</span>
        </label>

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
            title={`Toggle ${PLATFORM_META[p].label} in the feed`}
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
          <button
            onClick={() => setHideBots((v) => !v)}
            title={hideBots ? "Bots hidden — click to show" : "Hide messages from known chat bots"}
            className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold ring-1 transition ${
              hideBots
                ? "bg-accent/15 text-accent ring-accent/30"
                : "bg-white/5 text-zinc-400 ring-white/5 hover:bg-white/10"
            }`}
          >
            🤖 {hideBots ? "Hidden" : "Bots"}
          </button>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search messages…"
            className="w-40 rounded-lg bg-white/5 px-3 py-1.5 text-sm outline-none ring-1 ring-white/5 transition focus:ring-2 focus:ring-accent/60"
          />
          <input
            value={highlight}
            onChange={(e) => setHighlight(e.target.value)}
            placeholder="highlight…"
            title="Highlight messages containing these comma-separated keywords"
            className="w-28 rounded-lg bg-white/5 px-3 py-1.5 text-sm outline-none ring-1 ring-white/5 transition focus:ring-2 focus:ring-accent/60"
          />
          <button
            onClick={toggleSound}
            title="Play a sound on new messages"
            className={`rounded-lg px-2.5 py-1.5 text-xs ring-1 transition ${
              soundOn ? "bg-accent/15 text-accent ring-accent/30" : "bg-white/5 text-zinc-400 ring-white/5 hover:bg-white/10"
            }`}
          >
            {soundOn ? "🔔" : "🔕"}
          </button>
          <button
            onClick={toggleTts}
            title="Read new chat aloud (text-to-speech)"
            className={`rounded-lg px-2.5 py-1.5 text-xs ring-1 transition ${
              ttsOn ? "bg-accent/15 text-accent ring-accent/30" : "bg-white/5 text-zinc-400 ring-white/5 hover:bg-white/10"
            }`}
          >
            🗣️
          </button>
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
          {featured && (
            <div className="flex items-center gap-2 border-b border-accent/30 bg-accent/10 px-4 py-1.5 text-[12px]">
              <span className="shrink-0 font-semibold text-accent">★ Featured on stream</span>
              <span className="truncate text-zinc-300">
                <span className="font-semibold">{featured.displayName}</span>: {featured.text}
              </span>
              <button onClick={unfeature} className="ml-auto shrink-0 text-zinc-400 transition hover:text-zinc-200">
                clear ✕
              </button>
            </div>
          )}
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
            <ChatFeed
              messages={filtered}
              paused={paused}
              highlight={highlightList}
              onFeature={handleFeature}
              canModerate={!!auth}
              onModerate={handleModerate}
            />
          </div>
          <Composer
            channel={twitch.trim() || undefined}
            demo={demo}
            auth={auth}
            onSignOut={() => setAuth(null)}
            onSend={(t) => auth && sendMessage("twitch", twitch.trim(), t, auth.token, auth.login)}
            sendError={sendError}
          />
        </section>
        {showHype && (
          <aside className="scrollbar-thin hidden w-80 shrink-0 overflow-y-auto border-l border-white/5 bg-ink-900/40 lg:block">
            <HypePanel messages={messages} markets={markets} />
          </aside>
        )}
      </div>

      <ConnectModal
        open={connectOpen}
        initial={channelsFromState()}
        demo={demo}
        onClose={() => setConnectOpen(false)}
        onApply={handleApply}
      />

      {modResult && (
        <div
          className={`pointer-events-none fixed bottom-24 left-1/2 z-50 -translate-x-1/2 animate-slide-in rounded-lg px-4 py-2 text-sm font-semibold shadow-xl ring-1 ${
            modResult.ok
              ? "bg-emerald-600/90 text-white ring-emerald-400/50"
              : "bg-red-600/90 text-white ring-red-400/50"
          }`}
        >
          {modResult.ok ? modLabel(modResult.action) : `⚠ ${modResult.error ?? "Action failed"}`}
        </div>
      )}
    </main>
  );
}

function modLabel(action?: string) {
  if (action === "delete") return "🗑 Message deleted";
  if (action === "timeout") return "⏳ User timed out 10 min";
  if (action === "ban") return "⛔ User banned";
  return "✓ Done";
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

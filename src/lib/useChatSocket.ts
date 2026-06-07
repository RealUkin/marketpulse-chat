"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type {
  ChannelConfig,
  ConnectionState,
  MarketInfo,
  PriceInfo,
  Platform,
  ServerEvent,
  UnifiedMessage,
} from "@shared/types";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:3001";
const MAX_MESSAGES = 250;

export type StatusMap = Record<Platform, ConnectionState | "idle">;
export type SocketState = "connecting" | "open" | "closed";

const IDLE_STATUS: StatusMap = { twitch: "idle", kick: "idle", x: "idle", youtube: "idle" };

export function useChatSocket() {
  const [messages, setMessages] = useState<UnifiedMessage[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [socketState, setSocketState] = useState<SocketState>("connecting");
  const [status, setStatus] = useState<StatusMap>(IDLE_STATUS);
  const [markets, setMarkets] = useState<MarketInfo[]>([]);
  const [prices, setPrices] = useState<PriceInfo[]>([]);
  const [featured, setFeatured] = useState<UnifiedMessage | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [modResult, setModResult] = useState<{ ok: boolean; action?: string; error?: string } | null>(null);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [recapState, setRecapState] = useState<{ loading: boolean; text?: string; error?: string } | null>(null);
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [twitchBadges, setTwitchBadges] = useState<Record<string, string>>({});

  const wsRef = useRef<WebSocket | null>(null);
  const bufferRef = useRef<UnifiedMessage[]>([]);
  const seenUsersRef = useRef<Set<string>>(new Set()); // for first-time-chatter tagging
  const totalRef = useRef(0); // session message counter (uncapped)
  const priorViewersRef = useRef<Record<string, number>>({}); // cumulative msg counts from prior sessions
  const liveViewersRef = useRef<Record<string, number>>({}); // prior + this session, persisted
  const lastViewerSaveRef = useRef(0);
  const attemptsRef = useRef(0);
  const pausedRef = useRef(false);
  const closingRef = useRef(false);
  // Auto-start in Demo Mode so the feed is alive on first load.
  const lastSubRef = useRef<{ channels: ChannelConfig; demo: boolean }>({ channels: {}, demo: true });

  // Throttled flush: buffer -> state every 100ms, capped sliding window.
  useEffect(() => {
    const t = setInterval(() => {
      if (pausedRef.current || bufferRef.current.length === 0) return;
      // Snapshot + clear OUTSIDE the updater so it stays pure (StrictMode double-invokes updaters).
      const batch = bufferRef.current;
      bufferRef.current = [];
      for (const m of batch) {
        if (m.event) continue;
        const key = `${m.platform}:${m.username.toLowerCase()}`;
        if (!seenUsersRef.current.has(key)) {
          seenUsersRef.current.add(key);
          m.firstSeen = true;
        }
        if ((priorViewersRef.current[key] ?? 0) >= 15) m.regular = true;
        liveViewersRef.current[key] = (liveViewersRef.current[key] ?? 0) + 1;
      }
      if (Date.now() - lastViewerSaveRef.current > 10_000) {
        lastViewerSaveRef.current = Date.now();
        try {
          const top = Object.entries(liveViewersRef.current).sort((a, b) => b[1] - a[1]).slice(0, 400);
          window.localStorage.setItem("mp-viewers", JSON.stringify(Object.fromEntries(top)));
        } catch {
          /* ignore */
        }
      }
      totalRef.current += batch.length;
      setTotalCount(totalRef.current);
      setMessages((prev) => {
        const next = prev.concat(batch);
        return next.length > MAX_MESSAGES ? next.slice(next.length - MAX_MESSAGES) : next;
      });
    }, 100);
    return () => clearInterval(t);
  }, []);

  // Load returning-viewer history (cumulative message counts) from prior sessions.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("mp-viewers");
      if (raw) {
        const m = JSON.parse(raw) as Record<string, number>;
        priorViewersRef.current = m;
        liveViewersRef.current = { ...m };
      }
    } catch {
      /* ignore */
    }
  }, []);

  const connect = useCallback(() => {
    setSocketState("connecting");
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      attemptsRef.current = 0;
      setSocketState("open");
      ws.send(JSON.stringify({ type: "subscribe", ...lastSubRef.current }));
    };

    ws.onmessage = (e) => {
      let ev: ServerEvent;
      try {
        ev = JSON.parse(e.data as string);
      } catch {
        return;
      }
      if (ev.type === "message") bufferRef.current.push(ev.data);
      else if (ev.type === "status") setStatus((s) => ({ ...s, [ev.platform]: ev.state }));
      else if (ev.type === "markets") setMarkets(ev.data);
      else if (ev.type === "prices") setPrices(ev.data);
      else if (ev.type === "featured") setFeatured(ev.data);
      else if (ev.type === "sendResult") setSendError(ev.ok ? null : ev.error ?? "Send failed");
      else if (ev.type === "modResult") setModResult({ ok: ev.ok, action: ev.action, error: ev.error });
      else if (ev.type === "hello") setAiEnabled(ev.aiEnabled);
      else if (ev.type === "recapResult")
        setRecapState({ loading: false, text: ev.ok ? ev.text : undefined, error: ev.ok ? undefined : ev.error ?? "Recap failed" });
      else if (ev.type === "translateResult") {
        const tx = ev.text;
        if (ev.ok && tx) setTranslations((t) => ({ ...t, [ev.id]: tx }));
      } else if (ev.type === "badgeSet") setTwitchBadges(ev.data);
    };

    ws.onerror = () => ws.close();

    ws.onclose = () => {
      if (wsRef.current !== ws) return; // superseded by a newer socket (StrictMode remount)
      setSocketState("closed");
      if (closingRef.current) return;
      const delay = Math.min(30000, 1000 * 2 ** attemptsRef.current) + Math.random() * 500;
      attemptsRef.current += 1;
      setTimeout(() => {
        if (!closingRef.current) connect();
      }, delay);
    };
  }, []);

  useEffect(() => {
    closingRef.current = false;
    connect();
    return () => {
      closingRef.current = true;
      wsRef.current?.close();
    };
  }, [connect]);

  const subscribe = useCallback((channels: ChannelConfig, demo: boolean) => {
    lastSubRef.current = { channels, demo };
    setMessages([]);
    bufferRef.current = [];
    seenUsersRef.current.clear();
    totalRef.current = 0;
    setTotalCount(0);
    setStatus({
      twitch: demo || channels.twitch ? "connecting" : "idle",
      kick: demo || channels.kick ? "connecting" : "idle",
      x: demo || channels.x ? "connecting" : "idle",
      youtube: demo || channels.youtube ? "connecting" : "idle",
    });
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "subscribe", channels, demo }));
    }
    // If the socket is still CONNECTING, onopen sends lastSubRef.current instead.
  }, []);

  const setPaused = useCallback((p: boolean) => {
    pausedRef.current = p;
  }, []);

  const clear = useCallback(() => {
    setMessages([]);
    bufferRef.current = [];
    seenUsersRef.current.clear();
    totalRef.current = 0;
    setTotalCount(0);
  }, []);

  const feature = useCallback((m: UnifiedMessage) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: "feature", data: m }));
  }, []);

  const unfeature = useCallback(() => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: "unfeature" }));
  }, []);

  const sendMessage = useCallback(
    (platform: Platform, channel: string, text: string, token: string, login: string) => {
      const ws = wsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) {
        setSendError(null);
        ws.send(JSON.stringify({ type: "send", platform, channel, text, token, login }));
      }
    },
    [],
  );

  const moderate = useCallback(
    (cmd: {
      action: "delete" | "timeout" | "ban";
      broadcasterId: string;
      moderatorId: string;
      targetUserId?: string;
      messageId?: string;
      durationSec?: number;
      token: string;
      clientId: string;
    }) => {
      const ws = wsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) {
        setModResult(null);
        ws.send(JSON.stringify({ type: "moderate", ...cmd }));
      }
    },
    [],
  );

  const clearModResult = useCallback(() => setModResult(null), []);

  const requestRecap = useCallback((texts: string[]) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      setRecapState({ loading: true });
      ws.send(JSON.stringify({ type: "recap", texts }));
    }
  }, []);
  const clearRecap = useCallback(() => setRecapState(null), []);
  const requestTranslate = useCallback((id: string, text: string) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: "translate", id, text }));
  }, []);
  const requestBadges = useCallback((broadcasterId: string, token: string, clientId: string) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: "badges", broadcasterId, token, clientId }));
  }, []);

  return {
    messages,
    totalCount,
    socketState,
    status,
    markets,
    prices,
    featured,
    subscribe,
    setPaused,
    clear,
    feature,
    unfeature,
    sendMessage,
    sendError,
    moderate,
    modResult,
    clearModResult,
    aiEnabled,
    requestRecap,
    recapState,
    clearRecap,
    translations,
    requestTranslate,
    twitchBadges,
    requestBadges,
  };
}

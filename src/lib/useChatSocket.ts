"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type {
  ChannelConfig,
  ConnectionState,
  MarketInfo,
  Platform,
  ServerEvent,
  UnifiedMessage,
} from "@shared/types";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:3001";
const MAX_MESSAGES = 250;

export type StatusMap = Record<Platform, ConnectionState | "idle">;
export type SocketState = "connecting" | "open" | "closed";

const IDLE_STATUS: StatusMap = { twitch: "idle", kick: "idle", x: "idle" };

export function useChatSocket() {
  const [messages, setMessages] = useState<UnifiedMessage[]>([]);
  const [socketState, setSocketState] = useState<SocketState>("connecting");
  const [status, setStatus] = useState<StatusMap>(IDLE_STATUS);
  const [markets, setMarkets] = useState<MarketInfo[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const bufferRef = useRef<UnifiedMessage[]>([]);
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
      setMessages((prev) => {
        const next = prev.concat(batch);
        return next.length > MAX_MESSAGES ? next.slice(next.length - MAX_MESSAGES) : next;
      });
    }, 100);
    return () => clearInterval(t);
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
    setStatus({
      twitch: demo || channels.twitch ? "connecting" : "idle",
      kick: demo || channels.kick ? "connecting" : "idle",
      x: demo || channels.x ? "connecting" : "idle",
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
  }, []);

  return { messages, socketState, status, markets, subscribe, setPaused, clear };
}

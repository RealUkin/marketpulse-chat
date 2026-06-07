"use client";
import { useEffect, useRef } from "react";
import type { UnifiedMessage } from "@shared/types";
import { MessageRow } from "@/components/MessageRow";

export function ChatFeed({
  messages,
  paused,
  highlight,
  onFeature,
  canModerate,
  onModerate,
  pinnedIds,
  onPin,
  aiEnabled,
  translations,
  onTranslate,
  connecting,
  demo,
  hasChannels,
  badges,
}: {
  messages: UnifiedMessage[];
  paused: boolean;
  highlight: string[];
  onFeature?: (m: UnifiedMessage) => void;
  canModerate?: boolean;
  onModerate?: (action: "delete" | "timeout" | "ban", m: UnifiedMessage) => void;
  pinnedIds?: Set<string>;
  onPin?: (m: UnifiedMessage) => void;
  aiEnabled?: boolean;
  translations?: Record<string, string>;
  onTranslate?: (m: UnifiedMessage) => void;
  connecting?: boolean;
  demo?: boolean;
  hasChannels?: boolean;
  badges?: Record<string, string>;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (paused) return;
    const el = ref.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, paused]);

  return (
    <div ref={ref} className="scrollbar-thin h-full overflow-y-auto">
      {messages.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
          {connecting ? (
            <>
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-white/15 border-t-accent" />
              <p className="text-sm text-zinc-400">Connecting to chat…</p>
            </>
          ) : demo ? (
            <p className="text-sm leading-relaxed text-zinc-500">
              <span className="text-zinc-300">Demo Mode</span> — sample chat across all four platforms.
              <br />
              Hit <span className="text-accent">Connect platforms</span> to add your own.
            </p>
          ) : hasChannels ? (
            <p className="text-sm text-zinc-500">Connected — waiting for the first message…</p>
          ) : (
            <p className="text-sm text-zinc-500">
              Hit <span className="text-accent">Connect platforms</span> to start your feed.
            </p>
          )}
        </div>
      ) : (
        <div className="flex flex-col py-2">
          {messages.map((m) => (
            <MessageRow
              key={m.id}
              m={m}
              highlight={highlight}
              onFeature={onFeature}
              canModerate={canModerate}
              onModerate={onModerate}
              pinned={pinnedIds?.has(m.id)}
              onPin={onPin}
              aiEnabled={aiEnabled}
              translation={translations?.[m.id]}
              onTranslate={onTranslate}
              badges={badges}
            />
          ))}
        </div>
      )}
    </div>
  );
}

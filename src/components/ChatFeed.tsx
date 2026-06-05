"use client";
import { useEffect, useRef } from "react";
import type { UnifiedMessage } from "@shared/types";
import { MessageRow } from "@/components/MessageRow";

export function ChatFeed({ messages, paused }: { messages: UnifiedMessage[]; paused: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (paused) return;
    const el = ref.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, paused]);

  return (
    <div ref={ref} className="scrollbar-thin h-full overflow-y-auto">
      {messages.length === 0 ? (
        <div className="flex h-full items-center justify-center px-6 text-center text-sm text-zinc-600">
          No messages yet — Demo Mode is on by default, hit <span className="mx-1 text-accent">Connect</span> to start the feed.
        </div>
      ) : (
        <div className="flex flex-col py-2">
          {messages.map((m) => (
            <MessageRow key={m.id} m={m} />
          ))}
        </div>
      )}
    </div>
  );
}

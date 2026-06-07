"use client";
import { useState } from "react";
import type { ChannelConfig } from "@shared/types";
import { IMonitor, ICopy } from "@/components/icons";

// Helper so streamers can grab a ready-to-paste OBS browser-source URL instead
// of hand-building ?twitch=…&max=… query strings.
export function OverlayModal({
  open,
  channels,
  demo,
  onClose,
}: {
  open: boolean;
  channels: ChannelConfig;
  demo: boolean;
  onClose: () => void;
}) {
  const [max, setMax] = useState(18);
  const [copied, setCopied] = useState(false);
  if (!open) return null;

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const params = new URLSearchParams();
  if (demo) {
    params.set("demo", "1");
  } else {
    if (channels.twitch) params.set("twitch", channels.twitch);
    if (channels.kick) params.set("kick", channels.kick);
    if (channels.youtube) params.set("youtube", channels.youtube);
    if (channels.x) params.set("x", channels.x);
  }
  params.set("max", String(max));
  const url = `${origin}/overlay?${params.toString()}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — user can select the text */
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-white/10 bg-ink-900 p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 flex items-center gap-2 text-lg font-bold tracking-tight">
          <IMonitor className="h-5 w-5 text-accent" /> OBS overlay
        </div>
        <p className="mb-4 text-[13px] leading-relaxed text-zinc-400">
          Add this as a <span className="text-zinc-200">Browser Source</span> in OBS — transparent background,
          your unified chat on stream, with subs/raids and emote pops.
        </p>

        <div className="mb-3 flex flex-wrap items-center gap-2">
          <label className="text-[12px] text-zinc-400">Max messages</label>
          <input
            type="number"
            min={4}
            max={40}
            value={max}
            onChange={(e) => setMax(Math.max(4, Math.min(40, Number(e.target.value) || 18)))}
            className="w-20 rounded-lg bg-black/30 px-2 py-1 text-sm outline-none ring-1 ring-white/10 transition focus:ring-2 focus:ring-accent/60"
          />
          <span className="text-[11px] text-zinc-500">
            {demo ? "· Demo Mode (connect channels for your own)" : "· built from your connected channels"}
          </span>
        </div>

        <div className="flex items-center gap-2 rounded-lg bg-black/40 p-2 ring-1 ring-white/10">
          <code className="min-w-0 flex-1 truncate text-[12px] text-zinc-300">{url}</code>
          <button
            onClick={copy}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90"
          >
            <ICopy className="h-3.5 w-3.5" /> {copied ? "Copied!" : "Copy"}
          </button>
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg px-3 py-2 text-sm text-zinc-400 transition hover:text-zinc-200"
          >
            Preview overlay ↗
          </a>
          <button
            onClick={onClose}
            className="rounded-lg bg-white/5 px-4 py-2 text-sm text-zinc-300 ring-1 ring-white/5 transition hover:bg-white/10"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

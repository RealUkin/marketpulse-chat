"use client";
import { useState } from "react";
import type { ChannelConfig, Platform } from "@shared/types";
import { PLATFORM_META } from "@/lib/platform";
import { PlatformLogo } from "@/components/platformLogos";
import { ITrend } from "@/components/icons";

const PLATFORMS: Platform[] = ["twitch", "kick", "youtube", "x"];
const PLACEHOLDER: Record<Platform, string> = {
  twitch: "twitch channel name",
  kick: "kick channel name",
  youtube: "channel id (UC…) or live URL",
  x: "broadcast URL or id",
};
const HINT: Record<Platform, string> = {
  twitch: "No login needed — reads public chat instantly.",
  kick: "No login needed.",
  youtube: "No API key needed.",
  x: "Needs a burner session (npm run x:login).",
};

export function ConnectModal({
  open,
  initial,
  demo,
  onClose,
  onApply,
  crypto,
}: {
  open: boolean;
  initial: ChannelConfig;
  demo: boolean;
  onClose: () => void;
  onApply: (channels: ChannelConfig, demo: boolean, crypto: boolean) => void;
  crypto: boolean;
}) {
  const [vals, setVals] = useState<Record<Platform, string>>({
    twitch: initial.twitch ?? "",
    kick: initial.kick ?? "",
    youtube: initial.youtube ?? "",
    x: initial.x ?? "",
  });
  const [enabled, setEnabled] = useState<Record<Platform, boolean>>({
    twitch: !!initial.twitch,
    kick: !!initial.kick,
    youtube: !!initial.youtube,
    x: !!initial.x,
  });
  const [cryptoOn, setCryptoOn] = useState(crypto);

  if (!open) return null;

  const apply = (useDemo: boolean) => {
    const channels: ChannelConfig = {};
    for (const p of PLATFORMS) if (enabled[p] && vals[p].trim()) channels[p] = vals[p].trim();
    onApply(channels, useDemo, cryptoOn);
    onClose();
  };

  const anySelected = PLATFORMS.some((p) => enabled[p] && vals[p].trim());

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-white/10 bg-ink-900 p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 text-lg font-bold tracking-tight">Connect your platforms</div>
        <p className="mb-4 text-[13px] leading-relaxed text-zinc-400">
          Pick the platforms to pull chat from — select all, or just the ones you&apos;re live on. No
          login needed to read chat.
        </p>

        <div className="flex flex-col gap-2">
          {PLATFORMS.map((p) => {
            const meta = PLATFORM_META[p];
            const on = enabled[p];
            return (
              <div
                key={p}
                className={`rounded-xl border p-3 transition ${
                  on ? "border-white/15 bg-white/[0.05]" : "border-white/5 bg-white/[0.02]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-lg"
                    style={{ backgroundColor: meta.color, color: meta.fg }}
                  >
                    <PlatformLogo platform={p} className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold leading-tight">{meta.label}</div>
                    <div className="truncate text-[11px] text-zinc-500">{HINT[p]}</div>
                  </div>
                  <button
                    onClick={() => setEnabled((e) => ({ ...e, [p]: !e[p] }))}
                    aria-label={`Toggle ${meta.label}`}
                    className={`relative h-5 w-9 shrink-0 rounded-full transition ${on ? "bg-accent" : "bg-white/15"}`}
                  >
                    <span
                      className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${on ? "left-[18px]" : "left-0.5"}`}
                    />
                  </button>
                </div>
                {on && (
                  <input
                    value={vals[p]}
                    onChange={(e) => setVals((s) => ({ ...s, [p]: e.target.value }))}
                    placeholder={PLACEHOLDER[p]}
                    className="mt-2.5 w-full rounded-lg bg-black/30 px-3 py-2 text-sm outline-none ring-1 ring-white/10 transition placeholder:text-zinc-600 focus:ring-2 focus:ring-accent/60"
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Optional crypto add-on — deliberately opt-in, off by default */}
        <div className="mt-3 rounded-xl border border-gold/20 bg-gold/[0.04] p-3">
          <div className="flex items-center gap-3">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gold/20 text-gold">
              <ITrend className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="font-semibold leading-tight">Crypto Intelligence</div>
              <div className="text-[11px] leading-snug text-zinc-500">
                Live prices, chat-vs-market divergence &amp; Polymarket odds. Optional — for trading streams.
              </div>
            </div>
            <button
              onClick={() => setCryptoOn((v) => !v)}
              aria-label="Toggle crypto intelligence"
              className={`relative h-5 w-9 shrink-0 rounded-full transition ${cryptoOn ? "bg-gold" : "bg-white/15"}`}
            >
              <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${cryptoOn ? "left-[18px]" : "left-0.5"}`}
              />
            </button>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          <button
            onClick={() => apply(true)}
            className="rounded-lg px-3 py-2 text-sm text-zinc-400 transition hover:text-zinc-200"
            title="Use realistic sample chat — no setup"
          >
            Try Demo Mode
          </button>
          <div className="flex gap-2">
            <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200">
              Cancel
            </button>
            <button
              onClick={() => apply(false)}
              disabled={!anySelected}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-accent/25 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Connect
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

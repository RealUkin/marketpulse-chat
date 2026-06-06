"use client";
// Reply box — lets the signed-in streamer post to their Twitch chat from here.
// Reading chat needs no login; replying does (your own OAuth token, stored
// locally). Degrades gracefully when no Twitch app is configured.
import { useState } from "react";
import { isTwitchConfigured, beginTwitchSignIn, signOutTwitch, type TwitchAuth } from "@/lib/twitchAuth";

interface Props {
  channel?: string; // connected Twitch channel = reply target
  demo: boolean;
  auth: TwitchAuth | null;
  onSignOut: () => void;
  onSend: (text: string) => void;
  sendError?: string | null;
}

const SETUP_DOCS =
  "https://github.com/RealUkin/marketpulse-chat#-reply-from-the-app-twitch-sign-in";

export function Composer({ channel, demo, auth, onSignOut, onSend, sendError }: Props) {
  const [text, setText] = useState("");
  const configured = isTwitchConfigured();

  // No Twitch app configured — show that the feature exists + how to turn it on.
  if (!configured) {
    return (
      <Bar>
        <span className="text-zinc-400">
          <span className="text-zinc-300">💬 Reply from here</span> — add a Twitch app to enable sign-in.
        </span>
        <a
          href={SETUP_DOCS}
          target="_blank"
          rel="noreferrer"
          className="ml-auto rounded-md bg-white/5 px-2.5 py-1 text-xs text-zinc-300 ring-1 ring-white/10 transition hover:bg-white/10"
        >
          Set it up →
        </a>
      </Bar>
    );
  }

  // Configured but not signed in.
  if (!auth) {
    return (
      <Bar>
        <button
          onClick={beginTwitchSignIn}
          className="flex items-center gap-2 rounded-lg bg-[#9146FF] px-3.5 py-1.5 text-sm font-semibold text-white shadow-lg shadow-[#9146FF]/25 transition hover:brightness-110"
        >
          <TwitchGlyph /> Sign in with Twitch to reply
        </button>
        <span className="text-[11px] text-zinc-500">Reading works without it — sign-in just lets you post back.</span>
      </Bar>
    );
  }

  const canSend = !!channel && !demo && text.trim().length > 0;
  const submit = () => {
    if (!canSend) return;
    onSend(text.trim());
    setText("");
  };
  const placeholder = demo
    ? "Turn off Demo and connect your channel to reply"
    : channel
      ? `Message #${channel} as ${auth.login}…`
      : "Connect your Twitch channel to reply";

  return (
    <div className="border-t border-white/5 bg-ink-900/60 px-4 py-2.5">
      <div className="flex items-center gap-2">
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#9146FF]/20 text-[#b794ff]" title="Replying as you on Twitch">
          <TwitchGlyph />
        </span>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          disabled={demo || !channel}
          placeholder={placeholder}
          maxLength={480}
          className="min-w-0 flex-1 rounded-lg bg-white/5 px-3 py-1.5 text-sm outline-none ring-1 ring-white/5 transition focus:ring-2 focus:ring-accent/60 disabled:opacity-50"
        />
        <button
          onClick={submit}
          disabled={!canSend}
          className="shrink-0 rounded-lg bg-accent px-3.5 py-1.5 text-sm font-semibold text-white shadow-lg shadow-accent/20 transition enabled:hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Send
        </button>
      </div>
      <div className="mt-1 flex items-center gap-2 pl-8 text-[11px] text-zinc-500">
        {sendError ? (
          <span className="text-red-400">⚠ {sendError}</span>
        ) : (
          <span>
            Signed in as <span className="text-zinc-300">{auth.login}</span>
          </span>
        )}
        <button
          onClick={() => {
            signOutTwitch();
            onSignOut();
          }}
          className="ml-auto text-zinc-500 underline-offset-2 transition hover:text-zinc-300 hover:underline"
        >
          sign out
        </button>
      </div>
    </div>
  );
}

function Bar({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 border-t border-white/5 bg-ink-900/60 px-4 py-2.5 text-sm">
      {children}
    </div>
  );
}

function TwitchGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
      <path d="M4 2 2.5 6v14h5v3h3l3-3h4l5-5V2H4zm16 11-3 3h-5l-3 3v-3H5V4h15v9zM16 7h-2v5h2V7zm-5 0H9v5h2V7z" />
    </svg>
  );
}

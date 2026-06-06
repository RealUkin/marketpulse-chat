"use client";
// Twitch sign-in for the STREAMER, so they can reply from inside the app.
// Uses the OAuth implicit grant (no client secret needed — safe for a static
// client). The access token lives only in this browser's localStorage; it is
// never sent to git, only to the local ingestion server when you send a message.

const CLIENT_ID = process.env.NEXT_PUBLIC_TWITCH_CLIENT_ID ?? "";
const SCOPES = ["chat:read", "chat:edit"]; // read + post chat as you
const STORAGE_KEY = "mp-twitch-auth";
const STATE_KEY = "mp-twitch-state";

export interface TwitchAuth {
  token: string;
  login: string;
  userId: string;
}

export function isTwitchConfigured(): boolean {
  return CLIENT_ID.length > 0;
}

export function getStoredTwitchAuth(): TwitchAuth | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TwitchAuth) : null;
  } catch {
    return null;
  }
}

export function signOutTwitch(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* noop */
  }
}

// Kick off the OAuth redirect. Returns to the current page with the token in the
// URL fragment, which consumeTwitchRedirect() picks up on the next load.
export function beginTwitchSignIn(): void {
  if (!CLIENT_ID) return;
  const redirect = window.location.origin; // register exactly this in your Twitch app
  const state = Math.random().toString(36).slice(2) + Date.now().toString(36);
  try {
    window.sessionStorage.setItem(STATE_KEY, state);
  } catch {
    /* noop */
  }
  const url = new URL("https://id.twitch.tv/oauth2/authorize");
  url.searchParams.set("client_id", CLIENT_ID);
  url.searchParams.set("redirect_uri", redirect);
  url.searchParams.set("response_type", "token");
  url.searchParams.set("scope", SCOPES.join(" "));
  url.searchParams.set("state", state);
  window.location.href = url.toString();
}

// On load, if we came back from Twitch with a token, validate it (to learn the
// login name), store it, and clean the URL. Returns the auth or null.
export async function consumeTwitchRedirect(): Promise<TwitchAuth | null> {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash;
  if (!hash.includes("access_token=")) return null;

  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const token = params.get("access_token");
  const state = params.get("state");
  let expected: string | null = null;
  try {
    expected = window.sessionStorage.getItem(STATE_KEY);
  } catch {
    /* noop */
  }
  // Always clean the fragment so a refresh doesn't reprocess it.
  window.history.replaceState(null, "", window.location.pathname + window.location.search);

  if (!token) return null;
  if (expected && state !== expected) return null; // CSRF guard

  const auth = await validateTwitchToken(token);
  if (auth) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
    } catch {
      /* noop */
    }
  }
  return auth;
}

// /oauth2/validate returns the login + user_id for an implicit-grant token.
async function validateTwitchToken(token: string): Promise<TwitchAuth | null> {
  try {
    const res = await fetch("https://id.twitch.tv/oauth2/validate", {
      headers: { Authorization: `OAuth ${token}` },
    });
    if (!res.ok) return null;
    const d = (await res.json()) as { login?: string; user_id?: string };
    if (!d.login) return null;
    return { token, login: d.login, userId: d.user_id ?? "" };
  } catch {
    return null;
  }
}

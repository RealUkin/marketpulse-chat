// X (Twitter) adapter — Playwright headful + WebSocket-frame interception.
// Reads the live broadcast's "chatman" socket (chatapi/v1/chatnow) — the same
// structured JSON the native client gets, immune to DOM churn.
// Requires a logged-in burner session saved to x-auth.json (guest tokens died 2023).
import type { BrowserContext, Page } from "playwright";
import type { MessageFlags, UnifiedMessage } from "../../shared/types";
import { analyze } from "../../shared/intelligence";
import type { Adapter, Emit, StatusFn } from "./types";
import { hasXAuth, newXContext } from "../browser";

function broadcastUrl(input: string): string {
  const s = input.trim();
  if (s.startsWith("http")) return s;
  return `https://x.com/i/broadcasts/${s}`;
}

export function createXAdapter(input: string, emit: Emit, status: StatusFn): Adapter {
  let ctx: BrowserContext | null = null;
  let page: Page | null = null;
  let stopped = false;

  status("x", "connecting");

  if (!hasXAuth()) {
    status(
      "x",
      "error",
      "X needs a burner session — save cookies to x-auth.json (see README §X). Demo Mode works meanwhile.",
    );
    return { stop: () => {} };
  }

  (async () => {
    try {
      ctx = await newXContext();
      page = await ctx.newPage();
      let logged = 0;

      page.on("websocket", (ws) => {
        if (!ws.url().includes("chatapi/v1/chatnow")) return;
        status("x", "connected", "live chat socket");
        ws.on("framereceived", (data) => {
          if (stopped) return;
          // Log the first few raw frames so the exact text-field schema can be
          // confirmed on a real broadcast during the Day-1 spike.
          if (logged < 3) {
            logged++;
            // eslint-disable-next-line no-console
            console.log("[x] sample frame:", String(data.payload).slice(0, 320));
          }
          const msg = parseXFrame(data.payload);
          if (msg) emit(msg);
        });
      });

      await page.goto(broadcastUrl(input), { waitUntil: "domcontentloaded", timeout: 45_000 });
      status("x", "connected", "watching broadcast");
    } catch (e) {
      if (!stopped) status("x", "error", `X: ${(e as Error).message ?? String(e)}`);
    }
  })();

  return {
    stop: () => {
      stopped = true;
      ctx?.close().catch(() => {});
    },
  };
}

// Defensive parser — chatman frames are doubly-nested JSON; exact text field
// varies, so we probe the common candidates.
function parseXFrame(payload: string | Buffer): UnifiedMessage | null {
  try {
    const raw = typeof payload === "string" ? payload : payload.toString("utf8");
    const outer: any = JSON.parse(raw);

    let inner: any = outer;
    if (typeof outer.payload === "string") {
      try {
        inner = JSON.parse(outer.payload);
      } catch {
        inner = outer;
      }
    }

    let body: any = inner.body ?? inner;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch {
        /* body stays a string */
      }
    }

    const text: string =
      (body && typeof body === "object" && (body.body || body.message || body.text)) ||
      (typeof inner.body === "string" ? inner.body : "") ||
      "";
    if (!text) return null;

    const sender: any =
      (body && typeof body === "object" && (body.sender || body.user)) || inner.sender || {};
    const username =
      sender.username || sender.screen_name || sender.display_name || sender.name || "x_user";
    const verified = !!(sender.verified || sender.is_verified || sender.verified_type);

    const flags: MessageFlags = {
      broadcaster: false,
      moderator: false,
      vip: false,
      subscriber: false,
      verified,
    };

    const msg: UnifiedMessage = {
      id: `x_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      platform: "x",
      channel: "x",
      username: String(username),
      displayName: String(sender.display_name || username),
      avatarUrl: sender.profile_image_url || sender.profile_image_url_https,
      text: String(text),
      timestamp: Date.now(),
      badges: verified ? [{ type: "verified", label: "Verified" }] : [],
      flags,
    };
    msg.intelligence = analyze(msg.text, flags);
    return msg;
  } catch {
    return null;
  }
}

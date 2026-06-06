// Standalone ingestion server: connects to each platform, normalizes, and
// fans messages out to browser clients over one WebSocket.
import { WebSocketServer, WebSocket } from "ws";
import type { ChannelConfig, ClientCommand, Platform, ConnectionState, ServerEvent, UnifiedMessage } from "../shared/types";
import { analyze } from "../shared/intelligence";
import { createDemoAdapter } from "./adapters/demo";
import { createTwitchAdapter } from "./adapters/twitch";
import { createKickAdapter } from "./adapters/kick";
import { createXAdapter } from "./adapters/x";
import { createYouTubeAdapter } from "./adapters/youtube";
import type { Adapter } from "./adapters/types";
import { fetchMarkets } from "./polymarket";
import { sendTwitchMessage } from "./send";
import { moderateTwitch } from "./moderate";
import { fetchPrices } from "./coingecko";

const PORT = Number(process.env.WS_PORT ?? 3001);

class Session {
  private adapters: Adapter[] = [];
  private marketsTimer: ReturnType<typeof setInterval> | null = null;
  constructor(private ws: WebSocket) {}

  private send(ev: ServerEvent) {
    if (this.ws.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(ev));
  }

  private emit = (msg: UnifiedMessage) => {
    if (!msg.intelligence) msg.intelligence = analyze(msg.text, msg.flags);
    this.send({ type: "message", data: msg });
  };

  private status = (platform: Platform, state: ConnectionState, detail?: string) => {
    this.send({ type: "status", platform, state, detail });
  };

  private pushMarkets = async () => {
    const data = await fetchMarkets();
    if (data.length) this.send({ type: "markets", data });
  };

  private pushPrices = async () => {
    const data = await fetchPrices();
    if (data.length) this.send({ type: "prices", data });
  };

  private startMarkets() {
    void this.pushMarkets();
    void this.pushPrices();
    this.marketsTimer = setInterval(() => {
      void this.pushMarkets();
      void this.pushPrices();
    }, 90_000);
  }

  start(channels: ChannelConfig, demo: boolean) {
    this.stopAll();
    this.startMarkets();
    if (demo) {
      this.adapters.push(createDemoAdapter(this.emit, this.status));
      return; // demo covers all three platforms
    }
    if (channels.twitch) this.adapters.push(createTwitchAdapter(channels.twitch, this.emit, this.status));
    if (channels.kick) this.adapters.push(createKickAdapter(channels.kick, this.emit, this.status));
    if (channels.x) this.adapters.push(createXAdapter(channels.x, this.emit, this.status));
    if (channels.youtube) this.adapters.push(createYouTubeAdapter(channels.youtube, this.emit, this.status));
  }

  stopAll() {
    if (this.marketsTimer) {
      clearInterval(this.marketsTimer);
      this.marketsTimer = null;
    }
    for (const a of this.adapters) {
      try {
        a.stop();
      } catch {
        /* noop */
      }
    }
    this.adapters = [];
  }
}

const wss = new WebSocketServer({ port: PORT });

// Broadcast to every connected client (used for "feature this message" → overlay).
function broadcast(ev: ServerEvent) {
  const data = JSON.stringify(ev);
  for (const c of wss.clients) if (c.readyState === WebSocket.OPEN) c.send(data);
}

wss.on("connection", (ws) => {
  const session = new Session(ws);
  ws.send(JSON.stringify({ type: "hello", ok: true }));

  ws.on("message", (raw) => {
    let cmd: ClientCommand;
    try {
      cmd = JSON.parse(raw.toString());
    } catch {
      return;
    }
    if (cmd.type === "subscribe") session.start(cmd.channels, cmd.demo);
    else if (cmd.type === "feature") broadcast({ type: "featured", data: cmd.data });
    else if (cmd.type === "unfeature") broadcast({ type: "featured", data: null });
    else if (cmd.type === "send") {
      // Reply only to the requesting client (never broadcast a token result).
      const reply = (ev: ServerEvent) => {
        if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(ev));
      };
      if (cmd.platform === "twitch") {
        sendTwitchMessage({ channel: cmd.channel, text: cmd.text, token: cmd.token, login: cmd.login })
          .then(() => reply({ type: "sendResult", ok: true }))
          .catch((e) => reply({ type: "sendResult", ok: false, error: String(e?.message ?? e) }));
      } else {
        reply({ type: "sendResult", ok: false, error: `Replying to ${cmd.platform} isn't supported yet` });
      }
    } else if (cmd.type === "moderate") {
      const reply = (ev: ServerEvent) => {
        if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(ev));
      };
      moderateTwitch(cmd)
        .then(() => reply({ type: "modResult", ok: true, action: cmd.action }))
        .catch((e) => reply({ type: "modResult", ok: false, action: cmd.action, error: String(e?.message ?? e) }));
    }
  });

  ws.on("close", () => session.stopAll());
  ws.on("error", () => session.stopAll());
});

// eslint-disable-next-line no-console
console.log(`[server] MarketPulse ingestion WS listening on ws://localhost:${PORT}`);

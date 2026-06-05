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

  private startMarkets() {
    void this.pushMarkets();
    this.marketsTimer = setInterval(() => void this.pushMarkets(), 90_000);
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
  });

  ws.on("close", () => session.stopAll());
  ws.on("error", () => session.stopAll());
});

// eslint-disable-next-line no-console
console.log(`[server] MarketPulse ingestion WS listening on ws://localhost:${PORT}`);

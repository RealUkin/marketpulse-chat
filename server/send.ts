// Sends chat messages AS the signed-in streamer, using their own OAuth token.
// Tokens arrive only over the local WS, are held in memory for the session, and
// are never logged or persisted. No token ever touches disk or git.
import tmi from "tmi.js";

interface SendArgs {
  channel: string;
  text: string;
  token: string;
  login: string;
}

// One authenticated client per login, reused across messages (avoids reconnect
// latency on every send). Rebuilt if the token changes (re-auth).
interface Entry {
  client: tmi.Client;
  token: string;
  joined: Set<string>;
}
const clients = new Map<string, Entry>();

export async function sendTwitchMessage({ channel, text, token, login }: SendArgs): Promise<void> {
  const chan = channel.replace(/^#/, "").toLowerCase().trim();
  const user = login.toLowerCase().trim();
  if (!user || !token) throw new Error("Not signed in to Twitch");
  if (!chan) throw new Error("No channel to send to");
  if (!text.trim()) throw new Error("Message is empty");

  let entry = clients.get(user);
  if (entry && entry.token !== token) {
    // Token changed — tear down the stale client and rebuild.
    try {
      await entry.client.disconnect();
    } catch {
      /* noop */
    }
    clients.delete(user);
    entry = undefined;
  }

  if (!entry) {
    const client = new tmi.Client({
      options: { skipUpdatingEmotesets: true },
      connection: { reconnect: true, secure: true },
      identity: { username: user, password: `oauth:${token}` },
    });
    await client.connect(); // throws "Login authentication failed" on a bad/expired token
    entry = { client, token, joined: new Set() };
    clients.set(user, entry);
  }

  if (!entry.joined.has(chan)) {
    await entry.client.join(chan);
    entry.joined.add(chan);
  }

  await entry.client.say(chan, text);
}

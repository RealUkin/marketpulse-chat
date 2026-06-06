// Twitch moderation via the Helix API, run as the signed-in streamer/mod.
// (Twitch removed chat-command moderation like "/ban" — Helix is the supported
// path now.) Token + client id arrive over the local WS only; nothing persists.

interface ModArgs {
  action: "delete" | "timeout" | "ban";
  broadcasterId: string;
  moderatorId: string;
  targetUserId?: string;
  messageId?: string;
  durationSec?: number;
  token: string;
  clientId: string;
}

async function ensureOk(res: Response): Promise<void> {
  if (res.ok || res.status === 204) return;
  let detail = `HTTP ${res.status}`;
  try {
    const j = (await res.json()) as { message?: string };
    if (j.message) detail = j.message;
  } catch {
    /* no body */
  }
  // Friendlier hints for the usual failures.
  if (res.status === 401) detail = "Not authorized — sign in again (token expired or missing scope)";
  else if (res.status === 403) detail = "You're not a moderator of this channel";
  throw new Error(detail);
}

export async function moderateTwitch(a: ModArgs): Promise<void> {
  if (!a.token || !a.clientId) throw new Error("Not signed in to Twitch");
  if (!a.broadcasterId) throw new Error("Missing channel id (connect a real Twitch channel)");
  if (!a.moderatorId) throw new Error("Missing moderator id — sign in again");

  const headers: Record<string, string> = {
    Authorization: `Bearer ${a.token}`,
    "Client-Id": a.clientId,
    "Content-Type": "application/json",
  };

  if (a.action === "delete") {
    if (!a.messageId) throw new Error("No message id to delete");
    const url =
      `https://api.twitch.tv/helix/moderation/chat?broadcaster_id=${a.broadcasterId}` +
      `&moderator_id=${a.moderatorId}&message_id=${encodeURIComponent(a.messageId)}`;
    await ensureOk(await fetch(url, { method: "DELETE", headers }));
    return;
  }

  // ban (permanent) or timeout (duration in seconds)
  if (!a.targetUserId) throw new Error("No user to moderate");
  const url = `https://api.twitch.tv/helix/moderation/bans?broadcaster_id=${a.broadcasterId}&moderator_id=${a.moderatorId}`;
  const data: { user_id: string; duration?: number } = { user_id: a.targetUserId };
  if (a.action === "timeout") data.duration = a.durationSec && a.durationSec > 0 ? a.durationSec : 600;
  await ensureOk(await fetch(url, { method: "POST", headers, body: JSON.stringify({ data }) }));
}

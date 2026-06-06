// Common chat bots across platforms — used by the "hide bots" toggle so the
// feed shows people, not automated command/spam accounts.
const BOTS = new Set<string>([
  // Twitch / cross-platform
  "nightbot",
  "streamelements",
  "streamlabs",
  "moobot",
  "fossabot",
  "wizebot",
  "botisimo",
  "phantombot",
  "soundalerts",
  "pretzelrocks",
  "sery_bot",
  "commanderroot",
  "lurxx",
  "anotherttvviewer",
  "streamlootsbot",
  "tangiabot",
  "kofistreambot",
  // Kick
  "botrix",
  "botrixoficial",
  // YouTube
  "nightbot_yt",
]);

export function isBot(username: string): boolean {
  return BOTS.has(username.toLowerCase().trim());
}

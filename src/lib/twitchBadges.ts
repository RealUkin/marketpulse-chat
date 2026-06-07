// Well-known GLOBAL Twitch badge images (stable public UUIDs) so common badges
// render as real images even without sign-in. Per-channel custom badges (sub
// tiers, bits) come from the authenticated fetch and override/extend these.
export const GLOBAL_TWITCH_BADGES: Record<string, string> = {
  "broadcaster/1": "https://static-cdn.jtvnw.net/badges/v1/5527c58c-fb7d-422d-b71b-f309dcb85cc1/2",
  "moderator/1": "https://static-cdn.jtvnw.net/badges/v1/3267646d-33f0-4b17-b3df-f923a41db1d0/2",
  "vip/1": "https://static-cdn.jtvnw.net/badges/v1/b817aba4-fad8-49e2-b88a-7cc744dfa6ec/2",
  "partner/1": "https://static-cdn.jtvnw.net/badges/v1/d12a2e27-16f6-41d0-ab77-b780518f00a3/2",
  "premium/1": "https://static-cdn.jtvnw.net/badges/v1/bbbe0db0-a598-423e-86d0-f9fb98ca1933/2",
  "turbo/1": "https://static-cdn.jtvnw.net/badges/v1/bd444ec6-8f34-4bf9-91f4-af1e3428d80f/2",
};

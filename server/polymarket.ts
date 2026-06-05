// Polymarket live odds via the public Gamma API (verified reachable, no auth).
import type { MarketInfo } from "../shared/types";

const GAMMA = "https://gamma-api.polymarket.com/markets?closed=false&active=true&limit=150";
const CRYPTO_RE = /bitcoin|btc|solana|\bsol\b|ethereum|\beth\b|crypto|coin\b|token|memecoin|altcoin|\bxrp\b|dogecoin|\bdoge\b/i;

function parseList(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw as string[];
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }
  return [];
}

export async function fetchMarkets(): Promise<MarketInfo[]> {
  try {
    const res = await fetch(GAMMA, { headers: { Accept: "application/json" } });
    if (!res.ok) return [];
    const data: any = await res.json();
    const arr: any[] = Array.isArray(data) ? data : data?.data ?? [];

    const parsed: MarketInfo[] = arr
      .map((m) => {
        const outcomes = parseList(m.outcomes);
        const prices = parseList(m.outcomePrices).map((p) => Number(p));
        return {
          id: String(m.id ?? m.conditionId ?? m.slug ?? ""),
          question: String(m.question ?? "").trim(),
          outcomes,
          prices,
          volume: Number(m.volume ?? m.volumeNum ?? 0),
          url: m.slug ? `https://polymarket.com/event/${m.slug}` : "https://polymarket.com",
        };
      })
      .filter((m) => m.question && m.outcomes.length >= 2 && m.prices.length >= 2);

    // Prefer crypto-relevant markets for this audience, then fill with top volume.
    const byVolume = [...parsed].sort((a, b) => b.volume - a.volume);
    const crypto = byVolume.filter((m) => CRYPTO_RE.test(m.question));
    const picked: MarketInfo[] = [...crypto];
    for (const m of byVolume) {
      if (picked.length >= 6) break;
      if (!picked.some((x) => x.id === m.id)) picked.push(m);
    }
    return picked.slice(0, 6);
  } catch {
    return [];
  }
}

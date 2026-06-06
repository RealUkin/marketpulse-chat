// Keyless live token prices (CoinGecko public API) for the "Chat × Market"
// panel — pairs chat $ticker hype with what the market is actually doing.
import { TICKER_IDS, idToSymbol } from "../shared/tickers";
import type { PriceInfo } from "../shared/types";

let cache: { at: number; data: PriceInfo[] } = { at: 0, data: [] };

export async function fetchPrices(): Promise<PriceInfo[]> {
  if (cache.data.length && Date.now() - cache.at < 60_000) return cache.data;
  try {
    const url =
      `https://api.coingecko.com/api/v3/simple/price?ids=${TICKER_IDS.join(",")}` +
      `&vs_currencies=usd&include_24hr_change=true`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return cache.data;
    const j = (await res.json()) as Record<string, { usd?: number; usd_24h_change?: number }>;
    const data: PriceInfo[] = [];
    for (const [id, v] of Object.entries(j)) {
      const symbol = idToSymbol(id);
      if (symbol && typeof v.usd === "number") {
        data.push({ symbol, price: v.usd, change24h: v.usd_24h_change ?? 0 });
      }
    }
    if (data.length) cache = { at: Date.now(), data };
    return data;
  } catch {
    return cache.data;
  }
}

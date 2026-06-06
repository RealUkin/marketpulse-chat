// $ticker symbol -> CoinGecko id, for keyless live price lookups in the
// "Chat × Market" panel. Unknown ids are simply omitted by CoinGecko, so a
// slightly-off id is harmless (it just returns no price).
export const TICKER_TO_ID: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana",
  BNB: "binancecoin",
  XRP: "ripple",
  DOGE: "dogecoin",
  ADA: "cardano",
  AVAX: "avalanche-2",
  LINK: "chainlink",
  SUI: "sui",
  HYPE: "hyperliquid",
  BONK: "bonk",
  WIF: "dogwifcoin",
  PEPE: "pepe",
  SHIB: "shiba-inu",
  POPCAT: "popcat",
  FARTCOIN: "fartcoin",
  JUP: "jupiter-exchange-solana",
  TRUMP: "official-trump",
  PENGU: "pudgy-penguins",
};

export const TICKER_IDS = Object.values(TICKER_TO_ID);

const ID_TO_TICKER: Record<string, string> = Object.fromEntries(
  Object.entries(TICKER_TO_ID).map(([sym, id]) => [id, sym]),
);

export function idToSymbol(id: string): string | undefined {
  return ID_TO_TICKER[id];
}

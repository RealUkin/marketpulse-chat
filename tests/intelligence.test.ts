import { describe, it, expect } from "vitest";
import { analyze } from "../shared/intelligence";

const noFlags = {
  broadcaster: false,
  moderator: false,
  vip: false,
  subscriber: false,
  verified: false,
};

describe("analyze() — chat intelligence", () => {
  it("extracts cashtags, uppercased and de-duplicated", () => {
    const r = analyze("buying $sol and $SOL and $btc", noFlags);
    expect(r.tickers.sort()).toEqual(["$BTC", "$SOL"]);
  });

  it("ignores plain dollar amounts", () => {
    expect(analyze("send me $5 please", noFlags).tickers).toEqual([]);
  });

  it("detects bullish sentiment", () => {
    expect(analyze("lfg $SOL to the moon 🚀", noFlags).sentiment).toBe("bullish");
  });

  it("detects bearish sentiment", () => {
    expect(analyze("this is a rug, dump it 📉", noFlags).sentiment).toBe("bearish");
  });

  it("flags questions", () => {
    expect(analyze("is btc gonna pump?", noFlags).isQuestion).toBe(true);
    expect(analyze("btc pumping", noFlags).isQuestion).toBe(false);
  });

  it("ranks high-value users above normal users", () => {
    const mod = analyze("when moon?", { ...noFlags, moderator: true });
    const normal = analyze("when moon?", noFlags);
    expect(mod.priorityScore).toBeGreaterThan(normal.priorityScore);
    expect(mod.isHighValueUser).toBe(true);
    expect(normal.isHighValueUser).toBe(false);
  });
});

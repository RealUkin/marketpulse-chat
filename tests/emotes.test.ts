import { describe, it, expect } from "vitest";
import { twitchParts, kickParts, cleanKickText, expandWordEmotes } from "../shared/emotes";

describe("twitchParts (native emote tokenizing)", () => {
  it("splits text around an emote by code-point range", () => {
    const parts = twitchParts("Kappa hi", { "25": ["0-4"] });
    expect(parts?.[0]).toMatchObject({ t: "emote", name: "Kappa" });
    expect(parts?.[1]).toMatchObject({ t: "text", v: " hi" });
  });
  it("returns undefined when there are no emotes", () => {
    expect(twitchParts("hello", {})).toBeUndefined();
  });
});

describe("kickParts / cleanKickText", () => {
  it("extracts [emote:id:name] codes into emote parts", () => {
    const parts = kickParts("gg [emote:42:pog] wp");
    expect(parts?.some((p) => p.t === "emote" && p.name === "pog")).toBe(true);
  });
  it("cleanKickText strips emote codes down to their names", () => {
    expect(cleanKickText("gg [emote:42:pog] wp")).toBe("gg pog wp");
  });
});

describe("expandWordEmotes (7TV/BTTV/FFZ word matching)", () => {
  it("replaces matching whole words with emote images", () => {
    const map = new Map([["OMEGALUL", "https://cdn/x.webp"]]);
    const out = expandWordEmotes(undefined, "lol OMEGALUL yes", map);
    expect(out?.some((p) => p.t === "emote" && p.name === "OMEGALUL")).toBe(true);
  });
  it("leaves parts unchanged when the emote map is empty", () => {
    expect(expandWordEmotes(undefined, "hi", new Map())).toBeUndefined();
  });
});

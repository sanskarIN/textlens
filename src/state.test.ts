import { describe, expect, it } from "vitest";
import { defaultSettings, parseSettings } from "./state";

describe("settings parsing", () => {
  it("accepts valid persisted values", () => {
    expect(
      parseSettings({
        theme: "dark",
        readingWpm: 300,
        speakingWpm: 120,
        topKeywords: 20,
        topNgrams: 15,
        reducedMotion: true,
      }),
    ).toEqual({
      theme: "dark",
      readingWpm: 300,
      speakingWpm: 120,
      topKeywords: 20,
      topNgrams: 15,
      reducedMotion: true,
    });
  });

  it("rejects malformed storage values", () => {
    expect(
      parseSettings({
        theme: "neon",
        readingWpm: -1,
        speakingWpm: Number.NaN,
        topKeywords: 0,
        topNgrams: 999,
        reducedMotion: "yes",
      }),
    ).toEqual(defaultSettings);
  });

  it("uses defaults for non-object JSON", () => {
    expect(parseSettings(null)).toEqual(defaultSettings);
    expect(parseSettings(["dark"])).toEqual(defaultSettings);
    expect(parseSettings("dark")).toEqual(defaultSettings);
  });
});

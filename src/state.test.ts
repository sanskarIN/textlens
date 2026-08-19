import { describe, expect, it } from "vitest";
import { defaultSettings, parseAnalysisOptions, parseSettings } from "./state";

describe("settings parsing", () => {
  it("accepts valid persisted values", () => {
    expect(
      parseSettings({
        theme: "dark",
        readingWpm: 300,
        speakingWpm: 120,
        topKeywords: 20,
        topNgrams: 15,
        keywordExclusions: ["the", "and"],
        reducedMotion: true,
        recentFilesEnabled: true,
      }),
    ).toEqual({
      theme: "dark",
      readingWpm: 300,
      speakingWpm: 120,
      topKeywords: 20,
      topNgrams: 15,
      keywordExclusions: ["the", "and"],
      reducedMotion: true,
      recentFilesEnabled: true,
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
        keywordExclusions: "the,and",
        reducedMotion: "yes",
        recentFilesEnabled: "yes",
      }),
    ).toEqual(defaultSettings);
  });

  it("uses defaults for non-object JSON", () => {
    expect(parseSettings(null)).toEqual(defaultSettings);
    expect(parseSettings(["dark"])).toEqual(defaultSettings);
    expect(parseSettings("dark")).toEqual(defaultSettings);
  });

  it("trims deduplicates and bounds keyword exclusions", () => {
    const long = "x".repeat(100);
    const parsed = parseSettings({
      ...defaultSettings,
      keywordExclusions: ["  The  ", "the", "AND", "", 42, long],
    });

    expect(parsed.keywordExclusions).toEqual(["The", "AND", "x".repeat(64)]);
  });

  it("limits keyword exclusions to one hundred entries", () => {
    const parsed = parseSettings({
      ...defaultSettings,
      keywordExclusions: Array.from({ length: 150 }, (_, index) => `word-${index}`),
    });
    expect(parsed.keywordExclusions).toHaveLength(100);
  });

  it("validates analysis options independently for reusable workflows", () => {
    expect(
      parseAnalysisOptions({
        readingWpm: 350,
        speakingWpm: 175,
        topKeywords: 18,
        topNgrams: 14,
        keywordExclusions: ["  Alpha ", "alpha", "Beta"],
      }),
    ).toEqual({
      readingWpm: 350,
      speakingWpm: 175,
      topKeywords: 18,
      topNgrams: 14,
      keywordExclusions: ["Alpha", "Beta"],
    });
  });
});

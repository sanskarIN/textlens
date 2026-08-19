import { describe, expect, it } from "vitest";
import { defaultSettings } from "../state";
import type { AnalysisPreset } from "../types";
import {
  MAX_ANALYSIS_PRESETS,
  applyAnalysisPreset,
  createAnalysisPreset,
  parseAnalysisPresets,
  removeAnalysisPreset,
  upsertAnalysisPreset,
} from "./presets";

function preset(name: string, readingWpm = 238): AnalysisPreset {
  return {
    name,
    readingWpm,
    speakingWpm: 150,
    topKeywords: 12,
    topNgrams: 10,
    keywordExclusions: [],
  };
}

describe("analysis presets", () => {
  it("parses names and bounded analysis options from untrusted storage", () => {
    const parsed = parseAnalysisPresets([
      {
        name: `  ${"A".repeat(60)}  `,
        readingWpm: 300,
        speakingWpm: 120,
        topKeywords: 20,
        topNgrams: 15,
        keywordExclusions: ["  The ", "the", "and"],
      },
      null,
      { name: "" },
    ]);

    expect(parsed).toEqual([
      {
        name: "A".repeat(48),
        readingWpm: 300,
        speakingWpm: 120,
        topKeywords: 20,
        topNgrams: 15,
        keywordExclusions: ["The", "and"],
      },
    ]);
  });

  it("deduplicates names case-insensitively and caps the collection", () => {
    const values = [
      preset("Writing"),
      preset("writing", 400),
      ...Array.from({ length: 20 }, (_, index) => preset(`Preset ${index}`)),
    ];

    const parsed = parseAnalysisPresets(values);
    expect(parsed).toHaveLength(MAX_ANALYSIS_PRESETS);
    expect(parsed[0]).toEqual(preset("Writing"));
    expect(parsed.some((item) => item.name === "writing")).toBe(false);
  });

  it("creates a preset from current analysis settings only", () => {
    const created = createAnalysisPreset("  Proofreading  ", {
      ...defaultSettings,
      theme: "dark",
      reducedMotion: true,
      recentFilesEnabled: true,
      readingWpm: 320,
      topKeywords: 24,
      keywordExclusions: ["the", "and"],
    });

    expect(created).toEqual({
      name: "Proofreading",
      readingWpm: 320,
      speakingWpm: 150,
      topKeywords: 24,
      topNgrams: 10,
      keywordExclusions: ["the", "and"],
    });
  });

  it("replaces an existing named preset and moves it to the front", () => {
    const updated = upsertAnalysisPreset(
      [preset("Default"), preset("Writing", 250)],
      preset("writing", 450),
    );

    expect(updated).toEqual([preset("writing", 450), preset("Default")]);
  });

  it("removes only a valid selected preset", () => {
    expect(removeAnalysisPreset([preset("One"), preset("Two")], 0)).toEqual([preset("Two")]);
    expect(removeAnalysisPreset([preset("One")], 99)).toEqual([preset("One")]);
  });

  it("applies analysis values while preserving appearance and privacy preferences", () => {
    const settings = {
      ...defaultSettings,
      theme: "dark" as const,
      reducedMotion: true,
      recentFilesEnabled: true,
    };

    expect(applyAnalysisPreset(settings, preset("Fast reading", 500))).toEqual({
      ...settings,
      readingWpm: 500,
      speakingWpm: 150,
      topKeywords: 12,
      topNgrams: 10,
      keywordExclusions: [],
    });
  });
});

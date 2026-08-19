import { describe, expect, it } from "vitest";

import type { AnalysisReport, FrequencyItem } from "../types";
import { comparisonMetrics, keywordDeltas } from "./comparison";

function report(
  words: number,
  uniqueWords: number,
  keywords: FrequencyItem[],
  version = 2,
): AnalysisReport {
  return {
    version,
    source: { kind: "pasted", displayName: null, mode: "memory", fileSize: null },
    encoding: null,
    stats: {
      words,
      uniqueWords,
      maxWordCharacters: words > 0 && version >= 2 ? 8 : 0,
      characters: words * 5,
      graphemes: words * 5,
      bytes: words * 5,
      sentences: Math.ceil(words / 5),
      paragraphs: words > 0 ? 1 : 0,
      lines: words > 0 ? 1 : 0,
      readingSeconds: words,
      speakingSeconds: words * 2,
    },
    keywords,
    bigrams: [],
    trigrams: [],
    whitespace: {
      spaces: Math.max(0, words - 1),
      tabs: 0,
      lineFeeds: 0,
      carriageReturns: 0,
      nonBreakingSpaces: 0,
      otherWhitespace: 0,
      blankLines: 0,
      trailingWhitespaceLines: 0,
      lineEndings: { lf: 0, crlf: 0, cr: 0, mixed: false, dominant: "None" },
    },
  };
}

describe("report comparison", () => {
  it("calculates signed metric deltas", () => {
    const current = report(20, 12, []);
    const baseline = report(15, 10, []);
    const metrics = comparisonMetrics(current, baseline);

    expect(metrics.find((item) => item.key === "words")).toMatchObject({
      current: 20,
      baseline: 15,
      delta: 5,
    });
    expect(metrics.find((item) => item.key === "uniqueWords")?.delta).toBe(2);
  });

  it("omits vocabulary deltas when a legacy report lacks that schema", () => {
    const current = report(20, 12, []);
    const baseline = report(15, 0, [], 1);
    expect(comparisonMetrics(current, baseline).some((item) => item.key === "uniqueWords")).toBe(
      false,
    );
  });

  it("ranks changed keywords by absolute count delta", () => {
    const current = report(20, 3, [
      { text: "rust", count: 8, percentage: 40 },
      { text: "tauri", count: 4, percentage: 20 },
    ]);
    const baseline = report(20, 3, [
      { text: "rust", count: 3, percentage: 15 },
      { text: "desktop", count: 4, percentage: 20 },
    ]);

    expect(keywordDeltas(current, baseline)).toEqual([
      { text: "rust", current: 8, baseline: 3, delta: 5 },
      { text: "desktop", current: 0, baseline: 4, delta: -4 },
      { text: "tauri", current: 4, baseline: 0, delta: 4 },
    ]);
  });

  it("omits unchanged keyword counts and clamps the limit", () => {
    const shared = [{ text: "same", count: 2, percentage: 10 }];
    expect(keywordDeltas(report(20, 1, shared), report(20, 1, shared), 100)).toEqual([]);
  });
});

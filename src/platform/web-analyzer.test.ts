import { describe, expect, it } from "vitest";
import { analyzeWebText } from "./web-analyzer";
import type { AnalysisOptions } from "../types";

const options: AnalysisOptions = {
  readingWpm: 240,
  speakingWpm: 150,
  topKeywords: 12,
  topNgrams: 10,
  keywordExclusions: [],
};

describe("portable web analyzer", () => {
  it("matches the core TextLens counting contract", () => {
    const report = analyzeWebText("Hello world.\n\nNext line!", options);

    expect(report.version).toBe(2);
    expect(report.stats.words).toBe(4);
    expect(report.stats.uniqueWords).toBe(4);
    expect(report.stats.maxWordCharacters).toBe(5);
    expect(report.stats.sentences).toBe(2);
    expect(report.stats.paragraphs).toBe(2);
    expect(report.stats.lines).toBe(3);
    expect(report.whitespace.blankLines).toBe(1);
  });

  it("keeps keyword exclusions separate from core counts and n-grams", () => {
    const report = analyzeWebText("the rust rust book", {
      ...options,
      keywordExclusions: ["THE", "rust"],
    });

    expect(report.stats.words).toBe(4);
    expect(report.stats.uniqueWords).toBe(3);
    expect(report.keywords.map((item) => item.text)).toEqual(["book"]);
    expect(report.bigrams.some((item) => item.text === "the rust")).toBe(true);
  });

  it("handles Unicode graphemes and mixed line endings", () => {
    const report = analyzeWebText("नमस्ते दुनिया café 👨‍👩‍👧‍👦\r\nnext\nlast\rend", options);

    expect(report.stats.words).toBeGreaterThanOrEqual(6);
    expect(report.stats.graphemes).toBeLessThanOrEqual(report.stats.characters);
    expect(report.whitespace.lineEndings.mixed).toBe(true);
    expect(report.stats.lines).toBe(4);
  });
});

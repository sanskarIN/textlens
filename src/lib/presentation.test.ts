import { describe, expect, it } from "vitest";

import { encodingSummary, escapeHtml, metricRows } from "./presentation";
import type { AnalysisReport } from "../types";

const report: AnalysisReport = {
  version: 1,
  source: { kind: "pasted", displayName: null, mode: "memory", fileSize: null },
  encoding: {
    name: "Windows-1252",
    bomDetected: false,
    fallbackUsed: true,
    hadErrors: true,
  },
  stats: {
    words: 3,
    uniqueWords: 2,
    maxWordCharacters: 8,
    characters: 18,
    graphemes: 18,
    bytes: 18,
    sentences: 1,
    paragraphs: 1,
    lines: 1,
    readingSeconds: 1,
    speakingSeconds: 2,
  },
  keywords: [],
  bigrams: [],
  trigrams: [],
  whitespace: {
    spaces: 2,
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

describe("presentation helpers", () => {
  it("escapes untrusted HTML", () => {
    expect(escapeHtml(`<script>alert("x")</script> & 'quoted'`)).toBe(
      "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; &#039;quoted&#039;",
    );
  });

  it("includes vocabulary metrics", () => {
    const rows = metricRows(report);
    expect(rows).toContainEqual(["Unique words", "2"]);
    expect(rows).toContainEqual(["Longest word", "8 chars"]);
  });

  it("surfaces fallback and replacement warnings", () => {
    expect(encodingSummary(report)).toBe("Windows-1252 · fallback · replacement chars");
  });
});

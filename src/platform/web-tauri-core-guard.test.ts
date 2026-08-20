import { describe, expect, it } from "vitest";
import type { AnalysisOptions, FrequencyItem } from "../types";
import { analyzeWebText } from "./web-analyzer";
import {
  assertNativeReportParity,
  decodePortableTextForParity,
} from "./web-tauri-core-guard";

const options: AnalysisOptions = {
  readingWpm: 240,
  speakingWpm: 150,
  topKeywords: 12,
  topNgrams: 10,
  keywordExclusions: [],
};

describe("portable report parity guard", () => {
  it("accepts reports produced by the portable analyzer", () => {
    const report = analyzeWebText("alpha beta alpha", options);
    expect(() => assertNativeReportParity(report)).not.toThrow();
  });

  it("rejects grapheme counts that exceed character counts", () => {
    const report = analyzeWebText("alpha beta", options);
    const invalid = {
      ...report,
      stats: { ...report.stats, graphemes: report.stats.characters + 1 },
    };

    expect(() => assertNativeReportParity(invalid)).toThrow("Invalid TextLens report data.");
  });

  it("rejects inconsistent schema-v2 vocabulary metrics", () => {
    const empty = analyzeWebText("", options);
    const invalidEmpty = {
      ...empty,
      stats: { ...empty.stats, maxWordCharacters: 1 },
    };
    expect(() => assertNativeReportParity(invalidEmpty)).toThrow("Invalid TextLens report data.");

    const nonEmpty = analyzeWebText("alpha", options);
    const invalidNonEmpty = {
      ...nonEmpty,
      stats: { ...nonEmpty.stats, uniqueWords: 0 },
    };
    expect(() => assertNativeReportParity(invalidNonEmpty)).toThrow(
      "Invalid TextLens report data.",
    );
  });

  it("rejects more frequency entries than the native importer accepts", () => {
    const report = analyzeWebText(
      Array.from({ length: 60 }, (_, index) => `word${index}`).join(" "),
      options,
    );
    const keywords: FrequencyItem[] = Array.from({ length: 51 }, (_, index) => ({
      text: `word${index}`,
      count: 1,
      percentage: 100 / 60,
    }));

    expect(() => assertNativeReportParity({ ...report, keywords })).toThrow(
      "Invalid TextLens report data.",
    );
  });

  it("rejects n-gram counts that exceed possible positions", () => {
    const report = analyzeWebText("alpha beta", options);
    const invalid = {
      ...report,
      bigrams: [{ text: "alpha beta", count: 2, percentage: 100 }],
    };

    expect(() => assertNativeReportParity(invalid)).toThrow("Invalid TextLens report data.");
  });
});

describe("portable file decoding parity", () => {
  it("keeps UTF-8 selected from the native 32 KiB sample and reports later errors", () => {
    const bytes = new Uint8Array(32 * 1024 + 1);
    bytes.fill(0x61);
    bytes[bytes.length - 1] = 0xff;

    const decoded = decodePortableTextForParity(bytes);

    expect(decoded.encoding.name).toBe("UTF-8");
    expect(decoded.encoding.fallbackUsed).toBe(false);
    expect(decoded.encoding.hadErrors).toBe(true);
    expect(decoded.text.endsWith("�")).toBe(true);
  });

  it("reports an odd UTF-16 LE payload and preserves the replacement character", () => {
    const decoded = decodePortableTextForParity(
      new Uint8Array([0xff, 0xfe, 0x41, 0x00, 0x42]),
    );

    expect(decoded.encoding.name).toBe("UTF-16 LE");
    expect(decoded.encoding.bomDetected).toBe(true);
    expect(decoded.encoding.hadErrors).toBe(true);
    expect(decoded.text).toBe("A�");
  });

  it("reports malformed UTF-16 surrogate data", () => {
    const decoded = decodePortableTextForParity(new Uint8Array([0xff, 0xfe, 0x00, 0xd8]));

    expect(decoded.encoding.name).toBe("UTF-16 LE");
    expect(decoded.encoding.hadErrors).toBe(true);
    expect(decoded.text).toBe("�");
  });

  it("matches the native Windows-1252 undefined-byte behavior", () => {
    const decoded = decodePortableTextForParity(new Uint8Array([0x41, 0x81, 0x80]));

    expect(decoded.encoding.name).toBe("Windows-1252");
    expect(decoded.encoding.fallbackUsed).toBe(true);
    expect(decoded.encoding.hadErrors).toBe(true);
    expect(decoded.text).toBe("A�€");
  });
});

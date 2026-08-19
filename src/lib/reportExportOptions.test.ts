import { describe, expect, it } from "vitest";
import { defaultReportExportOptions, parseReportExportOptions } from "./reportExportOptions";

describe("report export options", () => {
  it("defaults every Markdown section on", () => {
    expect(parseReportExportOptions(null)).toEqual(defaultReportExportOptions);
  });

  it("accepts explicit section choices", () => {
    expect(
      parseReportExportOptions({
        includeSourceMetadata: false,
        includeCoreMetrics: true,
        includeKeywords: false,
        includeBigrams: true,
        includeTrigrams: false,
        includeWhitespace: true,
      }),
    ).toEqual({
      includeSourceMetadata: false,
      includeCoreMetrics: true,
      includeKeywords: false,
      includeBigrams: true,
      includeTrigrams: false,
      includeWhitespace: true,
    });
  });

  it("falls back only malformed fields", () => {
    expect(
      parseReportExportOptions({
        includeSourceMetadata: "no",
        includeCoreMetrics: false,
        includeKeywords: 1,
      }),
    ).toEqual({
      ...defaultReportExportOptions,
      includeCoreMetrics: false,
    });
  });
});

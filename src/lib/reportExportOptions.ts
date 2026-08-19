import type { ReportExportOptions } from "../types";

export const defaultReportExportOptions: ReportExportOptions = {
  includeSourceMetadata: true,
  includeCoreMetrics: true,
  includeKeywords: true,
  includeBigrams: true,
  includeTrigrams: true,
  includeWhitespace: true,
};

export function parseReportExportOptions(value: unknown): ReportExportOptions {
  if (!isRecord(value)) return { ...defaultReportExportOptions };
  return {
    includeSourceMetadata: booleanOrDefault(
      value.includeSourceMetadata,
      defaultReportExportOptions.includeSourceMetadata,
    ),
    includeCoreMetrics: booleanOrDefault(
      value.includeCoreMetrics,
      defaultReportExportOptions.includeCoreMetrics,
    ),
    includeKeywords: booleanOrDefault(
      value.includeKeywords,
      defaultReportExportOptions.includeKeywords,
    ),
    includeBigrams: booleanOrDefault(
      value.includeBigrams,
      defaultReportExportOptions.includeBigrams,
    ),
    includeTrigrams: booleanOrDefault(
      value.includeTrigrams,
      defaultReportExportOptions.includeTrigrams,
    ),
    includeWhitespace: booleanOrDefault(
      value.includeWhitespace,
      defaultReportExportOptions.includeWhitespace,
    ),
  };
}

function booleanOrDefault(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

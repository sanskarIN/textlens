import type { AnalysisReport, FrequencyItem } from "../types";
import { invoke as portableInvoke } from "./web-tauri-core";

const MAX_FREQUENCY_ITEMS = 50;

export async function invoke<T>(
  command: string,
  args: Record<string, unknown> = {},
): Promise<T> {
  const result = await portableInvoke<T>(command, args);
  if (command === "import_report") {
    assertNativeReportParity(result as AnalysisReport);
  }
  return result;
}

export function assertNativeReportParity(report: AnalysisReport): void {
  const { stats } = report;

  if (stats.uniqueWords > stats.words || stats.graphemes > stats.characters) {
    throw invalidReport();
  }

  if (
    report.version >= 2 &&
    ((stats.words === 0 && stats.maxWordCharacters !== 0) ||
      (stats.words > 0 && (stats.uniqueWords === 0 || stats.maxWordCharacters === 0)))
  ) {
    throw invalidReport();
  }

  validateFrequencyItems(report.keywords, stats.words);
  validateFrequencyItems(report.bigrams, Math.max(0, stats.words - 1));
  validateFrequencyItems(report.trigrams, Math.max(0, stats.words - 2));
}

function validateFrequencyItems(items: FrequencyItem[], possiblePositions: number): void {
  if (items.length > MAX_FREQUENCY_ITEMS || (possiblePositions === 0 && items.length > 0)) {
    throw invalidReport();
  }

  for (const item of items) {
    if (item.count > possiblePositions) {
      throw invalidReport();
    }
  }
}

function invalidReport(): Error {
  return new Error("Invalid TextLens report data.");
}

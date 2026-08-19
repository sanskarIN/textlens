import { en } from "../i18n/en";
import { formatBytes, formatDuration, formatInteger } from "./format";
import type { AnalysisReport } from "../types";

export type MetricRow = readonly [label: string, value: string];

const HTML_ENTITIES: Readonly<Record<string, string>> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#039;",
};

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => HTML_ENTITIES[character] ?? character);
}

export function metricRows(report: AnalysisReport | null): MetricRow[] {
  if (!report) {
    return [
      [en.words, "—"],
      [en.uniqueWords, "—"],
      [en.longestWord, "—"],
      [en.characters, "—"],
      [en.sentences, "—"],
      [en.paragraphs, "—"],
      [en.lines, "—"],
      [en.bytes, "—"],
      [en.readingTime, "—"],
      [en.speakingTime, "—"],
    ];
  }

  return [
    [en.words, formatInteger(report.stats.words)],
    [en.uniqueWords, formatInteger(report.stats.uniqueWords)],
    [en.longestWord, `${formatInteger(report.stats.maxWordCharacters)} ${en.charsSuffix}`],
    [en.characters, formatInteger(report.stats.characters)],
    [en.sentences, formatInteger(report.stats.sentences)],
    [en.paragraphs, formatInteger(report.stats.paragraphs)],
    [en.lines, formatInteger(report.stats.lines)],
    [en.bytes, formatBytes(report.stats.bytes)],
    [en.readingTime, formatDuration(report.stats.readingSeconds)],
    [en.speakingTime, formatDuration(report.stats.speakingSeconds)],
  ];
}

export function encodingSummary(report: AnalysisReport): string {
  if (!report.encoding) return "UTF-8 text";
  const labels = [report.encoding.name];
  if (report.encoding.fallbackUsed) labels.push(en.fallbackSuffix);
  if (report.encoding.hadErrors) labels.push(en.replacementCharsSuffix);
  return labels.join(" · ");
}

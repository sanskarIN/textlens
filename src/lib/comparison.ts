import { en } from "../i18n/en";
import type { AnalysisReport, FrequencyItem } from "../types";

export type ComparisonUnit = "count" | "bytes" | "seconds";

export interface ComparisonMetric {
  key: string;
  label: string;
  current: number;
  baseline: number;
  delta: number;
  unit: ComparisonUnit;
}

export interface KeywordDelta {
  text: string;
  current: number;
  baseline: number;
  delta: number;
}

export function comparisonMetrics(
  current: AnalysisReport,
  baseline: AnalysisReport,
): ComparisonMetric[] {
  return [
    metric("words", en.words, current.stats.words, baseline.stats.words, "count"),
    metric(
      "uniqueWords",
      en.uniqueWords,
      current.stats.uniqueWords,
      baseline.stats.uniqueWords,
      "count",
    ),
    metric(
      "characters",
      en.characters,
      current.stats.characters,
      baseline.stats.characters,
      "count",
    ),
    metric("sentences", en.sentences, current.stats.sentences, baseline.stats.sentences, "count"),
    metric(
      "paragraphs",
      en.paragraphs,
      current.stats.paragraphs,
      baseline.stats.paragraphs,
      "count",
    ),
    metric("lines", en.lines, current.stats.lines, baseline.stats.lines, "count"),
    metric("bytes", en.bytes, current.stats.bytes, baseline.stats.bytes, "bytes"),
    metric(
      "readingSeconds",
      en.readingTime,
      current.stats.readingSeconds,
      baseline.stats.readingSeconds,
      "seconds",
    ),
    metric(
      "speakingSeconds",
      en.speakingTime,
      current.stats.speakingSeconds,
      baseline.stats.speakingSeconds,
      "seconds",
    ),
  ];
}

export function keywordDeltas(
  current: AnalysisReport,
  baseline: AnalysisReport,
  limit = 10,
): KeywordDelta[] {
  const currentMap = frequencyMap(current.keywords);
  const baselineMap = frequencyMap(baseline.keywords);
  const terms = new Set([...currentMap.keys(), ...baselineMap.keys()]);

  return [...terms]
    .map((text) => {
      const currentCount = currentMap.get(text) ?? 0;
      const baselineCount = baselineMap.get(text) ?? 0;
      return {
        text,
        current: currentCount,
        baseline: baselineCount,
        delta: currentCount - baselineCount,
      };
    })
    .filter((item) => item.delta !== 0)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta) || a.text.localeCompare(b.text))
    .slice(0, Math.max(0, Math.min(50, Math.round(limit))));
}

function metric(
  key: string,
  label: string,
  current: number,
  baseline: number,
  unit: ComparisonUnit,
): ComparisonMetric {
  return { key, label, current, baseline, delta: current - baseline, unit };
}

function frequencyMap(items: FrequencyItem[]): Map<string, number> {
  return new Map(items.map((item) => [item.text, item.count]));
}

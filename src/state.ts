import { readStorageItem, writeStorageItem } from "./lib/storage";
import type { AnalysisOptions, AppSettings, ThemePreference } from "./types";

const STORAGE_KEY = "textlens.settings.v1";
const MAX_KEYWORD_EXCLUSIONS = 100;
const MAX_KEYWORD_EXCLUSION_CHARACTERS = 64;

export const defaultSettings: AppSettings = {
  theme: "system",
  readingWpm: 238,
  speakingWpm: 150,
  topKeywords: 12,
  topNgrams: 10,
  keywordExclusions: [],
  reducedMotion: false,
  recentFilesEnabled: false,
};

export function parseAnalysisOptions(value: unknown): AnalysisOptions {
  const source = isRecord(value) ? value : {};
  return {
    readingWpm: validRate(source.readingWpm, defaultSettings.readingWpm),
    speakingWpm: validRate(source.speakingWpm, defaultSettings.speakingWpm),
    topKeywords: validLimit(source.topKeywords, defaultSettings.topKeywords),
    topNgrams: validLimit(source.topNgrams, defaultSettings.topNgrams),
    keywordExclusions: validKeywordExclusions(source.keywordExclusions),
  };
}

export function parseSettings(value: unknown): AppSettings {
  if (!isRecord(value)) return { ...defaultSettings, keywordExclusions: [] };
  return {
    theme: validTheme(value.theme),
    ...parseAnalysisOptions(value),
    reducedMotion:
      typeof value.reducedMotion === "boolean" ? value.reducedMotion : defaultSettings.reducedMotion,
    recentFilesEnabled:
      typeof value.recentFilesEnabled === "boolean"
        ? value.recentFilesEnabled
        : defaultSettings.recentFilesEnabled,
  };
}

export function loadSettings(): AppSettings {
  const raw = readStorageItem(STORAGE_KEY);
  if (!raw) return { ...defaultSettings, keywordExclusions: [] };
  try {
    return parseSettings(JSON.parse(raw) as unknown);
  } catch {
    return { ...defaultSettings, keywordExclusions: [] };
  }
}

export function saveSettings(settings: AppSettings): boolean {
  return writeStorageItem(STORAGE_KEY, JSON.stringify(parseSettings(settings)));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validTheme(value: unknown): ThemePreference {
  return value === "light" || value === "dark" || value === "system"
    ? value
    : defaultSettings.theme;
}

function validRate(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 30 && value <= 1000
    ? Math.round(value)
    : fallback;
}

function validLimit(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 1 && value <= 50
    ? Math.round(value)
    : fallback;
}

function validKeywordExclusions(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  const result: string[] = [];
  const seen = new Set<string>();
  for (const item of value) {
    if (typeof item !== "string") continue;
    const trimmed = item.trim();
    if (!trimmed) continue;
    const bounded = [...trimmed].slice(0, MAX_KEYWORD_EXCLUSION_CHARACTERS).join("");
    const key = bounded.toLocaleLowerCase();
    if (!bounded || seen.has(key)) continue;
    seen.add(key);
    result.push(bounded);
    if (result.length >= MAX_KEYWORD_EXCLUSIONS) break;
  }
  return result;
}

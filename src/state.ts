import type { AppSettings, ThemePreference } from "./types";

const STORAGE_KEY = "textlens.settings.v1";

export const defaultSettings: AppSettings = {
  theme: "system",
  readingWpm: 238,
  speakingWpm: 150,
  topKeywords: 12,
  topNgrams: 10,
  reducedMotion: false,
};

export function parseSettings(value: unknown): AppSettings {
  if (!isRecord(value)) return { ...defaultSettings };
  return {
    theme: validTheme(value.theme),
    readingWpm: validRate(value.readingWpm, defaultSettings.readingWpm),
    speakingWpm: validRate(value.speakingWpm, defaultSettings.speakingWpm),
    topKeywords: validLimit(value.topKeywords, defaultSettings.topKeywords),
    topNgrams: validLimit(value.topNgrams, defaultSettings.topNgrams),
    reducedMotion: typeof value.reducedMotion === "boolean" ? value.reducedMotion : defaultSettings.reducedMotion,
  };
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? parseSettings(JSON.parse(raw) as unknown) : { ...defaultSettings };
  } catch {
    return { ...defaultSettings };
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(parseSettings(settings)));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validTheme(value: unknown): ThemePreference {
  return value === "light" || value === "dark" || value === "system" ? value : defaultSettings.theme;
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

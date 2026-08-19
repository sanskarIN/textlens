import type { AppSettings } from "./types";

const STORAGE_KEY = "textlens.settings.v1";
export const defaultSettings: AppSettings = { theme: "system", readingWpm: 238, speakingWpm: 150, topKeywords: 12, topNgrams: 10, reducedMotion: false };
export function loadSettings(): AppSettings { try { const raw = localStorage.getItem(STORAGE_KEY); if (!raw) return { ...defaultSettings }; const parsed = JSON.parse(raw) as Partial<AppSettings>; return { ...defaultSettings, ...parsed, readingWpm: validRate(parsed.readingWpm, defaultSettings.readingWpm), speakingWpm: validRate(parsed.speakingWpm, defaultSettings.speakingWpm), topKeywords: validLimit(parsed.topKeywords, defaultSettings.topKeywords), topNgrams: validLimit(parsed.topNgrams, defaultSettings.topNgrams) }; } catch { return { ...defaultSettings }; } }
export function saveSettings(settings: AppSettings): void { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); }
function validRate(value: unknown, fallback: number): number { return typeof value === "number" && Number.isFinite(value) && value >= 30 && value <= 1000 ? Math.round(value) : fallback; }
function validLimit(value: unknown, fallback: number): number { return typeof value === "number" && Number.isFinite(value) && value >= 1 && value <= 50 ? Math.round(value) : fallback; }

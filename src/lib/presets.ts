import { parseAnalysisOptions } from "../state";
import type { AnalysisOptions, AnalysisPreset, AppSettings } from "../types";

const STORAGE_KEY = "textlens.analysis-presets.v1";
const MAX_PRESET_NAME_CHARACTERS = 48;
export const MAX_ANALYSIS_PRESETS = 12;

export function parseAnalysisPresets(value: unknown): AnalysisPreset[] {
  if (!Array.isArray(value)) return [];

  const result: AnalysisPreset[] = [];
  const seen = new Set<string>();
  for (const item of value) {
    const preset = parsePreset(item);
    if (!preset) continue;
    const key = normalizeName(preset.name);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(preset);
    if (result.length >= MAX_ANALYSIS_PRESETS) break;
  }
  return result;
}

export function loadAnalysisPresets(): AnalysisPreset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? parseAnalysisPresets(JSON.parse(raw) as unknown) : [];
  } catch {
    return [];
  }
}

export function saveAnalysisPresets(presets: AnalysisPreset[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parseAnalysisPresets(presets)));
    return true;
  } catch {
    return false;
  }
}

export function createAnalysisPreset(
  name: string,
  options: AnalysisOptions,
): AnalysisPreset | null {
  const boundedName = validName(name);
  if (!boundedName) return null;
  return { name: boundedName, ...parseAnalysisOptions(options) };
}

export function upsertAnalysisPreset(
  presets: AnalysisPreset[],
  preset: AnalysisPreset,
): AnalysisPreset[] {
  const parsed = parsePreset(preset);
  if (!parsed) return parseAnalysisPresets(presets);
  const key = normalizeName(parsed.name);
  const remaining = parseAnalysisPresets(presets).filter(
    (item) => normalizeName(item.name) !== key,
  );
  return [parsed, ...remaining].slice(0, MAX_ANALYSIS_PRESETS);
}

export function removeAnalysisPreset(presets: AnalysisPreset[], index: number): AnalysisPreset[] {
  const parsed = parseAnalysisPresets(presets);
  if (!Number.isInteger(index) || index < 0 || index >= parsed.length) return parsed;
  return parsed.filter((_, currentIndex) => currentIndex !== index);
}

export function applyAnalysisPreset(settings: AppSettings, preset: AnalysisPreset): AppSettings {
  return {
    ...settings,
    ...parseAnalysisOptions(preset),
  };
}

function parsePreset(value: unknown): AnalysisPreset | null {
  if (!isRecord(value)) return null;
  const name = validName(value.name);
  if (!name) return null;
  return { name, ...parseAnalysisOptions(value) };
}

function validName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return [...trimmed].slice(0, MAX_PRESET_NAME_CHARACTERS).join("");
}

function normalizeName(value: string): string {
  return value.toLocaleLowerCase();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

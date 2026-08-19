export interface RecentFileEntry {
  name: string;
  size: number;
  openedAt: string;
}

const STORAGE_KEY = "textlens.recent-files.v1";
const MAX_ENTRIES = 10;
const MAX_NAME_CHARACTERS = 255;

export function parseRecentFiles(value: unknown): RecentFileEntry[] {
  if (!Array.isArray(value)) return [];

  const result: RecentFileEntry[] = [];
  for (const item of value) {
    if (!isRecord(item)) continue;
    const name = validName(item.name);
    const size = validSize(item.size);
    const openedAt = validTimestamp(item.openedAt);
    if (!name || size === null || !openedAt) continue;
    result.push({ name, size, openedAt });
    if (result.length >= MAX_ENTRIES) break;
  }
  return result;
}

export function recordRecentFile(
  entries: readonly RecentFileEntry[],
  entry: RecentFileEntry,
): RecentFileEntry[] {
  const validated = parseRecentFiles([entry]);
  if (!validated.length) return parseRecentFiles(entries);

  const next = validated[0];
  return [next, ...entries.filter((item) => item.name !== next.name)].slice(0, MAX_ENTRIES);
}

export function loadRecentFiles(): RecentFileEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? parseRecentFiles(JSON.parse(raw) as unknown) : [];
  } catch {
    return [];
  }
}

export function saveRecentFiles(entries: readonly RecentFileEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(parseRecentFiles(entries)));
}

export function clearRecentFiles(): void {
  localStorage.removeItem(STORAGE_KEY);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.includes("\0") || trimmed.includes("/") || trimmed.includes("\\")) return null;
  return [...trimmed].slice(0, MAX_NAME_CHARACTERS).join("");
}

function validSize(value: unknown): number | null {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0 ? value : null;
}

function validTimestamp(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null;
}

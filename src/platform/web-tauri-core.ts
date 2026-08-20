import type {
  AnalysisOptions,
  AnalysisReport,
  AppSettings,
  EncodingInfo,
  ReportExportOptions,
} from "../types";
import { analyzeWebText } from "./web-analyzer";
import { downloadBrowserText, getBrowserFile } from "./web-file-store";

const MAX_TEXT_FILE_BYTES = 64 * 1024 * 1024;
const MAX_REPORT_BYTES = 512 * 1024;
const MAX_SETTINGS_BYTES = 64 * 1024;

interface InvokeArgs {
  [key: string]: unknown;
}

export async function invoke<T>(command: string, args: InvokeArgs = {}): Promise<T> {
  switch (command) {
    case "analyze_text":
      return analyzeTextCommand(args) as T;
    case "analyze_file":
      return (await analyzeFileCommand(args)) as T;
    case "export_report":
      exportReportCommand(args);
      return undefined as T;
    case "import_report":
      return (await importReportCommand(args)) as T;
    case "export_settings":
      exportSettingsCommand(args);
      return undefined as T;
    case "import_settings":
      return (await importSettingsCommand(args)) as T;
    default:
      throw new Error(`Unsupported TextLens web command: ${command}`);
  }
}

function analyzeTextCommand(args: InvokeArgs): AnalysisReport {
  const text = requireString(args.text, "text");
  const options = requireAnalysisOptions(args.options);
  return analyzeWebText(text, options);
}

async function analyzeFileCommand(args: InvokeArgs): Promise<AnalysisReport> {
  const token = requireString(args.path, "path");
  const options = requireAnalysisOptions(args.options);
  const file = getBrowserFile(token);
  if (file.size > MAX_TEXT_FILE_BYTES) {
    throw new Error("This browser build currently accepts text files up to 64 MiB.");
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const decoded = decodeText(bytes);
  return analyzeWebText(decoded.text, options, {
    originalBytes: bytes.byteLength,
    source: {
      kind: "file",
      displayName: safeDisplayName(file.name),
      mode: "memory",
      fileSize: file.size,
    },
    encoding: decoded.encoding,
  });
}

function exportReportCommand(args: InvokeArgs): void {
  const path = requireString(args.path, "path");
  const report = requireReport(args.report);
  const format = requireString(args.format, "format");

  if (format === "json") {
    downloadBrowserText(path, `${JSON.stringify(report, null, 2)}\n`, "application/json;charset=utf-8");
    return;
  }
  if (format !== "markdown") throw new Error("Unsupported report export format.");

  const options = normalizeExportOptions(args.options);
  downloadBrowserText(path, renderMarkdown(report, options), "text/markdown;charset=utf-8");
}

async function importReportCommand(args: InvokeArgs): Promise<AnalysisReport> {
  const file = getBrowserFile(requireString(args.path, "path"));
  if (file.size > MAX_REPORT_BYTES) throw new Error("TextLens reports must be 512 KiB or smaller.");
  const raw = await file.text();
  const parsed: unknown = JSON.parse(raw);
  return requireReport(parsed);
}

function exportSettingsCommand(args: InvokeArgs): void {
  const path = requireString(args.path, "path");
  const settings = requireSettings(args.settings);
  const backup = JSON.stringify({ version: 2, settings }, null, 2);
  if (new TextEncoder().encode(backup).byteLength > MAX_SETTINGS_BYTES) {
    throw new Error("TextLens settings backup is too large.");
  }
  downloadBrowserText(path, `${backup}\n`, "application/json;charset=utf-8");
}

async function importSettingsCommand(args: InvokeArgs): Promise<AppSettings> {
  const file = getBrowserFile(requireString(args.path, "path"));
  if (file.size > MAX_SETTINGS_BYTES) throw new Error("TextLens settings backups must be 64 KiB or smaller.");
  const parsed: unknown = JSON.parse(await file.text());
  if (!isRecord(parsed)) throw new Error("Invalid TextLens settings backup.");

  const version = parsed.version;
  if (version !== 1 && version !== 2) throw new Error("Unsupported TextLens settings backup version.");
  if (!isRecord(parsed.settings)) throw new Error("Invalid TextLens settings backup.");

  const legacyDefaults = version === 1 ? { keywordExclusions: [], recentFilesEnabled: false } : {};
  return requireSettings({ ...legacyDefaults, ...parsed.settings });
}

function decodeText(bytes: Uint8Array): { text: string; encoding: EncodingInfo } {
  if (startsWith(bytes, [0xef, 0xbb, 0xbf])) {
    return {
      text: new TextDecoder("utf-8").decode(bytes.subarray(3)),
      encoding: { name: "UTF-8", bomDetected: true, fallbackUsed: false, hadErrors: false },
    };
  }
  if (startsWith(bytes, [0xff, 0xfe])) {
    return {
      text: new TextDecoder("utf-16le").decode(bytes.subarray(2)),
      encoding: { name: "UTF-16 LE", bomDetected: true, fallbackUsed: false, hadErrors: false },
    };
  }
  if (startsWith(bytes, [0xfe, 0xff])) {
    const swapped = new Uint8Array(Math.max(0, bytes.length - 2));
    for (let index = 2; index + 1 < bytes.length; index += 2) {
      swapped[index - 2] = bytes[index + 1];
      swapped[index - 1] = bytes[index];
    }
    return {
      text: new TextDecoder("utf-16le").decode(swapped),
      encoding: { name: "UTF-16 BE", bomDetected: true, fallbackUsed: false, hadErrors: bytes.length % 2 !== 0 },
    };
  }

  try {
    return {
      text: new TextDecoder("utf-8", { fatal: true }).decode(bytes),
      encoding: { name: "UTF-8", bomDetected: false, fallbackUsed: false, hadErrors: false },
    };
  } catch {
    return {
      text: new TextDecoder("windows-1252").decode(bytes),
      encoding: { name: "Windows-1252", bomDetected: false, fallbackUsed: true, hadErrors: true },
    };
  }
}

function startsWith(bytes: Uint8Array, prefix: number[]): boolean {
  return prefix.every((value, index) => bytes[index] === value);
}

function requireAnalysisOptions(value: unknown): AnalysisOptions {
  if (!isRecord(value)) throw new Error("Invalid analysis options.");
  return {
    readingWpm: boundedNumber(value.readingWpm, 30, 1000, "readingWpm"),
    speakingWpm: boundedNumber(value.speakingWpm, 30, 1000, "speakingWpm"),
    topKeywords: boundedNumber(value.topKeywords, 1, 50, "topKeywords"),
    topNgrams: boundedNumber(value.topNgrams, 1, 50, "topNgrams"),
    keywordExclusions: stringArray(value.keywordExclusions, 100, 64),
  };
}

function requireSettings(value: unknown): AppSettings {
  if (!isRecord(value)) throw new Error("Invalid TextLens settings data.");
  const theme = value.theme;
  if (theme !== "system" && theme !== "light" && theme !== "dark") throw new Error("Invalid TextLens theme.");
  if (typeof value.reducedMotion !== "boolean") throw new Error("Invalid reduced-motion setting.");
  if (typeof value.recentFilesEnabled !== "boolean") throw new Error("Invalid recent-files setting.");

  return {
    theme,
    readingWpm: boundedNumber(value.readingWpm, 30, 1000, "readingWpm"),
    speakingWpm: boundedNumber(value.speakingWpm, 30, 1000, "speakingWpm"),
    topKeywords: boundedNumber(value.topKeywords, 1, 50, "topKeywords"),
    topNgrams: boundedNumber(value.topNgrams, 1, 50, "topNgrams"),
    keywordExclusions: stringArray(value.keywordExclusions ?? [], 100, 64),
    reducedMotion: value.reducedMotion,
    recentFilesEnabled: value.recentFilesEnabled,
  };
}

function requireReport(value: unknown): AnalysisReport {
  if (!isRecord(value) || (value.version !== 1 && value.version !== 2)) {
    throw new Error("Unsupported or invalid TextLens report.");
  }
  if (!isRecord(value.source) || !isRecord(value.stats) || !isRecord(value.whitespace)) {
    throw new Error("Invalid TextLens report structure.");
  }
  if (!Array.isArray(value.keywords) || !Array.isArray(value.bigrams) || !Array.isArray(value.trigrams)) {
    throw new Error("Invalid TextLens report frequency data.");
  }

  const report = value as unknown as AnalysisReport;
  const requiredStats = [
    report.stats.words,
    report.stats.characters,
    report.stats.bytes,
    report.stats.sentences,
    report.stats.paragraphs,
    report.stats.lines,
    report.stats.readingSeconds,
    report.stats.speakingSeconds,
  ];
  if (requiredStats.some((number) => !Number.isFinite(number) || number < 0)) {
    throw new Error("Invalid TextLens report metrics.");
  }
  return report;
}

function normalizeExportOptions(value: unknown): ReportExportOptions {
  const defaults: ReportExportOptions = {
    includeSourceMetadata: true,
    includeCoreMetrics: true,
    includeKeywords: true,
    includeBigrams: true,
    includeTrigrams: true,
    includeWhitespace: true,
  };
  if (!isRecord(value)) return defaults;
  return Object.fromEntries(
    Object.entries(defaults).map(([key, fallback]) => [key, typeof value[key] === "boolean" ? value[key] : fallback]),
  ) as unknown as ReportExportOptions;
}

function renderMarkdown(report: AnalysisReport, options: ReportExportOptions): string {
  const lines = ["# TextLens report", "", `Report schema: v${report.version}`, ""];
  if (options.includeSourceMetadata) {
    lines.push("## Source", "", `- Name: ${report.source.displayName ?? "Pasted text"}`, `- Type: ${report.source.kind}`, `- Mode: ${report.source.mode}`);
    if (report.source.fileSize !== null) lines.push(`- File size: ${report.source.fileSize} bytes`);
    if (report.encoding) lines.push(`- Encoding: ${report.encoding.name}`);
    lines.push("");
  }
  if (options.includeCoreMetrics) {
    lines.push("## Core metrics", "");
    const stats = report.stats;
    lines.push(
      `- Words: ${stats.words}`,
      ...(report.version >= 2 ? [`- Unique words: ${stats.uniqueWords}`, `- Longest word: ${stats.maxWordCharacters} characters`] : []),
      `- Characters: ${stats.characters}`,
      `- Graphemes: ${stats.graphemes}`,
      `- Bytes: ${stats.bytes}`,
      `- Sentences: ${stats.sentences}`,
      `- Paragraphs: ${stats.paragraphs}`,
      `- Lines: ${stats.lines}`,
      `- Reading time: ${stats.readingSeconds} seconds`,
      `- Speaking time: ${stats.speakingSeconds} seconds`,
      "",
    );
  }
  appendFrequency(lines, "Keywords", report.keywords, options.includeKeywords);
  appendFrequency(lines, "Bigrams", report.bigrams, options.includeBigrams);
  appendFrequency(lines, "Trigrams", report.trigrams, options.includeTrigrams);
  if (options.includeWhitespace) {
    const whitespace = report.whitespace;
    const endings = whitespace.lineEndings;
    lines.push(
      "## Whitespace and line endings",
      "",
      `- Spaces: ${whitespace.spaces}`,
      `- Tabs: ${whitespace.tabs}`,
      `- Blank lines: ${whitespace.blankLines}`,
      `- Trailing-whitespace lines: ${whitespace.trailingWhitespaceLines}`,
      `- Line endings: LF ${endings.lf}, CRLF ${endings.crlf}, CR ${endings.cr}`,
      `- Dominant line ending: ${endings.dominant}${endings.mixed ? " (mixed)" : ""}`,
      "",
    );
  }
  lines.push("_Generated locally by TextLens. Source document text is not included._", "");
  return lines.join("\n");
}

function appendFrequency(lines: string[], title: string, items: AnalysisReport["keywords"], enabled: boolean): void {
  if (!enabled) return;
  lines.push(`## ${title}`, "");
  if (!items.length) lines.push("No entries.");
  else items.forEach((item) => lines.push(`- ${item.text}: ${item.count} (${item.percentage.toFixed(1)}%)`));
  lines.push("");
}

function boundedNumber(value: unknown, min: number, max: number, label: string): number {
  if (!Number.isInteger(value) || (value as number) < min || (value as number) > max) {
    throw new Error(`Invalid ${label}.`);
  }
  return value as number;
}

function stringArray(value: unknown, maxItems: number, maxCharacters: number): string[] {
  if (!Array.isArray(value) || value.length > maxItems) throw new Error("Invalid keyword exclusions.");
  return value.map((item) => {
    if (typeof item !== "string" || !item.trim() || Array.from(item).length > maxCharacters || item.includes("\0")) {
      throw new Error("Invalid keyword exclusion.");
    }
    return item;
  });
}

function safeDisplayName(value: string): string {
  return value.split(/[\\/]/).pop()?.slice(0, 255) || "File";
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== "string" || !value) throw new Error(`Missing ${label}.`);
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

import type {
  AnalysisOptions,
  AnalysisReport,
  AppSettings,
  EncodingInfo,
  FrequencyItem,
  LineEndingDiagnostics,
  ReportExportOptions,
  SourceInfo,
  TextStats,
  WhitespaceDiagnostics,
} from "../types";
import { analyzeWebText } from "./web-analyzer";
import { downloadBrowserText, getBrowserFile } from "./web-file-store";

const MAX_TEXT_FILE_BYTES = 64 * 1024 * 1024;
const MAX_REPORT_BYTES = 512 * 1024;
const MAX_SETTINGS_BYTES = 64 * 1024;
const MAX_FREQUENCY_ITEMS = 100;
const MAX_FREQUENCY_TEXT_CHARACTERS = 256;

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
      await exportReportCommand(args);
      return undefined as T;
    case "import_report":
      return (await importReportCommand(args)) as T;
    case "export_settings":
      await exportSettingsCommand(args);
      return undefined as T;
    case "import_settings":
      return (await importSettingsCommand(args)) as T;
    default:
      throw new Error(`Unsupported TextLens portable command: ${command}`);
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
    throw new Error("This portable build accepts text files up to 64 MiB.");
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

async function exportReportCommand(args: InvokeArgs): Promise<void> {
  const path = requireString(args.path, "path");
  const report = requireReport(args.report);
  const format = requireString(args.format, "format");

  if (format === "json") {
    await downloadBrowserText(
      path,
      `${JSON.stringify(report, null, 2)}\n`,
      "application/json;charset=utf-8",
    );
    return;
  }

  if (format !== "markdown") {
    throw new Error("Unsupported report export format.");
  }

  const options = normalizeExportOptions(args.options);
  await downloadBrowserText(
    path,
    renderMarkdown(report, options),
    "text/markdown;charset=utf-8",
  );
}

async function importReportCommand(args: InvokeArgs): Promise<AnalysisReport> {
  const file = getBrowserFile(requireString(args.path, "path"));
  if (file.size > MAX_REPORT_BYTES) {
    throw new Error("TextLens reports must be 512 KiB or smaller.");
  }

  const parsed: unknown = JSON.parse(await file.text());
  return requireReport(parsed);
}

async function exportSettingsCommand(args: InvokeArgs): Promise<void> {
  const path = requireString(args.path, "path");
  const settings = requireSettings(args.settings);
  const backup = JSON.stringify({ version: 2, settings }, null, 2);

  if (new TextEncoder().encode(backup).byteLength > MAX_SETTINGS_BYTES) {
    throw new Error("TextLens settings backup is too large.");
  }

  await downloadBrowserText(path, `${backup}\n`, "application/json;charset=utf-8");
}

async function importSettingsCommand(args: InvokeArgs): Promise<AppSettings> {
  const file = getBrowserFile(requireString(args.path, "path"));
  if (file.size > MAX_SETTINGS_BYTES) {
    throw new Error("TextLens settings backups must be 64 KiB or smaller.");
  }

  const parsed: unknown = JSON.parse(await file.text());
  if (!isRecord(parsed)) {
    throw new Error("Invalid TextLens settings backup.");
  }

  assertAllowedKeys(parsed, ["version", "settings"], "settings backup");
  const version = parsed.version;
  if (version !== 1 && version !== 2) {
    throw new Error("Unsupported TextLens settings backup version.");
  }
  if (!isRecord(parsed.settings)) {
    throw new Error("Invalid TextLens settings backup.");
  }

  const legacyDefaults =
    version === 1 ? { keywordExclusions: [], recentFilesEnabled: false } : {};
  return requireSettings({ ...legacyDefaults, ...parsed.settings });
}

function decodeText(bytes: Uint8Array): { text: string; encoding: EncodingInfo } {
  if (startsWith(bytes, [0xef, 0xbb, 0xbf])) {
    return {
      text: new TextDecoder("utf-8").decode(bytes.subarray(3)),
      encoding: {
        name: "UTF-8",
        bomDetected: true,
        fallbackUsed: false,
        hadErrors: false,
      },
    };
  }

  if (startsWith(bytes, [0xff, 0xfe])) {
    return {
      text: new TextDecoder("utf-16le").decode(bytes.subarray(2)),
      encoding: {
        name: "UTF-16 LE",
        bomDetected: true,
        fallbackUsed: false,
        hadErrors: false,
      },
    };
  }

  if (startsWith(bytes, [0xfe, 0xff])) {
    const payloadLength = Math.max(0, bytes.length - 2);
    const evenLength = payloadLength - (payloadLength % 2);
    const swapped = new Uint8Array(evenLength);
    for (let index = 2; index + 1 < bytes.length; index += 2) {
      swapped[index - 2] = bytes[index + 1];
      swapped[index - 1] = bytes[index];
    }
    return {
      text: new TextDecoder("utf-16le").decode(swapped),
      encoding: {
        name: "UTF-16 BE",
        bomDetected: true,
        fallbackUsed: false,
        hadErrors: payloadLength % 2 !== 0,
      },
    };
  }

  try {
    return {
      text: new TextDecoder("utf-8", { fatal: true }).decode(bytes),
      encoding: {
        name: "UTF-8",
        bomDetected: false,
        fallbackUsed: false,
        hadErrors: false,
      },
    };
  } catch {
    return {
      text: new TextDecoder("windows-1252").decode(bytes),
      encoding: {
        name: "Windows-1252",
        bomDetected: false,
        fallbackUsed: true,
        hadErrors: true,
      },
    };
  }
}

function startsWith(bytes: Uint8Array, prefix: number[]): boolean {
  return prefix.every((value, index) => bytes[index] === value);
}

function requireAnalysisOptions(value: unknown): AnalysisOptions {
  if (!isRecord(value)) {
    throw new Error("Invalid analysis options.");
  }

  return {
    readingWpm: boundedInteger(value.readingWpm, 30, 1000, "readingWpm"),
    speakingWpm: boundedInteger(value.speakingWpm, 30, 1000, "speakingWpm"),
    topKeywords: boundedInteger(value.topKeywords, 1, 50, "topKeywords"),
    topNgrams: boundedInteger(value.topNgrams, 1, 50, "topNgrams"),
    keywordExclusions: stringArray(value.keywordExclusions, 100, 64),
  };
}

function requireSettings(value: unknown): AppSettings {
  if (!isRecord(value)) {
    throw new Error("Invalid TextLens settings data.");
  }

  assertAllowedKeys(
    value,
    [
      "theme",
      "readingWpm",
      "speakingWpm",
      "topKeywords",
      "topNgrams",
      "keywordExclusions",
      "reducedMotion",
      "recentFilesEnabled",
    ],
    "settings",
  );

  const theme = value.theme;
  if (theme !== "system" && theme !== "light" && theme !== "dark") {
    throw new Error("Invalid TextLens theme.");
  }
  if (typeof value.reducedMotion !== "boolean") {
    throw new Error("Invalid reduced-motion setting.");
  }
  if (typeof value.recentFilesEnabled !== "boolean") {
    throw new Error("Invalid recent-files setting.");
  }

  return {
    theme,
    readingWpm: boundedInteger(value.readingWpm, 30, 1000, "readingWpm"),
    speakingWpm: boundedInteger(value.speakingWpm, 30, 1000, "speakingWpm"),
    topKeywords: boundedInteger(value.topKeywords, 1, 50, "topKeywords"),
    topNgrams: boundedInteger(value.topNgrams, 1, 50, "topNgrams"),
    keywordExclusions: stringArray(value.keywordExclusions ?? [], 100, 64),
    reducedMotion: value.reducedMotion,
    recentFilesEnabled: value.recentFilesEnabled,
  };
}

function requireReport(value: unknown): AnalysisReport {
  if (!isRecord(value)) {
    throw new Error("Invalid TextLens report.");
  }

  assertAllowedKeys(
    value,
    ["version", "source", "encoding", "stats", "keywords", "bigrams", "trigrams", "whitespace"],
    "report",
  );

  const version = value.version;
  if (version !== 1 && version !== 2) {
    throw new Error("Unsupported TextLens report version.");
  }

  return {
    version,
    source: requireSource(value.source),
    encoding: requireEncoding(value.encoding),
    stats: requireStats(value.stats, version),
    keywords: requireFrequencyItems(value.keywords, "keywords"),
    bigrams: requireFrequencyItems(value.bigrams, "bigrams"),
    trigrams: requireFrequencyItems(value.trigrams, "trigrams"),
    whitespace: requireWhitespace(value.whitespace),
  };
}

function requireSource(value: unknown): SourceInfo {
  if (!isRecord(value)) {
    throw new Error("Invalid TextLens report source.");
  }

  assertAllowedKeys(value, ["kind", "displayName", "mode", "fileSize"], "report source");
  if (value.kind !== "pasted" && value.kind !== "file") {
    throw new Error("Invalid TextLens report source kind.");
  }
  if (value.mode !== "memory" && value.mode !== "streaming") {
    throw new Error("Invalid TextLens report source mode.");
  }

  const displayName = nullableString(value.displayName, 255, "displayName");
  if (displayName?.includes("/") || displayName?.includes("\\")) {
    throw new Error("TextLens report display names must not contain paths.");
  }

  const fileSize = nullableNonNegativeInteger(value.fileSize, "fileSize");
  if (value.kind === "pasted" && fileSize !== null) {
    throw new Error("Pasted-text reports must not contain a file size.");
  }

  return {
    kind: value.kind,
    displayName,
    mode: value.mode,
    fileSize,
  };
}

function requireEncoding(value: unknown): EncodingInfo | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (!isRecord(value)) {
    throw new Error("Invalid TextLens report encoding data.");
  }

  assertAllowedKeys(
    value,
    ["name", "bomDetected", "fallbackUsed", "hadErrors"],
    "report encoding",
  );

  const name = requireBoundedString(value.name, 80, "encoding name");
  if (
    typeof value.bomDetected !== "boolean" ||
    typeof value.fallbackUsed !== "boolean" ||
    typeof value.hadErrors !== "boolean"
  ) {
    throw new Error("Invalid TextLens report encoding flags.");
  }

  return {
    name,
    bomDetected: value.bomDetected,
    fallbackUsed: value.fallbackUsed,
    hadErrors: value.hadErrors,
  };
}

function requireStats(value: unknown, version: 1 | 2): TextStats {
  if (!isRecord(value)) {
    throw new Error("Invalid TextLens report metrics.");
  }

  const allowed = [
    "words",
    "uniqueWords",
    "maxWordCharacters",
    "characters",
    "graphemes",
    "bytes",
    "sentences",
    "paragraphs",
    "lines",
    "readingSeconds",
    "speakingSeconds",
  ];
  assertAllowedKeys(value, allowed, "report stats");

  const words = nonNegativeInteger(value.words, "words");
  const uniqueWords =
    version === 1 && value.uniqueWords === undefined
      ? 0
      : nonNegativeInteger(value.uniqueWords, "uniqueWords");
  const maxWordCharacters =
    version === 1 && value.maxWordCharacters === undefined
      ? 0
      : nonNegativeInteger(value.maxWordCharacters, "maxWordCharacters");
  const characters = nonNegativeInteger(value.characters, "characters");

  if (uniqueWords > words || maxWordCharacters > characters) {
    throw new Error("Inconsistent TextLens report vocabulary metrics.");
  }

  return {
    words,
    uniqueWords,
    maxWordCharacters,
    characters,
    graphemes: nonNegativeInteger(value.graphemes, "graphemes"),
    bytes: nonNegativeInteger(value.bytes, "bytes"),
    sentences: nonNegativeInteger(value.sentences, "sentences"),
    paragraphs: nonNegativeInteger(value.paragraphs, "paragraphs"),
    lines: nonNegativeInteger(value.lines, "lines"),
    readingSeconds: nonNegativeInteger(value.readingSeconds, "readingSeconds"),
    speakingSeconds: nonNegativeInteger(value.speakingSeconds, "speakingSeconds"),
  };
}

function requireFrequencyItems(value: unknown, label: string): FrequencyItem[] {
  if (!Array.isArray(value) || value.length > MAX_FREQUENCY_ITEMS) {
    throw new Error(`Invalid TextLens ${label}.`);
  }

  return value.map((item) => {
    if (!isRecord(item)) {
      throw new Error(`Invalid TextLens ${label} entry.`);
    }
    assertAllowedKeys(item, ["text", "count", "percentage"], `${label} entry`);

    const text = requireBoundedString(item.text, MAX_FREQUENCY_TEXT_CHARACTERS, `${label} text`);
    const count = nonNegativeInteger(item.count, `${label} count`);
    const percentage = finiteNumber(item.percentage, `${label} percentage`);
    if (count === 0 || percentage < 0 || percentage > 100) {
      throw new Error(`Invalid TextLens ${label} values.`);
    }

    return { text, count, percentage };
  });
}

function requireWhitespace(value: unknown): WhitespaceDiagnostics {
  if (!isRecord(value)) {
    throw new Error("Invalid TextLens whitespace diagnostics.");
  }

  assertAllowedKeys(
    value,
    [
      "spaces",
      "tabs",
      "lineFeeds",
      "carriageReturns",
      "nonBreakingSpaces",
      "otherWhitespace",
      "blankLines",
      "trailingWhitespaceLines",
      "lineEndings",
    ],
    "whitespace diagnostics",
  );

  return {
    spaces: nonNegativeInteger(value.spaces, "spaces"),
    tabs: nonNegativeInteger(value.tabs, "tabs"),
    lineFeeds: nonNegativeInteger(value.lineFeeds, "lineFeeds"),
    carriageReturns: nonNegativeInteger(value.carriageReturns, "carriageReturns"),
    nonBreakingSpaces: nonNegativeInteger(value.nonBreakingSpaces, "nonBreakingSpaces"),
    otherWhitespace: nonNegativeInteger(value.otherWhitespace, "otherWhitespace"),
    blankLines: nonNegativeInteger(value.blankLines, "blankLines"),
    trailingWhitespaceLines: nonNegativeInteger(
      value.trailingWhitespaceLines,
      "trailingWhitespaceLines",
    ),
    lineEndings: requireLineEndings(value.lineEndings),
  };
}

function requireLineEndings(value: unknown): LineEndingDiagnostics {
  if (!isRecord(value)) {
    throw new Error("Invalid TextLens line-ending diagnostics.");
  }

  assertAllowedKeys(value, ["lf", "crlf", "cr", "mixed", "dominant"], "line endings");
  if (typeof value.mixed !== "boolean") {
    throw new Error("Invalid TextLens mixed-line-ending flag.");
  }
  if (!new Set(["LF", "CRLF", "CR", "None"]).has(value.dominant as string)) {
    throw new Error("Invalid TextLens dominant line ending.");
  }

  return {
    lf: nonNegativeInteger(value.lf, "LF count"),
    crlf: nonNegativeInteger(value.crlf, "CRLF count"),
    cr: nonNegativeInteger(value.cr, "CR count"),
    mixed: value.mixed,
    dominant: value.dominant as LineEndingDiagnostics["dominant"],
  };
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

  if (!isRecord(value)) {
    return defaults;
  }

  return Object.fromEntries(
    Object.entries(defaults).map(([key, fallback]) => [
      key,
      typeof value[key] === "boolean" ? value[key] : fallback,
    ]),
  ) as unknown as ReportExportOptions;
}

function renderMarkdown(report: AnalysisReport, options: ReportExportOptions): string {
  const lines = ["# TextLens report", "", `Report schema: v${report.version}`, ""];

  if (options.includeSourceMetadata) {
    lines.push(
      "## Source",
      "",
      `- Name: ${report.source.displayName ?? "Pasted text"}`,
      `- Type: ${report.source.kind}`,
      `- Mode: ${report.source.mode}`,
    );
    if (report.source.fileSize !== null) {
      lines.push(`- File size: ${report.source.fileSize} bytes`);
    }
    if (report.encoding) {
      lines.push(`- Encoding: ${report.encoding.name}`);
    }
    lines.push("");
  }

  if (options.includeCoreMetrics) {
    const stats = report.stats;
    lines.push("## Core metrics", "", `- Words: ${stats.words}`);
    if (report.version >= 2) {
      lines.push(
        `- Unique words: ${stats.uniqueWords}`,
        `- Longest word: ${stats.maxWordCharacters} characters`,
      );
    }
    lines.push(
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

function appendFrequency(
  lines: string[],
  title: string,
  items: AnalysisReport["keywords"],
  enabled: boolean,
): void {
  if (!enabled) {
    return;
  }

  lines.push(`## ${title}`, "");
  if (!items.length) {
    lines.push("No entries.");
  } else {
    items.forEach((item) =>
      lines.push(`- ${item.text}: ${item.count} (${item.percentage.toFixed(1)}%)`),
    );
  }
  lines.push("");
}

function boundedInteger(value: unknown, min: number, max: number, label: string): number {
  if (!Number.isInteger(value) || (value as number) < min || (value as number) > max) {
    throw new Error(`Invalid ${label}.`);
  }
  return value as number;
}

function nonNegativeInteger(value: unknown, label: string): number {
  if (!Number.isInteger(value) || (value as number) < 0) {
    throw new Error(`Invalid ${label}.`);
  }
  return value as number;
}

function nullableNonNegativeInteger(value: unknown, label: string): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  return nonNegativeInteger(value, label);
}

function finiteNumber(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Invalid ${label}.`);
  }
  return value;
}

function stringArray(value: unknown, maxItems: number, maxCharacters: number): string[] {
  if (!Array.isArray(value) || value.length > maxItems) {
    throw new Error("Invalid keyword exclusions.");
  }

  return value.map((item) => {
    if (
      typeof item !== "string" ||
      !item.trim() ||
      Array.from(item).length > maxCharacters ||
      item.includes("\0")
    ) {
      throw new Error("Invalid keyword exclusion.");
    }
    return item;
  });
}

function nullableString(value: unknown, maxCharacters: number, label: string): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  return requireBoundedString(value, maxCharacters, label);
}

function requireBoundedString(value: unknown, maxCharacters: number, label: string): string {
  if (
    typeof value !== "string" ||
    !value.trim() ||
    Array.from(value).length > maxCharacters ||
    value.includes("\0")
  ) {
    throw new Error(`Invalid ${label}.`);
  }
  return value;
}

function safeDisplayName(value: string): string {
  return value.split(/[\\/]/).pop()?.slice(0, 255) || "File";
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== "string" || !value) {
    throw new Error(`Missing ${label}.`);
  }
  return value;
}

function assertAllowedKeys(
  value: Record<string, unknown>,
  allowed: string[],
  label: string,
): void {
  const allowedSet = new Set(allowed);
  if (Object.keys(value).some((key) => !allowedSet.has(key))) {
    throw new Error(`Invalid ${label}: unknown field.`);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

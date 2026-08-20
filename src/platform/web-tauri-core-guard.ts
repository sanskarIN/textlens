import type { AnalysisOptions, AnalysisReport, EncodingInfo, FrequencyItem } from "../types";
import { getBrowserFile } from "./web-file-store";
import { invoke as portableInvoke } from "./web-tauri-core";

const MAX_FREQUENCY_ITEMS = 50;
const MAX_TEXT_FILE_BYTES = 64 * 1024 * 1024;
const DETECTION_SAMPLE_BYTES = 32 * 1024;
const UTF8_BOM = [0xef, 0xbb, 0xbf] as const;
const UTF16_LE_BOM = [0xff, 0xfe] as const;
const UTF16_BE_BOM = [0xfe, 0xff] as const;

type PortableEncoding = "utf8" | "utf16le" | "utf16be" | "windows1252";

interface DecodedPortableText {
  text: string;
  encoding: EncodingInfo;
}

export async function invoke<T>(
  command: string,
  args: Record<string, unknown> = {},
): Promise<T> {
  if (command === "analyze_file") {
    return (await analyzeFileWithNativeParity(args)) as T;
  }

  const result = await portableInvoke<T>(command, args);
  if (command === "import_report") {
    assertNativeReportParity(result as AnalysisReport);
  }
  return result;
}

async function analyzeFileWithNativeParity(args: Record<string, unknown>): Promise<AnalysisReport> {
  const token = requireString(args.path, "path");
  const file = getBrowserFile(token);
  if (file.size > MAX_TEXT_FILE_BYTES) {
    throw new Error("This portable build accepts text files up to 64 MiB.");
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const decoded = decodePortableTextForParity(bytes);
  const report = await portableInvoke<AnalysisReport>("analyze_text", {
    text: decoded.text,
    options: args.options as AnalysisOptions,
  });
  const result: AnalysisReport = {
    ...report,
    source: {
      kind: "file",
      displayName: safeDisplayName(file.name),
      mode: "memory",
      fileSize: file.size,
    },
    encoding: decoded.encoding,
    stats: {
      ...report.stats,
      bytes: bytes.byteLength,
    },
  };
  assertNativeReportParity(result);
  return result;
}

export function decodePortableTextForParity(bytes: Uint8Array): DecodedPortableText {
  const sample = bytes.subarray(0, Math.min(bytes.byteLength, DETECTION_SAMPLE_BYTES));
  const { kind, bomDetected, fallbackUsed } = detectEncoding(sample);
  const decoded = decodeAll(bytes, kind);

  return {
    text: decoded.text,
    encoding: {
      name: encodingName(kind),
      bomDetected,
      fallbackUsed,
      hadErrors: decoded.hadErrors,
    },
  };
}

function detectEncoding(sample: Uint8Array): {
  kind: PortableEncoding;
  bomDetected: boolean;
  fallbackUsed: boolean;
} {
  if (startsWith(sample, UTF8_BOM)) {
    return { kind: "utf8", bomDetected: true, fallbackUsed: false };
  }
  if (startsWith(sample, UTF16_LE_BOM)) {
    return { kind: "utf16le", bomDetected: true, fallbackUsed: false };
  }
  if (startsWith(sample, UTF16_BE_BOM)) {
    return { kind: "utf16be", bomDetected: true, fallbackUsed: false };
  }

  try {
    new TextDecoder("utf-8", { fatal: true }).decode(sample);
    return { kind: "utf8", bomDetected: false, fallbackUsed: false };
  } catch {
    return { kind: "windows1252", bomDetected: false, fallbackUsed: true };
  }
}

function decodeAll(
  bytes: Uint8Array,
  kind: PortableEncoding,
): { text: string; hadErrors: boolean } {
  switch (kind) {
    case "utf8":
      return decodeUtf8(stripPrefix(bytes, UTF8_BOM));
    case "utf16le":
      return decodeUtf16(stripPrefix(bytes, UTF16_LE_BOM), true);
    case "utf16be":
      return decodeUtf16(stripPrefix(bytes, UTF16_BE_BOM), false);
    case "windows1252":
      return decodeWindows1252(bytes);
  }
}

function decodeUtf8(bytes: Uint8Array): { text: string; hadErrors: boolean } {
  try {
    return { text: new TextDecoder("utf-8", { fatal: true }).decode(bytes), hadErrors: false };
  } catch {
    return { text: new TextDecoder("utf-8").decode(bytes), hadErrors: true };
  }
}

function decodeUtf16(
  payload: Uint8Array,
  littleEndian: boolean,
): { text: string; hadErrors: boolean } {
  const hasOddTrailingByte = payload.byteLength % 2 !== 0;
  const evenLength = payload.byteLength - (hasOddTrailingByte ? 1 : 0);
  let bytes = payload.subarray(0, evenLength);

  if (!littleEndian) {
    const swapped = new Uint8Array(evenLength);
    for (let index = 0; index < evenLength; index += 2) {
      swapped[index] = bytes[index + 1];
      swapped[index + 1] = bytes[index];
    }
    bytes = swapped;
  }

  let text: string;
  let hadErrors = hasOddTrailingByte;
  try {
    text = new TextDecoder("utf-16le", { fatal: true }).decode(bytes);
  } catch {
    text = new TextDecoder("utf-16le").decode(bytes);
    hadErrors = true;
  }

  if (hasOddTrailingByte) {
    text += "\uFFFD";
  }
  return { text, hadErrors };
}

function decodeWindows1252(bytes: Uint8Array): { text: string; hadErrors: boolean } {
  let hadErrors = false;
  let text = "";

  for (const byte of bytes) {
    const character = windows1252Character(byte);
    if (character === null) {
      text += "\uFFFD";
      hadErrors = true;
    } else {
      text += character;
    }
  }

  return { text, hadErrors };
}

function windows1252Character(byte: number): string | null {
  const special = new Map<number, string | null>([
    [0x80, "€"],
    [0x81, null],
    [0x82, "‚"],
    [0x83, "ƒ"],
    [0x84, "„"],
    [0x85, "…"],
    [0x86, "†"],
    [0x87, "‡"],
    [0x88, "ˆ"],
    [0x89, "‰"],
    [0x8a, "Š"],
    [0x8b, "‹"],
    [0x8c, "Œ"],
    [0x8d, null],
    [0x8e, "Ž"],
    [0x8f, null],
    [0x90, null],
    [0x91, "‘"],
    [0x92, "’"],
    [0x93, "“"],
    [0x94, "”"],
    [0x95, "•"],
    [0x96, "–"],
    [0x97, "—"],
    [0x98, "˜"],
    [0x99, "™"],
    [0x9a, "š"],
    [0x9b, "›"],
    [0x9c, "œ"],
    [0x9d, null],
    [0x9e, "ž"],
    [0x9f, "Ÿ"],
  ]);

  return special.has(byte) ? (special.get(byte) ?? null) : String.fromCodePoint(byte);
}

function startsWith(bytes: Uint8Array, prefix: readonly number[]): boolean {
  return prefix.every((value, index) => bytes[index] === value);
}

function stripPrefix(bytes: Uint8Array, prefix: readonly number[]): Uint8Array {
  return startsWith(bytes, prefix) ? bytes.subarray(prefix.length) : bytes;
}

function encodingName(kind: PortableEncoding): string {
  switch (kind) {
    case "utf8":
      return "UTF-8";
    case "utf16le":
      return "UTF-16 LE";
    case "utf16be":
      return "UTF-16 BE";
    case "windows1252":
      return "Windows-1252";
  }
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

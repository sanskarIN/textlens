import type { AnalysisReport, EncodingInfo, FrequencyItem } from "../types";
import { getBrowserFile } from "./web-file-store";
import { invoke as portableInvoke } from "./web-tauri-core";

const MAX_FREQUENCY_ITEMS = 50;
const MAX_TEXT_FILE_BYTES = 64 * 1024 * 1024;
const DETECTION_SAMPLE_BYTES = 32 * 1024;
const WINDOWS_1252_CHUNK_BYTES = 8 * 1024;
const REPLACEMENT_CHARACTER = 0xfffd;
const UTF8_BOM = [0xef, 0xbb, 0xbf] as const;
const UTF16_LE_BOM = [0xff, 0xfe] as const;
const UTF16_BE_BOM = [0xfe, 0xff] as const;
const WINDOWS_1252_CODE_POINTS = createWindows1252CodePoints();

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
    options: args.options,
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
  const chunks: string[] = [];

  for (let offset = 0; offset < bytes.byteLength; offset += WINDOWS_1252_CHUNK_BYTES) {
    const end = Math.min(offset + WINDOWS_1252_CHUNK_BYTES, bytes.byteLength);
    const codeUnits = new Uint16Array(end - offset);

    for (let index = offset; index < end; index += 1) {
      const codePoint = WINDOWS_1252_CODE_POINTS[bytes[index]];
      codeUnits[index - offset] = codePoint;
      hadErrors ||= codePoint === REPLACEMENT_CHARACTER;
    }

    chunks.push(String.fromCharCode(...codeUnits));
  }

  return { text: chunks.join(""), hadErrors };
}

function createWindows1252CodePoints(): Uint16Array {
  const codePoints = new Uint16Array(256);
  for (let byte = 0; byte < codePoints.length; byte += 1) {
    codePoints[byte] = byte;
  }

  const overrides: Array<[number, number]> = [
    [0x80, 0x20ac],
    [0x81, REPLACEMENT_CHARACTER],
    [0x82, 0x201a],
    [0x83, 0x0192],
    [0x84, 0x201e],
    [0x85, 0x2026],
    [0x86, 0x2020],
    [0x87, 0x2021],
    [0x88, 0x02c6],
    [0x89, 0x2030],
    [0x8a, 0x0160],
    [0x8b, 0x2039],
    [0x8c, 0x0152],
    [0x8d, REPLACEMENT_CHARACTER],
    [0x8e, 0x017d],
    [0x8f, REPLACEMENT_CHARACTER],
    [0x90, REPLACEMENT_CHARACTER],
    [0x91, 0x2018],
    [0x92, 0x2019],
    [0x93, 0x201c],
    [0x94, 0x201d],
    [0x95, 0x2022],
    [0x96, 0x2013],
    [0x97, 0x2014],
    [0x98, 0x02dc],
    [0x99, 0x2122],
    [0x9a, 0x0161],
    [0x9b, 0x203a],
    [0x9c, 0x0153],
    [0x9d, REPLACEMENT_CHARACTER],
    [0x9e, 0x017e],
    [0x9f, 0x0178],
  ];

  for (const [byte, codePoint] of overrides) {
    codePoints[byte] = codePoint;
  }
  return codePoints;
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

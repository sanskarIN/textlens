import type {
  AnalysisOptions,
  AnalysisReport,
  EncodingInfo,
  FrequencyItem,
  LineEndingDiagnostics,
  SourceInfo,
  WhitespaceDiagnostics,
} from "../types";

const SENTENCE_ENDERS = new Set([".", "!", "?", "…", "。", "！", "？"]);

interface AnalyzeWebOptions {
  source?: SourceInfo;
  encoding?: EncodingInfo | null;
  originalBytes?: number;
}

export function analyzeWebText(
  text: string,
  options: AnalysisOptions,
  webOptions: AnalyzeWebOptions = {},
): AnalysisReport {
  const words = unicodeWords(text).map(normalize).filter(Boolean);
  const wordCounts = countItems(words);
  const bigramCounts = new Map<string, number>();
  const trigramCounts = new Map<string, number>();

  for (let index = 0; index < words.length; index += 1) {
    if (index >= 1) increment(bigramCounts, `${words[index - 1]} ${words[index]}`);
    if (index >= 2) increment(trigramCounts, `${words[index - 2]} ${words[index - 1]} ${words[index]}`);
  }

  const keywordExclusions = new Set(options.keywordExclusions.map(normalize).filter(Boolean));
  const keywordCounts = new Map([...wordCounts].filter(([word]) => !keywordExclusions.has(word)));
  const whitespace = analyzeWhitespace(text);
  const characterCount = Array.from(text).length;
  const graphemeCount = segmentCount(text, "grapheme", characterCount);
  const maxWordCharacters = words.reduce((maximum, word) => Math.max(maximum, Array.from(word).length), 0);

  return {
    version: 2,
    source:
      webOptions.source ??
      ({ kind: "pasted", displayName: null, mode: "memory", fileSize: null } satisfies SourceInfo),
    encoding: webOptions.encoding ?? null,
    stats: {
      words: words.length,
      uniqueWords: wordCounts.size,
      maxWordCharacters,
      characters: characterCount,
      graphemes: graphemeCount,
      bytes: webOptions.originalBytes ?? new TextEncoder().encode(text).byteLength,
      sentences: countSentences(text),
      paragraphs: countParagraphs(text),
      lines: text.length === 0 ? 0 : lineEndingTotal(whitespace.lineEndings) + 1,
      readingSeconds: estimateSeconds(words.length, options.readingWpm),
      speakingSeconds: estimateSeconds(words.length, options.speakingWpm),
    },
    keywords: rank(keywordCounts, Math.max(words.length, 1), options.topKeywords),
    bigrams: rank(bigramCounts, Math.max(words.length - 1, 1), options.topNgrams),
    trigrams: rank(trigramCounts, Math.max(words.length - 2, 1), options.topNgrams),
    whitespace,
  };
}

function unicodeWords(text: string): string[] {
  const Segmenter = Intl.Segmenter;
  if (Segmenter) {
    const segmenter = new Segmenter(undefined, { granularity: "word" });
    return Array.from(segmenter.segment(text))
      .filter((segment) => segment.isWordLike)
      .map((segment) => segment.segment);
  }

  return text.match(/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*/gu) ?? [];
}

function segmentCount(text: string, granularity: "grapheme", fallback: number): number {
  const Segmenter = Intl.Segmenter;
  if (!Segmenter) return fallback;
  return Array.from(new Segmenter(undefined, { granularity }).segment(text)).length;
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/^[^\p{L}\p{N}'’]+|[^\p{L}\p{N}'’]+$/gu, "");
}

function countItems(values: string[]): Map<string, number> {
  const counts = new Map<string, number>();
  values.forEach((value) => increment(counts, value));
  return counts;
}

function increment(counts: Map<string, number>, key: string): void {
  counts.set(key, (counts.get(key) ?? 0) + 1);
}

function rank(counts: Map<string, number>, denominator: number, limit: number): FrequencyItem[] {
  return [...counts.entries()]
    .sort(([leftText, leftCount], [rightText, rightCount]) =>
      rightCount === leftCount ? leftText.localeCompare(rightText) : rightCount - leftCount,
    )
    .slice(0, Math.max(0, limit))
    .map(([text, count]) => ({ text, count, percentage: (count * 100) / denominator }));
}

function estimateSeconds(words: number, wpm: number): number {
  if (words === 0) return 0;
  return Math.ceil((words * 60) / Math.max(1, wpm));
}

function countSentences(text: string): number {
  let sentences = 0;
  let sentenceOpen = false;
  for (const character of text) {
    if (/^[\p{L}\p{N}]$/u.test(character)) sentenceOpen = true;
    if (SENTENCE_ENDERS.has(character) && sentenceOpen) {
      sentences += 1;
      sentenceOpen = false;
    }
  }
  return sentences + (sentenceOpen ? 1 : 0);
}

function logicalLines(text: string): string[] {
  if (!text) return [];
  return text.match(/[^\r\n]*(?:\r\n|\r|\n)|[^\r\n]+$/g) ?? [];
}

function countParagraphs(text: string): number {
  let paragraphs = 0;
  let paragraphOpen = false;
  for (const line of logicalLines(text)) {
    const content = line.replace(/[\r\n]+$/, "");
    if (content.trim().length === 0) {
      paragraphOpen = false;
    } else if (!paragraphOpen) {
      paragraphs += 1;
      paragraphOpen = true;
    }
  }
  return paragraphs;
}

function analyzeWhitespace(text: string): WhitespaceDiagnostics {
  let spaces = 0;
  let tabs = 0;
  let lineFeeds = 0;
  let carriageReturns = 0;
  let nonBreakingSpaces = 0;
  let otherWhitespace = 0;
  let blankLines = 0;
  let trailingWhitespaceLines = 0;
  let lf = 0;
  let crlf = 0;
  let cr = 0;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === "\r" && text[index + 1] === "\n") {
      crlf += 1;
      carriageReturns += 1;
      lineFeeds += 1;
      index += 1;
    } else if (character === "\r") {
      cr += 1;
      carriageReturns += 1;
    } else if (character === "\n") {
      lf += 1;
      lineFeeds += 1;
    } else if (character === " ") spaces += 1;
    else if (character === "\t") tabs += 1;
  }

  for (const character of text) {
    if (character === "\u00a0") nonBreakingSpaces += 1;
    else if (/\s/u.test(character) && ![" ", "\t", "\r", "\n"].includes(character)) otherWhitespace += 1;
  }

  for (const line of logicalLines(text)) {
    const content = line.replace(/[\r\n]+$/, "");
    if (content.trim().length === 0) blankLines += 1;
    if (content.length !== content.trimEnd().length) trailingWhitespaceLines += 1;
  }

  const lineEndings: LineEndingDiagnostics = {
    lf,
    crlf,
    cr,
    mixed: [lf, crlf, cr].filter((value) => value > 0).length > 1,
    dominant: dominantLineEnding(lf, crlf, cr),
  };

  return {
    spaces,
    tabs,
    lineFeeds,
    carriageReturns,
    nonBreakingSpaces,
    otherWhitespace,
    blankLines,
    trailingWhitespaceLines,
    lineEndings,
  };
}

function dominantLineEnding(lf: number, crlf: number, cr: number): LineEndingDiagnostics["dominant"] {
  const values: Array<[LineEndingDiagnostics["dominant"], number]> = [
    ["LF", lf],
    ["CRLF", crlf],
    ["CR", cr],
  ];
  values.sort((left, right) => right[1] - left[1]);
  return values[0][1] === 0 ? "None" : values[0][0];
}

function lineEndingTotal(value: LineEndingDiagnostics): number {
  return value.lf + value.crlf + value.cr;
}

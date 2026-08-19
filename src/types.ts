export type ThemePreference = "system" | "light" | "dark";

export interface AnalysisOptions {
  readingWpm: number;
  speakingWpm: number;
  topKeywords: number;
  topNgrams: number;
  keywordExclusions: string[];
}

export interface SourceInfo {
  kind: "pasted" | "file";
  displayName: string | null;
  mode: "memory" | "streaming";
  fileSize: number | null;
}

export interface EncodingInfo {
  name: string;
  bomDetected: boolean;
  fallbackUsed: boolean;
  hadErrors: boolean;
}

export interface TextStats {
  words: number;
  uniqueWords: number;
  maxWordCharacters: number;
  characters: number;
  graphemes: number;
  bytes: number;
  sentences: number;
  paragraphs: number;
  lines: number;
  readingSeconds: number;
  speakingSeconds: number;
}

export interface FrequencyItem {
  text: string;
  count: number;
  percentage: number;
}

export interface LineEndingDiagnostics {
  lf: number;
  crlf: number;
  cr: number;
  mixed: boolean;
  dominant: "LF" | "CRLF" | "CR" | "None";
}

export interface WhitespaceDiagnostics {
  spaces: number;
  tabs: number;
  lineFeeds: number;
  carriageReturns: number;
  nonBreakingSpaces: number;
  otherWhitespace: number;
  blankLines: number;
  trailingWhitespaceLines: number;
  lineEndings: LineEndingDiagnostics;
}

export interface AnalysisReport {
  version: number;
  source: SourceInfo;
  encoding: EncodingInfo | null;
  stats: TextStats;
  keywords: FrequencyItem[];
  bigrams: FrequencyItem[];
  trigrams: FrequencyItem[];
  whitespace: WhitespaceDiagnostics;
}

export interface AppSettings {
  theme: ThemePreference;
  readingWpm: number;
  speakingWpm: number;
  topKeywords: number;
  topNgrams: number;
  keywordExclusions: string[];
  reducedMotion: boolean;
  recentFilesEnabled: boolean;
}

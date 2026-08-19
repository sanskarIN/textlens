use serde::{Deserialize, Serialize};

const MAX_KEYWORD_EXCLUSIONS: usize = 100;
const MAX_KEYWORD_EXCLUSION_CHARACTERS: usize = 64;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AnalysisOptions {
    pub reading_wpm: u32,
    pub speaking_wpm: u32,
    pub top_keywords: usize,
    pub top_ngrams: usize,
    #[serde(default)]
    pub keyword_exclusions: Vec<String>,
}

impl Default for AnalysisOptions {
    fn default() -> Self {
        Self {
            reading_wpm: 238,
            speaking_wpm: 150,
            top_keywords: 12,
            top_ngrams: 10,
            keyword_exclusions: Vec::new(),
        }
    }
}

impl AnalysisOptions {
    pub fn sanitized(self) -> Self {
        let keyword_exclusions = self
            .keyword_exclusions
            .into_iter()
            .filter_map(|value| {
                let trimmed = value.trim();
                if trimmed.is_empty() {
                    None
                } else {
                    Some(
                        trimmed
                            .chars()
                            .take(MAX_KEYWORD_EXCLUSION_CHARACTERS)
                            .collect::<String>(),
                    )
                }
            })
            .take(MAX_KEYWORD_EXCLUSIONS)
            .collect();

        Self {
            reading_wpm: self.reading_wpm.clamp(30, 1000),
            speaking_wpm: self.speaking_wpm.clamp(30, 1000),
            top_keywords: self.top_keywords.clamp(1, 50),
            top_ngrams: self.top_ngrams.clamp(1, 50),
            keyword_exclusions,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct SourceInfo {
    pub kind: SourceKind,
    pub display_name: Option<String>,
    pub mode: AnalysisMode,
    pub file_size: Option<u64>,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum SourceKind {
    Pasted,
    File,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum AnalysisMode {
    Memory,
    Streaming,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct EncodingInfo {
    pub name: String,
    pub bom_detected: bool,
    pub fallback_used: bool,
    pub had_errors: bool,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct TextStats {
    pub words: usize,
    pub unique_words: usize,
    pub max_word_characters: usize,
    pub characters: usize,
    pub graphemes: usize,
    pub bytes: usize,
    pub sentences: usize,
    pub paragraphs: usize,
    pub lines: usize,
    pub reading_seconds: u64,
    pub speaking_seconds: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct FrequencyItem {
    pub text: String,
    pub count: usize,
    pub percentage: f64,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct LineEndingDiagnostics {
    pub lf: usize,
    pub crlf: usize,
    pub cr: usize,
    pub mixed: bool,
    pub dominant: String,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct WhitespaceDiagnostics {
    pub spaces: usize,
    pub tabs: usize,
    pub line_feeds: usize,
    pub carriage_returns: usize,
    pub non_breaking_spaces: usize,
    pub other_whitespace: usize,
    pub blank_lines: usize,
    pub trailing_whitespace_lines: usize,
    pub line_endings: LineEndingDiagnostics,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct AnalysisReport {
    pub version: u8,
    pub source: SourceInfo,
    pub encoding: Option<EncodingInfo>,
    pub stats: TextStats,
    pub keywords: Vec<FrequencyItem>,
    pub bigrams: Vec<FrequencyItem>,
    pub trigrams: Vec<FrequencyItem>,
    pub whitespace: WhitespaceDiagnostics,
}

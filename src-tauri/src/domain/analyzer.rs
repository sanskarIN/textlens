use std::collections::{HashMap, HashSet};

use unicode_segmentation::UnicodeSegmentation;

use super::models::{
    AnalysisMode, AnalysisOptions, AnalysisReport, EncodingInfo, FrequencyItem,
    LineEndingDiagnostics, SourceInfo, SourceKind, TextStats, WhitespaceDiagnostics,
    CURRENT_REPORT_VERSION,
};

const SENTENCE_ENDERS: &[char] = &['.', '!', '?', '…', '。', '！', '？'];

pub fn analyze_text(text: &str, options: AnalysisOptions) -> AnalysisReport {
    let mut acc = AnalysisAccumulator::new(options);
    acc.push_line_chunk(text, text.len());
    acc.finish(
        SourceInfo {
            kind: SourceKind::Pasted,
            display_name: None,
            mode: AnalysisMode::Memory,
            file_size: None,
        },
        None,
    )
}

pub(crate) struct AnalysisAccumulator {
    options: AnalysisOptions,
    stats: TextStats,
    whitespace: WhitespaceDiagnostics,
    word_counts: HashMap<String, usize>,
    bigram_counts: HashMap<String, usize>,
    trigram_counts: HashMap<String, usize>,
    keyword_exclusions: HashSet<String>,
    previous_word: Option<String>,
    previous_two: Option<(String, String)>,
    sentence_open: bool,
    paragraph_open: bool,
    has_content: bool,
}

impl AnalysisAccumulator {
    pub(crate) fn new(options: AnalysisOptions) -> Self {
        let options = options.sanitized();
        let keyword_exclusions = options
            .keyword_exclusions
            .iter()
            .map(|value| normalize(value))
            .filter(|value| !value.is_empty())
            .collect();

        Self {
            options,
            stats: TextStats::default(),
            whitespace: WhitespaceDiagnostics::default(),
            word_counts: HashMap::new(),
            bigram_counts: HashMap::new(),
            trigram_counts: HashMap::new(),
            keyword_exclusions,
            previous_word: None,
            previous_two: None,
            sentence_open: false,
            paragraph_open: false,
            has_content: false,
        }
    }

    pub(crate) fn push_line_chunk(&mut self, chunk: &str, original_bytes: usize) {
        if chunk.is_empty() && original_bytes == 0 {
            return;
        }
        self.has_content = true;
        self.stats.bytes = self.stats.bytes.saturating_add(original_bytes);
        self.stats.characters = self.stats.characters.saturating_add(chunk.chars().count());
        self.stats.graphemes = self
            .stats
            .graphemes
            .saturating_add(UnicodeSegmentation::graphemes(chunk, true).count());
        self.scan_whitespace(chunk);
        self.scan_sentences(chunk);
        self.scan_paragraphs(chunk);
        self.scan_words(chunk);
    }

    pub(crate) fn finish(
        mut self,
        source: SourceInfo,
        encoding: Option<EncodingInfo>,
    ) -> AnalysisReport {
        if self.sentence_open {
            self.stats.sentences = self.stats.sentences.saturating_add(1);
        }
        if self.has_content {
            self.stats.lines = self
                .whitespace
                .line_endings
                .lf
                .saturating_add(self.whitespace.line_endings.crlf)
                .saturating_add(self.whitespace.line_endings.cr)
                .saturating_add(1);
        }

        let kinds = [
            self.whitespace.line_endings.lf,
            self.whitespace.line_endings.crlf,
            self.whitespace.line_endings.cr,
        ]
        .into_iter()
        .filter(|v| *v > 0)
        .count();
        self.whitespace.line_endings.mixed = kinds > 1;
        self.whitespace.line_endings.dominant = dominant(&self.whitespace.line_endings);

        self.stats.unique_words = self.word_counts.len();
        self.stats.reading_seconds = estimate_seconds(self.stats.words, self.options.reading_wpm);
        self.stats.speaking_seconds = estimate_seconds(self.stats.words, self.options.speaking_wpm);

        let mut keyword_counts = self.word_counts;
        keyword_counts.retain(|word, _| !self.keyword_exclusions.contains(word));
        let keywords = rank(
            keyword_counts,
            self.stats.words.max(1),
            self.options.top_keywords,
        );
        let bigrams = rank(
            self.bigram_counts,
            self.stats.words.saturating_sub(1).max(1),
            self.options.top_ngrams,
        );
        let trigrams = rank(
            self.trigram_counts,
            self.stats.words.saturating_sub(2).max(1),
            self.options.top_ngrams,
        );

        AnalysisReport {
            version: CURRENT_REPORT_VERSION,
            source,
            encoding,
            stats: self.stats,
            keywords,
            bigrams,
            trigrams,
            whitespace: self.whitespace,
        }
    }

    fn scan_words(&mut self, chunk: &str) {
        for raw in UnicodeSegmentation::unicode_words(chunk) {
            let word = normalize(raw);
            if word.is_empty() {
                continue;
            }

            self.stats.words = self.stats.words.saturating_add(1);
            self.stats.max_word_characters =
                self.stats.max_word_characters.max(word.chars().count());
            *self.word_counts.entry(word.clone()).or_insert(0) += 1;

            if let Some(prev) = &self.previous_word {
                *self
                    .bigram_counts
                    .entry(format!("{prev} {word}"))
                    .or_insert(0) += 1;
            }
            if let Some((first, second)) = &self.previous_two {
                *self
                    .trigram_counts
                    .entry(format!("{first} {second} {word}"))
                    .or_insert(0) += 1;
            }

            self.previous_two = self
                .previous_word
                .as_ref()
                .map(|prev| (prev.clone(), word.clone()));
            self.previous_word = Some(word);
        }
    }

    fn scan_sentences(&mut self, chunk: &str) {
        for ch in chunk.chars() {
            if ch.is_alphanumeric() {
                self.sentence_open = true;
            }
            if SENTENCE_ENDERS.contains(&ch) && self.sentence_open {
                self.stats.sentences = self.stats.sentences.saturating_add(1);
                self.sentence_open = false;
            }
        }
    }

    fn scan_paragraphs(&mut self, chunk: &str) {
        for line in logical_lines(chunk) {
            let content = line.trim_end_matches(['\r', '\n']);
            if content.trim().is_empty() {
                self.paragraph_open = false;
                self.whitespace.blank_lines = self.whitespace.blank_lines.saturating_add(1);
            } else if !self.paragraph_open {
                self.stats.paragraphs = self.stats.paragraphs.saturating_add(1);
                self.paragraph_open = true;
            }
            if content.len() != content.trim_end_matches(char::is_whitespace).len() {
                self.whitespace.trailing_whitespace_lines =
                    self.whitespace.trailing_whitespace_lines.saturating_add(1);
            }
        }
    }

    fn scan_whitespace(&mut self, chunk: &str) {
        let bytes = chunk.as_bytes();
        let mut i = 0;
        while i < bytes.len() {
            match bytes[i] {
                b'\r' if i + 1 < bytes.len() && bytes[i + 1] == b'\n' => {
                    self.whitespace.line_endings.crlf += 1;
                    self.whitespace.carriage_returns += 1;
                    self.whitespace.line_feeds += 1;
                    i += 2;
                    continue;
                }
                b'\r' => {
                    self.whitespace.line_endings.cr += 1;
                    self.whitespace.carriage_returns += 1;
                }
                b'\n' => {
                    self.whitespace.line_endings.lf += 1;
                    self.whitespace.line_feeds += 1;
                }
                b' ' => self.whitespace.spaces += 1,
                b'\t' => self.whitespace.tabs += 1,
                _ => {}
            }
            i += 1;
        }

        for ch in chunk.chars() {
            if ch == '\u{00A0}' {
                self.whitespace.non_breaking_spaces += 1;
            } else if ch.is_whitespace() && !matches!(ch, ' ' | '\t' | '\r' | '\n') {
                self.whitespace.other_whitespace += 1;
            }
        }
    }
}

fn normalize(word: &str) -> String {
    word.chars()
        .flat_map(char::to_lowercase)
        .collect::<String>()
        .trim_matches(|c: char| !c.is_alphanumeric() && c != '\'' && c != '’')
        .to_string()
}

fn estimate_seconds(words: usize, wpm: u32) -> u64 {
    if words == 0 {
        0
    } else {
        ((words as u128).saturating_mul(60)).div_ceil(u128::from(wpm.max(1))) as u64
    }
}

fn rank(map: HashMap<String, usize>, denominator: usize, limit: usize) -> Vec<FrequencyItem> {
    let mut items: Vec<_> = map.into_iter().collect();
    items.sort_by(|(at, ac), (bt, bc)| bc.cmp(ac).then_with(|| at.cmp(bt)));
    items
        .into_iter()
        .take(limit)
        .map(|(text, count)| FrequencyItem {
            text,
            count,
            percentage: count as f64 * 100.0 / denominator as f64,
        })
        .collect()
}

fn dominant(d: &LineEndingDiagnostics) -> String {
    let mut vals = [("LF", d.lf), ("CRLF", d.crlf), ("CR", d.cr)];
    vals.sort_by(|a, b| b.1.cmp(&a.1));
    if vals[0].1 == 0 {
        "None".into()
    } else {
        vals[0].0.into()
    }
}

fn logical_lines(text: &str) -> Vec<&str> {
    if text.is_empty() {
        return Vec::new();
    }
    let bytes = text.as_bytes();
    let mut out = Vec::new();
    let mut start = 0;
    let mut i = 0;
    while i < bytes.len() {
        if bytes[i] == b'\n' {
            out.push(&text[start..=i]);
            start = i + 1;
        } else if bytes[i] == b'\r' {
            if i + 1 < bytes.len() && bytes[i + 1] == b'\n' {
                out.push(&text[start..=i + 1]);
                i += 1;
                start = i + 1;
            } else {
                out.push(&text[start..=i]);
                start = i + 1;
            }
        }
        i += 1;
    }
    if start < text.len() {
        out.push(&text[start..]);
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn core_counts() {
        let r = analyze_text("Hello world.\n\nNext line!", AnalysisOptions::default());
        assert_eq!(r.version, CURRENT_REPORT_VERSION);
        assert_eq!(r.stats.words, 4);
        assert_eq!(r.stats.unique_words, 4);
        assert_eq!(r.stats.max_word_characters, 5);
        assert_eq!(r.stats.sentences, 2);
        assert_eq!(r.stats.paragraphs, 2);
        assert_eq!(r.stats.lines, 3);
    }

    #[test]
    fn vocabulary_metrics_handle_repetition() {
        let r = analyze_text("alpha beta alpha alphabet", AnalysisOptions::default());
        assert_eq!(r.stats.words, 4);
        assert_eq!(r.stats.unique_words, 3);
        assert_eq!(r.stats.max_word_characters, 8);
    }

    #[test]
    fn keyword_exclusions_do_not_change_core_counts_or_ngrams() {
        let options = AnalysisOptions {
            keyword_exclusions: vec!["THE".into(), "rust".into()],
            ..AnalysisOptions::default()
        };
        let r = analyze_text("the rust rust book", options);

        assert_eq!(r.stats.words, 4);
        assert_eq!(r.stats.unique_words, 3);
        assert!(r
            .keywords
            .iter()
            .all(|item| item.text != "the" && item.text != "rust"));
        assert!(r.keywords.iter().any(|item| item.text == "book"));
        assert!(r.bigrams.iter().any(|item| item.text == "the rust"));
    }

    #[test]
    fn unicode_words_and_graphemes() {
        let r = analyze_text("नमस्ते दुनिया café 👨‍👩‍👧‍👦", AnalysisOptions::default());
        assert!(r.stats.words >= 3);
        assert!(r.stats.graphemes <= r.stats.characters);
    }

    #[test]
    fn mixed_endings() {
        let r = analyze_text("a\r\nb\nc\rd", AnalysisOptions::default());
        assert!(r.whitespace.line_endings.mixed);
        assert_eq!(r.stats.lines, 4);
    }

    #[test]
    fn ngrams_are_counted() {
        let r = analyze_text("one two three one two", AnalysisOptions::default());
        assert!(r
            .bigrams
            .iter()
            .any(|x| x.text == "one two" && x.count == 2));
        assert!(r.trigrams.iter().any(|x| x.text == "one two three"));
    }
}

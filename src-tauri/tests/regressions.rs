use textlens_lib::domain::{analyzer::analyze_text, models::AnalysisOptions};

#[test]
fn trailing_newline_counts_final_empty_line() {
    assert_eq!(
        analyze_text("first\nsecond\n", AnalysisOptions::default())
            .stats
            .lines,
        3
    );
}

#[test]
fn empty_input_has_zero_metrics() {
    let report = analyze_text("", AnalysisOptions::default());
    assert_eq!(report.stats.lines, 0);
    assert_eq!(report.stats.paragraphs, 0);
    assert_eq!(report.stats.words, 0);
    assert_eq!(report.stats.unique_words, 0);
    assert_eq!(report.stats.max_word_characters, 0);
}

#[test]
fn repeated_sentence_punctuation_does_not_double_count() {
    assert_eq!(
        analyze_text("Really?! Yes.", AnalysisOptions::default())
            .stats
            .sentences,
        2
    );
}

#[test]
fn case_folding_keeps_unique_word_count_stable() {
    let report = analyze_text("TextLens textlens TEXTLENS", AnalysisOptions::default());
    assert_eq!(report.stats.words, 3);
    assert_eq!(report.stats.unique_words, 1);
}

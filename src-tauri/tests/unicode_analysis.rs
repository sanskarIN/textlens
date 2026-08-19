use proptest::prelude::*;
use textlens_lib::domain::{analyzer::analyze_text, models::AnalysisOptions};

#[test]
fn tokenizes_multiple_writing_systems() {
    let report = analyze_text(
        "English हिन्दी 中文 العربية français",
        AnalysisOptions::default(),
    );
    assert!(report.stats.words >= 5);
    assert!(report.stats.characters > report.stats.words);
    assert!(report.stats.unique_words <= report.stats.words);
}

#[test]
fn checked_in_multilingual_fixture_is_safe() {
    let report = analyze_text(
        include_str!("fixtures/multilingual.txt"),
        AnalysisOptions::default(),
    );
    assert!(report.stats.words >= 15);
    assert!(report.stats.characters >= report.stats.graphemes);
    assert!(report.stats.unique_words <= report.stats.words);
    assert_eq!(report.stats.lines, 6);
}

#[test]
fn preserves_apostrophes_inside_words() {
    let report = analyze_text("don't don’t cant", AnalysisOptions::default());
    let terms = report
        .keywords
        .iter()
        .map(|item| item.text.as_str())
        .collect::<Vec<_>>();
    assert!(terms.contains(&"don't"));
    assert!(terms.contains(&"don’t"));
}

#[test]
fn vocabulary_metrics_are_unicode_aware() {
    let report = analyze_text("café café नमस्ते", AnalysisOptions::default());
    assert_eq!(report.stats.words, 3);
    assert_eq!(report.stats.unique_words, 2);
    assert!(report.stats.max_word_characters >= 4);
}

#[test]
fn keyword_exclusions_normalize_unicode_terms() {
    let options = AnalysisOptions {
        keyword_exclusions: vec!["CAFÉ".into(), "हिन्दी".into()],
        ..AnalysisOptions::default()
    };
    let report = analyze_text("café हिन्दी café दुनिया", options);
    assert_eq!(report.stats.words, 4);
    assert_eq!(report.stats.unique_words, 3);
    assert!(report
        .keywords
        .iter()
        .all(|item| item.text != "café" && item.text != "हिन्दी"));
}

proptest! {
    #[test]
    fn arbitrary_unicode_is_safe(input in ".*") {
        let report = analyze_text(&input, AnalysisOptions::default());
        prop_assert!(report.stats.bytes >= report.stats.characters);
        prop_assert!(report.stats.characters >= report.stats.graphemes);
        prop_assert!(report.stats.unique_words <= report.stats.words);
        prop_assert_eq!(report.stats.max_word_characters == 0, report.stats.words == 0);
    }
}

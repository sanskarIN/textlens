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

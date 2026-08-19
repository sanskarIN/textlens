use proptest::prelude::*;
use textlens_lib::domain::{analyzer::analyze_text, models::AnalysisOptions};

#[test] fn tokenizes_multiple_writing_systems(){let r=analyze_text("English हिन्दी 中文 العربية français",AnalysisOptions::default());assert!(r.stats.words>=5);assert!(r.stats.characters>r.stats.words);}
#[test] fn preserves_apostrophes_inside_words(){let r=analyze_text("don't don’t cant",AnalysisOptions::default());let terms=r.keywords.iter().map(|i|i.text.as_str()).collect::<Vec<_>>();assert!(terms.contains(&"don't"));assert!(terms.contains(&"don’t"));}
proptest!{#[test] fn arbitrary_unicode_is_safe(input in ".*"){let r=analyze_text(&input,AnalysisOptions::default());prop_assert!(r.stats.bytes>=r.stats.characters);prop_assert!(r.stats.characters>=r.stats.graphemes);}}

use textlens_lib::domain::{analyzer::analyze_text, models::AnalysisOptions};
#[test] fn trailing_newline_counts_final_empty_line(){assert_eq!(analyze_text("first\nsecond\n",AnalysisOptions::default()).stats.lines,3);}
#[test] fn empty_input_has_zero_lines(){let r=analyze_text("",AnalysisOptions::default());assert_eq!(r.stats.lines,0);assert_eq!(r.stats.paragraphs,0);assert_eq!(r.stats.words,0);}
#[test] fn repeated_sentence_punctuation_does_not_double_count(){assert_eq!(analyze_text("Really?! Yes.",AnalysisOptions::default()).stats.sentences,2);}

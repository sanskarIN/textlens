use std::path::Path;

use crate::{
    domain::models::{AnalysisReport, FrequencyItem},
    error::AppError,
};

pub fn write_report(path: &Path, report: &AnalysisReport, format: &str) -> Result<(), AppError> {
    validate_destination(path)?;
    let content = match format {
        "json" => serde_json::to_string_pretty(report).map_err(AppError::Serialize)?,
        "markdown" => render_markdown(report),
        other => return Err(AppError::UnsupportedFormat(other.into())),
    };
    atomic_write(path, content.as_bytes())
}

fn validate_destination(path: &Path) -> Result<(), AppError> {
    let Some(parent) = path.parent() else {
        return Err(AppError::InvalidDestination);
    };
    if !parent.as_os_str().is_empty() && !parent.exists() {
        return Err(AppError::MissingDestination(parent.to_path_buf()));
    }
    Ok(())
}

fn atomic_write(path: &Path, contents: &[u8]) -> Result<(), AppError> {
    let name = path
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("textlens-report");
    let temp = path.with_file_name(format!(".{name}.tmp"));
    let backup = path.with_file_name(format!(".{name}.textlens-backup"));

    std::fs::write(&temp, contents).map_err(AppError::WriteReport)?;
    if !path.exists() {
        return std::fs::rename(&temp, path).map_err(|error| {
            let _ = std::fs::remove_file(&temp);
            AppError::WriteReport(error)
        });
    }

    if backup.exists() {
        std::fs::remove_file(&backup).map_err(AppError::WriteReport)?;
    }
    std::fs::rename(path, &backup).map_err(|error| {
        let _ = std::fs::remove_file(&temp);
        AppError::WriteReport(error)
    })?;

    match std::fs::rename(&temp, path) {
        Ok(()) => {
            let _ = std::fs::remove_file(&backup);
            Ok(())
        }
        Err(error) => {
            let _ = std::fs::rename(&backup, path);
            let _ = std::fs::remove_file(&temp);
            Err(AppError::WriteReport(error))
        }
    }
}

fn render_markdown(r: &AnalysisReport) -> String {
    let mut output = String::from(
        "# TextLens Analysis Report\n\n> Generated locally by TextLens. Document content is not included in this report.\n\n",
    );

    if let Some(name) = &r.source.display_name {
        output.push_str(&format!("- **Source:** `{}`\n", escape_inline(name)));
    }
    output.push_str(&format!("- **Analysis mode:** `{:?}`\n", r.source.mode));
    if let Some(encoding) = &r.encoding {
        output.push_str(&format!("- **Encoding:** {}\n", encoding.name));
    }

    output.push_str("\n## Core metrics\n\n| Metric | Value |\n|---|---:|\n");
    for (name, value) in [
        ("Words", r.stats.words as u64),
        ("Unique words", r.stats.unique_words as u64),
        ("Longest word (characters)", r.stats.max_word_characters as u64),
        ("Characters", r.stats.characters as u64),
        ("Graphemes", r.stats.graphemes as u64),
        ("Sentences", r.stats.sentences as u64),
        ("Paragraphs", r.stats.paragraphs as u64),
        ("Lines", r.stats.lines as u64),
        ("Bytes", r.stats.bytes as u64),
        ("Reading time (seconds)", r.stats.reading_seconds),
        ("Speaking time (seconds)", r.stats.speaking_seconds),
    ] {
        output.push_str(&format!("| {name} | {value} |\n"));
    }

    output.push('\n');
    append_table(&mut output, "Keywords", &r.keywords);
    append_table(&mut output, "Bigrams", &r.bigrams);
    append_table(&mut output, "Trigrams", &r.trigrams);
    output.push_str(&format!(
        "## Whitespace & line endings\n\n- Spaces: {}\n- Tabs: {}\n- Blank lines: {}\n- Trailing-whitespace lines: {}\n- Dominant line ending: {}\n- Line endings mixed: {}\n\n---\n\nMade by the Sanskar\n",
        r.whitespace.spaces,
        r.whitespace.tabs,
        r.whitespace.blank_lines,
        r.whitespace.trailing_whitespace_lines,
        r.whitespace.line_endings.dominant,
        r.whitespace.line_endings.mixed
    ));
    output
}

fn append_table(output: &mut String, heading: &str, items: &[FrequencyItem]) {
    output.push_str(&format!("## {heading}\n\n"));
    if items.is_empty() {
        output.push_str("_No entries._\n\n");
        return;
    }

    output.push_str("| Text | Count | Share |\n|---|---:|---:|\n");
    for item in items {
        output.push_str(&format!(
            "| {} | {} | {:.2}% |\n",
            escape_table(&item.text),
            item.count,
            item.percentage
        ));
    }
    output.push('\n');
}

fn escape_table(value: &str) -> String {
    value
        .replace('\\', "\\\\")
        .replace('|', "\\|")
        .replace('\n', " ")
}

fn escape_inline(value: &str) -> String {
    value.replace('`', "ˋ").replace('\n', " ")
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::domain::{analyzer::analyze_text, models::AnalysisOptions};

    #[test]
    fn markdown_omits_source_text() {
        let report = analyze_text("secret source text", AnalysisOptions::default());
        let markdown = render_markdown(&report);
        assert!(markdown.contains("TextLens Analysis Report"));
        assert!(!markdown.contains("secret source text"));
    }

    #[test]
    fn markdown_includes_vocabulary_metrics() {
        let report = analyze_text("alpha beta alpha", AnalysisOptions::default());
        let markdown = render_markdown(&report);
        assert!(markdown.contains("| Unique words | 2 |"));
        assert!(markdown.contains("| Longest word (characters) | 5 |"));
    }

    #[test]
    fn replaces_existing_export() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("report.json");
        std::fs::write(&path, "old").unwrap();
        let report = analyze_text("hello world", AnalysisOptions::default());
        write_report(&path, &report, "json").unwrap();
        assert!(std::fs::read_to_string(&path)
            .unwrap()
            .contains("\"words\": 2"));
        assert!(!path
            .with_file_name(".report.json.textlens-backup")
            .exists());
    }
}

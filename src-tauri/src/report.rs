use std::{fs, path::Path};

use serde::Deserialize;

use crate::{
    domain::models::{AnalysisReport, FrequencyItem, SourceKind, CURRENT_REPORT_VERSION},
    error::AppError,
};

const MAX_REPORT_IMPORT_BYTES: u64 = 512 * 1024;
const MAX_FREQUENCY_ITEMS: usize = 50;
const MAX_FREQUENCY_TEXT_BYTES: usize = 4 * 1024;
const MAX_METADATA_TEXT_BYTES: usize = 4 * 1024;

#[derive(Debug, Clone, Copy, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ReportExportOptions {
    pub include_source_metadata: bool,
    pub include_core_metrics: bool,
    pub include_keywords: bool,
    pub include_bigrams: bool,
    pub include_trigrams: bool,
    pub include_whitespace: bool,
}

impl Default for ReportExportOptions {
    fn default() -> Self {
        Self {
            include_source_metadata: true,
            include_core_metrics: true,
            include_keywords: true,
            include_bigrams: true,
            include_trigrams: true,
            include_whitespace: true,
        }
    }
}

pub fn write_report(path: &Path, report: &AnalysisReport, format: &str) -> Result<(), AppError> {
    write_report_with_options(path, report, format, ReportExportOptions::default())
}

pub fn write_report_with_options(
    path: &Path,
    report: &AnalysisReport,
    format: &str,
    options: ReportExportOptions,
) -> Result<(), AppError> {
    validate_destination(path)?;
    let content = match format {
        "json" => serde_json::to_string_pretty(report).map_err(AppError::Serialize)?,
        "markdown" => render_markdown_with_options(report, options),
        other => return Err(AppError::UnsupportedFormat(other.into())),
    };
    atomic_write(path, content.as_bytes())
}

pub fn read_report(path: &Path) -> Result<AnalysisReport, AppError> {
    let metadata = fs::metadata(path).map_err(AppError::ReadReport)?;
    if !metadata.is_file() {
        return Err(AppError::NotAFile);
    }
    if metadata.len() > MAX_REPORT_IMPORT_BYTES {
        return Err(AppError::ReportTooLarge);
    }

    let bytes = fs::read(path).map_err(AppError::ReadReport)?;
    let report: AnalysisReport = serde_json::from_slice(&bytes).map_err(AppError::InvalidReport)?;
    validate_report(&report)?;
    Ok(report)
}

fn validate_report(report: &AnalysisReport) -> Result<(), AppError> {
    if report.version == 0 || report.version > CURRENT_REPORT_VERSION {
        return Err(AppError::UnsupportedReportVersion(report.version));
    }

    if report.stats.unique_words > report.stats.words
        || report.stats.graphemes > report.stats.characters
        || (report.version >= 2
            && ((report.stats.words == 0 && report.stats.max_word_characters != 0)
                || (report.stats.words > 0
                    && (report.stats.unique_words == 0 || report.stats.max_word_characters == 0))))
    {
        return Err(AppError::InvalidReportData);
    }

    if report.source.kind == SourceKind::Pasted && report.source.file_size.is_some() {
        return Err(AppError::InvalidReportData);
    }
    if report
        .source
        .display_name
        .as_ref()
        .is_some_and(|value| value.len() > MAX_METADATA_TEXT_BYTES || value.contains('\0'))
    {
        return Err(AppError::InvalidReportData);
    }
    if report
        .encoding
        .as_ref()
        .is_some_and(|value| value.name.is_empty() || value.name.len() > MAX_METADATA_TEXT_BYTES)
    {
        return Err(AppError::InvalidReportData);
    }
    if !matches!(
        report.whitespace.line_endings.dominant.as_str(),
        "LF" | "CRLF" | "CR" | "None"
    ) {
        return Err(AppError::InvalidReportData);
    }

    validate_frequency_items(&report.keywords, report.stats.words)?;
    validate_frequency_items(&report.bigrams, report.stats.words.saturating_sub(1))?;
    validate_frequency_items(&report.trigrams, report.stats.words.saturating_sub(2))?;

    Ok(())
}

fn validate_frequency_items(
    items: &[FrequencyItem],
    possible_positions: usize,
) -> Result<(), AppError> {
    if items.len() > MAX_FREQUENCY_ITEMS || (possible_positions == 0 && !items.is_empty()) {
        return Err(AppError::InvalidReportData);
    }

    for item in items {
        if item.text.is_empty()
            || item.text.len() > MAX_FREQUENCY_TEXT_BYTES
            || item.text.contains('\0')
            || item.count == 0
            || item.count > possible_positions
            || !item.percentage.is_finite()
            || !(0.0..=100.0).contains(&item.percentage)
        {
            return Err(AppError::InvalidReportData);
        }
    }

    Ok(())
}

fn validate_destination(path: &Path) -> Result<(), AppError> {
    let Some(parent) = path.parent() else {
        return Err(AppError::InvalidDestination);
    };
    if !parent.as_os_str().is_empty() && !parent.exists() {
        return Err(AppError::MissingDestination);
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

    fs::write(&temp, contents).map_err(AppError::WriteReport)?;
    if !path.exists() {
        return fs::rename(&temp, path).map_err(|error| {
            let _ = fs::remove_file(&temp);
            AppError::WriteReport(error)
        });
    }

    if backup.exists() {
        fs::remove_file(&backup).map_err(AppError::WriteReport)?;
    }
    fs::rename(path, &backup).map_err(|error| {
        let _ = fs::remove_file(&temp);
        AppError::WriteReport(error)
    })?;

    match fs::rename(&temp, path) {
        Ok(()) => {
            let _ = fs::remove_file(&backup);
            Ok(())
        }
        Err(error) => {
            let _ = fs::rename(&backup, path);
            let _ = fs::remove_file(&temp);
            Err(AppError::WriteReport(error))
        }
    }
}

#[cfg(test)]
fn render_markdown(r: &AnalysisReport) -> String {
    render_markdown_with_options(r, ReportExportOptions::default())
}

fn render_markdown_with_options(r: &AnalysisReport, options: ReportExportOptions) -> String {
    let mut output = String::from(
        "# TextLens Analysis Report\n\n> Generated locally by TextLens. Document content is not included in this report.\n\n",
    );

    output.push_str(&format!("- **Report schema:** v{}\n", r.version));
    if options.include_source_metadata {
        if let Some(name) = &r.source.display_name {
            output.push_str(&format!("- **Source:** `{}`\n", escape_inline(name)));
        }
        output.push_str(&format!("- **Analysis mode:** `{:?}`\n", r.source.mode));
        if let Some(encoding) = &r.encoding {
            output.push_str(&format!("- **Encoding:** {}\n", encoding.name));
        }
    }

    if options.include_core_metrics {
        output.push_str("\n## Core metrics\n\n| Metric | Value |\n|---|---:|\n");
        for (name, value) in [
            ("Words", r.stats.words as u64),
            ("Unique words", r.stats.unique_words as u64),
            (
                "Longest word (characters)",
                r.stats.max_word_characters as u64,
            ),
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
    }

    output.push('\n');
    if options.include_keywords {
        append_table(&mut output, "Keywords", &r.keywords);
    }
    if options.include_bigrams {
        append_table(&mut output, "Bigrams", &r.bigrams);
    }
    if options.include_trigrams {
        append_table(&mut output, "Trigrams", &r.trigrams);
    }
    if options.include_whitespace {
        output.push_str(&format!(
            "## Whitespace & line endings\n\n- Spaces: {}\n- Tabs: {}\n- Blank lines: {}\n- Trailing-whitespace lines: {}\n- Dominant line ending: {}\n- Line endings mixed: {}\n\n",
            r.whitespace.spaces,
            r.whitespace.tabs,
            r.whitespace.blank_lines,
            r.whitespace.trailing_whitespace_lines,
            r.whitespace.line_endings.dominant,
            r.whitespace.line_endings.mixed
        ));
    }
    output.push_str("---\n\nMade by the Sanskar\n");
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
    fn markdown_includes_vocabulary_metrics_and_schema() {
        let report = analyze_text("alpha beta alpha", AnalysisOptions::default());
        let markdown = render_markdown(&report);
        assert!(markdown.contains("Report schema:** v2"));
        assert!(markdown.contains("| Unique words | 2 |"));
        assert!(markdown.contains("| Longest word (characters) | 5 |"));
    }

    #[test]
    fn custom_markdown_can_hide_source_metadata_and_sections() {
        let mut report = analyze_text("alpha beta alpha", AnalysisOptions::default());
        report.source.display_name = Some("private-name.txt".into());
        let options = ReportExportOptions {
            include_source_metadata: false,
            include_core_metrics: false,
            include_keywords: true,
            include_bigrams: false,
            include_trigrams: false,
            include_whitespace: false,
        };

        let markdown = render_markdown_with_options(&report, options);
        assert!(markdown.contains("## Keywords"));
        assert!(!markdown.contains("private-name.txt"));
        assert!(!markdown.contains("## Core metrics"));
        assert!(!markdown.contains("## Bigrams"));
        assert!(!markdown.contains("## Trigrams"));
        assert!(!markdown.contains("## Whitespace & line endings"));
        assert!(!markdown.contains("alpha beta alpha"));
    }

    #[test]
    fn json_export_remains_canonical_when_markdown_options_are_disabled() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("report.json");
        let report = analyze_text("alpha beta alpha", AnalysisOptions::default());
        let options = ReportExportOptions {
            include_source_metadata: false,
            include_core_metrics: false,
            include_keywords: false,
            include_bigrams: false,
            include_trigrams: false,
            include_whitespace: false,
        };

        write_report_with_options(&path, &report, "json", options).unwrap();
        assert_eq!(read_report(&path).unwrap(), report);
    }

    #[test]
    fn replaces_existing_export() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("report.json");
        fs::write(&path, "old").unwrap();
        let report = analyze_text("hello world", AnalysisOptions::default());
        write_report(&path, &report, "json").unwrap();
        assert!(fs::read_to_string(&path).unwrap().contains("\"words\": 2"));
        assert!(!path.with_file_name(".report.json.textlens-backup").exists());
    }

    #[test]
    fn exported_json_round_trips_through_import_validation() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("report.json");
        let expected = analyze_text("alpha beta alpha", AnalysisOptions::default());
        write_report(&path, &expected, "json").unwrap();
        assert_eq!(read_report(&path).unwrap(), expected);
    }

    #[test]
    fn reads_legacy_version_one_report_without_vocabulary_fields() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("legacy-report.json");
        let report = analyze_text("alpha beta alpha", AnalysisOptions::default());
        let mut value = serde_json::to_value(report).unwrap();
        value["version"] = serde_json::Value::from(1);
        let stats = value["stats"].as_object_mut().unwrap();
        stats.remove("uniqueWords");
        stats.remove("maxWordCharacters");
        fs::write(&path, serde_json::to_vec(&value).unwrap()).unwrap();

        let restored = read_report(&path).unwrap();
        assert_eq!(restored.version, 1);
        assert_eq!(restored.stats.unique_words, 0);
        assert_eq!(restored.stats.max_word_characters, 0);
    }

    #[test]
    fn rejects_unsupported_report_version() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("report.json");
        let mut report = analyze_text("hello", AnalysisOptions::default());
        report.version = CURRENT_REPORT_VERSION + 1;
        fs::write(&path, serde_json::to_vec(&report).unwrap()).unwrap();
        assert!(matches!(
            read_report(&path),
            Err(AppError::UnsupportedReportVersion(_))
        ));
    }

    #[test]
    fn rejects_inconsistent_report_metrics() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("report.json");
        let mut report = analyze_text("hello", AnalysisOptions::default());
        report.stats.unique_words = 2;
        fs::write(&path, serde_json::to_vec(&report).unwrap()).unwrap();
        assert!(matches!(
            read_report(&path),
            Err(AppError::InvalidReportData)
        ));
    }

    #[test]
    fn rejects_oversized_report_before_parsing() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("report.json");
        fs::write(&path, vec![b' '; MAX_REPORT_IMPORT_BYTES as usize + 1]).unwrap();
        assert!(matches!(read_report(&path), Err(AppError::ReportTooLarge)));
    }

    #[test]
    fn missing_destination_error_does_not_disclose_path() {
        let dir = tempfile::tempdir().unwrap();
        let missing = dir.path().join("missing");
        let path = missing.join("report.json");
        let report = analyze_text("hello", AnalysisOptions::default());
        let error = write_report(&path, &report, "json").unwrap_err();
        assert!(matches!(error, AppError::MissingDestination));
        assert!(!error
            .to_string()
            .contains(missing.to_string_lossy().as_ref()));
    }
}

# Changelog

All notable TextLens changes are documented here.

## [Unreleased]

### Added

- Unique-word and longest-word metrics in analysis results and exported reports.
- Versioned settings backup/restore with strict validation and a 64 KiB safety limit.
- Repeatable configurable analyzer benchmark iterations.
- Validated JSON report import with a 512 KiB safety limit and explicit schema compatibility checks.
- Local comparison between the current analysis and a previously exported TextLens report.
- Local keyword-exclusion lists that filter keyword summaries without changing core counts or n-grams.
- Searchable keyboard-first Quick actions palette for common workspace operations.
- Opt-in recent-file metadata history storing only display filename, size, and opened timestamp, capped at 10 entries.
- Per-entry removal and clear-all controls for recent-file metadata; disabling the setting clears the history.
- Checked-in multilingual and difficult-punctuation fixtures for repeatable regression coverage.
- Frontend unit coverage for report comparison, Quick actions filtering, recent-file metadata validation, and keyword-exclusion settings parsing.
- Rust regression coverage for report import validation, legacy schema compatibility, settings exclusions, keyword filtering, multilingual text, punctuation handling, and private-path error redaction.

### Changed

- New analyses now emit report schema v2 so vocabulary metrics have an explicit compatibility boundary.
- Legacy schema-v1 report JSON remains importable; vocabulary deltas unavailable in v1 are omitted from comparisons instead of being fabricated.
- Encoding diagnostics now flag undefined Windows-1252 bytes and replace them safely.
- The desktop workspace now surfaces vocabulary metrics alongside the existing live counts.
- Settings backups remain schema-v1 compatible while defaulting newer preferences for older backups.

### Security

- Imported report metadata, frequencies, sizes, schema versions, and numeric relationships are validated before presentation.
- Report comparison operates on aggregate exported report data and never attempts to reconstruct source document text.
- Recent-file history is disabled by default, never stores full paths, rejects path-like display names, and is erased when the preference is disabled.
- Missing report/settings export destination errors no longer retain or echo the private directory path.

## [0.1.0] - 2026-08-19

### Added

- Rust + Tauri 2 desktop architecture.
- Unicode-aware word and grapheme analysis.
- Character, byte, sentence, paragraph, and line counts.
- Configurable reading and speaking time estimates.
- Keyword, bigram, and trigram frequency summaries.
- Whitespace and LF/CRLF/CR diagnostics.
- UTF-8 and UTF-16 BOM handling with labelled Windows-1252 fallback.
- Large-file streaming for UTF-8 and Windows-1252 inputs.
- JSON and Markdown export that excludes source document text.
- Responsive light/dark/system UI and reduced-motion preference.
- Settings, onboarding, About, support, and funding UI.
- Rust unit/integration/property tests and TypeScript unit tests.
- CI, security scanning, dependency updates, release automation, and documentation.

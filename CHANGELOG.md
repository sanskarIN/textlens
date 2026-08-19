# Changelog

All notable TextLens changes are documented here.

## [Unreleased]

### Added

- Unique-word and longest-word metrics in analysis results and exported reports.
- Versioned settings backup/restore with strict validation and a 64 KiB safety limit.
- Repeatable configurable analyzer benchmark iterations.

### Changed

- Encoding diagnostics now flag undefined Windows-1252 bytes and replace them safely.
- The desktop workspace now surfaces vocabulary metrics alongside the existing live counts.

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

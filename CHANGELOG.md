# Changelog

All notable TextLens changes are documented here.

## [Unreleased]

No user-visible changes have been added after the 2.0.12 source milestone yet.

## [2.0.12] - 2026-08-19

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
- Reusable local analysis presets for reading/speaking rates, result limits, and keyword exclusions, bounded to 12 device-local presets.
- Privacy-safe Markdown export customization for source metadata, core metrics, keywords, bigrams, trigrams, and whitespace diagnostics.
- Dependency-free release version consistency check covering npm, Cargo, and Tauri metadata, enforced in CI.
- Release-tag guard that rejects `vX.Y.Z` tags that do not match the application version before packaging starts.
- Deterministic SHA-256 release-artifact checksum generator and strict checksum-manifest verifier.
- Failure-safe local-storage boundary plus a session-only memory fallback for blocked or unavailable WebView storage.
- Guarded application startup that renders a local recovery view rather than leaving a blank window when initialization fails.
- Manual Settings update section that opens the official GitHub Releases page only when requested and performs no background update check.
- Checked-in multilingual and difficult-punctuation fixtures for repeatable regression coverage.
- Deterministic malformed UTF-8, UTF-16 boundary, and Windows-1252 byte fixtures wired into Rust decoding tests.
- Frontend unit coverage for report comparison, Quick actions filtering, recent-file metadata validation, keyword-exclusion settings parsing, analysis preset validation/persistence behavior, Markdown export-option parsing, and failure-safe storage helpers.
- Rust regression coverage for report import validation, legacy schema compatibility, settings exclusions, keyword filtering, multilingual text, punctuation handling, deterministic encoding-boundary fixtures, custom Markdown rendering, and private-path error redaction.
- Stable report-schema compatibility contract in `docs/report-schema.md`.
- Regression guard freezing `CURRENT_REPORT_VERSION` at schema v2 unless an explicit compatibility decision is made.

### Changed

- Application version is synchronized to 2.0.12 across npm, Cargo, and Tauri metadata.
- New analyses continue to emit report schema v2; application version 2.0.12 does not change report-schema semantics.
- Legacy schema-v1 report JSON remains importable; vocabulary deltas unavailable in v1 are omitted from comparisons instead of being fabricated.
- Encoding diagnostics flag undefined Windows-1252 bytes and replace them safely.
- The desktop workspace surfaces vocabulary metrics alongside the existing live counts.
- Settings backups remain schema-v1 compatible while defaulting newer preferences for older backups.
- Analysis-option validation is shared by ordinary settings and local presets so both paths enforce the same bounds.
- Existing Markdown export entry points open the same section picker; JSON export remains a complete canonical report.
- The About dialog resolves the packaged application version at runtime instead of relying on a copied release number as its source of truth.
- Settings, recent-file metadata, and analysis presets share exception-contained storage helpers instead of calling WebView persistence independently.
- Frontend boot flows through a single startup module so storage fallback and optional UI modules initialize in a deterministic order.

### Security

- Imported report metadata, frequencies, sizes, schema versions, and numeric relationships are validated before presentation.
- Report comparison operates on aggregate exported report data and never attempts to reconstruct source document text.
- Recent-file history is disabled by default, never stores full paths, rejects path-like display names, and is erased when the preference is disabled.
- Analysis presets never contain source text, file paths, reports, recent-file entries, or unrelated privacy/appearance settings; persisted preset values are bounded and validated before use.
- Markdown customization can omit source metadata, and raw source document text is never offered as an export option.
- Missing report/settings export destination errors no longer retain or echo the private directory path.
- Persistent-storage failures no longer escape as uncaught application errors from settings/recent/preset persistence paths.
- Release checksum verification rejects unsafe paths, duplicate entries, missing artifacts, extra artifacts, malformed manifests, and digest mismatches.

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

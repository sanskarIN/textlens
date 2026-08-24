# Changelog

All notable TextLens changes are documented here.

## [Unreleased]

No changes have been added after the 2.0.13 source milestone yet.

## [2.0.13] - 2026-08-24

### Added

- Dependency-free `release:readiness` preflight requiring reviewed npm and Cargo lockfiles before tagged native packaging.
- SHA-256 lockfile fingerprint output for release-candidate evidence.
- Machine-readable release build evidence containing allowlisted runner, repository, toolchain, build-status, and dependency-lock metadata.
- Manually dispatched three-platform Release Candidate Audit workflow for clean Ubuntu, Windows, and macOS quality/bundle evidence.
- Ubuntu release-mode benchmark capture in the Release Candidate Audit workflow.
- `docs/release-evidence.md` defining what automated release evidence proves and which release claims still require manual verification.
- Dependency-advisory triage rules for RustSec vulnerability/unsoundness and unmaintained-package findings.

### Changed

- Application version is synchronized to 2.0.13 across npm, Cargo, and Tauri metadata.
- Tagged release frontend installation now uses `npm ci` rather than resolving a fresh dependency graph with `npm install`.
- Tagged releases verify Cargo manifest/lock alignment with `cargo metadata --locked` before Tauri packaging.
- Tagged release matrix jobs upload build-evidence JSON after packaging attempts, including failed attempts when the evidence writer can run.
- Release checklist now records reviewed dependency locks, lock fingerprints, Release Candidate Audit runs, per-platform evidence, open advisories, native accessibility, signing/notarization, screenshots, and final checksums.
- `SECURITY.md` now identifies 2.0.x as the current supported line instead of the obsolete 0.1.x-only statement.
- Report schema remains v2; application version 2.0.13 does not change report-schema semantics or legacy schema-v1 import compatibility.

### Security

- Tagged binary packaging is intentionally blocked while reviewed `package-lock.json` and `src-tauri/Cargo.lock` files are absent or malformed.
- Release guidance now requires unresolved release-relevant RustSec advisories to remain visible until the locked dependency path and upstream remediation are understood.
- Vulnerability, memory-safety, and unsoundness advisories are treated as release-review blockers unless patched or supported by a documented technical non-applicability assessment.
- Unmaintained-package advisories require dependency-path and upstream migration review and must not be suppressed merely to make automation green.
- Release build evidence uses an explicit metadata allowlist and does not read analyzed documents, reports, settings, signing secrets, credentials, or arbitrary environment variables.

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
- Dependency-free release version consistency check covering npm, Cargo, Tauri, README release identity, changelog release identity, and version-specific source milestone notes.
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
- Encoding heuristics were re-audited for 2.0.12 and the deterministic UTF BOM/valid UTF-8/labelled Windows-1252 fallback policy was intentionally retained instead of adding unproven statistical guessing.
- The desktop workspace surfaces vocabulary metrics alongside the existing live counts.
- Settings backups remain schema-v1 compatible while defaulting newer preferences for older backups.
- Analysis-option validation is shared by ordinary settings and local presets so both paths enforce the same bounds.
- Existing Markdown export entry points open the same section picker; JSON export remains a complete canonical report.
- The About dialog resolves the packaged application version at runtime instead of relying on a copied release number as its source of truth.
- Settings, recent-file metadata, and analysis presets share exception-contained storage helpers instead of calling WebView persistence independently.
- Frontend boot flows through a single startup module so storage fallback and optional UI modules initialize in a deterministic order.
- CI and release workflows run dependency-free release identity checks before dependency/toolchain setup so metadata/document drift fails fast.

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

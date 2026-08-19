# Architecture

## Goals

TextLens is a modular desktop application with a pure analysis core, a narrow native boundary, and a lightweight UI. The architecture is optimized for offline privacy, testability, predictable large-file behavior, and explicit compatibility boundaries.

## Layers

### Domain (`src-tauri/src/domain`)

- `models.rs` defines serializable report structures, the current report schema version, and validated analysis options.
- `analyzer.rs` owns counting, Unicode word segmentation, vocabulary metrics, keyword filtering, frequencies, n-grams, timing estimates, and diagnostics.
- `AnalysisAccumulator` serves both one-shot and line-oriented streaming analysis.

The domain does not know about Tauri windows, dialogs, or filesystem paths.

### Infrastructure

`fileio.rs` validates selected files, handles conservative encoding detection/decoding, and selects memory or streaming analysis.

`report.rs` owns privacy-safe JSON/Markdown export, atomic replacement, bounded JSON report import, schema compatibility checks, and imported-report validation.

`settings_backup.rs` owns the versioned preferences-only backup format, size limits, range validation, keyword-exclusion validation, and local atomic replacement behavior.

### Application boundary

`commands.rs` exposes only the operations needed by the UI:

- `analyze_text`
- `analyze_file`
- `export_report`
- `import_report`
- `export_settings`
- `import_settings`

Potentially blocking filesystem work runs through Tauri's blocking runtime.

### UI

The TypeScript UI renders the editor, metrics, keyword/n-gram lists, diagnostics, local settings, reusable analysis presets, opt-in recent-file metadata, report comparison, Quick actions, About, support, and funding links. It does not maintain a second analysis algorithm.

Pure helpers under `src/lib` provide independently testable presentation and local-state behavior:

- `format.ts` — numeric, byte, and duration formatting.
- `presentation.ts` — safe display helpers and metric rows.
- `comparison.ts` — report metric and top-keyword deltas with legacy-schema awareness.
- `quickActions.ts` — deterministic local Quick actions filtering.
- `recentFiles.ts` — bounded, path-free recent-file metadata parsing and storage helpers.
- `presets.ts` — bounded analysis-preset parsing, local persistence, deduplication, application, and deletion helpers.

`presets-ui.ts` owns the settings-dialog preset controls. It writes selected preset values into the existing settings form and submits that form instead of duplicating settings validation or active-document reanalysis behavior.

## Data flow

```text
Typed/pasted text ─────┐
                      ├─> Tauri command ─> domain analyzer ─> report DTO ─> UI
Selected local file ──┘        │
                               └─> file adapter / streaming decoder
                                     │
                                     └─> display name + size ─> optional local metadata history

Report DTO ─> export command ─> JSON or Markdown ─> user-selected local path
Saved JSON report ─> import command ─> size/schema/data validation ─> comparison helper ─> UI

Local preferences ─> settings backup command ─> versioned JSON ─> user-selected path
Versioned JSON ─> restore command ─> strict validation ─> frontend validation ─> local preferences

Analysis settings ─> preset parser ─> bounded local preset storage
Selected preset ─> existing settings form ─> normal save path ─> active analysis refresh

Quick action query ─> pure local filter ─> existing workspace action
```

## Report schema compatibility

The current report schema is v2. Vocabulary metrics introduced after the original schema have an explicit v2 boundary. Rust deserialization keeps schema-v1 reports readable by defaulting those later fields, while the frontend omits unavailable vocabulary deltas instead of interpreting legacy zero defaults as real measurements. Unknown future schemas are rejected.

Report import is deliberately separate from ordinary file analysis. A selected report is parsed as a TextLens aggregate report; it is never fed through the text analyzer.

## Privacy boundary

Raw source text is intentionally absent from `AnalysisReport`. File analysis returns a display filename but not the full source path. Report comparison loads only the aggregate JSON export. Settings backups contain preferences only and are independent from analysis reports. Quick action search is local UI state.

Recent-file history is a separate, opt-in frontend store. It accepts only a display filename, size, and timestamp, is capped at 10 entries, rejects names containing path separators, and is deleted when the preference is disabled. The boolean preference is backup-able; the metadata entries are not.

Analysis presets are another separate local frontend store. A preset contains only a bounded display name and analysis configuration. It cannot contain source text, paths, recent-file entries, reports, theme choice, reduced-motion preference, or the recent-file-history opt-in. Presets are capped at 12 and are not part of the current settings backup schema.

## Keyword exclusions

Keyword exclusions are analysis options derived from local settings. They are normalized and bounded at the Rust boundary. They filter only the final keyword ranking; the complete token stream still drives word/vocabulary metrics and n-grams. This prevents a preference intended for presentation quality from silently redefining core counts.

Preset keyword exclusions pass through the same frontend analysis-option parser as ordinary settings before they are persisted or applied.

## Large-file design

Files above the configured threshold use line-oriented streaming when detected as UTF-8 or Windows-1252. UTF-16 uses full-file decoding in 0.1 because byte-oriented newline scanning can split UTF-16 code units. This correctness-over-memory choice is documented in `docs/performance.md`.

## Extensibility

The analysis report and settings backup each include an explicit version boundary. Future schema changes should be deliberate, tested against older fixtures, and documented. New analysis behavior belongs in domain modules rather than command/UI code. New Quick actions must invoke established application behavior instead of duplicating it.

New local persistence must be privacy-reviewed before introduction: record only fields required by a coherent feature, set explicit bounds, provide clear/delete behavior, and prefer opt-in when metadata can reveal user activity.

## ADRs

- ADR-0001: Rust + Tauri modular monolith.
- ADR-0002: Offline-first privacy boundary.
- ADR-0003: Conservative encoding strategy.
- ADR-0004: Versioned settings backups.
- ADR-0005: Versioned report import and comparison.
- ADR-0006: Local keyword exclusions.
- ADR-0007: Keyboard-first Quick actions.
- ADR-0008: Opt-in recent file metadata.
- ADR-0009: Local analysis presets.

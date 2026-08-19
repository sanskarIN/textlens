# Architecture

## Goals

TextLens is a modular desktop application with a pure analysis core, a narrow native boundary, and a lightweight UI. The architecture is optimized for offline privacy, testability, and predictable large-file behavior.

## Layers

### Domain (`src-tauri/src/domain`)

- `models.rs` defines serializable report structures and validated analysis options.
- `analyzer.rs` owns counting, Unicode word segmentation, vocabulary metrics, frequencies, n-grams, timing estimates, and diagnostics.
- `AnalysisAccumulator` serves both one-shot and line-oriented streaming analysis.

The domain does not know about Tauri windows, dialogs, or filesystem paths.

### Infrastructure

`fileio.rs` validates selected files, handles conservative encoding detection/decoding, and selects memory or streaming analysis.

`report.rs` renders privacy-safe JSON/Markdown and uses temporary-file + rename export.

`settings_backup.rs` owns the versioned preferences-only backup format, size limits, range validation, and local atomic replacement behavior.

### Application boundary

`commands.rs` exposes only the operations needed by the UI:

- `analyze_text`
- `analyze_file`
- `export_report`
- `export_settings`
- `import_settings`

Potentially blocking filesystem work runs through Tauri's blocking runtime.

### UI

The TypeScript UI renders the editor, metrics, keyword/n-gram lists, diagnostics, local settings, About, support, and funding links. It does not maintain a second analysis algorithm. Pure formatting and presentation helpers live under `src/lib` so they can be tested without a WebView.

## Data flow

```text
Typed/pasted text ─────┐
                      ├─> Tauri command ─> domain analyzer ─> report DTO ─> UI
Selected local file ──┘        │
                               └─> file adapter / streaming decoder

Report DTO ─> export command ─> JSON or Markdown ─> user-selected local path

Local preferences ─> settings backup command ─> versioned JSON ─> user-selected path
Versioned JSON ─> restore command ─> strict validation ─> frontend validation ─> local preferences
```

## Privacy boundary

Raw source text is intentionally absent from `AnalysisReport`. File analysis returns a display filename but not the full source path. Settings backups contain preferences only and are independent from analysis reports.

## Large-file design

Files above the configured threshold use line-oriented streaming when detected as UTF-8 or Windows-1252. UTF-16 uses full-file decoding in 0.1 because byte-oriented newline scanning can split UTF-16 code units. This correctness-over-memory choice is documented in `docs/performance.md`.

## Extensibility

The analysis report and settings backup each include an explicit version boundary. Future schema changes should be deliberate and documented. New analysis behavior belongs in domain modules rather than command/UI code.

## ADRs

- ADR-0001: Rust + Tauri modular monolith.
- ADR-0002: Offline-first privacy boundary.
- ADR-0003: Conservative encoding strategy.
- ADR-0004: Versioned settings backups.

# Architecture

## Goals

TextLens is a local-first cross-platform application with a shared UI, explicit platform boundaries, stable report compatibility, failure-safe local persistence, and testable analysis logic.

The architecture targets Windows, macOS, Linux, Android, iOS/iPadOS, Web/PWA, and ChromeOS through the PWA without pretending that every platform exposes desktop filesystem semantics.

See [platforms.md](platforms.md) and [ADR-0012](adr/0012-portable-cross-platform-runtime.md).

## Runtime overview

```text
                              Shared TypeScript/Vite UI
                                        │
                   ┌────────────────────┴────────────────────┐
                   │                                         │
           Native desktop mode                       Portable mode
        Windows / macOS / Linux                Web / PWA / Android / iOS
                   │                                         │
         real Tauri JS modules                      Vite module aliases
                   │                                         │
               Tauri IPC                              browser-safe APIs
                   │                                         │
        Rust backend implementation                 src/platform/*
```

The UI imports one logical set of operations. Vite decides which implementation is bundled:

- normal desktop builds use the real `@tauri-apps/*` modules;
- `web` and `mobile` modes alias the Tauri-facing modules to `src/platform/` adapters.

This keeps platform selection at build time instead of scattering runtime platform checks throughout the UI.

## Native desktop layers

### Domain (`src-tauri/src/domain`)

- `models.rs` defines serializable report structures, the report schema version, and validated analysis options.
- `analyzer.rs` owns counting, Unicode word segmentation, vocabulary metrics, keyword filtering, frequencies, n-grams, timing estimates, and diagnostics.
- `AnalysisAccumulator` serves one-shot and line-oriented streaming analysis.

The domain does not depend on Tauri windows, dialogs, or filesystem paths.

### Infrastructure

`fileio.rs` validates desktop-selected files, handles conservative encoding detection/decoding, and selects memory or streaming analysis.

`report.rs` owns privacy-safe JSON/Markdown export, atomic replacement, bounded JSON report import, schema compatibility checks, and imported-report validation.

`settings_backup.rs` owns the versioned preferences-only backup format, size limits, range validation, keyword-exclusion validation, and local atomic replacement behavior.

### Tauri application boundary

`commands.rs` exposes only operations required by the UI:

- `analyze_text`
- `analyze_file`
- `export_report`
- `import_report`
- `export_settings`
- `import_settings`

Potentially blocking desktop filesystem work runs through Tauri's blocking runtime.

`src-tauri/src/lib.rs` is already mobile-entry compatible, but Android/iOS frontend bundles deliberately use portable file semantics rather than passing mobile document-provider values into desktop-oriented `std::fs` workflows.

## Portable Web/mobile runtime

`src/platform/` contains the browser-safe implementation used by `web` and `mobile` Vite modes.

### `web-analyzer.ts`

Implements the portable analysis contract locally in TypeScript:

- words and unique words;
- longest-word characters;
- characters and graphemes;
- byte count;
- sentence, paragraph, and line counts;
- reading/speaking estimates;
- keyword exclusions;
- keyword, bigram, and trigram ranking;
- whitespace and line-ending diagnostics.

It emits report schema v2 so the shared presentation/comparison code receives the same DTO shape as the native Rust path.

### `web-tauri-core.ts`

Provides the portable equivalent of the Tauri command calls used by the UI. It owns:

- pasted-text analysis;
- browser/mobile file analysis;
- report import/export;
- settings backup/restore;
- portable input bounds and basic compatibility validation.

Portable source files are bounded to 64 MiB and analyzed in memory. Report imports stay bounded to 512 KiB and settings backups to 64 KiB.

### `web-dialog.ts` and `web-file-store.ts`

Translate the application's open/save workflow into sandboxed browser file selection and local download tokens. The original source path is never required or retained.

### `web-opener.ts`

Provides explicit user-initiated external navigation with a small protocol allowlist.

### `web-app.ts`

Returns the application version from `package.json` so the browser/mobile About UI does not depend on packaged Tauri metadata and does not introduce a second copied version literal.

## Frontend startup boundary

`startup.ts` is the single browser/WebView entry point loaded by `index.html`.

It:

- probes local preference storage before main modules are imported;
- installs a process-local memory fallback when persistent storage is unusable;
- loads the shared main UI;
- loads mobile/safe-area CSS;
- mounts optional preset, version, and manual-update modules;
- registers the service worker only in `web` mode;
- catches initialization failures and renders a local recovery state.

The Tauri `mobile` mode does not register the PWA service worker.

## Shared UI and helpers

`src/main.ts` renders the editor, metrics, keyword/n-gram lists, diagnostics, settings, report comparison, Quick actions, About, support, and funding links.

Platform-specific behavior is kept behind imported operations rather than embedded in rendering logic.

Pure helpers under `src/lib` remain independently testable:

- `format.ts` — numeric, byte, and duration formatting;
- `presentation.ts` — safe display helpers and metric rows;
- `comparison.ts` — report metric and top-keyword deltas with legacy-schema awareness;
- `quickActions.ts` — deterministic local Quick actions filtering;
- `storage.ts` — exception-contained local storage and session fallback;
- `recentFiles.ts` — bounded, path-free recent metadata;
- `presets.ts` — bounded local analysis presets;
- `reportExportOptions.ts` — Markdown section choices and persistence.

`presets-ui.ts`, `report-export-ui.ts`, `app-version-ui.ts`, and `updates-ui.ts` add focused UI behavior around the shared main application.

## Data flow

### Desktop

```text
Typed/pasted text ─────┐
                      ├─> Tauri command ─> Rust analyzer ─> report DTO ─> UI
Selected local file ──┘        │
                               └─> Rust file adapter / streaming decoder
```

### Web/PWA/mobile portable mode

```text
Typed/pasted text ─────┐
                      ├─> portable invoke adapter ─> TS analyzer ─> report DTO ─> UI
Selected sandbox file ─┘             │
                                     └─> TextDecoder + in-memory file adapter
```

### Shared report/settings flow

```text
Report DTO ─> export operation ─> canonical JSON or customized Markdown
Saved TextLens JSON ─> bounded import ─> compatibility checks ─> comparison helper ─> UI
Local preferences ─> failure-safe local storage
Local preferences ─> settings backup operation ─> versioned JSON
Analysis settings ─> preset parser ─> bounded local preset storage
```

## Report schema compatibility

Application version **2.0.12** and report schema **v2** are independent version spaces.

Desktop Rust and the portable runtime both emit schema v2. Schema-v1 reports remain a compatibility input. Unknown future schemas are rejected rather than guessed.

The canonical compatibility rules are documented in [report-schema.md](report-schema.md), and the Rust regression guard prevents accidental changes to `CURRENT_REPORT_VERSION` during unrelated version work.

Cross-platform work must not introduce a platform-specific report schema.

## Privacy boundary

Raw source text is intentionally absent from `AnalysisReport`.

Desktop file analysis returns display filename/size without exposing the full path in the report. Portable file analysis uses sandboxed file objects and also returns display filename/size only.

Report comparison loads aggregate report data. Settings backups contain preferences only. Presets contain analysis configuration only. Recent-file metadata is opt-in, path-free, bounded, and clearable.

Persistent local storage is optional infrastructure. If it fails, TextLens may fall back to memory for the session; it never uploads preferences or document content as a recovery mechanism.

The update link is manual. There is no background release poll.

The PWA service worker caches the application shell and same-origin application assets. It does not receive source documents from the analyzer and does not intentionally cache imported documents or exports.

## Encoding strategy

The native Rust path retains the conservative encoding policy documented in ADR-0003.

The portable adapter mirrors the deterministic high-level policy available through Web APIs:

1. UTF-8 BOM;
2. UTF-16 LE/BE BOM;
3. valid UTF-8;
4. labelled Windows-1252 fallback.

Platform support does not justify adding statistical encoding guesses or cloud detection.

## Large-file behavior

Desktop files above the configured threshold can use the Rust line-oriented streaming path when UTF-8 or Windows-1252 is selected. UTF-16 uses full-file decoding for correctness.

Portable Web/mobile analysis is currently in-memory and has an explicit 64 MiB selected-file bound. This difference is documented rather than hidden behind a misleading claim of identical filesystem behavior.

## PWA architecture

`public/manifest.webmanifest` describes installability. `public/sw.js` provides an application-shell offline cache.

The service worker:

- caches root application assets;
- discovers same-origin built CSS/JS assets from the generated root document;
- uses network-first navigation with cached-root fallback;
- runtime-caches same-origin static assets;
- deletes older TextLens PWA caches during activation.

It does not implement document synchronization or a content database.

## Tauri platform configuration

- `tauri.conf.json` contains shared application identity and desktop defaults.
- `tauri.android.conf.json` selects `npm run dev:mobile` / `npm run build:mobile`.
- `tauri.ios.conf.json` selects the same portable mobile frontend mode.
- `capabilities/default.json` is scoped to Linux/macOS/Windows.
- `capabilities/mobile.json` is scoped to Android/iOS.

## Testing boundary

CI must verify:

```bash
npm run check
npm run lint
npm run format:check
npm run docs:check
npm run test
npm run build
npm run build:web
npm run build:mobile
```

Rust formatting, clippy, and tests run separately. Native mobile signing/device testing remains a platform release gate because Linux CI cannot prove Xcode provisioning, Android signing, store policy compliance, or device-specific behavior.

## Extensibility rules

- Keep rendering/UI platform-neutral where possible.
- Add platform behavior behind adapters rather than user-agent conditionals spread through the application.
- Keep report schema consistent across runtimes.
- Preserve explicit input bounds.
- Do not broaden Tauri capabilities simply to make a platform feature easier.
- New persistence requires a privacy review and bounded clear/delete behavior.
- New portable analysis behavior must have regression coverage and should match the Rust contract where the underlying platform APIs permit it.
- Application version changes must pass `npm run version:check`.

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
- ADR-0010: Markdown report customization.
- ADR-0011: Failure-safe local preference storage.
- ADR-0012: Portable cross-platform runtime.

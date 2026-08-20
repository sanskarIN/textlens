# TextLens Privacy

## Summary

TextLens analyzes text locally on the device running the application. Core analysis requires no TextLens account, analytics service, advertising SDK, or cloud text-processing API.

The supported source runtimes are Windows, macOS, Linux, Android, iOS/iPadOS, and Web/PWA (including ChromeOS through the PWA). Their file APIs differ, but the privacy boundary is the same: analyzed source text is processed locally and is not intentionally uploaded to a TextLens backend.

## Data handled

TextLens may process:

- typed or pasted text;
- a local/sandboxed file you explicitly select;
- local analysis settings;
- reusable local analysis presets;
- optional recent-file metadata you explicitly enable;
- saved aggregate reports you explicitly select for comparison;
- reports or settings backups you explicitly export.

## Pasted text

### Native desktop runtime

On Windows, macOS, and Linux, pasted text crosses only the local Tauri IPC boundary to the bundled Rust backend for analysis.

### Web/PWA and mobile portable runtime

On Web/PWA and the Android/iOS portable frontend, pasted text is analyzed directly in the local WebView/browser JavaScript runtime.

Neither path intentionally transmits pasted text to an external analysis server.

## Opened files

Files are accessed only after explicit selection.

Desktop builds use the Rust file layer. Compatible large desktop files can be processed incrementally rather than retained in full.

Web/PWA and mobile portable builds use sandboxed platform/browser file objects and analyze selected files in memory with a 64 MiB source-file limit. This path does not require or retain an arbitrary desktop filesystem path.

Analysis results store at most the display filename and size, not the full source path.

## Encoding

The native and portable runtimes use deterministic local decoding behavior. The portable runtime recognizes UTF-8 BOM, UTF-16 LE/BE BOM, valid UTF-8, and otherwise uses a labelled Windows-1252 fallback.

No source sample is sent to an online encoding-detection service.

## Settings

Theme, reading/speaking rates, result limits, keyword exclusions, recent-file-metadata opt-in, and reduced-motion preferences are stored in local browser/WebView application storage where available.

Keyword exclusions are preferences only. They filter the keyword summary while core counts and n-grams continue to use the complete analyzed token stream.

TextLens can export a versioned settings backup after explicit interaction. The backup contains preferences only; it does not contain analyzed text, document paths, keyword results, analysis reports, recent-file entries, analysis presets, credentials, or external identifiers.

Restored backups are size-limited and validated before use. Compatible older backups restore newer fields to defined defaults.

### Storage availability

Local persistence is optional infrastructure, not a prerequisite for analysis.

At startup TextLens probes preference storage. When persistent storage is unavailable and a safe local replacement can be installed, TextLens uses a process-local/session-only memory fallback and reports that preferences are not durable.

The fallback is local, is not transmitted anywhere, and disappears when the process/session ends.

If neither persistent storage nor the local fallback can be established, guarded startup renders a local recovery message instead of silently switching to a network service.

## Local analysis presets

Analysis presets are optional local configurations. A preset can contain only:

- a display name;
- reading and speaking rates;
- top-keyword and top-n-gram limits;
- keyword exclusions.

Presets never contain analyzed text, source paths, recent-file entries, reports, encoding samples, credentials, theme choice, reduced-motion preference, or the recent-file-history opt-in.

Preset names/collections are bounded and parsed before use. Presets are device/browser-profile local and are not part of the current settings-backup schema.

## Optional recent-file metadata

Recent-file metadata is **off by default**. If enabled, TextLens stores at most 10 local entries containing only:

- display filename;
- analyzed file size;
- opened timestamp.

Full file paths, directory names, source text, keyword results, encoding samples, and report contents are not stored in this history. Path-like display names are rejected before storage.

Recent-file controls allow per-entry removal and clear-all. Turning the feature off or restoring defaults deletes stored recent metadata when local persistence is available.

The history is informational and does not retain enough path/provider information to reopen a file automatically.

## Analysis exports

Reports are created only after explicit export interaction. They contain aggregate metrics/frequencies, report schema version, encoding diagnostics when applicable, and at most display filename metadata.

They intentionally omit the original source document content and full path.

JSON exports remain complete canonical TextLens analysis reports because JSON is used for validated import/comparison. Markdown exports can omit source metadata, core metrics, keywords, bigrams, trigrams, or whitespace diagnostics.

The original document text is never an export option.

Markdown section choices are UI state rather than a source-document history record.

## Saved-report comparison

When **Compare report** is used, TextLens reads only the report selected by the user. Imported reports are size-limited and validated locally before presentation.

Comparison operates on aggregate counts and exported frequency data. It does not open, request, reconstruct, or persist the original source document.

The imported baseline is kept only as local application state for the comparison workflow; TextLens does not create a cloud report-history service.

## PWA and service-worker storage

The Web/PWA build can register `public/sw.js` so the application shell can relaunch offline after its static assets have been fetched.

The service worker is intended to cache:

- the application root/shell;
- the manifest/logo;
- same-origin JavaScript/CSS/static application assets.

It is not passed analyzed document contents by the analyzer and does not intentionally cache imported source files, report contents, settings backups, or generated exports.

A hosted PWA necessarily downloads its static application files from the host. After those assets load, text analysis occurs locally.

## Mobile platform storage and sharing

Android and iOS/iPadOS builds use the portable local runtime for document workflows rather than treating mobile document-provider values as ordinary desktop paths.

The user remains responsible for the destination/provider chosen when exporting or sharing a generated local file. Once a file is handed to an operating-system share/save provider or another application, that provider/application's privacy behavior applies.

TextLens does not attach analyzed source text to the external Releases, GitHub, or funding URLs.

## Quick actions

Quick action search terms are local UI state used only to filter built-in actions. They are not stored as analytics or transmitted to a TextLens backend.

## Updates and external links

TextLens does not poll an update server in the background.

The Settings update section opens the official GitHub Releases page only after explicit user interaction. GitHub source and Buy Me a Coffee links likewise open only after explicit interaction.

Opening an external page transfers control to the browser/operating system, where that site's own privacy practices apply.

## Network behavior

Core analysis, presets, settings backup/restore, report export customization, report comparison, keyword exclusions, recent-file metadata, Quick actions, and startup recovery do not require a TextLens backend.

A Web/PWA deployment uses network access to fetch its static application assets when they are not already available locally. Tauri mobile/desktop packaging can also open user-requested external links. These behaviors are separate from document analysis.

## Logging

Production code must never log raw analyzed text, full private document paths, imported report contents, credentials, authentication data, or other sensitive content.

Native analysis logging is limited to operation/aggregate diagnostics and must not include private source content. Portable analysis does not add a remote telemetry endpoint.

## Retention

TextLens has no cloud document-retention system.

Clear the editor to remove its current visible value. Restore default Settings to replace local preferences with defaults and clear recent-file metadata when persistence is available. Delete analysis presets individually or clear application/browser storage. Exported reports/settings backups remain wherever the user or operating-system provider saved them until the user deletes them.

For a PWA, uninstalling the app may not automatically clear all browser site data; browser/site-storage controls govern that data lifecycle.

## Contact

Privacy questions: `sanskarin@outlook.in`

Security vulnerabilities: see `SECURITY.md`.

**Made by the Sanskar**

# TextLens Privacy

## Summary

TextLens analyzes text locally on your computer. Core functionality requires no account, analytics service, advertising SDK, or cloud text-processing API.

## Data handled

TextLens may process typed/pasted text, local files you explicitly select, local analysis settings, saved aggregate reports you explicitly select for comparison, and reports or settings backups you explicitly export.

## Pasted text

Pasted text crosses only the local Tauri IPC boundary to the bundled Rust backend for analysis. It is not intentionally transmitted to an external server.

## Opened files

The Rust backend reads the file you choose. Compatible large files are processed incrementally rather than retained in full. The analysis result stores at most the display filename, not the full source path.

## Settings

Theme, reading/speaking rates, result limits, keyword exclusions, and reduced-motion preferences are stored locally in WebView application storage.

Keyword exclusions are preferences only. They filter the displayed/exported keyword summary while core counts and n-grams continue to use the complete analyzed token stream.

TextLens can export a versioned settings backup when you explicitly choose **Back up settings**. That backup contains preferences only; it does not contain analyzed text, document paths, keyword results, analysis reports, credentials, or identifiers. Restored backups are size-limited and strictly validated before use. Older compatible settings backups that do not contain keyword exclusions restore with an empty exclusion list.

## Analysis exports

Reports are written only to a destination you choose. They contain aggregate metrics/frequencies, a report schema version, encoding diagnostics when applicable, and at most a display filename. They intentionally omit the original source document content and full path.

## Saved-report comparison

When you choose **Compare report**, TextLens reads only the JSON report file you select. Imported reports are size-limited and validated locally before presentation. Comparison operates on aggregate counts and exported top-keyword entries. It does not open, request, reconstruct, or persist the original source document.

The imported baseline report exists in application memory only for the comparison operation/dialog. TextLens does not create a cloud or local history database from compared reports.

## Quick actions

Quick action search terms are UI state inside the local WebView. They are used only to filter the built-in list of actions and are not stored or transmitted.

## Network behavior

Core analysis, settings backup/restore, report comparison, keyword exclusions, and Quick actions need no network. GitHub and Buy Me a Coffee links open only after explicit user interaction.

## Logging

Production code must never log raw analyzed text, full private document paths, imported report contents, credentials, authentication data, or other sensitive content. Current analysis logging records operation names and aggregate input byte counts only; file/report/settings operations log operation names without paths.

## Retention

There is no cloud retention system. Clear the editor to remove its current value; restore default Settings to replace local preferences with defaults. Any report or settings backup you save is retained at the local filesystem location you selected until you delete it.

## Contact

Privacy questions: `sanskarin@outlook.in`

Security vulnerabilities: see `SECURITY.md`.

**Made by the Sanskar**

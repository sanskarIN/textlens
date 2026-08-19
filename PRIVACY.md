# TextLens Privacy

## Summary

TextLens analyzes text locally on your computer. Core functionality requires no account, analytics service, advertising SDK, or cloud text-processing API.

## Data handled

TextLens may process typed/pasted text, local files you explicitly select, local analysis settings, and reports you explicitly export.

## Pasted text

Pasted text crosses only the local Tauri IPC boundary to the bundled Rust backend for analysis. It is not intentionally transmitted to an external server.

## Opened files

The Rust backend reads the file you choose. Compatible large files are processed incrementally rather than retained in full.

## Settings

Theme, reading/speaking rates, result limits, and reduced-motion preferences are stored locally in WebView application storage.

## Exports

Reports are written only to a destination you choose. They contain aggregate metrics/frequencies and at most a display filename. They intentionally omit the original source document content and full path.

## Network behavior

Core analysis needs no network. GitHub and Buy Me a Coffee links open only after explicit user interaction.

## Logging

Production code must never log raw analyzed text, full private document paths, credentials, authentication data, or other sensitive content.

## Retention

There is no cloud retention system. Clear the editor to remove its current value; reset Settings to replace local preferences with defaults.

## Contact

Privacy questions: `sanskarin@outlook.in`

Security vulnerabilities: see `SECURITY.md`.

**Made by the Sanskar**

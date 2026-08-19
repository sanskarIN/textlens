# ADR 0011: Failure-safe local preference storage

- Status: Accepted
- Date: 2026-08-19

## Context

TextLens intentionally keeps preferences and optional metadata in the local WebView instead of using a remote account. Browser-style storage APIs can still fail at runtime because storage is blocked, unavailable, corrupted, or out of quota. A storage exception must not crash the desktop app or convert an optional convenience feature into a requirement for text analysis.

## Decision

TextLens uses a small storage boundary in `src/lib/storage.ts`.

- Reads return a safe absence result when storage cannot be accessed.
- Writes/removals return success/failure instead of allowing storage exceptions to escape.
- Settings, recent-file metadata, and analysis presets share the same boundary.
- Startup probes persistent storage before the main UI is imported.
- If persistent storage is unusable and the WebView permits a replacement, TextLens installs an in-memory session store so existing UI code can continue to operate safely.
- If even that fallback cannot be installed, the guarded startup boundary catches initialization failure and renders a local recovery screen instead of leaving a blank window.
- Session fallback never changes the privacy model: it contains only the same bounded preference/metadata values that would otherwise be stored locally and disappears when the process ends.

## Consequences

Text analysis remains independent from preference persistence. A storage outage can reduce persistence convenience, but it does not justify network fallback, telemetry, account creation, or uploading document content.

The application communicates when preferences are session-only. Persistent-storage failures must remain generic; they must not expose document text, private file paths, or storage internals.

## Verification

Regression coverage in `src/lib/storage.test.ts` exercises normal storage, unavailable storage, and throwing storage implementations. The startup path is routed through `src/startup.ts` so the fallback is installed before modules containing legacy direct `localStorage` access are evaluated.

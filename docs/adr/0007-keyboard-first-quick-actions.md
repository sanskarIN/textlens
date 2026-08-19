# ADR-0007 — Keyboard-first Quick actions

- Status: Accepted
- Date: 2026-08-19

## Context

TextLens has several common desktop actions—focus editor, open a file, export, compare, and open settings/About. A growing toolbar would add visual clutter, while keyboard users benefit from a discoverable command surface.

## Decision

1. Provide a local searchable Quick actions dialog in the TypeScript UI.
2. Open it from the top navigation or `Ctrl/Cmd + Shift + P`.
3. Keep action filtering in a small pure helper (`src/lib/quickActions.ts`) with unit tests.
4. Search matches all whitespace-separated query terms against an action's label and static keywords, case-insensitively.
5. Actions that require a current analysis remain visible but disabled when no report exists, preserving discoverability without allowing invalid operations.
6. Quick actions invoke the same existing functions as visible controls; they do not create a second implementation of file, export, settings, or comparison behavior.
7. No action data or search query leaves the local WebView.

## Consequences

- Keyboard-first workflows improve without crowding the primary workspace.
- Action availability remains consistent with regular controls.
- Search logic is deterministic, offline, and independently testable.
- New Quick actions should reuse established application functions and be added to the searchable definition list rather than duplicating behavior.

# ADR-0008 — Opt-in recent file metadata

- Status: Accepted
- Date: 2026-08-19

## Context

A recent-file list can improve continuity for desktop users, but storing full file paths or source content would weaken TextLens's privacy-first defaults. Reopening a file also requires retaining a path, which is intentionally outside this feature's privacy boundary.

## Decision

1. Recent-file metadata is disabled by default.
2. When explicitly enabled, TextLens stores at most 10 entries containing only:
   - the display filename returned by the Rust analysis result;
   - the analyzed file size;
   - the local opened timestamp.
3. Full paths, directory names, document text, report contents, keyword results, and encoding samples are never stored in recent-file history.
4. Display names containing path separators are rejected by the frontend metadata parser as a defense-in-depth privacy check.
5. Individual entries can be removed and the entire history can be cleared from the workspace.
6. Disabling the preference immediately deletes the stored metadata history. Restoring defaults also deletes it.
7. Settings backup stores only the boolean opt-in preference, not the recent-file entries themselves.
8. The list is informational only; entries are not reopen links because reopening would require retaining a filesystem path.

## Consequences

- Users can opt into lightweight continuity without creating a path history database.
- The feature cannot reopen a historical file directly; users must choose the file again through the native file dialog.
- Two files with the same display filename are intentionally indistinguishable and collapse to the newest metadata entry because directory identity is not retained.
- Privacy-sensitive users receive no history storage unless they explicitly enable it.

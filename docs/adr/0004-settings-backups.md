# ADR 0004: Versioned settings backups

- Status: Accepted
- Date: 2026-08-19

## Context

TextLens stores small user preferences locally. The application should support portable backup and restore without including analyzed documents or local activity history.

## Decision

TextLens uses a small versioned JSON backup handled by the Rust backend.

- The envelope has an explicit format version.
- New backups use schema version `2` after the addition of keyword exclusions and the recent-file-metadata opt-in preference.
- Schema version `1` remains readable; newer fields use privacy-preserving defaults when absent.
- Version `0` and unknown future versions are rejected instead of guessed.
- Only known fields are accepted.
- Theme, rates, result limits, and keyword exclusions are range/bounds checked.
- Keyword exclusions are limited to 100 entries and 64 Unicode scalar values per entry.
- The recent-file preference is backed up only as a boolean; recent-file metadata entries themselves are never included.
- Backup files are limited to 64 KiB before parsing.
- Writes use a temporary file and replacement strategy to reduce partial-write risk.
- Backups contain preferences only, not source text, source paths, recent-file entries, imported reports, or analysis results.
- Restored values are validated again by the frontend before local persistence.

## Consequences

This keeps backups portable, makes malformed input fail safely, preserves migration from schema v1, and gives future schema changes a clear compatibility boundary. Rust and TypeScript settings shapes must remain synchronized and are covered by validation tests and type checking.

Any future settings-backup schema extension must decide whether an older version can safely default the new field. If not, the current schema version must be incremented and compatibility behavior documented here.

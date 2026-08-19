# ADR 0004: Versioned settings backups

- Status: Accepted
- Date: 2026-08-19

## Context

TextLens stores small user preferences locally. The application should support portable backup and restore without including analyzed documents.

## Decision

TextLens uses a small versioned JSON backup handled by the Rust backend.

- The envelope has an explicit format version.
- Only known fields are accepted.
- Theme, rates, and result limits are range-checked.
- Backup files are limited to 64 KiB before parsing.
- Writes use a temporary file and replacement strategy to reduce partial-write risk.
- Backups contain preferences only, not source text, source paths, or analysis results.
- Restored values are validated again by the frontend before local persistence.

## Consequences

This keeps backups portable, makes malformed input fail safely, and gives future schema changes a clear migration boundary. Rust and TypeScript settings shapes must remain synchronized and are covered by validation tests and type checking.

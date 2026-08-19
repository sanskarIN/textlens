# ADR-0003: Conservative encoding detection

- Status: Accepted
- Date: 2026-08-19

## Context

Text files do not always declare their encoding. Statistical guesses can be wrong.

## Decision

Use a deterministic offline policy:

1. Recognize UTF-8 BOM.
2. Recognize UTF-16 LE/BE BOM.
3. Otherwise accept valid UTF-8.
4. Otherwise decode Windows-1252 and set `fallbackUsed`.

Large UTF-16 files use memory decoding in 0.1; streaming is limited to UTF-8 and Windows-1252.

## Consequences

Behavior is predictable and safe for arbitrary bytes, but not every legacy encoding is identified correctly. The fallback is displayed as a fallback rather than certainty.

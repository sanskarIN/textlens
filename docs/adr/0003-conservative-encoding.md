# ADR-0003: Conservative encoding detection

- Status: Accepted
- Date: 2026-08-19
- Reviewed for: TextLens 2.0.12

## Context

Text files do not always declare their encoding. Statistical guesses can be wrong, differ across libraries/platforms, and make offline results harder to reproduce.

## Decision

Use a deterministic offline policy:

1. Recognize UTF-8 BOM.
2. Recognize UTF-16 LE/BE BOM.
3. Otherwise accept valid UTF-8.
4. Otherwise decode Windows-1252 and set `fallbackUsed`.
5. Surface undefined Windows-1252 byte replacements through encoding diagnostics rather than silently presenting the fallback as certain.

Large UTF-16 files continue to use full-file decoding because byte-oriented newline scanning can split UTF-16 code units. Streaming remains limited to compatible UTF-8 and Windows-1252 paths.

## 2.0.12 review decision

The encoding policy was re-audited during the 2.0.12 source milestone. No broader statistical/heuristic detector is being added merely to increase feature count or close a roadmap checkbox.

A future change is appropriate only when it is:

- deterministic for the same byte input;
- fully offline;
- conservative about uncertainty;
- clearly labelled in diagnostics/UI;
- backed by synthetic regression fixtures and measured false-positive/false-negative evidence;
- compatible with the project's privacy and reproducibility goals.

Until those conditions are met by a concrete proposal, retaining the current policy is the completed design decision.

## Consequences

Behavior is predictable and safe for arbitrary bytes, but not every legacy encoding is identified correctly. The Windows-1252 path is displayed as a fallback rather than certainty. The tradeoff intentionally favors reproducibility and transparent uncertainty over broad but opaque statistical guessing.

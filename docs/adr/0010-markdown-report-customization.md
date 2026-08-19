# ADR-0010 — Privacy-safe Markdown report customization

- Status: Accepted
- Date: 2026-08-19

## Context

TextLens exports both JSON and Markdown reports. JSON is also the machine-readable import/comparison format, so allowing arbitrary JSON section omission would create partial documents that look like valid TextLens reports while violating schema invariants. Markdown is a human-readable presentation format and can safely support selective sections as long as raw source text remains excluded.

## Decision

1. Report customization applies to Markdown exports only.
2. JSON exports remain canonical complete `AnalysisReport` documents so import, validation, and comparison behavior stays deterministic.
3. Markdown export options can independently include or omit:
   - source metadata (display filename, analysis mode, and encoding when present);
   - core metrics;
   - keywords;
   - bigrams;
   - trigrams;
   - whitespace and line-ending diagnostics.
4. The report schema marker and TextLens attribution remain present even when every optional section is omitted.
5. Raw source document text is never an export option and is never added to Markdown output.
6. The desktop UI defaults all aggregate sections on, preserving the previous full Markdown report behavior.
7. The export picker keeps selections only in current UI memory. It does not create a new persistent preference or history store.
8. The Rust command boundary accepts a typed optional export-options object. Missing options fall back to the complete Markdown report.
9. Rust deserialization rejects unknown option fields, while the frontend parser defaults malformed local values field-by-field.
10. Existing Markdown entry points—the visible button, Quick actions, and `Ctrl/Cmd + E`—open the same section picker so behavior does not diverge.

## Consequences

- Users can create shorter Markdown reports without changing analysis results or the canonical JSON report format.
- Hiding source metadata can further reduce filename disclosure in a shared Markdown report.
- Imported JSON compatibility remains unchanged.
- There is no way through this feature to include raw document text accidentally.
- Future customizable sections should remain aggregate-only unless a new privacy review explicitly changes the product boundary.

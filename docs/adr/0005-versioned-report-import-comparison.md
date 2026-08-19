# ADR-0005 — Versioned report import and comparison

- Status: Accepted
- Date: 2026-08-19

## Context

TextLens already exports aggregate JSON reports without source document text. Power users benefit from comparing a current analysis with an earlier report, but imported JSON is untrusted input and the report structure has evolved to include vocabulary metrics.

## Decision

1. New analyses emit report schema version `2`.
2. Schema version `1` remains importable for backwards compatibility.
3. Vocabulary metrics added after schema v1 deserialize to zero for legacy reports, but the comparison UI does not present those unavailable values as meaningful deltas.
4. Unknown future schema versions are rejected instead of guessed or partially interpreted.
5. JSON report import is limited to 512 KiB and validates schema version, metadata bounds, frequency bounds, percentages, and basic metric relationships before returning data to the UI.
6. Comparison is performed locally using aggregate report fields only. It never reconstructs or requests the original source text.
7. Markdown remains an export format, not an import format, because its human-readable structure is not treated as a stable machine schema.

## Consequences

- Saved reports become useful local comparison artifacts without creating a document-history database.
- Compatibility behavior is explicit and testable.
- Future schema changes must increment the report version when field meaning or required data changes.
- Import validation is deliberately conservative; malformed, oversized, inconsistent, version-zero, and unknown-future reports fail with user-safe errors.
- A schema-v1 comparison can still compare metrics that existed in that schema, while unavailable vocabulary metrics are omitted.

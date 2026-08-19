# ADR-0006 — Local keyword exclusions

- Status: Accepted
- Date: 2026-08-19

## Context

Keyword-frequency summaries often contain common words that are not useful to a particular user or document type. TextLens needs a customizable exclusion mechanism without changing the meaning of the underlying word count, vocabulary metrics, timing estimates, or n-grams.

## Decision

1. Keyword exclusions are a local preference, stored with the rest of TextLens settings.
2. Exclusions affect only the ranked keyword summary.
3. Word count, unique-word count, longest-word length, reading/speaking estimates, bigrams, and trigrams continue to analyze the full text.
4. Exclusions are normalized using the same lowercase word normalization used by the analyzer before filtering.
5. The frontend accepts comma- or line-separated entries and validates/deduplicates them before persistence.
6. The Rust boundary independently sanitizes and bounds the list to at most 100 entries and at most 64 Unicode scalar values per entry.
7. Settings backup/restore carries the exclusion list. Existing schema-v1 settings backups that predate the field remain readable through a default empty list.

## Consequences

- Users can remove noisy terms from keyword summaries without silently changing core document statistics.
- Settings remain privacy-preserving and offline.
- Both frontend and backend enforce bounded input, preventing an unbounded preference from growing frequency-filtering work or backup size.
- The setting is intentionally not embedded in `AnalysisReport`; the report records analysis results rather than every preference used to produce them.

# ADR-0002: Offline-first privacy boundary

- Status: Accepted
- Date: 2026-08-19

## Context

Users may analyze confidential writing, logs, notes, or source files. A word counter does not require cloud processing.

## Decision

Core TextLens analysis is fully local. No account is required; no text-analysis API is called; raw source text and full file paths are excluded from `AnalysisReport`; export occurs only after explicit user selection; external URLs open only after explicit activation.

## Consequences

Privacy is easier to audit and offline use remains reliable. Features that require source upload are out of scope unless made explicit, optional, and separately reviewed.

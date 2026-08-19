# TextLens Report Schema Compatibility

This document freezes the stable compatibility contract for TextLens JSON analysis reports as of application version **2.0.12**.

## Current schema

- Current emitted report schema: **v2**.
- `CURRENT_REPORT_VERSION` in `src-tauri/src/domain/models.rs` is the implementation source of truth.
- Application version and report-schema version are independent. A TextLens app release may change without changing the report schema.
- Changing the report schema requires an explicit schema-version decision, compatibility tests, migration notes, and documentation updates. Do not bump the schema merely because the application version changes.

## Import support

TextLens 2.0.12 accepts:

- schema v1 reports that match the legacy structure;
- schema v2 reports that satisfy current validation rules.

TextLens rejects:

- schema version `0`;
- schema versions greater than the current supported version;
- malformed JSON;
- reports larger than 512 KiB;
- reports with invalid or inconsistent validated values.

## Schema v1 compatibility

Schema v1 predates the vocabulary metrics added in v2. When importing v1:

- `stats.uniqueWords` may be absent and is treated as unavailable/zero internally;
- `stats.maxWordCharacters` may be absent and is treated as unavailable/zero internally;
- comparison UI must not present those unavailable v1 metrics as meaningful measured deltas.

This compatibility behavior is intentionally covered by regression tests.

## Schema v2 fields

A canonical v2 JSON report contains these top-level fields:

- `version`
- `source`
- `encoding`
- `stats`
- `keywords`
- `bigrams`
- `trigrams`
- `whitespace`

### `source`

- `kind`: `pasted` or `file`
- `displayName`: optional display filename; full filesystem paths are not part of the report contract
- `mode`: `memory` or `streaming`
- `fileSize`: optional byte size for file sources

### `encoding`

Optional object containing:

- `name`
- `bomDetected`
- `fallbackUsed`
- `hadErrors`

### `stats`

- `words`
- `uniqueWords`
- `maxWordCharacters`
- `characters`
- `graphemes`
- `bytes`
- `sentences`
- `paragraphs`
- `lines`
- `readingSeconds`
- `speakingSeconds`

### Frequency collections

`keywords`, `bigrams`, and `trigrams` contain entries with:

- `text`
- `count`
- `percentage`

Imported frequency collections are bounded and validated before presentation.

### `whitespace`

Includes aggregate whitespace counts plus `lineEndings`, whose dominant value is one of:

- `LF`
- `CRLF`
- `CR`
- `None`

## Privacy contract

Canonical reports deliberately exclude raw analyzed source text and full source filesystem paths. Future schema changes must preserve that privacy boundary unless a separately designed, explicitly opt-in export format is introduced. The canonical machine-readable JSON report must not silently begin embedding source document contents.

Markdown customization is not the canonical schema. Markdown may omit aggregate sections, while JSON remains the complete import/comparison representation for its declared schema version.

## Compatibility policy

For the stable v2 contract:

1. TextLens 2.x releases should continue to emit schema v2 unless a real schema change is required.
2. Existing valid schema-v2 reports must remain importable throughout the TextLens 2.x line.
3. Schema-v1 import compatibility remains supported unless a future major compatibility policy explicitly deprecates it with migration guidance.
4. A future schema v3 must not reinterpret existing v2 fields with incompatible meanings. New semantics require new fields or an explicit version transition.
5. Unknown future schema versions are rejected rather than guessed.
6. Any compatibility-affecting change requires regression tests and an entry in `CHANGELOG.md` plus this document.
7. Application-version changes alone never justify altering report-schema semantics.

## Release gate

Before publishing a release that touches report models, serialization, validation, import, export, or comparison:

- export and re-import a current v2 report;
- import the synthetic legacy v1 case;
- confirm future versions are rejected;
- confirm source text/full paths are absent from canonical exports;
- run Rust report tests and frontend comparison tests;
- update this document if the compatibility contract changed.

---

**Made by the Sanskar**

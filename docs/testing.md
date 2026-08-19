# Testing Strategy

## TypeScript

```bash
npm run test
```

Pure frontend helpers have unit tests. The UI delegates text analysis and validated filesystem I/O to Rust.

Current frontend helper coverage includes:

- settings parsing and bounds, including keyword exclusions and privacy-sensitive opt-ins;
- shared analysis-option parsing used by settings and reusable presets;
- analysis-preset name/collection bounds, case-insensitive deduplication, replacement ordering, application semantics, malformed storage, and write-failure handling;
- numeric/byte/duration formatting;
- HTML-safe presentation helpers;
- report metric and top-keyword comparison deltas;
- legacy-report comparison behavior for vocabulary metrics unavailable in schema v1;
- Markdown export-option defaults, explicit section choices, and malformed-field fallback behavior;
- Quick actions query filtering and multi-term matching;
- recent-file metadata parsing, path rejection, numeric/timestamp validation, deduplication, and ten-entry bounds.

## Rust unit tests

```bash
cd src-tauri
cargo test --lib
```

Coverage includes core counts, vocabulary richness, keyword exclusions, Unicode words/graphemes, line endings, n-grams, BOM/UTF-16 decoding, undefined Windows-1252 byte handling, privacy-safe report rendering, configurable Markdown section rendering, canonical JSON export behavior, report schema/import validation, report atomic replacement, and settings backup validation/round trips.

Report-export tests verify that Markdown customization can omit source metadata/sections without exposing source text, while JSON remains a complete round-trippable report even when Markdown options are supplied.

Report-import tests cover current-schema round trips, schema-v1 compatibility, unsupported future versions, inconsistent metrics, and oversized inputs.

Settings tests cover current backups, legacy backups without newer preferences, invalid exclusions, unknown fields, out-of-range values, and atomic replacement behavior.

Deterministic decoding fixtures cover malformed UTF-8, undefined Windows-1252 bytes, and an odd UTF-16LE boundary so replacement/error behavior does not depend on platform text files.

## Integration/property tests

```bash
cargo test --all-targets
```

Integration tests cover multiple writing systems and known regressions. `proptest` feeds arbitrary Unicode into the analyzer to verify panic-free behavior and invariants including byte/character/grapheme ordering and vocabulary bounds.

Checked-in synthetic fixtures under `src-tauri/tests/fixtures/` provide stable multilingual, difficult-punctuation, and byte-boundary inputs. Fixtures must remain fictional and must never contain private documents.

## Static checks

```bash
npm run version:check
npm run check
npm run lint
npm run format:check
npm run docs:check
npm run build
cd src-tauri
cargo fmt --check
cargo clippy --all-targets --all-features -- -D warnings
```

`npm run version:check` is dependency-free and verifies that `package.json`, `src-tauri/Cargo.toml`, and `src-tauri/tauri.conf.json` declare the same application version.

All checks above are release gates. Do not mark them passing merely because the source was inspected; record the actual command result in `what_changed.md`.

## Performance smoke test

Run the release-mode benchmark with an input size in MiB and optional iteration count:

```bash
cd src-tauri
cargo run --release --example benchmark -- 16 5
```

Record machine/OS/toolchain details when comparing results between revisions.

## Manual acceptance

Before a release candidate:

1. Run `npm run version:check` and confirm the packaged About dialog displays the same release version.
2. Paste ordinary English and confirm live updates.
3. Paste Hindi, Arabic, CJK, accents, emoji, and combining marks.
4. Confirm unique-word and longest-word metrics with repeated and multilingual terms.
5. Add keyword exclusions with mixed case, commas, blank entries, duplicates, and line breaks; confirm only the keyword summary changes while word counts and n-grams remain stable.
6. Save an analysis preset containing non-default reading/speaking rates, result limits, and keyword exclusions; close/reopen Settings and confirm it remains available locally.
7. Save another preset with the same name using different capitalization and confirm it replaces the existing preset rather than creating a duplicate.
8. Apply a preset and confirm the existing Settings save path updates the active pasted text or file analysis while theme, reduced-motion choice, and recent-file-history opt-in remain unchanged.
9. Delete a preset and confirm it disappears after reopening Settings. Verify preset storage contains no source text, file path, report, recent-file entry, or unrelated privacy/appearance setting.
10. Back up settings containing keyword exclusions, clear/change them, restore the backup, and confirm all backed-up values return. Confirm device-local analysis presets are not included in the current settings backup schema.
11. Open LF, CRLF, CR, and mixed-ending files.
12. Open UTF-8/BOM and UTF-16LE/BE BOM fixtures.
13. Test malformed UTF-8 and undefined Windows-1252 bytes and confirm the encoding warning appears.
14. Force streaming with `TEXTLENS_LARGE_FILE_THRESHOLD_MIB=1` and a synthetic >1 MiB file.
15. Export JSON and verify it remains a complete schema-v2 report with source document content absent.
16. Open Markdown export from the visible button, Quick actions, and `Ctrl/Cmd + E`; verify all three open the same section picker.
17. Export Markdown with every section selected and verify the previous full aggregate report content is present while source text is absent.
18. Disable source metadata and selected aggregate sections, export Markdown, and verify those sections/filename metadata are absent while the schema marker and TextLens attribution remain.
19. Disable every optional Markdown section and verify export still succeeds without including source text.
20. Confirm a newly exported JSON report uses schema v2.
21. Compare the current analysis with a valid exported schema-v2 JSON report and verify metric/keyword deltas.
22. Compare against a compatible schema-v1 report and confirm unavailable vocabulary deltas are omitted.
23. Attempt report comparison with malformed JSON, version 0, a future version, inconsistent metrics, invalid frequency data, and a file larger than 512 KiB; each must be rejected.
24. Attempt to restore malformed, unknown-field, unsupported-version, out-of-range, invalid-exclusion, and oversized settings files; each must be rejected.
25. Open Quick actions with both the navigation button and `Ctrl/Cmd + Shift + P`; verify search is case-insensitive and multi-term filtering works.
26. Verify report-dependent Quick actions remain visible but disabled before any analysis and become enabled after analysis.
27. Execute focus, open, clear, export, compare, Settings, and About through Quick actions and verify they reuse the same behavior as visible controls.
28. Confirm Recent files is hidden with default settings and no metadata storage key is retained.
29. Enable recent-file metadata, open more than 10 fictional files, and confirm only the newest 10 display-name/size/time entries remain.
30. Confirm recent metadata never includes a directory or full path; remove one entry and then clear all history.
31. Disable recent-file metadata and confirm stored history is deleted immediately. Restore defaults and verify the same deletion behavior.
32. Back up settings with recent metadata enabled and verify the backup stores only the boolean preference, not recent-file entries.
33. Test light/dark/system themes.
34. Navigate all controls keyboard-only, including dialogs, the Markdown section picker, Quick actions, analysis preset controls, and recent-history controls.
35. Enable reduced motion.
36. Test narrow window widths and horizontal comparison-table scrolling.

Never commit real private documents as fixtures.

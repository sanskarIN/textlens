# Testing Strategy

## TypeScript

```bash
npm run test
```

Pure frontend helpers have unit tests. The UI delegates text analysis and validated filesystem I/O to Rust.

Current frontend helper coverage includes:

- settings parsing and bounds, including keyword exclusions;
- numeric/byte/duration formatting;
- HTML-safe presentation helpers;
- report metric and top-keyword comparison deltas;
- legacy-report comparison behavior for vocabulary metrics unavailable in schema v1;
- Quick actions query filtering and multi-term matching.

## Rust unit tests

```bash
cd src-tauri
cargo test --lib
```

Coverage includes core counts, vocabulary richness, keyword exclusions, Unicode words/graphemes, line endings, n-grams, BOM/UTF-16 decoding, undefined Windows-1252 byte handling, privacy-safe report rendering, report schema/import validation, report atomic replacement, and settings backup validation/round trips.

Report-import tests cover current-schema round trips, schema-v1 compatibility, unsupported future versions, inconsistent metrics, and oversized inputs.

Settings tests cover current backups, legacy backups without keyword exclusions, invalid exclusions, unknown fields, out-of-range values, and atomic replacement behavior.

## Integration/property tests

```bash
cargo test --all-targets
```

Integration tests cover multiple writing systems and known regressions. `proptest` feeds arbitrary Unicode into the analyzer to verify panic-free behavior and invariants including byte/character/grapheme ordering and vocabulary bounds.

## Static checks

```bash
npm run check
npm run lint
npm run format:check
npm run build
cd src-tauri
cargo fmt --check
cargo clippy --all-targets --all-features -- -D warnings
```

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

1. Paste ordinary English and confirm live updates.
2. Paste Hindi, Arabic, CJK, accents, emoji, and combining marks.
3. Confirm unique-word and longest-word metrics with repeated and multilingual terms.
4. Add keyword exclusions with mixed case, commas, blank entries, duplicates, and line breaks; confirm only the keyword summary changes while word counts and n-grams remain stable.
5. Back up settings containing keyword exclusions, clear/change them, restore the backup, and confirm all values return.
6. Open LF, CRLF, CR, and mixed-ending files.
7. Open UTF-8/BOM and UTF-16LE/BE BOM fixtures.
8. Test malformed UTF-8 and undefined Windows-1252 bytes and confirm the encoding warning appears.
9. Force streaming with `TEXTLENS_LARGE_FILE_THRESHOLD_MIB=1` and a synthetic >1 MiB file.
10. Export JSON/Markdown and verify source document content is absent.
11. Confirm a newly exported JSON report uses schema v2.
12. Compare the current analysis with a valid exported schema-v2 JSON report and verify metric/keyword deltas.
13. Compare against a compatible schema-v1 report and confirm unavailable vocabulary deltas are omitted.
14. Attempt report comparison with malformed JSON, version 0, a future version, inconsistent metrics, invalid frequency data, and a file larger than 512 KiB; each must be rejected.
15. Attempt to restore malformed, unknown-field, unsupported-version, out-of-range, invalid-exclusion, and oversized settings files; each must be rejected.
16. Open Quick actions with both the navigation button and `Ctrl/Cmd + Shift + P`; verify search is case-insensitive and multi-term filtering works.
17. Verify report-dependent Quick actions remain visible but disabled before any analysis and become enabled after analysis.
18. Execute focus, open, clear, export, compare, Settings, and About through Quick actions and verify they reuse the same behavior as visible controls.
19. Test light/dark/system themes.
20. Navigate all controls keyboard-only, including dialogs and Quick actions.
21. Enable reduced motion.
22. Test narrow window widths and horizontal comparison-table scrolling.

Never commit real private documents as fixtures.

# Testing Strategy

## TypeScript

```bash
npm run test
```

Pure frontend helpers have unit tests. The UI delegates text analysis and validated settings-file I/O to Rust.

## Rust unit tests

```bash
cd src-tauri
cargo test --lib
```

Coverage includes core counts, vocabulary richness, Unicode words/graphemes, line endings, n-grams, BOM/UTF-16 decoding, undefined Windows-1252 byte handling, privacy-safe report rendering, atomic replacement, and settings backup validation/round trips.

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
4. Open LF, CRLF, CR, and mixed-ending files.
5. Open UTF-8/BOM and UTF-16LE/BE BOM fixtures.
6. Test malformed UTF-8 and undefined Windows-1252 bytes and confirm the encoding warning appears.
7. Force streaming with `TEXTLENS_LARGE_FILE_THRESHOLD_MIB=1` and a synthetic >1 MiB file.
8. Export JSON/Markdown and verify source document content is absent.
9. Back up settings, change preferences, restore the backup, and confirm all values are restored.
10. Attempt to restore malformed, unknown-field, unsupported-version, out-of-range, and oversized settings files; each must be rejected.
11. Test light/dark/system themes.
12. Navigate all controls keyboard-only.
13. Enable reduced motion.
14. Test narrow window widths.

Never commit real private documents as fixtures.

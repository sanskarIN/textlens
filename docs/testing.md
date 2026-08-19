# Testing Strategy

## TypeScript

```bash
npm run test
```

Pure frontend helpers have unit tests. The UI intentionally delegates text analysis to Rust.

## Rust unit tests

```bash
cd src-tauri
cargo test --lib
```

Coverage includes core counts, Unicode words/graphemes, line endings, n-grams, BOM/UTF-16 decoding, and privacy-safe report rendering.

## Integration/property tests

```bash
cargo test --all-targets
```

Integration tests cover multiple writing systems and known regressions. `proptest` feeds arbitrary Unicode into the analyzer to verify panic-free behavior and basic invariants.

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

## Manual acceptance

Before a release candidate:

1. Paste ordinary English.
2. Paste Hindi, Arabic, CJK, accents, emoji, and combining marks.
3. Open LF, CRLF, CR, and mixed-ending files.
4. Open UTF-8/BOM and UTF-16LE/BE BOM fixtures.
5. Force streaming with `TEXTLENS_LARGE_FILE_THRESHOLD_MIB=1` and a synthetic >1 MiB file.
6. Export JSON/Markdown and verify source document content is absent.
7. Test light/dark/system themes.
8. Navigate all controls keyboard-only.
9. Enable reduced motion.
10. Test narrow window widths.

Never commit real private documents as fixtures.

# Development

## Daily workflow

```bash
npm install
npm run tauri:dev
```

## Frontend checks

```bash
npm run check
npm run lint
npm run format:check
npm run test
npm run build
```

## Rust checks

```bash
cd src-tauri
cargo fmt --check
cargo clippy --all-targets --all-features -- -D warnings
cargo test --all-targets
```

## Design rules

- Keep analysis rules in Rust domain modules.
- Do not log or persist raw analyzed text.
- Treat full file paths as sensitive metadata.
- Escape user-derived strings before HTML insertion.
- Keep Tauri permissions minimal.
- Do not introduce network dependencies for core analysis.
- Every reproducible bug fix should add a regression test.

## Adding a metric

1. Extend the domain model.
2. Implement the calculation in the analyzer.
3. Add Unicode/empty/edge tests.
4. Render it in the UI.
5. Add it to exports where useful.
6. Update docs/changelog.

## Adding a setting

Validate it in both TypeScript persistence and Rust analysis options because IPC input is untrusted.

## Error handling

Native errors become user-safe messages through `AppError`. Avoid surfacing full private paths.

## Dependencies

Keep runtime dependencies small. Dependabot proposes updates; review changelogs and run the full suite before merging.

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
npm run docs:check
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
- Treat imported reports, settings backups, and WebView storage as untrusted input.
- Bound local collections and imported file sizes.
- Keep activity/history metadata opt-in and provide deletion controls.
- Every reproducible bug fix should add a regression test.

## Adding a metric

1. Extend the domain model.
2. Decide whether the report schema version must change.
3. Implement the calculation in the analyzer.
4. Add Unicode/empty/edge tests.
5. Render it in the UI.
6. Add it to exports and report comparison where meaningful.
7. Add legacy-schema behavior if older reports are still supported.
8. Update docs/changelog.

## Adding a setting

1. Add the setting to `AppSettings` and `defaultSettings`.
2. Validate values read from WebView storage in `state.ts`.
3. If the setting crosses IPC, add the matching Rust field and independent validation.
4. Decide whether the setting belongs in settings backup and whether the backup schema version must change.
5. Add migration/default behavior for supported older backups.
6. Add TypeScript and/or Rust tests.
7. Document privacy behavior for settings that retain user activity or metadata.

## Adding local persistence

Before introducing another local-storage key, read ADR-0008 and justify why persistence is needed. Persist the minimum data, set explicit bounds, reject path-like/sensitive values where applicable, and provide clear/delete behavior. Do not persist source text as a convenience feature.

## Report schema changes

The current analysis report schema is v2. `CURRENT_REPORT_VERSION` in Rust is the source of truth for newly generated reports. Import compatibility lives in `report.rs`, and frontend comparison must not invent values for fields that did not exist in an older schema.

When changing schema semantics:

1. update the version deliberately;
2. keep or reject older versions explicitly;
3. reject unknown future versions;
4. add current/legacy/future-version tests;
5. update ADR-0005 and user-facing compatibility docs.

## Quick actions

Quick actions must call the same application functions as visible controls. Keep search/filtering pure and testable in `src/lib/quickActions.ts`; do not create hidden command implementations with different validation or privacy behavior.

## Fixtures

Synthetic regression fixtures live in `src-tauri/tests/fixtures/`. Keep fixtures fictional, deterministic, small, and safe to publish. Never copy real private documents into the repository.

## Documentation links

`npm run docs:check` scans repository Markdown and fails on missing local link/image targets or links that escape the repository. External URLs are intentionally not fetched so the check remains deterministic and offline.

## Error handling

Native errors become user-safe messages through `AppError`. Avoid surfacing full private paths or imported content in UI errors or logs.

## Dependencies

Keep runtime dependencies small. Dependabot proposes updates; review changelogs and run the full suite before merging. Lockfiles should be refreshed and committed from an environment with registry access before a release candidate is declared reproducible.

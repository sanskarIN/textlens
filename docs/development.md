# Development

## Daily workflow

For a clean checkout or after pulling dependency changes, install the exact committed npm graph:

```bash
npm ci
npm run tauri:dev
```

If `node_modules` is already current and no dependency manifest changed, you can continue normal development without reinstalling. Use `npm install` only when intentionally changing npm dependencies and refreshing `package-lock.json`.

## Frontend checks

```bash
npm run version:check
npm run check
npm run lint
npm run format:check
npm run docs:check
npm run test
npm run build
npm run build:web
npm run build:mobile
```

## Rust checks

```bash
cd src-tauri
cargo fmt --check
cargo clippy --locked --all-targets --all-features -- -D warnings
cargo test --locked --all-targets
```

## Design rules

- Keep analysis rules in Rust domain modules and preserve observable parity in the portable analyzer where the feature is shared.
- Do not log or persist raw analyzed text.
- Treat full file paths and mobile provider URIs as sensitive metadata.
- Escape user-derived strings before HTML insertion.
- Keep Tauri permissions minimal and platform-scoped.
- Do not introduce network dependencies for core analysis.
- Treat imported reports, settings backups, and WebView/browser storage as untrusted input.
- Bound local collections and imported/selected file sizes.
- Keep activity/history metadata opt-in and provide deletion controls.
- Keep application version and report-schema version independent.
- Every reproducible bug fix should add a regression test.
- Keep `package-lock.json` and `src-tauri/Cargo.lock` synchronized with their manifests.

## Adding a metric

1. Extend the domain model.
2. Decide whether the report schema must change; ordinary app-version changes do not justify a schema bump.
3. Implement the calculation in the native analyzer.
4. If the metric is shared by portable runtimes, implement/verify the portable analyzer contract too.
5. Add Unicode/empty/edge tests and native/portable parity coverage where applicable.
6. Render it in the UI.
7. Add it to exports and report comparison where meaningful.
8. Add legacy-schema behavior if older reports are still supported.
9. Update `docs/report-schema.md` if the canonical JSON contract changes.
10. Update docs/changelog.

## Adding a setting

1. Add the setting to `AppSettings` and `defaultSettings`.
2. Validate values read from WebView/browser storage in `state.ts`.
3. If the setting crosses IPC, add the matching Rust field and independent validation.
4. Decide whether the setting belongs in settings backup and whether the backup schema version must change.
5. Add migration/default behavior for supported older backups.
6. Add TypeScript and/or Rust tests.
7. Document privacy behavior for settings that retain user activity or metadata.

## Adding local persistence

Before introducing another local-storage key, read ADR-0008 and ADR-0011 and justify why persistence is needed. Persist the minimum data, set explicit bounds, reject path-like/sensitive values where applicable, and provide clear/delete behavior. Do not persist source text as a convenience feature. Optional persistence must not become a requirement for core analysis availability.

## Report schema changes

The current stable analysis report schema is **v2**, including in application version **2.0.12**. `CURRENT_REPORT_VERSION` in Rust is the source of truth for newly generated native reports. Portable report generation/import must preserve the same supported schema semantics and native-compatible invariants. Import compatibility lives in `report.rs` plus the portable guard, frontend comparison must not invent values for fields that did not exist in an older schema, and the stable compatibility policy is documented in `docs/report-schema.md`.

`src-tauri/tests/report_schema_contract.rs` intentionally fails if `CURRENT_REPORT_VERSION` changes accidentally.

When changing schema semantics:

1. establish why the existing v2 contract cannot represent the change compatibly;
2. update the schema version deliberately;
3. keep or reject older versions explicitly;
4. reject unknown future versions;
5. add current/legacy/future-version and migration tests across applicable native/portable paths;
6. update ADR-0005 if the architectural compatibility decision changes;
7. update `docs/report-schema.md`, `CHANGELOG.md`, release notes, and comparison behavior;
8. verify canonical JSON still excludes raw source text and full source paths/provider URIs.

Do not modify or remove the schema-freeze regression test merely to make an unrelated change pass.

## Quick actions

Quick actions must call the same application functions as visible controls. Keep search/filtering pure and testable in `src/lib/quickActions.ts`; do not create hidden command implementations with different validation or privacy behavior.

## Fixtures

Synthetic regression fixtures live in `src-tauri/tests/fixtures/`. Keep fixtures fictional, deterministic, small, and safe to publish. Never copy real private documents into the repository.

## Documentation links

`npm run docs:check` scans repository Markdown and fails on missing local link/image targets or links that escape the repository. External URLs are intentionally not fetched so the check remains deterministic and offline.

## Error handling

Native errors become user-safe messages through `AppError`. Portable adapters must likewise avoid surfacing full private paths/provider URIs or imported content. Avoid leaking sensitive metadata in UI errors or logs.

## Dependencies

Keep runtime dependencies small. Dependabot proposes updates; review changelogs and run the full suite before merging.

`package-lock.json` and `src-tauri/Cargo.lock` are committed build inputs. When intentionally changing dependencies, update the appropriate manifest and lockfile together, review both diffs, and run deterministic validation. Do not delete, hand-edit, or casually regenerate lockfiles merely to make a check pass.

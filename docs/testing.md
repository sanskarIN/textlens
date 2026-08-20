# Testing Strategy

TextLens testing separates **source-level portability** from **platform release evidence**. CI can prove that the native, Web/PWA, and mobile frontend modes compile and that shared logic passes automated tests; it cannot prove App Store provisioning, Android signing, device-specific WebView behavior, or a hosted PWA deployment from a Linux runner alone.

See [platforms.md](platforms.md) for the platform support model.

## Deterministic dependency baseline

Clean test environments should install the exact committed npm dependency graph before running frontend checks:

```bash
npm ci
```

Rust validation uses the committed `src-tauri/Cargo.lock` through Cargo's `--locked` flag. If either manifest and its lockfile disagree, deterministic validation must fail rather than silently resolving a different dependency graph.

## TypeScript and portable-runtime tests

```bash
npm run test
```

Frontend coverage includes:

- settings parsing and bounds, including keyword exclusions and privacy-sensitive opt-ins;
- shared analysis-option parsing used by settings and reusable presets;
- analysis-preset name/collection bounds, deduplication, replacement ordering, and malformed storage;
- failure-safe storage helpers;
- numeric/byte/duration formatting;
- HTML-safe presentation helpers;
- report comparison and legacy-schema behavior;
- Markdown export-option parsing;
- Quick actions filtering;
- recent-file metadata validation and bounds;
- portable Web/mobile analysis for core counts, vocabulary metrics, keyword exclusions, n-grams, Unicode graphemes, mixed line endings, encoding-error behavior, and native-report import invariants.

`src/platform/web-analyzer.test.ts` guards the observable counting contract for the second local analysis implementation. `src/platform/web-tauri-core-guard.test.ts` covers native/import parity and portable file-decoding behavior. New portable analyzer behavior should be tested against the same observable report contract used by the Rust analyzer.

## Frontend build matrix

Every cross-platform change must compile all frontend modes:

```bash
npm run check
npm run build
npm run build:web
npm run build:mobile
```

The modes mean:

- `build` — native Tauri frontend using real Tauri JavaScript modules;
- `build:web` — browser/PWA bundle using portable aliases;
- `build:mobile` — Android/iOS Tauri frontend using portable aliases without PWA service-worker registration.

A change that passes the desktop build but breaks either portable build is not cross-platform complete.

## Rust unit tests

```bash
cd src-tauri
cargo test --locked --lib
```

Coverage includes core counts, vocabulary richness, keyword exclusions, Unicode words/graphemes, line endings, n-grams, BOM/UTF-16 decoding, undefined Windows-1252 handling, privacy-safe report rendering, configurable Markdown rendering, canonical JSON behavior, report import validation, atomic replacement, and settings backup validation/round trips.

Report-import tests cover current-schema round trips, schema-v1 compatibility, unsupported future versions, inconsistent metrics, and oversized inputs.

Deterministic decoding fixtures cover malformed UTF-8, undefined Windows-1252 bytes, and UTF-16 boundaries.

## Integration/property tests

```bash
cd src-tauri
cargo test --locked --all-targets
```

Integration tests cover multiple writing systems and known regressions. `proptest` feeds arbitrary Unicode into the native analyzer to verify panic-free behavior and invariants including byte/character/grapheme ordering and vocabulary bounds.

`src-tauri/tests/report_schema_contract.rs` guards the stable report schema at v2. An intentional change must update migration/compatibility tests, `docs/report-schema.md`, `CHANGELOG.md`, and release notes.

Fixtures under `src-tauri/tests/fixtures/` must remain synthetic and must never contain private documents.

## Static checks

```bash
npm ci
npm run version:check
npm run check
npm run lint
npm run format:check
npm run docs:check
npm run test
npm run build
npm run build:web
npm run build:mobile

cd src-tauri
cargo fmt --check
cargo clippy --locked --all-targets --all-features -- -D warnings
cargo test --locked --all-targets
```

`npm run version:check` verifies npm, Cargo, Tauri, README, changelog, and version-specific release-note identity for application version 2.0.12.

Application version and report-schema version are independent. Cross-platform work must continue to emit report schema v2 unless an explicit compatibility migration is made.

CI performs identity checks, installs the exact npm graph with `npm ci`, exercises all three frontend bundles, and validates Rust against the committed Cargo lockfile. Security auditing also validates the committed Cargo lockfile rather than generating a fresh dependency resolution.

Do not mark a command passing merely because source was inspected. Record actual CI/local evidence separately from source changes.

## Portable runtime limits to test

Web/mobile acceptance must include boundary behavior:

- selected source file at/under the 64 MiB portable limit;
- selected source file above 64 MiB rejected with a readable error;
- report import at/under 512 KiB;
- oversized report rejected;
- settings backup at/under 64 KiB;
- oversized settings backup rejected;
- UTF-8 BOM;
- UTF-16 LE BOM;
- UTF-16 BE BOM;
- valid UTF-8 without BOM;
- non-UTF-8 fallback labelled Windows-1252;
- malformed bytes recorded consistently with the native decoding contract;
- no source path embedded in a generated report.

## PWA acceptance

After `npm run build:web`, deploy or serve the output in a service-worker-capable environment and verify:

1. the manifest loads without errors;
2. the service worker installs with the intended application-relative scope;
3. the application loads normally online;
4. after the application shell has been cached, a relaunch can load without network access;
5. analyzed source text does not appear in Cache Storage entries;
6. imported documents and generated reports are not intentionally added to the service-worker cache;
7. an updated application build can replace the old TextLens PWA cache;
8. file selection and export still work after installation as a standalone PWA;
9. root-hosted and configured subdirectory-hosted deployments resolve manifest/icons/chunks/service-worker paths correctly.

ChromeOS acceptance uses this same PWA path.

## Android acceptance

On an emulator and at least one representative physical device when preparing a release:

1. initialize/build with the documented Tauri Android toolchain;
2. launch without a startup crash;
3. verify safe-area/touch layout and portrait/landscape behavior;
4. paste multilingual text and compare counts with a desktop reference fixture;
5. select text files through the Android document picker;
6. verify selected provider content is analyzed without exposing a full desktop-style source path;
7. export JSON and Markdown through the available local mobile workflow;
8. restore a settings backup;
9. compare an exported report;
10. verify local settings persistence and fallback behavior;
11. verify external Releases navigation requires explicit interaction;
12. inspect network behavior and confirm analyzed text is not sent to a TextLens backend.

A source build is not evidence of Play Store signing or policy compliance. Verify AAB/APK signing and store requirements separately.

## iPhone/iPad acceptance

On Simulator and a representative physical device when preparing a release:

1. initialize/build on macOS with Xcode;
2. launch without a startup crash;
3. verify iPhone and iPad safe areas, orientation, and dynamic viewport behavior;
4. test paste analysis with multilingual fixtures;
5. select files from the iOS document workflow;
6. verify local report/settings import/export behavior;
7. test report comparison;
8. verify theme and reduced-motion behavior;
9. verify no background update polling;
10. inspect network behavior and confirm analyzed text is not sent to a TextLens backend.

Provisioning, signing, App Store privacy declarations, screenshots, and submission are separate release gates.

## Desktop acceptance

Desktop release candidates should verify:

- pasted analysis;
- native file open/save dialogs;
- UTF-8/UTF-16/Windows-1252 behavior;
- large-file streaming;
- JSON and Markdown export;
- report comparison;
- settings backup/restore;
- presets and recent-file metadata;
- keyboard-only navigation;
- theme/reduced motion;
- release link behavior;
- platform package install/uninstall behavior.

## Shared manual feature acceptance

Across each applicable runtime:

1. Paste ordinary English and confirm live updates.
2. Paste Hindi, Arabic, CJK, accents, emoji, and combining marks.
3. Confirm unique-word and longest-word metrics.
4. Add keyword exclusions and verify only keyword summaries change.
5. Save/apply/delete analysis presets and verify no source text/path enters preset storage.
6. Back up and restore settings.
7. Open LF, CRLF, CR, and mixed-ending inputs where the platform file workflow permits fixture selection.
8. Export complete canonical JSON and verify source text/full source path are absent.
9. Export Markdown with all sections, then with selected sections disabled.
10. Compare against schema-v2 and compatible schema-v1 reports.
11. Reject malformed/future/oversized reports and malformed/oversized settings backups.
12. Exercise Quick actions and visible controls.
13. Verify recent-file metadata remains opt-in, path-free, bounded, removable, and clearable.
14. Simulate blocked local persistence and confirm memory fallback or guarded startup recovery.
15. Confirm the Updates section performs no background check.
16. Test light/dark/system and reduced motion.
17. Test narrow/mobile layouts and comparison-table scrolling.

## Performance smoke test

Native desktop benchmark:

```bash
cd src-tauri
cargo run --locked --release --example benchmark -- 16 5
```

Record machine, OS, and toolchain information when comparing results.

For Web/mobile, separately profile the portable analyzer with representative 1 MiB, 8 MiB, and larger synthetic files below the 64 MiB limit. Browser/mobile measurements are not directly comparable with Rust streaming measurements because the execution models differ.

## Release artifact integrity

After final platform artifacts have actually been produced, generate and verify their SHA-256 manifest with the documented release scripts. Do not fabricate artifact or signing evidence.

Never commit real private documents as fixtures.

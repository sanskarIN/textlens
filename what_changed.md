# TextLens — Final Work Handoff

## Current milestone

Version **2.0.12** source milestone, stable report-schema freeze, deterministic encoding-policy review, release-identity hardening, documentation completion, and continuous cross-platform native compile validation — 2026-08-21.

The repository contains the product implementation targeted by the current TextLens specification plus the completed reliability/privacy/release hardening from the previous final audit. This continuation adds a reusable native Tauri smoke build and a Windows/macOS/Linux GitHub Actions matrix while preserving the separation between source-level compilation evidence and real packaged-release verification.

This file deliberately separates source completion from environment-dependent release evidence. Do not describe unexecuted package-manager, native platform, signing, accessibility, screenshot, or release-artifact checks as completed.

## Repository state for this continuation

- Repository: `sanskarIN/textlens`
- Default branch: `main`
- Working continuation branch: `ci/cross-platform-native-smoke`
- Previous release branch: `release/v2.0.12-final`
- Visibility: public
- License: MIT
- Primary stack: Rust + Tauri 2 + TypeScript + Vite
- Application version: `2.0.12`
- Report schema: `2`
- Settings backup schema: `2`
- Required visible credit: **Made by the Sanskar**
- Requested commit identity: `Sanskar <sanskarin@outlook.in>`

## 2026-08-21 cross-platform native validation continuation

### Native smoke command

Added the reusable package command:

```bash
npm run native:smoke
```

It expands to `tauri build --debug --no-bundle`, so contributors and CI use the same native compilation path without manufacturing installer artifacts or implying release-package verification.

### Three-OS native smoke workflow

Added `.github/workflows/platform-smoke.yml` with a non-fail-fast matrix for:

- `ubuntu-22.04`;
- `windows-latest`;
- `macos-latest`.

The workflow:

- runs for relevant source/configuration changes on pull requests and `main`;
- also supports manual dispatch;
- uses read-only repository permissions;
- cancels superseded runs for the same workflow/ref;
- runs the dependency-free version/release identity gate before package installation;
- installs stable Rust and restores the Rust cache;
- installs the required Tauri/WebKit native packages on Linux;
- installs frontend dependencies with audit/funding noise disabled;
- executes `npm run native:smoke` on every host;
- uses a per-job timeout so a stuck native build cannot run indefinitely.

No host is marked `continue-on-error`; an OS-specific compile failure remains visible as a platform regression until investigated.

### Platform support contract

Added `docs/platform-support.md` documenting:

- supported desktop source targets;
- the native smoke CI host used for each platform family;
- the distinction between native compilation and distributable package verification;
- portability rules covering shell commands, paths, locale assumptions, line endings, keyboard conventions, responsive desktop UI, and platform-specific dependencies;
- local native prerequisites;
- the evidence required before a release is described as verified on Windows, macOS, or Linux;
- the expected handling of platform-specific regressions.

### Documentation and roadmap synchronization

Updated:

- `README.md` with the platform-smoke badge, support matrix, native smoke command, and platform support guide link;
- `docs/setup.md` with host-side native smoke instructions and evidence boundaries;
- `docs/testing.md` with the three-OS smoke strategy and a release-candidate matrix requirement;
- `ROADMAP.md` to mark continuous native compile coverage and the platform support contract complete while keeping packaged-build/accessibility/signing/screenshot gates open.

### Verification status for this continuation

Verified from connected GitHub state before opening the pull request:

- continuation branch exists and is based directly on `main`;
- branch initially compared as ahead-only with no divergence;
- the new workflow, package command, platform-support document, roadmap, setup guide, testing guide, README, and this handoff were committed independently with granular commit messages;
- no claim has been made that Windows/macOS/Linux packaged installers have been built, installed, signed, notarized, screen-reader tested, or screenshot-verified in this environment.

The actual GitHub-hosted platform matrix result must be read from the pull-request/commit checks after the branch is pushed through the normal GitHub workflow. A source change is not declared cross-platform release-verified merely because the workflow definition exists.

## Version 2.0.12 work completed in the previous pass

### Application version synchronization

Updated independently with granular commits:

- `package.json` → `2.0.12`;
- `src-tauri/Cargo.toml` → `2.0.12`;
- `src-tauri/tauri.conf.json` → `2.0.12`.

The runtime About UI continues to resolve the packaged version from Tauri metadata rather than a copied display literal.

Application version and report-schema version are intentionally independent. The app is `2.0.12`; the report schema remains `v2`.

### Expanded dependency-free version/release identity gate

The existing version checker originally validated only npm/Cargo/Tauri metadata. That left a maintenance gap: README, changelog, or version-specific release notes could silently disagree with the packaged version.

`scripts/check-version-sync.mjs` now verifies all of the following without third-party dependencies:

- `package.json` version;
- `src-tauri/Cargo.toml` package version;
- `src-tauri/tauri.conf.json` version;
- README contains `Current source version: <version>`;
- `CHANGELOG.md` contains a matching `## [<version>]` section;
- `docs/releases/v<version>.md` exists and is readable.

The expanded gate was exercised locally with Node 22 against 2.0.12 release-identity fixtures and returned:

```text
Version metadata and release documentation are synchronized at 2.0.12.
```

A negative case with the version-specific release-note file removed was also exercised and failed as intended.

### Release tag verification for 2.0.12

The dependency-free release-tag helper was exercised with the 2.0.12 package version:

- `v2.0.12` → accepted;
- `v2.0.11` → rejected.

This confirms the tag gate tracks the new application version rather than the earlier 0.1.0 value.

### CI fail-fast release identity ordering

`.github/workflows/ci.yml` previously ran `npm install` before the dependency-free version check. That meant registry failure could mask simple version/document drift.

The frontend job now runs:

1. checkout;
2. Node setup;
3. `npm run version:check`;
4. dependency installation;
5. type/lint/format/docs/test/build gates.

The release workflow now verifies both the release tag and version/release documentation before Rust toolchain setup, Linux prerequisite installation, or npm dependency installation.

This reduces wasted runner work and makes release identity failures independent from registry/toolchain availability.

### Stable report-schema contract completed

The roadmap previously left the stable report-schema compatibility guarantee unchecked. That source/documentation-owned item is now completed.

Added `docs/report-schema.md` documenting:

- current emitted report schema v2;
- schema v1 legacy import compatibility;
- version `0` rejection;
- unsupported future-version rejection;
- 512 KiB report import limit;
- validated report/frequency/metadata relationships;
- canonical v2 top-level structure;
- `source`, `encoding`, `stats`, frequency, and whitespace field contracts;
- legacy v1 behavior for vocabulary metrics that did not exist in that schema;
- privacy guarantee excluding raw source text and full filesystem paths from canonical JSON;
- explicit independence of application version from report-schema version;
- compatibility policy for the TextLens 2.x line;
- required release gates for future schema-affecting changes.

### Report-schema regression guard

Added:

```text
src-tauri/tests/report_schema_contract.rs
```

The test asserts that `CURRENT_REPORT_VERSION == 2` and explains that changing it requires an explicit compatibility decision, migration tests, and documentation updates.

This is not intended to prevent all future schema changes. It prevents an accidental schema bump during unrelated application-version work.

### Encoding-policy review completed

The remaining conditional encoding-heuristics roadmap entry was re-audited instead of being treated as a request to add statistical guessing for feature-count purposes.

ADR-0003 now records the 2.0.12 review decision:

- detect UTF-8 BOM;
- detect UTF-16 LE/BE BOM;
- otherwise accept valid UTF-8;
- otherwise use a clearly labelled Windows-1252 fallback;
- surface undefined Windows-1252 byte replacements through diagnostics;
- keep UTF-16 full-file decoding where byte-oriented line streaming could split code units.

A future heuristic change must be deterministic, offline, conservative about uncertainty, clearly labelled, backed by synthetic regression fixtures/evidence, and consistent with privacy/reproducibility goals.

The roadmap now marks this review complete because retaining the conservative policy is the deliberate design result.

### Roadmap synchronization

`ROADMAP.md` now:

- marks report-schema freeze/compatibility complete;
- marks the encoding heuristic review complete with the conservative decision;
- records the 2.0.12 source milestone;
- explicitly preserves report schema v2 independently from app version 2.0.12;
- keeps native packaging/signing/accessibility/screenshots as external evidence gates.

### Changelog cut for 2.0.12

`CHANGELOG.md` now contains:

- a clean `[Unreleased]` section for future changes;
- a `[2.0.12] - 2026-08-19` section containing reliability, privacy, workflow, report, update, version, schema, encoding-policy, and release-integrity work;
- explicit note that application version 2.0.12 does not change report schema v2;
- expanded version/release-document gate coverage;
- CI/release fail-fast identity ordering.

The original `0.1.0` historical section remains intact.

### README synchronization

`README.md` now:

- identifies the current source version as `2.0.12`;
- links `docs/report-schema.md` from the documentation index;
- documents the stable schema-v2 target for the TextLens 2.x line;
- explains app-version/report-schema independence;
- updates the release tag example from `v0.1.0` to `v2.0.12`;
- requires report-schema documentation updates for compatibility-affecting contributions.

### Development and architecture documentation synchronization

`docs/development.md` now:

- includes `npm run version:check` in the frontend workflow;
- explicitly separates application-version changes from report-schema changes;
- requires `docs/report-schema.md` updates for canonical JSON contract changes;
- references the report-schema freeze regression test;
- requires deliberate migration/legacy/future-version behavior for real schema changes;
- references both recent-file and failure-safe-storage ADRs before adding new persistence.

`docs/architecture.md` now documents:

- the guarded `startup.ts` frontend entry boundary;
- storage probe/session fallback behavior;
- manual update UI network boundary;
- `storage.ts` as a shared reliability helper;
- application version 2.0.12 versus report schema v2;
- the schema compatibility document/regression guard;
- streaming single-line memory limitation;
- ADR-0010 and ADR-0011 in the architecture record list.

### Testing documentation synchronization

`docs/testing.md` now covers:

- failure-safe storage helper tests;
- stable report-schema integration guard;
- expanded version/release-document gate behavior;
- CI/release fail-fast ordering;
- 2.0.12 tag validation;
- canonical JSON source-text/full-path checks;
- blocked-storage fallback/recovery acceptance;
- manual update no-background-polling acceptance;
- final artifact SHA-256 manifest verification.

### Release guide synchronization

`docs/release.md` now:

- uses `v2.0.12` in the tag-check example;
- explicitly identifies report schema v2 as independent from app version 2.0.12;
- requires `docs/report-schema.md` review when report compatibility changes;
- adds `CURRENT_REPORT_VERSION == 2` to data-compatibility checks unless an explicit migration is intended;
- requires canonical JSON source-text/full-path exclusion verification;
- links the version-specific source milestone notes.

### Release template hardening

`.github/RELEASE_TEMPLATE.md` includes explicit checks for:

- `npm run version:check`;
- intended-tag validation;
- app/report/settings schema declarations;
- app-version/report-schema independence;
- current and legacy report import checks;
- future report-version rejection;
- canonical JSON privacy boundaries;
- storage fallback/recovery behavior;
- final SHA-256 artifact manifest generation/verification;
- lockfile generation from package-manager output.

### Version-specific source milestone notes

Added:

```text
docs/releases/v2.0.12.md
```

The document records:

- 2.0.12 source identity;
- source-complete feature highlights;
- report/settings compatibility;
- retained privacy/security guarantees;
- verification performed during version preparation;
- external release gates that remain unverified;
- explicit instruction not to publish a stable `v2.0.12` binary release merely because source version preparation is complete.

## Audit state at the beginning of the 2.0.12 pass

The connected GitHub repository was re-inspected after the merged final reliability audit.

Observed at the start of this 2.0.12 pass:

- default branch remained `main`;
- repository remained public and writable through the connected account;
- no open repository issues were returned;
- no open pull requests were returned;
- repository search returned no unresolved `TODO`, `FIXME`, `HACK`, or `XXX` implementation markers;
- `package-lock.json` remained absent;
- `src-tauri/Cargo.lock` remained absent;
- `ROADMAP.md` showed report-schema freeze and a conditional encoding heuristic review as the source-side open/ambiguous roadmap entries.

The missing lockfiles are not being fabricated. They must be generated by their real package managers in a registry-capable/toolchain-capable environment.

## Lockfile generation attempt in the 2.0.12 pass

The local environment provides Node/npm but does not provide Cargo/Rust.

Observed:

```text
cargo: command not found
rustc: command not found
npm: 10.9.2
node: v22.16.0
```

A real npm `--package-lock-only` generation attempt was made against the exact 2.0.12 package manifest. The registry operation did not complete within the available execution window and no `package-lock.json` was produced.

Because no real lockfile was produced, none was committed. `src-tauri/Cargo.lock` also remains ungenerated because Cargo is unavailable in this execution environment.

## Product source status retained from the merged final audit

### Core analysis

Implemented:

- Unicode-aware word segmentation;
- word count;
- unique-word count;
- longest-word character count;
- character count;
- grapheme count;
- byte count;
- sentence count;
- paragraph count;
- line count;
- configurable reading-time estimate;
- configurable speaking-time estimate;
- ranked keywords;
- bigrams;
- trigrams;
- bounded local keyword exclusions affecting keyword summaries only;
- whitespace counts;
- blank-line counts;
- trailing-whitespace-line counts;
- LF/CRLF/CR and mixed-line-ending diagnostics.

Keyword exclusions intentionally do not redefine the full token stream used for core/vocabulary counts or n-grams.

### File analysis and encoding

Implemented:

- explicit local file selection through Tauri;
- UTF-8 and UTF-8 BOM handling;
- UTF-16LE/BE BOM decoding;
- conservative labelled Windows-1252 fallback;
- undefined Windows-1252 bytes surfaced through replacement/error diagnostics;
- large UTF-8/Windows-1252 streaming above the configured threshold;
- display filename returned instead of full source path;
- current selected source path retained only transiently in frontend memory when reanalysis is needed.

Synthetic deterministic fixtures cover multilingual text, punctuation, malformed UTF-8, Windows-1252 edge bytes, and UTF-16 boundaries.

The encoding policy has now been explicitly re-reviewed for 2.0.12 and retained by design rather than left as an ambiguous future checkbox.

### Canonical reports

Current contract:

- emitted schema: v2;
- compatible import: v1 and v2;
- source text excluded;
- full source paths excluded;
- report import bounded to 512 KiB;
- invalid/inconsistent report values rejected;
- unknown future schema versions rejected rather than guessed;
- v1 vocabulary values that were not present are not fabricated as meaningful comparison deltas.

### Markdown reports

Optional aggregate sections:

- source metadata;
- core metrics;
- keywords;
- bigrams;
- trigrams;
- whitespace/line-ending diagnostics.

Raw source text is never offered as a Markdown export option. Hiding source metadata removes display filename, analysis mode, and encoding metadata.

### Report comparison

Implemented:

- current report compared locally with saved TextLens JSON;
- metric deltas;
- top-keyword count changes;
- legacy-v1 vocabulary metrics omitted when unavailable;
- no cloud/local source-document history database created from comparisons.

### Settings and backup

Implemented settings:

- system/light/dark theme;
- reading words/minute;
- speaking words/minute;
- top-keyword and top-n-gram limits;
- keyword exclusions;
- reduced motion;
- opt-in recent-file metadata;
- manual update section;
- backup/restore/default controls.

Settings backup schema v2 includes:

- versioned JSON;
- 64 KiB read bound;
- strict field/range validation;
- bounded keyword exclusions;
- legacy schema-v1 compatibility;
- rejection of malformed/unsupported/out-of-range content;
- replacement write behavior;
- generic missing-destination errors without private path disclosure.

Backups intentionally exclude source text, source paths, reports, recent-file entries, analysis presets, and credentials.

### Recent-file metadata

Implemented:

- disabled by default;
- maximum 10 entries;
- display filename/size/opened timestamp only;
- no full paths;
- no source content;
- path-like display-name rejection;
- per-entry removal;
- clear-all;
- erase-on-disable/default behavior when local persistence is available.

### Analysis presets

Implemented:

- maximum 12 presets;
- maximum 48 Unicode scalar values in a preset name;
- case-insensitive replacement/deduplication;
- save/apply/delete Settings UI;
- DOM-safe preset-name rendering;
- shared bounded analysis-option parser;
- no source text/paths/reports/recent entries/credentials in preset persistence.

### Failure-safe storage and guarded startup

Implemented:

- exception-contained storage read/write/remove helpers;
- shared settings/recent/preset persistence boundary;
- startup local-storage writability probe;
- process-local in-memory fallback where available;
- clear session-only persistence communication;
- no network fallback;
- guarded single-entry frontend startup;
- readable recovery view instead of a blank desktop window on initialization failure.

### Privacy-preserving updates

Implemented:

- Settings Updates area;
- no background update polling;
- official GitHub Releases page opens only on explicit user action;
- no source document content attached to external URLs.

### Release integrity tooling

Implemented:

- npm/Cargo/Tauri application-version synchronization check;
- README/changelog/version-specific release-note identity checks in the same dependency-free gate;
- release-tag/version checker;
- dependency-free identity checks before dependency/toolchain setup in CI/release workflows;
- deterministic SHA-256 artifact manifest generator;
- strict manifest verifier covering malformed lines, path traversal, duplicates, missing/extra files, and digest mismatches.

## Documentation status

Repository documentation now includes:

- `README.md`
- `CHANGELOG.md`
- `ROADMAP.md`
- `CONTRIBUTING.md`
- `CODE_OF_CONDUCT.md`
- `SECURITY.md`
- `PRIVACY.md`
- `LICENSE`
- `what_changed.md`
- `docs/setup.md`
- `docs/development.md`
- `docs/architecture.md`
- `docs/testing.md`
- `docs/platform-support.md`
- `docs/report-schema.md`
- `docs/release.md`
- `docs/releases/v2.0.12.md`
- `docs/troubleshooting.md`
- `docs/accessibility.md`
- `docs/performance.md`
- `docs/repository-governance.md`
- `docs/branch-protection.md`
- ADRs including the re-reviewed conservative encoding policy, Markdown report customization, and failure-safe local storage.

## Verification performed in the 2.0.12 pass

Actually performed:

- re-read current repository metadata from connected GitHub;
- inspected npm, Cargo, and Tauri version sources;
- checked open issues and open pull requests at the beginning of the pass;
- searched for unresolved implementation markers;
- confirmed npm/Cargo lockfiles remain absent rather than pretending they exist;
- inspected the roadmap and identified the report-schema freeze plus conditional encoding review as remaining source-side work;
- inspected Rust report validation/import logic and report model definitions;
- synchronized all three application version sources to 2.0.12;
- exercised the original version metadata algorithm locally with Node 22 against 2.0.12 and received success;
- extended the version gate to README/changelog/version-specific release-note identity;
- exercised the expanded version/release-document algorithm with a passing 2.0.12 case and a failing missing-release-note case;
- exercised the 2.0.12 tag checker with matching and mismatching tags;
- attempted real npm package-lock generation; registry completion was not available and no lockfile was produced;
- confirmed Cargo/Rust are unavailable locally, so no Cargo lockfile/test claim was fabricated;
- added an explicit report-schema v2 compatibility document;
- added a Rust regression assertion freezing `CURRENT_REPORT_VERSION` at v2;
- re-reviewed encoding heuristics and reaffirmed the deterministic conservative policy in ADR-0003;
- moved dependency-free release identity checks ahead of dependency/toolchain setup in CI and release automation;
- updated roadmap, changelog, README, development, architecture, testing, release guide, release template, version-specific release notes, and this handoff.

## Verification not truthfully completed in this environment

The full repository gates still require package-manager registry access and a complete Rust/native environment:

```bash
npm install
npm run version:check
npm run check
npm run lint
npm run format:check
npm run docs:check
npm run test
npm run build
npm run native:smoke

cd src-tauri
cargo fmt --check
cargo clippy --all-targets --all-features -- -D warnings
cargo test --all-targets
cargo run --release --example benchmark -- 16 5
```

Clarification: the dependency-free version/release-document algorithm and release-tag algorithm were exercised locally against the 2.0.12 identity. The list above refers to the complete clean repository suite from an actual repository checkout with dependencies/toolchains available. The three-OS native smoke workflow is intended to supply additional host compilation evidence after GitHub Actions executes it.

## Remaining external release gates

These are evidence/distribution tasks, not missing product source features:

1. Generate and review `package-lock.json` using npm in a registry-capable environment.
2. Generate and review `src-tauri/Cargo.lock` using Cargo in a Rust-enabled registry-capable environment.
3. Run the full clean frontend/Rust suite from the reviewed dependency graph.
4. Record the release benchmark with machine/OS/toolchain/input/iteration evidence.
5. Build packages from clean Windows, macOS, and Linux checkouts.
6. Install and manually exercise each generated artifact.
7. Complete native keyboard/screen-reader/reduced-motion/scaling acceptance.
8. Capture real screenshots from verified release candidates.
9. Configure Windows signing and Apple Developer ID/notarization where credentials are available.
10. Apply repository-admin branch protection/rules per `docs/branch-protection.md`.
11. Generate and verify `SHA256SUMS.txt` for the actual final artifacts.
12. Re-run release-candidate verification before publishing/tagging a stable binary release.

## Definition-of-done status

**Source-owned implementation for the current TextLens milestone, including 2.0.12 version preparation, stable report-schema compatibility, encoding-policy review, release identity gating, continuous Windows/macOS/Linux native compile smoke coverage, platform portability documentation, and documentation synchronization, is complete.**

**Stable cross-platform release evidence is not complete.** Do not claim TextLens 2.0.12 is fully packaged, signed/notarized, native-accessibility-verified, lockfile-reproducible, screenshot-verified, or bug-free across every supported desktop until the external gates above are actually executed and recorded.

---

**Made by the Sanskar**
# TextLens — Current Work Handoff

## Current milestone

Version **2.0.13** reproducible-release-evidence source milestone — updated 2026-08-26.

This continuation advances TextLens from the completed 2.0.12 source milestone to 2.0.13 with release reproducibility, real package-manager lockfiles, cross-platform evidence collection, CI efficiency, dependency-advisory visibility, regression-tested release tooling, deterministic Rust formatting/toolchain behavior, current GitHub Actions runtimes, and final-head CI repair.

The source work is implemented on `release/v2.0.13-reproducible-evidence` and proposed through PR #40. Stable binary release acceptance remains separate. Do not describe native installation, accessibility, signing/notarization, screenshot, security-advisory remediation, or final artifact verification as complete without real evidence.

## Repository state

- Repository: `sanskarIN/textlens`
- Default branch: `main`
- Working branch: `release/v2.0.13-reproducible-evidence`
- Pull request: `#40`
- Visibility: public
- License: MIT
- Primary stack: Rust + Tauri 2 + TypeScript + Vite
- Application version: `2.0.13`
- Report schema: `2`
- Settings backup schema: `2`
- Release Rust toolchain: `1.97.1`
- Real generated npm lockfile: `package-lock.json` — committed by release lock materialization commit `f4061fff52dac260ecf1f18b01cd4db47ceb9e9f`
- Real generated Cargo lockfile: `src-tauri/Cargo.lock` — committed by the same release lock materialization commit
- Commit identity observed on GitHub: `Sanskar <sanskarin@outlook.in>`
- Required visible credit: **Made by the Sanskar**

Application version and report-schema version remain independent. TextLens 2.0.13 continues to emit report schema v2 and retains documented schema-v1/schema-v2 import compatibility.

## 2.0.13 source work completed

### Reproducible dependency-lock preflight

Added `scripts/check-release-readiness.mjs` and:

```bash
npm run release:readiness
```

The dependency-free preflight requires reviewed, package-manager-generated:

- `package-lock.json`
- `src-tauri/Cargo.lock`

It validates basic lock structure, rejects obvious merge-conflict markers, checks npm root-version alignment when present, requires a Cargo lockfile format declaration, and prints SHA-256 fingerprints for both locks.

The previous source milestone intentionally did not fabricate these files. They are now real generated files: the clean Ubuntu dependency-lock workflow generated them with npm and Cargo, validated them, and materialized them into the release branch. The resulting files are therefore now available for locked CI/release validation rather than being synthetic fixtures.

### Reviewable dependency lock generation and materialization

Updated `.github/workflows/dependency-lock-candidate.yml`.

The clean-Ubuntu workflow now supports both manual review and the release-branch materialization path:

1. generates `package-lock.json` with npm using `--package-lock-only --ignore-scripts`;
2. generates `src-tauri/Cargo.lock` with Cargo;
3. validates both via `npm run release:readiness`;
4. validates Cargo manifest/lock alignment via `cargo metadata --locked --format-version 1 --no-deps`;
5. when running from `release/v2.0.13-reproducible-evidence`, commits the generated lockfiles only if they are not already tracked;
6. uploads both generated files as a temporary seven-day artifact for human review.

The auto-materialization path is restricted to the dedicated release branch and only runs when both lockfiles are missing from version control. It uses the repository `GITHUB_TOKEN` with `contents: write`. GitHub's workflow-token behavior prevents the bot-created lock commit from recursively launching another push workflow.

The real workflow run completed successfully, including npm lock generation, Cargo lock generation, readiness validation, locked Cargo metadata validation, lockfile materialization, and artifact upload. This produced commit `f4061fff52dac260ecf1f18b01cd4db47ceb9e9f`.

### Tagged release workflow hardened

`.github/workflows/release.yml` now requires before native packaging:

1. release tag/version identity;
2. application/release-document identity;
3. dependency-lock readiness;
4. `npm ci --no-audit --no-fund` from the committed npm lock;
5. `cargo metadata --locked --format-version 1 --no-deps` from the committed Cargo lock.

The previous release workflow used `npm install`, allowing a fresh dependency resolution during packaging. Version 2.0.13 removes that release-path ambiguity.

### Machine-readable build evidence

Added `scripts/write-build-evidence.mjs` and:

```bash
npm run release:evidence -- release-evidence/build.json
```

Evidence schema v1 records an explicit allowlist only:

- application version;
- capture timestamp;
- CI build status supplied by workflow configuration;
- GitHub commit/ref/repository/run identity when available;
- runner OS and architecture;
- Node/npm/rustc/Cargo availability/version strings;
- presence, size, and SHA-256 digest of the npm/Cargo locks.

It does not inspect analyzed documents, exported reports, TextLens settings, credentials, signing secrets, arbitrary environment variables, or user data.

Generated `release-evidence/` is ignored by Git.

### Checked-in release-tooling regressions

Added `scripts/release-tooling.test.mjs` and:

```bash
npm run release:tooling:test
```

The dependency-free Node test suite covers:

- missing npm/Cargo locks are rejected;
- structurally valid synthetic locks are accepted;
- exactly two SHA-256 lock fingerprints are emitted;
- npm root-version drift is rejected;
- build evidence records schema v1, application/build metadata, and valid 64-character lock digests.

The suite is wired into ordinary CI immediately after `npm run version:check` and **before** third-party npm dependency installation.

The exact checked-in test design was executed locally with Node and produced:

```text
# tests 4
# pass 4
# fail 0
# cancelled 0
# skipped 0
```

This is a real local result for the dependency-free release-tooling tests only; it is not a substitute for the full frontend/Rust/native suite.

### Cross-platform Release Candidate Audit workflow

Added `.github/workflows/release-candidate.yml` for manually dispatched clean-checkout evidence on:

- Ubuntu 22.04;
- GitHub-hosted Windows;
- GitHub-hosted macOS.

It performs release/version/lock gates, `npm ci`, Cargo locked validation, frontend type/lint/format/docs/test/build gates, Rust format/Clippy/tests with locked dependencies, native Tauri bundle attempts, per-platform evidence capture, and temporary artifact upload. Ubuntu additionally records the release-mode analyzer benchmark.

Successful automation does not prove manual installation, screen-reader behavior, scaling/reduced-motion acceptance, screenshot accuracy, signing/notarization, or final public artifact integrity.

### CI queue/concurrency hardening

Granular PR commits exposed redundant queued runs for stale revisions. Added `cancel-in-progress: true` concurrency groups to:

- `.github/workflows/ci.yml`
- `.github/workflows/security.yml`
- `.github/workflows/dependency-review.yml`

GitHub subsequently reported superseded previous revisions as `cancelled`, confirming the concurrency behavior is active.

### PR CI repair and deterministic toolchain stabilization

Real PR runs exposed several release-engineering defects that were fixed rather than bypassed:

- Vite 7 rejected the stale `@types/node@22.0.0` peer range. The project now uses published `@types/node@22.20.1`.
- `typescript@5.7.0` was not a published stable package. The project now pins the published 5.7 patch line at `5.7.3`.
- Vitest was discovering the Node-native `scripts/release-tooling.test.mjs` file. Frontend test commands are now scoped to `src`, while release-tooling regressions remain explicitly executed through `npm run release:tooling:test`.
- Added root `rust-toolchain.toml` pinning Rust `1.97.1` with `rustfmt` and `clippy`.
- CI, security audit, dependency-lock generation, release-candidate audit, and tagged release workflows now use the same Rust 1.97.1 toolchain policy.
- All Rust files reported by the pinned formatter were updated to its exact formatting output without intentional logic changes.
- The pinned Clippy run exposed three concrete final-head warnings: the unused production `write_report` test helper, the manual CR/LF character-pattern comparison, and the manual `sort_by` implementation in the line-ending dominant calculation.
- The unused report helper is now test-only, CR/LF trimming uses the Clippy-preferred character pattern, and dominant line-ending ranking uses stable `sort_by_key` with `Reverse`.
- The UTF-16 divisibility check deliberately retains the Rust-1.77-compatible modulo expression with a targeted Clippy allow and an explicit MSRV reason; the newer `is_multiple_of` API is not used because the crate's declared MSRV is older.

The exact earlier Clippy failure was inspected from the real GitHub job log and repaired directly. The final user-authored head must still be judged from its own fresh CI result rather than inferred from an earlier superseded revision.

### GitHub Actions runtime modernization

GitHub runner logs exposed Node-20 action-runtime deprecation warnings from `actions/checkout@v4` and `actions/setup-node@v4`.

The current workflows now use `actions/checkout@v7` and, where Node setup is required, `actions/setup-node@v7` across:

- ordinary CI;
- Security;
- Dependency Review;
- Dependency Lock Candidate;
- Release Candidate Audit;
- tagged Release.

`package-manager-cache: false` is explicit on setup-node v7 steps so release-sensitive workflows do not acquire implicit npm dependency caching behavior. Existing action-specific majors such as CodeQL, dependency review, Rust cache, upload-artifact, RustSec audit, and Tauri action were not changed merely for version-number uniformity.

### Security policy corrected and advisory handling documented

`SECURITY.md` now reflects the current support line:

- 2.0.x — supported;
- 0.1.x — best effort only;
- older — unsupported.

Dependency advisory triage now requires exact locked dependency-path review, keeps vulnerability/memory-safety/unsoundness findings as release-review blockers until patched or technically assessed, distinguishes unmaintained-package notices from proven exploitability, forbids silencing advisories just to obtain green CI, and prefers supported upstream migration/remediation.

### Current RustSec findings remain visible

The scheduled Rust audit opened public tracking issues on 2026-08-24, including `RUSTSEC-2024-0429` for an affected `glib` version plus several unmaintained GTK3/UNIC ecosystem dependencies.

The newly generated Cargo lock confirms the GTK3/GLib dependency family is still present in the resolved graph; the lockfile therefore makes the exact release graph reviewable instead of leaving the audit to an unlocked dependency guess. This milestone still does **not** claim those transitive findings are fixed. No advisory was suppressed and no incompatible transitive version was forced simply for CI cosmetics.

The stable binary release remains blocked until the locked RustSec audit identifies each release-relevant advisory path and the supported upstream remediation or documented technical assessment is complete. Unmaintained-package notices remain distinguishable from proven exploitable vulnerabilities, but they are still part of release review.

### Version and documentation synchronized

Application version is `2.0.13` in:

- `package.json`
- `src-tauri/Cargo.toml`
- `src-tauri/tauri.conf.json`

Added:

- `docs/release-evidence.md`
- `docs/releases/v2.0.13.md`

Updated:

- `README.md`
- `CHANGELOG.md`
- `ROADMAP.md`
- `SECURITY.md`
- `docs/release.md`
- `.github/RELEASE_TEMPLATE.md`
- `what_changed.md`

README identifies source version 2.0.13, CHANGELOG has a 2.0.13 release section, and the matching version-specific release-note file exists. Report schema remains v2.

## Verification actually performed

Actually performed in this continuation:

- inspected the connected GitHub repository at the merged 2.0.12 baseline;
- inspected release/security workflows, version metadata, roadmap, release guide, and prior handoff;
- inspected current public RustSec tracking issues;
- confirmed the release branch initially lacked real npm/Cargo locks rather than pretending reproducibility already existed;
- exercised the release-readiness algorithm against missing-lock and valid synthetic-lock cases;
- exercised the build-evidence writer against synthetic locks;
- added and executed the checked-in dependency-free release-tooling regressions: **4 passed, 0 failed**;
- synchronized npm/Cargo/Tauri application identity to 2.0.13;
- synchronized release/security/documentation metadata;
- created PR #40 with granular commits and confirmed GitHub reports it mergeable;
- observed a real GitHub install failure from the stale Vite/Node type peer combination and corrected the dependency pin;
- observed a real GitHub install failure from the unpublished TypeScript 5.7.0 pin and corrected it to 5.7.3;
- observed a later real frontend run pass version sync, release-tooling tests, npm install, typecheck, lint, formatting, documentation checks, application tests, and production build;
- observed that same revision pass pinned `cargo fmt --check` after formatter repairs;
- inspected the actual pinned Clippy failure log and repaired all three reported warnings instead of weakening `-D warnings`;
- observed real CodeQL and Dependency Review success on the repaired PR revisions;
- verified the workflow concurrency controls cancel superseded PR revisions rather than wasting runners;
- migrated checkout/setup-node workflow usage to current v7 runtime actions after runner deprecation warnings exposed the older action runtime;
- generated real `package-lock.json` and `src-tauri/Cargo.lock` on GitHub's clean Ubuntu runner;
- passed `npm run release:readiness` against those generated locks;
- passed `cargo metadata --locked --format-version 1 --no-deps` against the generated Cargo lock;
- automatically materialized the reviewed lock candidates into the release branch as commit `f4061fff52dac260ecf1f18b01cd4db47ceb9e9f`;
- verified the materialization workflow itself completed successfully, including its lock-generation, validation, commit, and artifact-upload steps;
- statically reviewed the PR patches for the new release scripts and major release workflows.

The local container could not clone GitHub because external DNS/network resolution was unavailable. Repository reads/writes were performed through the connected GitHub integration. No unavailable local-checkout, registry, Cargo, or native-platform result is represented as completed.

## Checks not yet truthfully completed on the final user-authored head

The release-specific locked suite is no longer blocked by missing lockfiles. It now needs a fresh final-head run against the committed real locks:

```bash
npm run release:readiness
npm ci --no-audit --no-fund
npm run check
npm run lint
npm run format:check
npm run docs:check
npm run test
npm run build

cd src-tauri
cargo metadata --locked --format-version 1 --no-deps
cargo fmt --check
cargo clippy --locked --all-targets --all-features -- -D warnings
cargo test --locked --all-targets
cargo run --locked --release --example benchmark -- 16 5
```

The automatic lock materialization commit was created by `github-actions[bot]`, and GitHub marked the immediately triggered PR Security/Dependency Review checks as `action_required`. A subsequent user-authored `what_changed.md` commit is therefore required so the final PR head receives fresh ordinary CI/Security/Dependency Review evaluation rather than treating the bot-authored revision as the final proof.

The current real Cargo lock also makes the GTK3/GLib advisory path concrete. The security workflow must be allowed to run against that exact graph before the release can claim advisory status.

## Remaining work after 2.0.13 source preparation

1. Commit this updated handoff as a user-authored revision so the final PR head receives fresh CI/Security/Dependency Review runs.
2. Require the final PR #40 head to pass ordinary CI, Security, and Dependency Review.
3. Run `npm run release:readiness` on the final head and confirm both committed lockfiles remain aligned with manifests.
4. Run the complete frontend/Rust suite from the reviewed locked graph.
5. Re-run Rust dependency/security auditing against the committed Cargo lock and identify every release-relevant advisory path.
6. Resolve or explicitly assess vulnerability/unsoundness blockers using supported upstream fixes; never suppress them for CI cosmetics.
7. Run the Release Candidate Audit successfully on Ubuntu, Windows, and macOS.
8. Retain/review platform evidence JSON and benchmark evidence.
9. Install and manually exercise every candidate package.
10. Complete native keyboard, screen-reader, scaling, and reduced-motion acceptance.
11. Capture real screenshots from verified packages.
12. Configure Windows signing and Apple Developer ID/notarization where credentials are available.
13. Apply repository-admin branch protection/rules per governance documentation.
14. Collect final public artifacts and generate/verify `SHA256SUMS.txt`.
15. Re-run final release acceptance before publishing stable `v2.0.13` binaries.

## Definition-of-done status

**The TextLens 2.0.13 source-owned reproducible-release-evidence milestone is prepared in PR #40, including real generated npm/Cargo lockfiles, checked-in regression coverage for the new release tooling, deterministic Rust toolchain behavior, CI repairs discovered by real runner execution, current GitHub Actions checkout/setup runtimes, and direct repair of the final pinned Clippy warnings.**

**Stable TextLens 2.0.13 binary release evidence is not complete.** The new controls deliberately make dependency, advisory, native-platform, accessibility, signing, screenshot, and checksum work visible and enforceable.

PR-level CI must be treated according to its actual final result. A queued, action-required, in-progress, failing, or advisory-producing job must never be rewritten as passing.

---

**Made by the Sanskar**

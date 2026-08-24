# TextLens — Current Work Handoff

## Current milestone

Version **2.0.13** reproducible-release-evidence source milestone — 2026-08-24.

This continuation advances TextLens from the completed 2.0.12 source milestone to 2.0.13 with release reproducibility, cross-platform evidence collection, CI efficiency, dependency-advisory visibility, and regression-tested release tooling.

The source work is implemented on `release/v2.0.13-reproducible-evidence` and proposed through PR #40. Stable binary release acceptance remains separate. Do not describe package-manager, native installation, accessibility, signing/notarization, screenshot, security-advisory remediation, or final artifact verification as complete without real evidence.

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

The real repository still lacks those files. They were not fabricated. Tagged binary packaging is intentionally designed to remain blocked until real npm/Cargo output is generated, reviewed, and committed.

### Review-only dependency lock generation

Added `.github/workflows/dependency-lock-candidate.yml`.

The manually dispatched clean-Ubuntu workflow:

1. generates `package-lock.json` with npm using `--package-lock-only --ignore-scripts`;
2. generates `src-tauri/Cargo.lock` with Cargo;
3. validates both via `npm run release:readiness`;
4. validates Cargo manifest/lock alignment via `cargo metadata --locked --format-version 1 --no-deps`;
5. uploads both files as a temporary seven-day artifact for human review.

Repository permissions are read-only. The workflow deliberately cannot auto-commit or push supply-chain changes.

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

GitHub subsequently reported the superseded previous revision's CI, Security, and Dependency Review runs as `cancelled`, confirming the new concurrency behavior is active.

### Security policy corrected and advisory handling documented

`SECURITY.md` now reflects the current support line:

- 2.0.x — supported;
- 0.1.x — best effort only;
- older — unsupported.

Dependency advisory triage now requires exact locked dependency-path review, keeps vulnerability/memory-safety/unsoundness findings as release-review blockers until patched or technically assessed, distinguishes unmaintained-package notices from proven exploitability, forbids silencing advisories just to obtain green CI, and prefers supported upstream migration/remediation.

### Current RustSec findings remain visible

The scheduled Rust audit opened public tracking issues on 2026-08-24, including `RUSTSEC-2024-0429` for an affected `glib` version plus several unmaintained GTK3/UNIC ecosystem dependencies.

This milestone does **not** claim those transitive findings are fixed. No advisory was suppressed and no incompatible transitive version was forced simply for CI cosmetics. The real Cargo lockfile must be generated and reviewed before the exact dependency paths and supported remediation can be assessed.

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
- confirmed npm/Cargo lockfiles remain absent instead of pretending reproducibility already exists;
- exercised the release-readiness algorithm against missing-lock and valid synthetic-lock cases;
- exercised the build-evidence writer against synthetic locks;
- added and executed the checked-in dependency-free release-tooling regressions: **4 passed, 0 failed**;
- synchronized npm/Cargo/Tauri application identity to 2.0.13;
- synchronized release/security/documentation metadata;
- created PR #40 with granular commits and confirmed GitHub reports it mergeable;
- observed real GitHub CI/Security/Dependency Review runs queued for the final PR revisions;
- confirmed concurrency changes cancel superseded revisions rather than wasting runners;
- statically reviewed the PR patches for the new release scripts and major release workflows.

The local container could not clone GitHub because external DNS/network resolution was unavailable. Repository reads/writes were performed through the connected GitHub integration. No unavailable local-checkout, registry, Cargo, or native-platform result is represented as completed.

## Checks not yet truthfully completed

The release-specific locked suite remains blocked until real lockfiles are generated and committed:

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

The ordinary PR workflows are separate. Their final GitHub runner outcome must be recorded according to the actual result; `queued` is not equivalent to `passed`.

## Remaining work after 2.0.13 source preparation

1. Run the Dependency Lock Candidate workflow or equivalent npm/Cargo commands in a registry-capable environment.
2. Review `package-lock.json` and `src-tauri/Cargo.lock` before commit.
3. Commit reviewed locks and pass `npm run release:readiness` against the real repository state.
4. Re-run Rust dependency/security auditing against the committed Cargo lock and identify every release-relevant advisory path.
5. Resolve or explicitly assess vulnerability/unsoundness blockers using supported upstream fixes; never suppress them for CI cosmetics.
6. Run the complete frontend/Rust suite from the reviewed locked graph.
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

**The TextLens 2.0.13 source-owned reproducible-release-evidence milestone is prepared in PR #40, including checked-in regression coverage for the new release tooling.**

**Stable TextLens 2.0.13 binary release evidence is not complete.** The new controls deliberately make missing dependency, advisory, native-platform, accessibility, signing, screenshot, and checksum work visible and enforceable.

PR-level CI must be treated according to its actual final result. A queued or failing security/advisory job must never be rewritten as passing.

---

**Made by the Sanskar**

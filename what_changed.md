# TextLens — Current Work Handoff

## Current milestone

Version **2.0.13** reproducible-release-evidence source milestone — 2026-08-24.

This continuation advances TextLens from the completed 2.0.12 source milestone to a 2.0.13 source milestone focused on reproducible dependency state, cross-platform release evidence, CI efficiency, and explicit dependency-advisory release gates.

The source changes are implemented on `release/v2.0.13-reproducible-evidence` and proposed through PR #40. Stable binary release acceptance remains separate: do not describe package-manager, native installation, accessibility, signing/notarization, screenshot, security-advisory remediation, or final artifact checks as complete without real evidence.

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
- Required visible credit: **Made by the Sanskar**

Application version and report-schema version remain independent. TextLens 2.0.13 continues to emit report schema v2 and retains the documented valid schema-v1/schema-v2 import behavior.

## 2.0.13 source work completed

### Reproducible dependency-lock preflight

Added `scripts/check-release-readiness.mjs` and:

```bash
npm run release:readiness
```

The dependency-free preflight requires reviewed, package-manager-generated:

- `package-lock.json`
- `src-tauri/Cargo.lock`

It validates basic lock structure, rejects obvious merge-conflict markers, checks npm root-version alignment when available, and prints SHA-256 fingerprints for both dependency locks.

The repository intentionally does not contain fabricated lockfiles. Until real npm/Cargo output is generated, reviewed, and committed, tagged binary packaging is designed to remain blocked.

### Review-only Dependency Lock Candidate workflow

Added `.github/workflows/dependency-lock-candidate.yml`.

This manually dispatched workflow runs on a clean Ubuntu GitHub runner and:

1. generates `package-lock.json` with npm using `--package-lock-only --ignore-scripts`;
2. generates `src-tauri/Cargo.lock` with Cargo;
3. validates both using `npm run release:readiness`;
4. validates Cargo manifest/lock alignment with `cargo metadata --locked --format-version 1 --no-deps`;
5. uploads the two files as a temporary seven-day artifact for human review.

Repository permissions are read-only. The workflow deliberately does not auto-commit or push supply-chain changes.

### Tagged release workflow hardened

`.github/workflows/release.yml` now checks, in order:

1. release tag/version identity;
2. application/release-document version identity;
3. dependency-lock readiness;
4. `npm ci --no-audit --no-fund` from the committed npm lock;
5. `cargo metadata --locked --format-version 1 --no-deps` from the committed Cargo lock;
6. native Tauri packaging.

The previous tag workflow used `npm install`, which could resolve a fresh dependency graph during packaging. Version 2.0.13 prevents that release behavior.

### Machine-readable build evidence

Added `scripts/write-build-evidence.mjs` and:

```bash
npm run release:evidence -- release-evidence/build.json
```

Evidence schema version 1 records only an explicit allowlist:

- application version;
- capture timestamp;
- CI build status supplied by the workflow;
- GitHub commit/ref/repository/run identity when GitHub Actions supplies it;
- runner operating system and architecture;
- Node/npm/rustc/Cargo version or availability information;
- presence, size, and SHA-256 digest of the npm and Cargo lockfiles.

It does not inspect analyzed documents, reports, TextLens settings, credentials, signing secrets, arbitrary environment variables, or user data.

Generated `release-evidence/` output is ignored by Git.

### Cross-platform Release Candidate Audit workflow

Added `.github/workflows/release-candidate.yml`, manually dispatched across:

- Ubuntu 22.04;
- GitHub-hosted Windows;
- GitHub-hosted macOS.

It performs dependency/version gates, `npm ci`, Cargo locked validation, frontend type/lint/format/docs/test/build gates, Rust format/Clippy/tests with locked dependencies, native Tauri bundle attempts, per-platform build-evidence capture, and temporary artifact upload. Ubuntu additionally records the release-mode synthetic analyzer benchmark.

The workflow is evidence collection, not automatic release approval. Native package installation, assistive-technology acceptance, screenshots, signing/notarization, and final checksum verification remain manual evidence tasks.

### CI queue/concurrency hardening

During PR preparation, granular commits exposed that CI, Security, and Dependency Review could accumulate redundant runs for stale revisions of the same pull request.

Added GitHub Actions concurrency groups with `cancel-in-progress: true` to:

- `.github/workflows/ci.yml`;
- `.github/workflows/security.yml`;
- `.github/workflows/dependency-review.yml`.

This keeps the newest PR/ref revision authoritative and avoids wasting runner capacity on superseded revisions.

### Security policy corrected and advisory handling documented

`SECURITY.md` previously described the old 0.1.x development line as current. It now states:

- 2.0.x — supported;
- 0.1.x — best effort only;
- older — unsupported.

Dependency advisory triage now requires:

- real dependency-path confirmation from a reviewed Cargo lockfile;
- vulnerability/memory-safety/unsoundness findings to remain release-review blockers until patched or supported by a documented technical non-applicability assessment;
- unmaintained-package advisories to receive dependency-path/upstream migration review;
- advisories not to be suppressed solely to obtain a green workflow;
- supported upstream fixes to be preferred over unsafe forced transitive versions;
- unresolved release-relevant findings to remain visible in release documentation.

### Current RustSec issues are not hidden or falsely closed

The scheduled Rust dependency audit opened multiple public RustSec issues on 2026-08-24, including `RUSTSEC-2024-0429` for an affected `glib` version and several unmaintained GTK3/UNIC ecosystem packages.

This milestone does **not** claim those transitive findings are fixed. The exact locked dependency graph and supported upstream remediation must be established first. No advisory was suppressed and no incompatible transitive version was forced simply to make automation green.

### Documentation/release metadata synchronized

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

The release docs now distinguish automated build evidence from real manual acceptance and explicitly track reviewed dependency locks, lock fingerprints, security advisories, platform evidence, accessibility, screenshots, signing/notarization, and final checksums.

### Version identity synchronized

Application version is `2.0.13` in:

- `package.json`
- `src-tauri/Cargo.toml`
- `src-tauri/tauri.conf.json`

README identifies the current source version as 2.0.13, CHANGELOG contains the 2.0.13 release section, and `docs/releases/v2.0.13.md` exists, satisfying the intended inputs of the existing dependency-free version synchronization gate.

## Verification actually performed in this continuation

Actually performed:

- inspected the connected GitHub repository at the merged 2.0.12 baseline;
- inspected current version metadata, roadmap, release workflow, security workflow, release guide, and handoff;
- inspected current open RustSec tracking issues;
- confirmed `package-lock.json` and `src-tauri/Cargo.lock` are absent rather than pretending reproducibility already exists;
- exercised the new dependency-lock preflight locally against a missing-lock case and observed the intended failure;
- exercised the preflight locally against structurally valid synthetic npm/Cargo lock fixtures and observed success plus SHA-256 fingerprints;
- exercised the build-evidence writer locally against synthetic lockfiles and verified schema version 1 plus 64-character SHA-256 dependency-lock digests;
- synchronized npm, Cargo, Tauri, README, changelog, roadmap, release notes, release guide, release evidence documentation, security policy, and release checklist;
- created PR #40 with granular commits rather than collapsing the work into a single source change;
- confirmed GitHub reports PR #40 as mergeable;
- observed GitHub CI, Security, and Dependency Review runs being queued for the PR revisions;
- added workflow concurrency so superseded revisions are cancelled instead of continuing to consume runners.

The local container could not clone GitHub because external DNS/network resolution was unavailable there. Repository reads/writes were therefore performed through the connected GitHub integration. No local-checkout or registry-dependent success claim is fabricated.

## Checks not yet truthfully completed

The real repository still needs package-manager-generated locks before the release-specific locked suite can pass:

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

The ordinary PR workflows are separate from the release-specific lock gate. Their actual GitHub runner outcome must be recorded when available; queued is not equivalent to passed.

## Remaining work after source preparation

1. Run the Dependency Lock Candidate workflow or equivalent real npm/Cargo commands in a registry-capable environment.
2. Review the generated `package-lock.json` and `src-tauri/Cargo.lock` dependency changes before commit.
3. Commit reviewed locks and pass `npm run release:readiness` against the real repository state.
4. Re-run Rust dependency/security auditing against the committed Cargo lock and identify the exact path/status of each release-relevant RustSec issue.
5. Resolve or explicitly assess vulnerability/unsoundness blockers using supported upstream fixes; do not suppress them for CI cosmetics.
6. Run the complete frontend/Rust suite from the reviewed locked graph.
7. Run the Release Candidate Audit successfully on Ubuntu, Windows, and macOS.
8. Retain/review three platform evidence JSON files and benchmark evidence.
9. Install and manually exercise each Windows/macOS/Linux candidate package.
10. Complete native keyboard, screen-reader, scaling, and reduced-motion acceptance.
11. Capture real screenshots from verified packages.
12. Configure Windows signing and Apple Developer ID/notarization where credentials are available.
13. Apply repository-admin branch protection/rules per repository governance documentation.
14. Collect final public artifacts and generate/verify `SHA256SUMS.txt`.
15. Re-run final release acceptance before publishing a stable `v2.0.13` binary release.

## Definition-of-done status

**The TextLens 2.0.13 source-owned reproducible-release-evidence milestone is prepared in PR #40.**

**Stable TextLens 2.0.13 binary release evidence is not complete.** The new source controls make the missing dependency, advisory, native-platform, accessibility, signing, screenshot, and checksum work explicit and enforceable instead of hiding it.

PR-level CI must be treated according to its actual final result. A queued or failing security/advisory job must never be rewritten as a passing result.

---

**Made by the Sanskar**

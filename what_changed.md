# TextLens — Current Work Handoff

## Current milestone

Version **2.0.13** reproducible-release-evidence source milestone — 2026-08-24.

This continuation prepares the next TextLens source version after 2.0.12. The focus is release reproducibility, cross-platform evidence collection, dependency-advisory visibility, and preventing a tagged binary build from silently resolving an unreviewed dependency graph.

The source-side preparation described below is implemented on `release/v2.0.13-reproducible-evidence`. Stable binary release acceptance is deliberately separate and remains incomplete until real dependency lockfiles, native packages, manual platform acceptance, accessibility evidence, signing/notarization where applicable, and final artifact checksums exist.

## Repository state

- Repository: `sanskarIN/textlens`
- Default branch: `main`
- Working branch: `release/v2.0.13-reproducible-evidence`
- Visibility: public
- License: MIT
- Primary stack: Rust + Tauri 2 + TypeScript + Vite
- Application version: `2.0.13`
- Report schema: `2`
- Settings backup schema: `2`
- Required visible credit: **Made by the Sanskar**

Application version and report-schema version remain independent. TextLens 2.0.13 continues to emit report schema v2 and retains valid schema-v1/schema-v2 report import compatibility.

## Version 2.0.13 work completed in this continuation

### Reproducible dependency-lock preflight

Added `scripts/check-release-readiness.mjs` and the npm command:

```bash
npm run release:readiness
```

The dependency-free preflight requires both package-manager-generated release locks:

- `package-lock.json`
- `src-tauri/Cargo.lock`

The preflight:

- rejects a missing npm or Cargo lockfile;
- validates the npm lockfile as JSON;
- accepts supported npm lockfile format versions 2 and 3;
- checks the npm root package version when that value is present;
- requires a Cargo lockfile format-version declaration;
- rejects obvious merge-conflict markers in either lockfile;
- prints SHA-256 fingerprints for both dependency locks when the gate succeeds.

The repository still does not contain these lockfiles because this environment cannot truthfully generate and review them from the real npm/Cargo registries. They are intentionally not hand-authored. As a result, a tagged 2.0.13 binary build is expected to remain blocked until the real package-manager output is committed and reviewed.

### Tagged release workflow hardened

`.github/workflows/release.yml` now performs release checks before native packaging:

1. release tag/version validation;
2. application/release-document version validation;
3. dependency-lock readiness validation;
4. `npm ci --no-audit --no-fund` from the committed npm lockfile;
5. `cargo metadata --locked --format-version 1 --no-deps` from `src-tauri`.

The previous release workflow used `npm install`, which could resolve a fresh dependency graph during release packaging. Version 2.0.13 changes this to a reviewed-lock workflow.

The Windows, macOS, and Linux tag matrix still creates a draft release rather than publishing immediately. It now also attempts to capture per-platform machine-readable build evidence after each packaging attempt.

### Machine-readable build evidence

Added `scripts/write-build-evidence.mjs` and the npm command:

```bash
npm run release:evidence -- release-evidence/build.json
```

Evidence schema version 1 records only an explicit build-metadata allowlist:

- TextLens application version;
- capture timestamp;
- CI build status supplied by the workflow;
- GitHub commit/ref/repository/run identity when provided by GitHub Actions;
- runner operating system and architecture;
- Node, npm, rustc, and Cargo version/availability data;
- presence, byte size, and SHA-256 digest of the npm and Cargo lockfiles.

The writer does not inspect analyzed documents, exported reports, TextLens settings, credentials, signing secrets, arbitrary environment variables, or local user data.

Generated `release-evidence/` output is excluded through `.gitignore`.

### Cross-platform Release Candidate Audit workflow

Added `.github/workflows/release-candidate.yml` as a manually dispatched clean-checkout evidence workflow.

It runs independently on:

- Ubuntu 22.04;
- GitHub-hosted Windows;
- GitHub-hosted macOS.

The workflow performs:

- version/release-document validation;
- dependency-lock readiness validation;
- `npm ci`;
- Cargo locked-manifest validation;
- frontend TypeScript checks;
- ESLint;
- deterministic formatting check;
- documentation-link check;
- frontend tests;
- frontend production build;
- Rust formatting check;
- Rust Clippy with warnings denied and `--locked`;
- Rust tests with `--locked`;
- native Tauri bundle build;
- machine-readable evidence capture;
- temporary CI artifact upload containing evidence and produced native bundles.

Ubuntu also records the existing release-mode synthetic analyzer benchmark.

This workflow is an evidence collector. It does not turn successful automation into an unsupported claim that native installation, accessibility, screenshots, signing, notarization, or runtime acceptance have been manually verified.

### Release evidence contract documented

Added `docs/release-evidence.md` documenting:

- the lockfile preflight contract;
- why lockfiles must come from npm/Cargo rather than being hand-authored;
- the Release Candidate Audit workflow;
- the build-evidence JSON boundary;
- the tagged release evidence behavior;
- manual platform acceptance that automation cannot replace;
- the dependency-advisory release gate.

### Security policy corrected and strengthened

`SECURITY.md` previously described the obsolete `0.1.x` line as the actively supported version. It now reflects the current project state:

- `2.0.x` — supported;
- `0.1.x` — best effort only;
- older lines — unsupported.

Dependency advisory triage now requires:

- confirmation of the affected dependency path from a real reviewed Cargo lockfile;
- vulnerability, memory-safety, and unsoundness advisories to remain release-review blockers until patched or supported by a documented technical non-applicability assessment;
- unmaintained-package advisories to receive dependency-path/upstream migration review rather than being automatically described as exploitable vulnerabilities;
- advisories not to be ignored solely to make automation green;
- supported upstream dependency updates to be preferred over unsafe forced-version workarounds;
- unresolved release-relevant advisories to remain visible in release notes.

### Current Rust dependency advisories retained as open work

The scheduled Rust audit opened public RustSec tracking issues on 2026-08-24. These include the `glib` unsoundness advisory `RUSTSEC-2024-0429` and several unmaintained GTK3/UNIC ecosystem dependency notices.

Version 2.0.13 does **not** claim that these transitive dependency findings are fixed. The real Cargo lockfile must first be generated and audited so the exact dependency paths and available supported upstream migrations can be reviewed without guessing.

No advisory was suppressed and no incompatible transitive version was forced merely to obtain a green status.

### Release guide and checklist expanded

`docs/release.md` now documents:

- the 2.0.13 tag identity;
- the required dependency-lock gate;
- `npm ci` and Cargo `--locked` behavior;
- the Release Candidate Audit process;
- release evidence interpretation;
- dependency advisory review before a public binary release;
- manual acceptance and checksum requirements.

`.github/RELEASE_TEMPLATE.md` now explicitly records:

- reviewed npm/Cargo lockfiles;
- dependency-lock fingerprints;
- `npm ci` success;
- Cargo locked-manifest validation;
- Release Candidate Audit results;
- per-platform evidence artifacts;
- open dependency advisories;
- native accessibility/scaling acceptance;
- signing/notarization status;
- real screenshots;
- final checksum manifest evidence.

### Roadmap synchronized

`ROADMAP.md` now contains a dedicated **2.0.13 reproducible release evidence milestone**.

Completed source-owned work is checked separately from external evidence that still needs real platform/package-manager execution.

### Application version synchronized

Version metadata is now aligned at `2.0.13` in:

- `package.json`;
- `src-tauri/Cargo.toml`;
- `src-tauri/tauri.conf.json`.

The runtime About UI continues to use packaged Tauri version metadata.

### Release documentation synchronized

Added:

```text
docs/releases/v2.0.13.md
```

Updated:

- `README.md` — current source version, release-readiness/evidence commands, Release Candidate Audit documentation link, and report-schema statement;
- `CHANGELOG.md` — `[2.0.13] - 2026-08-24` release section and reset `[Unreleased]` section;
- `ROADMAP.md` — new 2.0.13 source/external gate split;
- `SECURITY.md` — current supported version and advisory policy;
- `docs/release.md` — reproducible release procedure;
- `.github/RELEASE_TEMPLATE.md` — expanded acceptance/evidence checklist;
- this handoff.

## Source-side verification actually performed

The following work was actually performed during this continuation:

- inspected the connected GitHub repository, current 2.0.12 source state, latest commits, roadmap, release guide, release automation, security policy, package metadata, and current handoff;
- inspected current open GitHub issues and identified the newly opened RustSec dependency findings;
- confirmed the repository does not contain `package-lock.json` or `src-tauri/Cargo.lock` and did not fabricate either file;
- confirmed the previous tag workflow used `npm install` and lacked a committed-lock release gate;
- exercised the new release-readiness algorithm locally with a missing-lock fixture and observed the intended failure;
- exercised the release-readiness algorithm locally with structurally valid synthetic npm/Cargo lock fixtures and observed success plus SHA-256 fingerprints;
- exercised the build-evidence writer locally with synthetic lockfiles and verified evidence schema version 1 plus 64-character SHA-256 dependency-lock digests;
- synchronized npm/Cargo/Tauri application metadata to 2.0.13;
- synchronized README, changelog, roadmap, release guide, security policy, release template, version-specific release notes, release-evidence documentation, and this handoff.

The local container could not clone GitHub because external DNS/network resolution is unavailable there. GitHub repository reads/writes were therefore performed through the connected GitHub integration rather than pretending a local checkout was available.

## Verification intentionally not claimed yet

The following are not complete in this environment:

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

The dependency-lock readiness command is expected to fail against the real repository until the missing real lockfiles are generated and committed. That is now intentional release behavior rather than an undocumented gap.

## Remaining release work after the 2.0.13 source milestone

These are evidence, dependency-resolution, distribution, or repository-administration tasks rather than missing core TextLens product source features:

1. Generate `package-lock.json` with npm in a registry-capable environment and review the resulting dependency graph.
2. Generate `src-tauri/Cargo.lock` with Cargo in a Rust/registry-capable environment and review the resulting dependency graph.
3. Commit both reviewed lockfiles and run `npm run release:readiness` against the real repository state.
4. Re-run Rust dependency/security auditing against the real Cargo lockfile and identify the exact dependency path/status of each current RustSec issue.
5. Resolve or explicitly assess all release-relevant vulnerability/unsoundness advisories using supported upstream fixes; do not suppress them simply to pass CI.
6. Run the complete frontend and Rust quality suite from the reviewed locked dependency graph.
7. Run the manual Release Candidate Audit workflow successfully on Ubuntu, Windows, and macOS.
8. Retain and review the three platform build-evidence files and Ubuntu benchmark evidence.
9. Install and manually exercise each generated Windows, macOS, and Linux candidate package.
10. Complete native keyboard, screen-reader, scaling, and reduced-motion acceptance.
11. Capture real screenshots from the verified release candidates.
12. Configure Windows code signing and Apple Developer ID/notarization where credentials are available.
13. Apply repository-admin branch protection/rules per the repository governance documentation.
14. Collect final public release artifacts and generate/verify `SHA256SUMS.txt`.
15. Re-run final release-candidate acceptance before publishing a stable `v2.0.13` binary release.

## Definition-of-done status

**The source-owned TextLens 2.0.13 reproducible-release-evidence milestone is prepared on its release branch.**

**A stable TextLens 2.0.13 binary release is not yet proven or ready to be described as fully verified.** The new source controls deliberately make the missing dependency-lock and native-evidence work visible and enforceable rather than hiding it.

The next repository step is branch-level CI/PR verification. Any observed CI result must be recorded as evidence; a failing security/advisory job must not be silently bypassed or rewritten as success.

---

**Made by the Sanskar**

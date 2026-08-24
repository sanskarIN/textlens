# Release Evidence

TextLens separates automated build evidence from manual release acceptance. A successful CI job proves only the checks that the job actually ran; it does not prove installation behavior, native accessibility, signing, notarization, or screenshot accuracy.

## Reproducible dependency preflight

Tagged releases and release-candidate audits must pass:

```bash
npm run release:readiness
```

The dependency-free preflight requires both of these reviewed, committed files:

- `package-lock.json`
- `src-tauri/Cargo.lock`

The check validates that the npm lockfile is parseable and supported, rejects obvious merge-conflict markers, verifies the root npm version when present, checks the Cargo lockfile format marker, and prints SHA-256 fingerprints for both lockfiles.

Never hand-author either lockfile. Generate them with npm and Cargo in a registry-capable environment, review the dependency diff, then commit the generated files.

The tagged release workflow additionally uses `npm ci` and `cargo metadata --locked` so a release cannot silently proceed from an unlocked dependency graph.

## Dependency Lock Candidate workflow

When a local environment cannot reach both registries/toolchains, `.github/workflows/dependency-lock-candidate.yml` can be dispatched manually to generate a review candidate on a clean Ubuntu runner.

It:

1. generates `package-lock.json` with npm using `--package-lock-only --ignore-scripts`;
2. generates `src-tauri/Cargo.lock` with Cargo;
3. runs `npm run release:readiness` against the generated files;
4. runs `cargo metadata --locked --format-version 1 --no-deps`;
5. uploads both lockfiles as a temporary seven-day artifact.

The workflow has read-only repository permissions and intentionally does **not** commit, push, or open a pull request. Dependency-lock changes are supply-chain changes and must be reviewed before they enter source control. After review, commit the package-manager output normally and let the ordinary CI/security workflows assess the resulting graph.

## Release Candidate Audit workflow

`.github/workflows/release-candidate.yml` is a manually dispatched clean-checkout audit for:

- Ubuntu 22.04;
- current GitHub-hosted Windows;
- current GitHub-hosted macOS.

Each platform verifies version metadata and dependency locks, installs from the committed npm lockfile, validates the Cargo lockfile, runs frontend quality gates, runs Rust formatting/lint/tests, and attempts a native Tauri bundle build. Ubuntu also records the release-mode synthetic benchmark.

The workflow uploads generated bundles plus machine-readable evidence for review. These artifacts are temporary CI evidence, not automatically approved public release artifacts.

## Machine-readable build evidence

Generate evidence locally or in CI with:

```bash
npm run release:evidence -- release-evidence/build.json
```

Evidence schema version 1 records only build/repository metadata:

- application version;
- capture timestamp;
- build/job status supplied by the workflow;
- Git commit/ref/run identity when GitHub Actions provides it;
- runner operating system and architecture;
- Node, npm, rustc, and Cargo availability/version strings;
- presence, size, and SHA-256 digest of the npm and Cargo lockfiles.

The writer does not read analyzed documents, reports, settings, credentials, signing secrets, home-directory paths, or environment variables other than the small explicit GitHub runner/build-status allowlist used in the output structure.

`release-evidence/` is ignored by Git so generated evidence is not accidentally committed as permanent source state.

## Tagged release workflow

`.github/workflows/release.yml` remains tag-triggered and creates a draft release. Before native packaging it now requires:

1. tag/version identity;
2. version/release-document identity;
3. committed dependency locks;
4. `npm ci` from the npm lockfile;
5. `cargo metadata --locked` against the Cargo lockfile.

After each matrix attempt, the workflow records and uploads build evidence even when the native packaging step fails. A draft must not be published solely because all three automated matrix jobs succeeded.

## Manual acceptance that automation does not replace

For every platform intended for public distribution, retain evidence for:

- installation and launch from the produced package;
- offline core analysis behavior;
- keyboard navigation and documented shortcuts;
- native screen-reader behavior;
- reduced-motion and scaling behavior;
- report/settings import and export smoke tests;
- privacy-sensitive update-link behavior;
- real screenshots from the verified candidate;
- signing/notarization status where credentials are available;
- final artifact SHA-256 manifest generation and verification.

Record failures as release blockers or documented limitations. Do not convert an unchecked item into a success claim without actual evidence.

## Security advisory gate

The scheduled Rust dependency audit may discover advisories in transitive platform libraries. Security/unsoundness advisories remain release-review items until the dependency path and available upstream fix are understood. Unmaintained-package notices also require dependency-path/upstream review; they are not to be suppressed merely to make automation green.

See `SECURITY.md` for the dependency-advisory triage policy and `docs/release.md` for the complete release procedure.

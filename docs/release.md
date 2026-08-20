# Release Guide

## Version alignment

Keep these aligned:

- `package.json`
- `package-lock.json`
- `src-tauri/Cargo.toml`
- `src-tauri/Cargo.lock`
- `src-tauri/tauri.conf.json`
- About/version UI behavior
- `CHANGELOG.md`

Run the dependency-free metadata gate after every version bump:

```bash
npm run version:check
```

The About dialog resolves the packaged application version at runtime through Tauri metadata instead of treating a copied UI literal as the release source of truth.

Application version and report-schema version are independent. TextLens 2.0.12 continues to emit report schema v2. See `docs/report-schema.md` before changing report models or compatibility behavior.

## Tag integrity

Stable/release tags must exactly match the npm application version with a leading `v`.

```bash
npm run release:tag-check -- v2.0.12
```

On GitHub Actions the script reads `GITHUB_REF_NAME`, so `.github/workflows/release.yml` rejects a mismatched tag before dependencies are installed or platform packaging starts.

Do not move an existing release tag to a different commit.

## Preparation

1. Update changelog, roadmap, documentation, and `what_changed.md`.
2. Confirm `package-lock.json` and `src-tauri/Cargo.lock` are committed and synchronized with their manifests. When dependencies intentionally change, refresh the matching lockfile with the normal package manager and review manifest/lockfile diffs together. Never hand-author lockfiles.
3. Install the exact npm graph and run the complete quality suite:

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

4. Run the release-mode synthetic benchmark with locked Cargo resolution and record the result in the release notes or performance evidence.
5. Build from a clean checkout on Windows, macOS, and Linux. For source-supported mobile targets, build/test in the required Android and macOS/Xcode environments before making release claims.
6. Confirm no secrets, private documents, full private paths/provider URIs, generated signing material, or personal fixture data exist in the diff.
7. Confirm report/settings schema compatibility notes match the implementation and `docs/report-schema.md`.
8. Complete the manual accessibility checklist in `docs/accessibility.md`.
9. Replace repository mock screenshots with real captures from the verified release candidate where possible.
10. Run the tag check against the intended tag.
11. Tag only the tested commit as `vX.Y.Z`.

## Data compatibility checks

Before tagging:

- Confirm `CURRENT_REPORT_VERSION` remains `2` unless an explicit schema migration is intended.
- Export a current schema-v2 analysis report and import it for comparison.
- Import a synthetic schema-v1 report and verify unavailable vocabulary metrics are not shown as real deltas.
- Verify future/invalid report versions are rejected.
- Confirm portable report import enforces native-compatible report invariants.
- Confirm canonical JSON still excludes raw source text and full source paths/provider URIs.
- Export a current settings schema-v2 backup and restore it.
- Restore a synthetic schema-v1 settings backup and verify newer preferences receive documented defaults.
- Confirm malformed/oversized report and settings files are rejected.
- Confirm disabling recent-file metadata clears the local metadata store.
- Confirm a blocked/unavailable WebView/browser storage implementation does not leave a blank startup window; when the memory fallback is available, preferences must be clearly session-only.

## Automation

Pushing `v*` triggers `.github/workflows/release.yml`, which first verifies that the tag equals `v` plus the application version. The workflow uses the committed npm lockfile through `npm ci`, verifies the committed Cargo lockfile before desktop packaging, builds the Web/PWA bundle, and builds desktop packages on Windows, macOS, and Linux into a draft GitHub Release.

The Web/PWA artifact is uploaded by the maintained GitHub artifact action. The draft must remain unpublished until platform artifacts are manually installed and checked. A successful workflow is evidence that packaging completed, not evidence that every runtime behavior, store requirement, signing path, PWA deployment behavior, or accessibility path was manually verified.

## Platform release gates

### Desktop

Windows, macOS, and Linux release candidates must be installed and exercised on their target operating systems. Public Windows/macOS distribution should use appropriate signing/notarization where credentials are available.

### Android

Source support and the documented Tauri Android build command do not establish Play Store readiness. Before claiming an Android release, verify the generated project and package on the required Android toolchain, emulator/physical hardware, target-SDK policy, signing configuration, and final APK/AAB.

### iOS/iPadOS

iOS/iPadOS packaging requires macOS/Xcode and Apple signing/provisioning. Before claiming an iOS release, verify Simulator/physical-device behavior, archive validation, provisioning, privacy declarations, and the distributable artifact.

### Web/PWA/ChromeOS

A successful `build:web` proves the static bundle compiles. Before claiming a production PWA deployment, verify HTTPS hosting, manifest/installability, application-relative root/subdirectory paths, service-worker scope/update behavior, offline relaunch, and ChromeOS installed-PWA behavior where claimed.

## Signing

Development builds can be unsigned. Public distribution should use Windows code signing and Apple Developer ID/notarization where credentials are available. Mobile store builds require their platform-specific signing/provisioning. Signing secrets belong only in protected release/CI secret stores and must never be committed to the repository or included in diagnostic logs.

## Artifact checksums

TextLens includes dependency-free SHA-256 tooling so release artifacts can be accompanied by a deterministic manifest after platform artifacts have been collected into one directory tree.

Generate a manifest:

```bash
npm run release:checksums -- artifacts release-metadata/SHA256SUMS.txt
```

Verify the artifact tree against that manifest:

```bash
npm run release:checksums:verify -- artifacts release-metadata/SHA256SUMS.txt
```

The verifier intentionally requires exact coverage: every regular artifact file must appear once, no unexpected extra artifact may exist, paths must remain relative and non-traversing, and every SHA-256 digest must match. Publish the checksum manifest with the same release whose artifacts it covers.

## Artifact verification

For every supported platform artifact actually produced:

1. Install from a clean user account or clean VM/device where practical.
2. Launch with network disconnected where the platform/runtime permits and confirm core local analysis remains usable after required application assets are available.
3. Paste multilingual synthetic text and verify core/vocabulary metrics.
4. Open synthetic UTF-8 and applicable encoding fixtures.
5. Exercise keyword exclusions.
6. Back up and restore settings.
7. Opt into recent metadata, open a synthetic file, clear history, then disable the preference.
8. Export JSON and Markdown reports.
9. Compare against a saved JSON report.
10. Exercise Quick actions and applicable keyboard/touch controls.
11. Confirm the Settings update section does not perform background network requests and opens the official Releases page only after user action.
12. Confirm the About dialog displays the packaged application version and inspect contact/funding links.
13. Review focus, reduced motion, scaling, screen-reader behavior, safe areas, and orientation as applicable.
14. Inspect network behavior and confirm analyzed source text is not sent to a TextLens backend.
15. Uninstall cleanly where applicable and confirm no unexpected startup/service components remain.
16. Generate and verify the release checksum manifest after collecting the final artifacts.

## Release-mode performance smoke test

Native desktop benchmark:

```bash
cd src-tauri
cargo run --locked --release --example benchmark -- 16 5
```

Record machine, OS, Rust toolchain, and input parameters with the result. Portable Web/mobile performance should be profiled separately because it uses an in-memory TypeScript analyzer rather than the native streaming execution model.

## Release notes

Use `.github/RELEASE_TEMPLATE.md` as a checklist. Describe user-visible changes, privacy/security changes, schema compatibility, known limitations, verification commands, and platform-specific caveats. Do not claim a platform or quality gate was verified unless it was actually run.

For the 2.0.12 source milestone, `docs/releases/v2.0.12.md` records what is source-complete and which release-candidate checks still require external environments.

## Rollback

Do not move or replace an immutable release tag. If a release has a defect, document it, withdraw the affected artifact/release if necessary, fix the issue on `main`, and publish a new patch version with regression coverage.

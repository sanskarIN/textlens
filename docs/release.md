# Release Guide

## Version alignment

Keep these aligned:

- `package.json`
- `src-tauri/Cargo.toml`
- `src-tauri/tauri.conf.json`
- About/version UI behavior
- `CHANGELOG.md`

Run the dependency-free metadata gate after every version bump:

```bash
npm run version:check
```

The About dialog resolves the packaged application version at runtime through Tauri metadata instead of treating a copied UI literal as the release source of truth.

## Tag integrity

Stable/release tags must exactly match the npm application version with a leading `v`.

```bash
npm run release:tag-check -- v0.1.0
```

On GitHub Actions the script reads `GITHUB_REF_NAME`, so `.github/workflows/release.yml` rejects a mismatched tag before dependencies are installed or platform packaging starts.

Do not move an existing release tag to a different commit.

## Preparation

1. Update changelog, roadmap, documentation, and `what_changed.md`.
2. Generate/refresh dependency lockfiles in an environment with registry access and review the diff. Never hand-author lockfiles.
3. Run the complete quality suite:

   ```bash
   npm run version:check
   npm run check
   npm run lint
   npm run format:check
   npm run docs:check
   npm run test
   npm run build
   cd src-tauri
   cargo fmt --check
   cargo clippy --all-targets --all-features -- -D warnings
   cargo test --all-targets
   ```

4. Run the release-mode synthetic benchmark and record the result in the release notes or performance evidence.
5. Build from a clean checkout on Windows, macOS, and Linux.
6. Confirm no secrets, private documents, full private paths, generated signing material, or personal fixture data exist in the diff.
7. Confirm report/settings schema compatibility notes match the implementation.
8. Complete the manual accessibility checklist in `docs/accessibility.md`.
9. Replace repository mock screenshots with real captures from the verified release candidate where possible.
10. Run the tag check against the intended tag.
11. Tag only the tested commit as `vX.Y.Z`.

## Data compatibility checks

Before tagging:

- Export a current schema-v2 analysis report and import it for comparison.
- Import a synthetic schema-v1 report and verify unavailable vocabulary metrics are not shown as real deltas.
- Verify future/invalid report versions are rejected.
- Export a current settings schema-v2 backup and restore it.
- Restore a synthetic schema-v1 settings backup and verify newer preferences receive documented defaults.
- Confirm malformed/oversized report and settings files are rejected.
- Confirm disabling recent-file metadata clears the local metadata store.
- Confirm a blocked/unavailable WebView storage implementation does not leave a blank startup window; when the memory fallback is available, preferences must be clearly session-only.

## Automation

Pushing `v*` triggers `.github/workflows/release.yml`, which first verifies that the tag equals `v` plus the application version, then builds on Windows, macOS, and Linux and creates a draft GitHub Release.

The draft must remain unpublished until platform artifacts are manually installed and checked. A successful workflow is evidence that packaging completed, not evidence that every runtime behavior or accessibility path was manually verified.

## Signing

Development builds can be unsigned. Public distribution should use Windows code signing and Apple Developer ID/notarization where credentials are available. Signing secrets belong only in GitHub Actions secrets and must never be committed to the repository or included in diagnostic logs.

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

For every supported platform artifact:

1. Install from a clean user account or clean VM where practical.
2. Launch with network disconnected and confirm core analysis remains usable.
3. Paste multilingual synthetic text and verify core/vocabulary metrics.
4. Open synthetic UTF-8 and applicable encoding fixtures.
5. Exercise keyword exclusions.
6. Back up and restore settings.
7. Opt into recent metadata, open a synthetic file, clear history, then disable the preference.
8. Export JSON and Markdown reports.
9. Compare against a saved JSON report.
10. Exercise Quick actions and all documented keyboard shortcuts.
11. Confirm the Settings update section does not perform background network requests and opens the official Releases page only after user action.
12. Confirm the About dialog displays the packaged application version and inspect contact/funding links.
13. Review focus, reduced motion, scaling, and screen-reader behavior.
14. Uninstall cleanly and confirm no unexpected startup/service components remain.
15. Generate and verify the release checksum manifest after collecting the final artifacts.

## Release notes

Use `.github/RELEASE_TEMPLATE.md` as a checklist. Describe user-visible changes, privacy/security changes, schema compatibility, known limitations, verification commands, and platform-specific caveats. Do not claim a platform or quality gate was verified unless it was actually run.

## Rollback

Do not move or replace an immutable release tag. If a release has a defect, document it, withdraw the affected artifact/release if necessary, fix the issue on `main`, and publish a new patch version with regression coverage.

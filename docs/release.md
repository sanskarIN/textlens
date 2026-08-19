# Release Guide

## Version alignment

Keep these aligned:

- `package.json`
- `src-tauri/Cargo.toml`
- `src-tauri/tauri.conf.json`
- `CHANGELOG.md`

## Preparation

1. Update changelog, roadmap, and handoff.
2. Run the complete quality suite.
3. Build locally on at least one supported platform.
4. Confirm no secrets/private data exist in the diff.
5. Tag the tested commit `vX.Y.Z`.

## Automation

Pushing `v*` triggers `.github/workflows/release.yml`, which builds on Windows, macOS, and Linux and creates a draft GitHub Release.

## Signing

Development builds can be unsigned. Public distribution should use Windows code signing and Apple Developer ID/notarization where credentials are available. Signing secrets belong only in GitHub Actions secrets.

## Verification

Install each artifact, analyze synthetic text, open a file, export both report formats, inspect About/version/links, then uninstall cleanly.

## Rollback

Patch with a new version rather than replacing an immutable release tag.

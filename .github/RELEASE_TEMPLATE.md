# TextLens vX.Y.Z

## Highlights

- Describe user-visible improvements.

## Fixes

- Describe corrected defects and regressions.

## Compatibility

- Application version: state the packaged version.
- Report schema: state the current version and any supported older versions.
- Settings backup schema: state the current version and any supported older versions.
- Confirm application-version changes did not silently alter report-schema semantics.
- Link `docs/report-schema.md` when report compatibility is relevant.
- Mention any intentionally unsupported future/legacy formats.

## Security & privacy

- Confirm whether privacy behavior, local persistence, imports, or Tauri permissions changed.
- Confirm imported reports/settings remain size-limited and validated.
- Confirm recent-file metadata remains opt-in and path-free if the feature is present.
- Confirm update navigation does not transmit document content or silently poll unless the release explicitly changes that policy.
- Never include credentials, private user data, full private paths, or sensitive diagnostic content.

## Verification

- [ ] `npm run version:check` passes.
- [ ] `npm run release:tag-check -- vX.Y.Z` passes for the intended tag.
- [ ] Frontend type-check passes.
- [ ] Frontend lint passes.
- [ ] Frontend deterministic format check passes.
- [ ] Offline documentation-link check passes.
- [ ] Frontend tests pass.
- [ ] Frontend production build passes.
- [ ] Rust format check passes.
- [ ] Rust Clippy passes with warnings denied.
- [ ] Rust tests pass for all targets, including the stable report-schema guard.
- [ ] Release-mode benchmark recorded.
- [ ] Dependency/security checks pass.
- [ ] Current report export/import/compare round trip checked.
- [ ] Supported legacy report import checked.
- [ ] Future report schema rejection checked.
- [ ] Canonical JSON source-text/full-path exclusion checked.
- [ ] Current settings backup/restore round trip checked.
- [ ] Supported legacy settings restore checked.
- [ ] Invalid/future/oversized report and settings imports rejected.
- [ ] Quick actions and documented keyboard shortcuts checked.
- [ ] Recent-file metadata opt-in/clear/disable behavior checked.
- [ ] Blocked persistent-storage fallback/recovery behavior checked.
- [ ] Keyboard-only and reduced-motion review completed.
- [ ] Windows package installed and checked.
- [ ] macOS package installed and checked.
- [ ] Linux package installed and checked.
- [ ] Real release-candidate screenshots captured where applicable.
- [ ] Final artifacts collected and `SHA256SUMS.txt` generated/verified.
- [ ] `CHANGELOG.md`, `ROADMAP.md`, and `what_changed.md` updated.
- [ ] Dependency lockfiles refreshed and committed from package-manager output.

## Known limitations

- Record unverified platforms, signing/notarization gaps, accessibility gaps, or toolchain limitations explicitly.

## Support

- Business: sanskarin@outlook.in
- Business: sanskarin.business@gmail.com
- Support: supportramsandesh@gmail.com
- GitHub: https://github.com/sanskarIN
- Buy Me a Coffee: https://buymeacoffee.com/sanskarIN

**Made by the Sanskar**

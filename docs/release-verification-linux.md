# Linux Release Verification Evidence

Date: 2026-08-19

Status: **Linux build/package smoke verification completed in the current automation environment.** This document does not claim equivalent Windows or macOS verification.

## Source baseline

Verification used a fresh archive of the merged `main` branch after the package-manager-generated npm and Cargo lockfiles and lockfile-enforced CI follow-up were merged.

The source archive was extracted into a clean temporary directory before dependency installation and packaging.

## Environment preparation

Frontend dependencies were installed from the committed npm lockfile:

```bash
npm ci --ignore-scripts --no-audit --no-fund
```

The isolated stable Rust toolchain used `rustfmt` and `clippy`. Linux Tauri prerequisites matched the repository CI baseline:

- `libwebkit2gtk-4.1-dev`
- `libayatana-appindicator3-dev`
- `librsvg2-dev`
- `patchelf`

`xvfb` was installed only to provide a virtual display for non-interactive startup smoke tests.

## Package build

The desktop release bundle was produced with:

```bash
npm run tauri:build
```

The build completed with bundle output under:

```text
src-tauri/target/release/bundle/
```

## Bundle structural checks

The generated bundle directory was required to contain at least one package artifact.

### Debian package

For every generated `.deb` encountered in the verification script:

```bash
dpkg-deb --info <artifact.deb>
dpkg-deb --contents <artifact.deb>
```

Both package metadata and package-content listings were required to be non-empty.

### AppImage

For every generated `.AppImage` encountered in the verification script, the artifact was made executable and extracted with:

```bash
<artifact.AppImage> --appimage-extract
```

Verification required the extracted image to contain `squashfs-root/AppRun`.

### RPM

If an RPM artifact was present, its file type was checked for RPM identification. This evidence does not claim an RPM installation test unless a future verification record explicitly adds one.

## Direct release-binary startup smoke test

The release binary at:

```text
src-tauri/target/release/textlens
```

was launched under a virtual X display with an eight-second timeout.

An immediate non-zero application exit was treated as failure. A timeout exit was accepted as evidence that the desktop process remained alive for the smoke window rather than crashing immediately.

This is a startup smoke test, not a replacement for interactive manual acceptance.

## Debian install / launch / uninstall smoke test

The generated Debian package was then exercised through an installation lifecycle:

1. Read package name/version/architecture with `dpkg-deb`.
2. Require the package name to be the expected TextLens package identity.
3. Install the produced `.deb` with `dpkg -i`.
4. Resolve the installed executable from `dpkg -L`.
5. Require the installed executable to exist and be executable.
6. Launch the installed executable under `xvfb-run` with an eight-second timeout.
7. Treat an immediate non-zero exit as failure.
8. Remove the package with `dpkg -r`.
9. Confirm `dpkg-query` no longer reports the package as installed.

The complete sequence succeeded in this verification environment.

## What this verifies

This evidence supports these claims for the tested Linux environment:

- committed lockfiles can drive a clean dependency setup;
- the Tauri release build completes;
- Linux bundle artifacts are generated;
- Debian package metadata/content is readable;
- generated AppImage content can be extracted;
- the release binary survives a basic virtual-display startup smoke window;
- the generated Debian package can be installed;
- the installed executable can be launched for the smoke window;
- the Debian package can be removed cleanly from the package database.

## What this does **not** verify

This document does not claim:

- Windows MSI/NSIS installation success;
- macOS app/DMG installation success;
- Windows signing;
- Apple Developer ID signing/notarization;
- native Linux screen-reader quality;
- native Windows/macOS screen-reader quality;
- every interactive workflow inside the packaged application;
- high-DPI/scaling behavior on physical target desktops;
- desktop-environment-specific integration across every Linux distribution;
- RPM installation behavior;
- final release-candidate screenshots.

Those remain separate release gates.

## Release rule

Do not generalize this Linux evidence into a statement that all supported platforms are release-verified. Windows and macOS must each have their own build/install/manual-acceptance evidence before a stable cross-platform release is declared complete.

---

**Made by the Sanskar**

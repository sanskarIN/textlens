# TextLens — Cross-Platform Work Handoff

## Current continuation

Date: **2026-08-20**

Application version remains **2.0.12**. Report schema remains **v2**. Settings backup schema remains **v2**.

Repository: `sanskarIN/textlens`

Working branch: `feature/cross-platform-support`

This continuation changes TextLens from a desktop-only source architecture into a cross-platform source architecture covering:

- Windows 10/11;
- macOS;
- Linux desktop;
- Android;
- iPhone/iPad;
- modern Web browsers;
- installable PWA;
- ChromeOS through the PWA.

The prior 2.0.12 release/audit history remains available in Git history. This handoff focuses on the current cross-platform continuation.

## Important evidence rule

Source support is not the same as a signed or store-published artifact.

Do not claim that an APK, AAB, IPA, App Store package, signed Windows installer, notarized macOS package, Linux package, or hosted PWA has been produced unless the corresponding build/signing/deployment was actually completed and verified in its required environment.

## Architecture change

TextLens now has one shared TypeScript/Vite UI and two local execution paths.

### Native desktop runtime

Windows, macOS, and Linux retain the existing Tauri IPC + Rust backend for:

- text analysis;
- native file decoding;
- large-file streaming;
- report import/export;
- settings backup/restore.

This preserves the strongest existing desktop behavior.

### Portable Web/mobile runtime

Web/PWA and Tauri Android/iOS frontend builds use Vite aliases that replace the Tauri-facing JavaScript modules with browser-safe local adapters under `src/platform/`.

The portable runtime implements:

- pasted-text analysis;
- file selection through sandbox-safe browser/document workflows;
- UTF-8 BOM handling;
- UTF-16 LE/BE BOM handling;
- valid UTF-8 decoding;
- labelled Windows-1252 fallback;
- report schema-v2 generation;
- JSON export;
- Markdown export;
- JSON report import/comparison;
- settings backup/restore;
- external-link opening with a protocol allowlist;
- application version display from package metadata.

Portable selected source files are limited to 64 MiB because this path analyzes them in memory. Report imports remain bounded to 512 KiB. Settings backups remain bounded to 64 KiB.

## New source files

Added:

- `src/platform/web-analyzer.ts`
- `src/platform/web-analyzer.test.ts`
- `src/platform/web-tauri-core.ts`
- `src/platform/web-dialog.ts`
- `src/platform/web-file-store.ts`
- `src/platform/web-opener.ts`
- `src/platform/web-app.ts`
- `src/platform.css`
- `public/manifest.webmanifest`
- `public/sw.js`
- `src-tauri/capabilities/mobile.json`
- `src-tauri/tauri.android.conf.json`
- `src-tauri/tauri.ios.conf.json`
- `docs/platforms.md`
- `docs/adr/0012-portable-cross-platform-runtime.md`

## Updated source/configuration

### `vite.config.ts`

Added build-mode aliases:

- normal mode → real Tauri modules;
- `web` → portable browser modules;
- `mobile` → portable modules without PWA registration.

Aliases cover:

- `@tauri-apps/api/core`;
- `@tauri-apps/api/app`;
- `@tauri-apps/plugin-dialog`;
- `@tauri-apps/plugin-opener`.

### `package.json`

Added:

- `dev:web`;
- `dev:mobile`;
- `build:web`;
- `build:mobile`;
- `preview:web`;
- Android init/dev/build commands;
- iOS init/dev/build commands.

The application version remains 2.0.12.

### `src/startup.ts`

Now loads platform/mobile CSS and registers the service worker only in `web` mode. PWA registration failure is non-fatal.

### `index.html`

Added:

- cross-platform product description;
- `viewport-fit=cover`;
- manifest link;
- mobile/PWA metadata;
- Apple standalone metadata;
- application icon metadata.

### Tauri capabilities

`src-tauri/capabilities/default.json` is now explicitly limited to:

- Linux;
- macOS;
- Windows.

`src-tauri/capabilities/mobile.json` is explicitly limited to:

- Android;
- iOS.

Cross-platform support was not implemented by granting broad shell/process/filesystem permissions.

### Tauri mobile configuration

`tauri.android.conf.json` and `tauri.ios.conf.json` select `dev:mobile` / `build:mobile` so mobile frontend bundles do not assume ordinary desktop filesystem path behavior.

## PWA work

`public/manifest.webmanifest` adds an installable application identity and standalone display mode.

`public/sw.js` implements an application-shell cache for offline relaunch after required assets have been fetched.

The service worker is intended to cache static application assets only. It is not a document synchronization layer and is not intentionally given source document contents, report contents, or settings backups.

ChromeOS support uses the Web/PWA path rather than introducing another native implementation.

## Mobile UI work

`src/platform.css` adds:

- safe-area inset handling;
- dynamic viewport height support;
- touch-action optimization;
- mobile form controls sized to avoid unwanted mobile zoom;
- narrow-screen topbar stacking;
- mobile dialog sizing;
- mobile editor sizing;
- standalone-PWA selection behavior;
- hover suppression on touch-only devices.

Existing responsive rules in `src/styles.css` remain intact.

## Portable analyzer parity work

The portable analyzer produces the same `AnalysisReport` TypeScript shape and report schema v2 used by the shared UI.

Current portable regression tests cover:

- core word/unique-word/longest-word metrics;
- sentence/paragraph/line counts;
- blank lines;
- keyword exclusions;
- n-grams;
- Unicode grapheme behavior;
- mixed line endings.

This is an explicit second local analysis implementation, so future analyzer changes must keep native/portable report semantics aligned through tests and documentation.

## CI change

`.github/workflows/ci.yml` now runs all frontend build modes:

```bash
npm run build
npm run build:web
npm run build:mobile
```

The existing TypeScript check, lint, format, documentation, tests, Rust format, clippy, and Rust tests remain release-quality gates.

## Documentation updated

Updated:

- `README.md`
- `docs/setup.md`
- `docs/architecture.md`
- `docs/testing.md`
- `PRIVACY.md`
- `CHANGELOG.md`
- `what_changed.md`

Added:

- `docs/platforms.md`
- `docs/adr/0012-portable-cross-platform-runtime.md`

Documentation now distinguishes:

- desktop native behavior;
- portable Web/PWA behavior;
- Android/iOS source support;
- ChromeOS/PWA support;
- source support versus signed/store release evidence.

## Privacy behavior retained

Cross-platform work does not add:

- a cloud text-analysis backend;
- analytics SDKs;
- advertising SDKs;
- user accounts;
- background update polling;
- source-document cloud retention.

Reports still exclude source document contents. Recent-file metadata remains path-free and opt-in. Presets remain configuration-only. Settings backups remain preferences-only.

## External platform gates still requiring real environments

These must not be marked complete from source inspection alone:

### Android

- Tauri Android project initialization on a machine with the required Android toolchain;
- emulator/physical-device runtime acceptance;
- APK/AAB build evidence;
- signing evidence;
- Play Store policy/target-SDK checks.

### iOS/iPadOS

- Tauri iOS project initialization on macOS;
- Xcode Simulator/physical-device acceptance;
- archive build evidence;
- signing/provisioning evidence;
- App Store privacy/store submission evidence.

### Web/PWA

- production HTTPS deployment;
- installability verification in target browsers;
- offline relaunch acceptance after service-worker caching;
- ChromeOS installed-PWA acceptance.

### Desktop

Existing platform-native package/signing/notarization evidence requirements remain unchanged.

## Required next verification

The cross-platform branch must pass GitHub CI before it is treated as merge-ready. Any CI failure should be fixed on this branch and recorded through additional commits rather than being described as complete without evidence.

---

**Made by the Sanskar**

# Cross-platform support

TextLens 2.0.12 is structured around one shared TypeScript user interface and two local analysis paths:

1. **Native desktop runtime** — Tauri IPC calls the Rust analysis, file, report, and settings-backup code.
2. **Portable analysis runtime** — Web/PWA and Android/iOS use a TypeScript analysis implementation that emits the same TextLens report schema. Web uses browser file APIs; Android/iOS use native Tauri dialogs and filesystem access for user-selected document-provider URIs.

No runtime uploads document contents to a TextLens service. Platform packaging and store distribution are separate release activities from source support.

## Support matrix

| Platform | Runtime | Build / launch command | File workflow | Status |
| --- | --- | --- | --- | --- |
| Windows 10/11 | Tauri + Rust | `npm run tauri:dev` / `npm run tauri:build` | Native dialog + Rust file layer | Supported |
| macOS | Tauri + Rust | `npm run tauri:dev` / `npm run tauri:build` | Native dialog + Rust file layer | Supported |
| Linux desktop | Tauri + Rust | `npm run tauri:dev` / `npm run tauri:build` | Native dialog + Rust file layer | Supported |
| Android | Tauri mobile + portable analyzer | `npm run tauri:android:dev` / `npm run tauri:android:build` | Native dialog + `content://` URI + scoped filesystem bridge | Source supported; device packaging requires Android toolchain |
| iPhone / iPad | Tauri mobile + portable analyzer | `npm run tauri:ios:dev` / `npm run tauri:ios:build` | Native dialog + `file://` URI + scoped filesystem bridge | Source supported; device packaging requires macOS/Xcode |
| Web | Browser | `npm run dev:web` / `npm run build:web` | Browser file picker + local download | Supported |
| PWA | Browser / installed web app | `npm run build:web` | Same as Web; service-worker app shell | Supported |
| ChromeOS | PWA or compatible browser | `npm run build:web` | Browser file picker + local download | Supported through Web/PWA |

## Why there are two local analysis paths

Desktop platforms can safely pass ordinary filesystem paths to the Rust backend. Browser environments cannot access arbitrary filesystem paths, and mobile document providers expose platform URIs rather than ordinary desktop paths.

TextLens therefore avoids pretending that every platform has the same filesystem semantics:

- desktop keeps the mature Rust streaming/file-decoding path;
- Web/PWA uses browser `File`, `Blob`, `TextDecoder`, and download APIs;
- Android uses Tauri's native dialog to receive a `content://` URI, then the scoped filesystem plugin reads that selected document locally;
- iOS/iPadOS uses the native dialog to receive a `file://` URI, then the same scoped filesystem bridge reads/writes the selected resource;
- mobile selected bytes are converted to an in-memory `File` before entering the portable analyzer, so the report-validation/export pipeline stays shared;
- both analysis implementations emit report schema v2 and preserve the same privacy boundary: source text is not written into exported reports.

This split prevents platform-specific filesystem assumptions from leaking into the analysis/UI contract.

## Shared feature contract

The following features are intended to behave consistently on every supported runtime:

- pasted-text analysis;
- word, unique-word, longest-word, character, grapheme, byte, sentence, paragraph, and line counts;
- reading and speaking estimates;
- keyword ranking and exclusions;
- bigrams and trigrams;
- whitespace and line-ending diagnostics;
- JSON report export;
- configurable Markdown export;
- report comparison;
- local settings;
- settings backup and restore;
- analysis presets;
- light, dark, and system themes;
- reduced-motion preference;
- guarded startup and storage fallback;
- manual-only external update/release link.

## Platform-specific behavior

### Desktop

Desktop builds use the Rust backend for local file analysis. Large UTF-8/Windows-1252 files can use the existing streaming path instead of loading the complete document into frontend memory. UTF-16 BOM inputs use the existing full-file decoder where byte-oriented streaming could split code units.

### Web and PWA

The web build replaces the Tauri-facing modules at bundle time with browser-safe implementations in `src/platform/`. Browser file analysis enforces a **64 MiB** source-file limit because the selected file is analyzed in memory. Report imports remain bounded to **512 KiB** and settings backups to **64 KiB**.

Portable file decoding intentionally follows the native Rust file layer's detection/error contract: encoding detection examines the first 32 KiB, UTF-8 decode errors after that sample are reported without changing the selected encoding, UTF-16 odd/malformed sequences are surfaced through replacement characters plus the report error flag, and Windows-1252 undefined bytes use the same native mapping. Imported portable reports also pass an additional native-parity guard for schema-v2 vocabulary metrics, grapheme/character consistency, frequency-item limits, and possible n-gram positions.

The PWA service worker caches the application shell and same-origin static build assets only. It does not cache analyzed document contents or exported reports. Raster 192×192 and 512×512 PWA icons plus a 180×180 Apple touch icon are included alongside the SVG application mark. Web build URLs, manifest identity/scope, icon references, and service-worker registration are application-base-relative so the generated `dist/` can be hosted either at a domain root or under a subdirectory.

### Android and iOS/iPadOS

Tauri mobile builds use `--mode mobile`, which selects the portable analyzer but keeps user-selected file I/O native:

1. the Tauri dialog plugin opens the platform document picker;
2. Android returns a content URI and iOS returns a file URI;
3. the Tauri filesystem plugin checks metadata and reads the selected resource through a tightly scoped capability;
4. TextLens rejects source files above **64 MiB** before portable analysis;
5. exported reports/settings are written through the native save destination selected by the user;
6. the PWA service worker is not registered inside the Tauri mobile shell.

`app.withGlobalTauri` is enabled only in the Android/iOS override configs so the aliased portable adapters can call the already capability-restricted native dialog/filesystem/opener APIs without routing document-provider URIs into desktop `std::fs` commands.

The mobile source tree is initialized/generated by the Tauri CLI on the development machine. Generated Android Studio and Xcode project state should be treated as build output/tooling state rather than hand-maintained application logic unless a platform-specific native customization is deliberately required.

## Build modes

### Desktop frontend

```bash
npm run build
```

Uses real Tauri JavaScript APIs and is consumed by normal desktop Tauri builds.

### Web/PWA frontend

```bash
npm run build:web
npm run preview:web
```

`build:web` uses the browser adapters and emits a static `dist/` bundle suitable for HTTPS static hosting. Production asset URLs are relative to the application base rather than hard-coded to `/`, so static hosts may publish TextLens below a path such as `/textlens/` without breaking its manifest, icons, generated chunks, or service-worker scope.

### Mobile frontend

```bash
npm run build:mobile
```

This is normally invoked automatically by `tauri.android.conf.json` or `tauri.ios.conf.json` during Tauri mobile development/build commands.

## Android prerequisites

A complete Android development machine needs the Tauri prerequisites plus the Android development toolchain, including:

- Node.js supported by this repository;
- Rust stable and the Android Rust targets required by Tauri;
- Java/JDK configured for Android development;
- Android Studio and Android SDK tooling;
- an emulator or physical device for runtime acceptance testing.

Initialize once on a development checkout when the generated Android project is not present:

```bash
npm run tauri:android:init
```

Then develop or build:

```bash
npm run tauri:android:dev
npm run tauri:android:build
```

Store signing, Play Console metadata, target-SDK policy, and final AAB/APK verification are release-environment responsibilities and are not implied by source compilation.

## iOS/iPadOS prerequisites

iOS development and packaging require a macOS host with the Apple toolchain in addition to the Tauri prerequisites:

- Xcode and its command-line tools;
- Rust stable and the iOS Rust targets required by Tauri;
- an iOS Simulator or physical device;
- Apple signing/provisioning configuration when producing distributable builds.

Initialize once on a development checkout when the generated iOS project is not present:

```bash
npm run tauri:ios:init
```

Then develop or build:

```bash
npm run tauri:ios:dev
npm run tauri:ios:build
```

App Store signing, provisioning, privacy declarations, screenshots, and review submission are external release gates.

## Web/PWA deployment requirements

Serve the contents of `dist/` from HTTPS in production. TextLens may be hosted at the origin root or at a subdirectory/application base. The host should:

- serve the generated `index.html` for the selected application base;
- serve JavaScript/CSS with correct MIME types;
- serve `manifest.webmanifest` and `sw.js` from that same application base;
- serve the raster and SVG app icons without rewriting them to HTML;
- avoid rewriting `sw.js` to HTML;
- keep all files from one `dist/` build together beneath the same base path;
- use a cache policy that permits the service worker to discover updated application assets.

Text analysis remains in the browser after the static assets have loaded.

## Capability model

Tauri capabilities are split by platform:

- `src-tauri/capabilities/default.json` is limited to Linux, macOS, and Windows;
- `src-tauri/capabilities/mobile.json` is limited to iOS and Android.

The mobile capability grants only core defaults, native dialog/opener access, and the filesystem commands required to stat/read/write a user-selected document. TextLens does not grant broad shell, process, unrestricted filesystem, or network permissions merely to claim cross-platform support.

## Cross-platform verification

The normal frontend CI checks all three frontend bundles:

```bash
npm run check
npm run lint
npm run format:check
npm run docs:check
npm run test
npm run build
npm run build:web
npm run build:mobile
```

Portable regression tests cover analyzer behavior, native-compatible file decoding, and report-import parity. The Rust job continues to run formatting, clippy, and tests separately.

Before publishing a platform artifact, also perform platform-native acceptance testing for:

- startup and navigation;
- paste analysis;
- native/mobile/browser document import as applicable;
- JSON and Markdown export;
- report comparison;
- settings backup/restore;
- theme and reduced-motion behavior;
- mobile rotation and safe areas where applicable;
- keyboard navigation on desktop/web;
- touch target behavior on mobile;
- offline relaunch for installed PWA;
- root-hosted and subdirectory-hosted PWA install/offline behavior when those deployment layouts are used;
- no unexpected network transfer of analyzed text.

## Release evidence versus source support

A platform can be **source supported** without a signed store artifact already existing. The repository must not claim that an APK, AAB, IPA, App Store build, notarized DMG, signed Windows installer, Linux package, or hosted PWA has been produced unless that artifact was actually built and verified in the appropriate release environment.

Cross-platform source support means the code, configuration, runtime boundaries, build commands, and verification plan are present. Distribution/signing remains an evidence-based release step.

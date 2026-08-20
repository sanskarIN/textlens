# TextLens — Cross-Platform Work Handoff

## Current continuation

Date: **2026-08-20**

Application version remains **2.0.12**. Report schema remains **v2**. Settings backup schema remains **v2**.

Repository: `sanskarIN/textlens`

Working branch: `feature/cross-platform-support`

Pull request: **#21**

This continuation changes TextLens from a desktop-only source architecture into a cross-platform source architecture covering:

- Windows 10/11;
- macOS;
- Linux desktop;
- Android;
- iPhone/iPad;
- modern Web browsers;
- installable PWA;
- ChromeOS through the PWA.

The prior 2.0.12 release/audit history remains available in Git history. This handoff focuses on the cross-platform continuation and the quality work required to make that continuation mergeable rather than merely source-complete.

## Important evidence rule

Source support is not the same as a signed or store-published artifact.

Do not claim that an APK, AAB, IPA, App Store package, signed Windows installer, notarized macOS package, Linux package, or hosted PWA has been produced unless the corresponding build/signing/deployment was actually completed and verified in its required environment.

## Final runtime architecture

TextLens now has one shared TypeScript/Vite UI with platform-correct local execution paths.

### Windows, macOS, Linux

Desktop keeps the existing Tauri IPC + Rust backend for:

- pasted-text analysis;
- native file decoding;
- large-file streaming;
- report import/export;
- settings backup/restore.

This preserves the strongest existing desktop behavior.

### Web/PWA/ChromeOS

Web/PWA uses browser-safe local adapters under `src/platform/` for:

- pasted-text analysis;
- browser `File` selection;
- UTF-8/UTF-16/Windows-1252 decoding;
- portable report-schema-v2 generation;
- browser-local JSON/Markdown downloads;
- report import/comparison;
- settings backup/restore;
- manual external-link navigation;
- package-version display;
- PWA install/offline shell behavior.

ChromeOS uses this PWA route rather than a separate native codebase.

### Android and iOS/iPadOS

Mobile uses the same portable TypeScript analyzer, but file open/save is native rather than browser-emulated:

1. Tauri's native dialog plugin opens the mobile document picker.
2. Android returns a `content://` provider URI.
3. iOS/iPadOS returns a `file://` URI.
4. The capability-restricted Tauri filesystem bridge performs `stat` and `readFile` only for the selected source.
5. TextLens rejects non-files and files above the 64 MiB portable limit before analysis, then verifies byte length after reading.
6. The selected bytes are converted into an in-memory `File` and passed into the shared portable analyzer.
7. Native save-dialog destinations are written through the scoped `writeTextFile` operation.
8. Provider URIs are not included in exported reports or persisted as recent-file metadata.

This prevents Android/iOS provider handles from being incorrectly passed into the desktop Rust `std::fs` path.

## Input and import bounds

Portable Web/mobile selected source files: **64 MiB maximum**.

Report imports: **512 KiB maximum**.

Settings backups: **64 KiB maximum**.

Desktop large-file behavior remains the Rust streaming implementation where supported.

## New source files

Added during this continuation:

- `src/platform/web-analyzer.ts`
- `src/platform/web-analyzer.test.ts`
- `src/platform/web-tauri-core.ts`
- `src/platform/web-tauri-core-guard.ts`
- `src/platform/web-tauri-core-guard.test.ts`
- `src/platform/web-dialog.ts`
- `src/platform/web-file-store.ts`
- `src/platform/web-opener.ts`
- `src/platform/web-app.ts`
- `src/platform/app.ts`
- `src/platform/opener.ts`
- `src/platform.css`
- `public/manifest.webmanifest`
- `public/sw.js`
- `public/icon-192.png`
- `public/icon-512.png`
- `public/apple-touch-icon.png`
- `src-tauri/capabilities/mobile.json`
- `src-tauri/tauri.android.conf.json`
- `src-tauri/tauri.ios.conf.json`
- `docs/platforms.md`
- `docs/adr/0012-portable-cross-platform-runtime.md`
- `package-lock.json`
- `src-tauri/Cargo.lock`

Temporary unused wrapper files created during the refactor were removed again rather than left as dead code.

## Updated configuration

### `vite.config.ts`

Build modes now distinguish:

- normal desktop mode;
- `web` portable mode;
- `mobile` portable-analysis mode.

The frontend stays shared while Tauri-facing calls are adapted for the target build.

The Web build uses an application-relative Vite base (`./`) instead of assuming deployment at `/`. The portable Tauri core alias routes through `web-tauri-core-guard.ts`, which adds native-parity validation and file decoding without changing the desktop Tauri path.

### `package.json` and npm lockfile

Added:

- `dev:web`;
- `dev:mobile`;
- `build:web`;
- `build:mobile`;
- `preview:web`;
- Android init/dev/build commands;
- iOS init/dev/build commands;
- Tauri filesystem plugin dependency for native mobile document-provider access.

Dependency/runtime corrections made during the continuation:

- `@types/node` is 22.12.0 to satisfy Vite 7's Node type range;
- TypeScript is pinned to the published `5.7.3` release instead of the invalid `5.7.0` pin that prevented npm installation;
- `"type": "module"` is explicit so ESLint/Vite configuration files execute as ESM without Node reparsing warnings;
- `package-lock.json` is now committed with lockfile format v3;
- clean CI/release installs use `npm ci`, so the lockfile is enforced instead of silently refreshed.

The application version remains 2.0.12.

### Rust/Tauri and Cargo lockfile

`src-tauri/Cargo.toml` includes `tauri-plugin-fs = "2"`.

`src-tauri/src/lib.rs` initializes:

- dialog plugin;
- filesystem plugin;
- opener plugin.

The existing application commands remain available for the desktop path. The report-export command deliberately routes the no-options case through the canonical `write_report` helper, keeping that runtime path exercised and removing a dead-code Clippy failure.

`src-tauri/Cargo.lock` is now committed. CI Clippy/tests use `--locked`; release validation checks the lockfile with `cargo fetch --locked`; the security audit validates the committed lockfile instead of generating a new resolution.

### Mobile capability boundary

`src-tauri/capabilities/default.json` is limited to Linux/macOS/Windows.

`src-tauri/capabilities/mobile.json` is limited to Android/iOS and grants only:

- `core:default`;
- `dialog:default`;
- `opener:default`;
- `fs:allow-stat`;
- `fs:allow-read-file`;
- `fs:allow-write-text-file`.

No shell/process/network permission was added merely to claim cross-platform support.

### Mobile Tauri overrides

`tauri.android.conf.json` and `tauri.ios.conf.json`:

- select `dev:mobile` / `build:mobile`;
- enable `app.withGlobalTauri` only for the mobile shell so the capability-restricted native dialog/fs/opener/app bridge is available to the portable adapters.

## PWA work

`public/manifest.webmanifest` adds an installable application identity and standalone display mode.

Install assets include:

- source SVG logo;
- 192×192 PNG;
- 512×512 PNG;
- 512×512 maskable entry;
- 180×180 Apple touch icon.

PWA deployment was hardened after auditing non-root hosting:

- `vite.config.ts` emits relative Web build asset URLs;
- `index.html` references the manifest/icons relative to the application base;
- manifest `id`, `start_url`, `scope`, and icon URLs are application-relative;
- service-worker registration resolves `sw.js` from `document.baseURI` rather than hard-coding `/sw.js` and `/` scope;
- `public/sw.js` derives its application root from its own URL;
- the service worker caches only the application shell and same-origin static build assets instead of broadly caching every same-origin GET;
- navigation fallback uses the actual application base, allowing root-hosted and subdirectory-hosted static deployments.

The service-worker cache version is `textlens-pwa-v2.0.12-3`.

The service worker is not a document synchronization layer and is not intentionally given source document contents, report contents, or settings backups.

## Mobile UI work

`src/platform.css` adds:

- safe-area inset handling;
- dynamic viewport height support;
- touch-action optimization;
- mobile form controls sized to avoid unwanted browser zoom;
- narrow-screen topbar stacking;
- mobile dialog sizing;
- mobile editor sizing;
- standalone-PWA selection behavior;
- hover suppression on touch-only devices.

Existing responsive rules in `src/styles.css` remain intact.

## Portable analyzer and native-parity work

The portable analyzer produces the same `AnalysisReport` TypeScript shape and report schema v2 used by the shared UI.

Portable analyzer regression tests cover:

- core word/unique-word/longest-word metrics;
- sentence/paragraph/line counts;
- blank lines;
- keyword exclusions;
- n-grams;
- Unicode grapheme behavior;
- mixed line endings.

A dedicated `web-tauri-core-guard.ts` closes important differences between browser/mobile behavior and the Rust backend.

### Report-import parity

Portable imported reports additionally reject data that the Rust importer rejects, including:

- `uniqueWords > words`;
- `graphemes > characters`;
- invalid schema-v2 zero/nonzero vocabulary metric combinations;
- more than 50 frequency entries;
- frequency entries when there are no possible positions;
- keyword/bigram/trigram counts greater than their possible positions.

Focused Vitest coverage verifies these invariants.

### File-decoding parity

Portable file decoding follows the native Rust detection/error contract instead of depending on whole-file/browser decoder heuristics:

- encoding detection examines the same first **32 KiB** sample;
- a file selected as UTF-8 from that sample stays UTF-8 even if later bytes are malformed, while `hadErrors` is set and replacement characters are emitted;
- UTF-8/UTF-16 BOMs are handled explicitly;
- odd UTF-16 payloads append the replacement character and set `hadErrors`;
- malformed UTF-16 surrogate data sets `hadErrors`;
- Windows-1252 uses the same special-byte mapping as Rust, including replacement/error handling for undefined bytes;
- decoded file reports preserve the original selected byte length and privacy-safe display-name metadata.

The Windows-1252 path uses a static byte mapping and bounded UTF-16 chunks to avoid excessive temporary allocations near the 64 MiB portable source-file limit.

This remains an explicit second local analysis implementation, so future analyzer/file-format changes must keep native/portable report semantics aligned through tests and documentation.

## CI, security, and release work

`.github/workflows/ci.yml` validates all frontend build modes and uses deterministic dependency installation:

```bash
npm ci --no-audit --no-fund
npm run check
npm run lint
npm run format:check
npm run docs:check
npm run test
npm run build
npm run build:web
npm run build:mobile
```

Rust CI runs:

```bash
cargo fmt --check
cargo clippy --locked --all-targets --all-features -- -D warnings
cargo test --locked --all-targets
```

The npm setup action uses lockfile-backed caching. `package-lock.json` and `src-tauri/Cargo.lock` are committed build inputs rather than regenerated in normal CI.

GitHub-owned workflow actions were modernized to maintained Node-24-runtime majors:

- `actions/checkout@v6`;
- `actions/setup-node@v6`;
- `github/codeql-action/init@v4` / `analyze@v4`;
- `actions/dependency-review-action@v5`;
- `actions/upload-artifact@v7` for Web/PWA release artifacts.

`tauri-apps/tauri-action@v1` remains the current Tauri release-action major.

The tagged release workflow builds and uploads a Web/PWA `dist/` artifact and keeps the existing Linux/Windows/macOS desktop packaging matrix. npm release installs use `npm ci`; desktop release jobs verify the committed Cargo lockfile before packaging.

Android/iOS signed package publication is intentionally not fabricated in generic CI because real Android signing and Apple/Xcode provisioning are required.

### Reproducibility bootstrap completed

The repository audit originally found that neither npm nor Cargo lockfiles were committed. A temporary CI bootstrap generated both lockfiles from the actual branch dependency manifests. The generated files were committed by the branch workflow as `build: add reproducibility lockfiles`.

The temporary self-writing/bootstrap job has now been removed. The final reproducibility state is:

1. `package-lock.json` committed;
2. `src-tauri/Cargo.lock` committed;
3. npm CI/release installs use `npm ci`;
4. Rust CI uses `--locked` for Clippy/tests;
5. release jobs verify the Cargo lockfile;
6. the Rust security audit checks the committed lockfile instead of generating a fresh one;
7. setup/testing/contribution documentation teaches the same deterministic workflow.

No lockfile contents were hand-invented or manually fabricated.

## CI evidence and blockers corrected during this continuation

Real GitHub workflow evidence was used to drive fixes rather than assuming source inspection was enough.

A completed branch run on commit `35f8bbbe514dd6289100801ebdbf9fae9f16acc4` established that:

- Frontend quality passed TypeScript checking, lint, format policy, documentation checks, Vitest, desktop frontend build, Web/PWA build, and mobile frontend build;
- Security passed;
- Dependency Review passed;
- lockfile generation passed and produced both npm/Cargo lockfiles;
- the only CI failure was one exact `cargo fmt --check` diff in `src-tauri/src/commands.rs`.

That Rust formatter diff was then applied exactly in commit `2620cff975dc93c60e93c102481f628928d31de8`.

Other concrete blockers corrected during the broader continuation include:

1. The cross-platform branch pinned nonexistent `typescript@5.7.0`, causing `npm install` to fail. It is now `5.7.3`.
2. Current Rust Clippy treated dead `write_report`, manual char comparison, and sortable-key style warnings as errors. The code now follows the canonical runtime path and current idioms.
3. ESLint rejected a control-character filename regex. Portable filename sanitization now checks Unicode code points instead of suppressing the lint rule.
4. The package had lost explicit ESM mode, causing Node to reparse `eslint.config.js`; `"type": "module"` is restored.
5. Older GitHub action majors emitted Node-20 runtime deprecation warnings on current hosted runners; workflows use maintained Node-24-runtime majors.
6. Non-root PWA hosting and native/portable import/file-decoding parity gaps were discovered by source audit and corrected with tests/documentation rather than left as undocumented limitations.

## Documentation updated

Updated:

- `README.md`
- `CONTRIBUTING.md`
- `docs/setup.md`
- `docs/architecture.md`
- `docs/testing.md`
- `docs/platforms.md`
- `PRIVACY.md`
- `CHANGELOG.md`
- `what_changed.md`

Added:

- `docs/platforms.md`;
- `docs/adr/0012-portable-cross-platform-runtime.md`.

Documentation now distinguishes:

- desktop native behavior;
- Web/PWA browser behavior;
- Android/iOS native document-provider I/O plus portable analysis;
- ChromeOS/PWA support;
- root and subdirectory Web/PWA hosting;
- portable/native file-decoding and report-import parity expectations;
- deterministic npm/Cargo dependency resolution;
- source support versus signed/store release evidence.

## Privacy behavior retained

Cross-platform work does not add:

- a cloud text-analysis backend;
- analytics SDKs;
- advertising SDKs;
- user accounts;
- background update polling;
- source-document cloud retention.

Reports still exclude source document contents and full paths/provider URIs. Recent-file metadata remains path-free and opt-in. Presets remain configuration-only. Settings backups remain preferences-only.

## External platform gates still requiring real environments

These must not be marked complete from source inspection or generic CI alone.

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
- root/subdirectory hosting acceptance where applicable;
- ChromeOS installed-PWA acceptance.

### Desktop

Existing platform-native package/signing/notarization evidence requirements remain unchanged.

## Merge readiness rule

Pull request #21 should be merged only after the latest branch head passes the current GitHub CI, Security, and Dependency Review workflows. Any new failure must be fixed on this branch and recorded as another focused commit instead of being described as complete without evidence.

Committed lockfiles and deterministic install/test commands are now part of that merge gate.

---

**Made by the Sanskar**

# TextLens Roadmap

The roadmap favors coherent, testable improvements over feature-count inflation.

## 0.1 — Offline analysis foundation

- [x] Core counts and time estimates.
- [x] Unicode-aware tokenization baseline.
- [x] Keywords and n-grams.
- [x] Whitespace and line-ending diagnostics.
- [x] Local file opening and conservative encoding handling.
- [x] Large-file streaming mode.
- [x] JSON/Markdown report export.
- [x] Theme, accessibility, settings, About, and privacy UX.
- [x] CI/security/release automation baseline.

## 0.2 — Reliability and polish

- [ ] Validate packaged builds on each supported OS and attach real screenshots.
- [x] Expand analysis regression/property coverage for Unicode vocabulary invariants.
- [x] Add a dedicated repeatable benchmark harness for analyzer throughput.
- [x] Add versioned, validated settings backup/restore.
- [x] Surface undefined Windows-1252 byte replacements in encoding diagnostics.
- [x] Add bounded, validated JSON report import with legacy schema compatibility.
- [x] Establish report schema v2 for vocabulary metrics while continuing to read schema v1.
- [x] Add a checked-in synthetic fixture corpus for multilingual text and difficult punctuation.
- [x] Add deterministic byte fixtures for malformed UTF-8, UTF-16 boundaries, and Windows-1252 edge bytes.
- [x] Re-audit encoding heuristics and retain the conservative deterministic policy until an evidence-backed, offline, clearly labelled alternative exists (ADR-0003).
- [x] Add richer report customization without including raw source text by default.

## 0.3 — Power-user workflows

- [x] Optional recent-file metadata history with opt-in and clear/delete controls, without storing paths.
- [x] Compare two analysis reports without storing source text.
- [x] Custom exclusion/stop-word lists stored locally.
- [x] Command palette / Quick actions for keyboard-first workflows.
- [x] Optional reusable local analysis presets for reading rate, speaking rate, exclusions, and result limits.

## 1.0+ — Stable desktop release line

- [ ] Complete Windows/macOS/Linux clean-checkout release-candidate audit.
- [ ] Confirm installer signing/notarization where credentials are available.
- [ ] Complete native screen-reader review.
- [x] Freeze the versioned report schema and document compatibility guarantees in `docs/report-schema.md`.
- [ ] Publish real platform screenshots produced from verified packaged builds.

## 2.0.12 source milestone

- [x] Synchronize npm, Cargo, and Tauri application versions to 2.0.12.
- [x] Preserve report schema v2 independently from the application version.
- [x] Add a regression guard against accidental report-schema bumps.
- [x] Document the stable schema-v2 and legacy-v1 import compatibility contract.
- [x] Reaffirm the deterministic conservative encoding policy rather than adding unjustified statistical guessing.
- [x] Keep release tag/version and checksum integrity tooling in the release path.
- [x] Keep remaining native packaging, signing, accessibility, and screenshot work as evidence-based external release gates.

## 2.0.12 cross-platform source milestone

- [x] Preserve the native Rust/Tauri runtime for Windows, macOS, and Linux.
- [x] Add a browser-local Web/PWA runtime with the same report-schema-v2 contract.
- [x] Add installable/offline PWA metadata, raster install icons, Apple touch icon, and application-shell caching.
- [x] Support ChromeOS through the Web/PWA route.
- [x] Add Tauri Android and iOS/iPadOS build configurations and development commands.
- [x] Add a shared portable TypeScript analyzer for Web and mobile.
- [x] Use native Android/iOS document-provider dialogs and scoped filesystem access instead of desktop path assumptions.
- [x] Keep Android `content://` and iOS `file://` provider handles out of reports and recent-file metadata.
- [x] Add mobile safe-area, touch, orientation-friendly, and narrow-screen layout hardening.
- [x] Build desktop, Web/PWA, and mobile frontend modes in CI.
- [x] Build a Web/PWA artifact on tagged release workflows.
- [x] Document cross-platform prerequisites, capability boundaries, testing, privacy, and source-vs-release evidence.
- [ ] Produce and verify signed Android APK/AAB artifacts in a configured Android release environment.
- [ ] Produce and verify signed iOS/iPadOS archives in a configured macOS/Xcode release environment.
- [ ] Deploy the PWA to production HTTPS and verify install/offline behavior on target browsers/ChromeOS.
- [ ] Complete physical-device acceptance on representative Android/iPhone/iPad devices.

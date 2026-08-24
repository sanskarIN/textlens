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

## 2.0.13 reproducible release evidence milestone

- [x] Add a dependency-free release-readiness preflight that requires reviewed npm and Cargo lockfiles and fingerprints them with SHA-256.
- [x] Block tagged native packaging when committed dependency locks are missing or malformed.
- [x] Switch tagged frontend release installation to `npm ci` and verify Cargo manifests with `cargo metadata --locked`.
- [x] Add machine-readable build evidence containing only allowlisted runner/toolchain/repository metadata and dependency-lock fingerprints.
- [x] Add a manually dispatched Ubuntu/Windows/macOS Release Candidate Audit workflow that runs quality gates, native bundling, benchmark evidence, and artifact upload.
- [x] Correct the supported security line to 2.0.x and document dependency-advisory triage rules.
- [x] Document what automated release evidence proves and which acceptance claims still require manual verification.
- [ ] Generate and review `package-lock.json` and `src-tauri/Cargo.lock` from package-manager output in a registry-capable environment.
- [ ] Run the Release Candidate Audit successfully from the reviewed dependency graph on Ubuntu, Windows, and macOS.
- [ ] Review the currently open RustSec dependency advisories against the locked dependency graph and upstream fixes before public binary release.
- [ ] Install and manually exercise each candidate package, including native accessibility/scaling/reduced-motion acceptance.
- [ ] Capture real screenshots from verified packages and complete signing/notarization where applicable.
- [ ] Generate and verify `SHA256SUMS.txt` from the final public artifact set.

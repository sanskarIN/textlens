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
- [ ] Expand the checked-in synthetic fixture corpus for difficult punctuation and encoding boundaries.
- [ ] Improve encoding heuristics only if deterministic, offline, and clearly labelled.
- [ ] Add richer report customization without including raw source text by default.

## 0.3 — Power-user workflows

- [ ] Optional recent-file metadata history with opt-in and clear/delete controls.
- [x] Compare two analysis reports without storing source text.
- [x] Custom exclusion/stop-word lists stored locally.
- [x] Command palette / Quick actions for keyboard-first workflows.
- [ ] Optional reusable local analysis presets for reading rate, speaking rate, exclusions, and result limits.

## 1.0 — Stable desktop release

- [ ] Complete Windows/macOS/Linux clean-checkout release-candidate audit.
- [ ] Confirm installer signing/notarization where credentials are available.
- [ ] Complete native screen-reader review.
- [ ] Freeze the versioned report schema and document compatibility guarantees.
- [ ] Publish real platform screenshots produced from verified packaged builds.

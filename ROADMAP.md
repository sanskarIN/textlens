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
- [ ] Expand the fixture corpus for scripts and difficult punctuation.
- [ ] Add a dedicated benchmark harness for large-file throughput.
- [ ] Improve encoding heuristics only if deterministic, offline, and clearly labelled.
- [ ] Add richer report customization without including raw source text by default.

## 0.3 — Power-user workflows

- [ ] Optional recent-file metadata history with opt-in and clear/delete controls.
- [ ] Compare two analysis reports without storing source text.
- [ ] Custom exclusion/stop-word lists stored locally.
- [ ] Command palette for keyboard-first workflows.

## 1.0 — Stable desktop release

- [ ] Complete Windows/macOS/Linux clean-checkout release-candidate audit.
- [ ] Confirm installer signing/notarization where credentials are available.
- [ ] Complete native screen-reader review.
- [ ] Freeze the versioned report schema and document compatibility guarantees.

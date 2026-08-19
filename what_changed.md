# TextLens — Work Handoff

## Current milestone

Phase 4 → Phase 5 reliability, local power-user workflows, documentation, and release hardening (2026-08-19).

The source-side feature implementation is substantially complete for the current milestone. This continuation completed deterministic encoding-fixture wiring that had been left stale in the previous handoff, implemented reusable privacy-bounded local analysis presets, expanded tests/documentation, and opened pull request #1 for observable repository CI.

Remaining release-blocking work is primarily clean dependency/toolchain verification, native Windows/macOS/Linux packaging, signing/notarization, manual accessibility review, and real release-candidate screenshots.

## Repository state

- Repository: `sanskarIN/textlens`
- Default branch: `main`
- Working branch for this continuation: `feat/local-analysis-presets`
- Pull request: `#1` — `feat: add reusable local analysis presets`
- Visibility: public
- License: MIT
- Primary stack: Rust + Tauri 2 + TypeScript + Vite
- Source specification: `18_textlens_master_prompt.md` supplied in the ChatGPT session
- Required visible credit: **Made by the Sanskar**
- Requested commit email: `sanskarin@outlook.in`

### Commit author limitation

The connected GitHub file-write API does not expose an author/email override. Commits created through the integration therefore use the authenticated GitHub identity rather than a caller-supplied Git author email. Repository/package source metadata uses `sanskarin@outlook.in` where author/contact metadata is supported.

## Completed implementation

### Core analysis

- Unicode-aware word segmentation.
- Word, unique-word, longest-word, character, grapheme, byte, sentence, paragraph, and line metrics.
- Configurable reading-time and speaking-time estimates.
- Ranked keywords, bigrams, and trigrams.
- Local keyword-exclusion lists that affect keyword summaries only; word/vocabulary metrics and n-grams continue to use the full token stream.
- Whitespace, blank-line, trailing-whitespace, and LF/CRLF/CR diagnostics.
- Empty-input, punctuation, Unicode, apostrophe, case-folding, and vocabulary invariants covered in Rust tests.

### File analysis and encoding

- Local file analysis through Tauri.
- UTF-8 and UTF-8 BOM handling.
- UTF-16 LE/BE BOM decoding.
- Conservative Windows-1252 fallback.
- Undefined Windows-1252 bytes are surfaced as decoding errors/replacements instead of being silently accepted.
- Large UTF-8/Windows-1252 files use streaming analysis above the configured threshold.
- Source reports expose display filenames rather than full private paths.
- The currently active selected file path may be held transiently in frontend memory only so analysis-setting changes can re-run that file; it is cleared when the workspace switches to pasted text or is cleared and is never persisted.
- Deterministic malformed UTF-8, Windows-1252 edge-byte, and UTF-16LE odd-boundary fixtures are now wired directly into `fileio.rs` decoding tests.

### Report export, import, and comparison

- Privacy-safe JSON and Markdown export.
- Exported reports intentionally omit raw source text and full source paths.
- Report schema version `2` is emitted by current analyses.
- Compatible report schema `1` JSON can still be imported.
- Report version `0` and unknown future versions are rejected.
- Imported JSON reports are capped at 512 KiB before parsing.
- Imported metadata, frequency entries, percentages, schema versions, and basic metric relationships are validated before presentation.
- Current analysis can be compared locally with a previously exported TextLens JSON report.
- Comparison shows signed metric deltas and top-keyword count changes.
- Vocabulary comparison metrics unavailable in schema v1 are omitted rather than fabricated from default values.
- Imported baseline reports are not persisted as a history database.

### Settings and local preferences

- Light, dark, and system themes.
- Reading/speaking rates and top-result limits.
- Reduced-motion preference.
- Bounded keyword exclusions: at most 100 entries, at most 64 Unicode scalar values per entry.
- Frontend trims/deduplicates keyword exclusions before persistence.
- Settings storage values are runtime-validated rather than trusted.
- Analysis-option validation is shared between ordinary settings and reusable presets so bounds cannot drift between the two workflows.
- Settings Close is an explicit non-submit button so closing the dialog does not accidentally save edits.
- Changing analysis settings re-runs the active pasted text or currently selected file so displayed results remain consistent with settings.

### Reusable local analysis presets

- Device-local reusable presets are available from Settings.
- A preset stores only:
  - display name;
  - reading words per minute;
  - speaking words per minute;
  - top-keyword result limit;
  - top-n-gram result limit;
  - keyword exclusions.
- Preset names are trimmed and capped at 48 Unicode scalar values.
- The collection is capped at 12 presets.
- Names are deduplicated case-insensitively; saving an existing name replaces it and moves the replacement to the front.
- Persisted preset input is treated as untrusted and passed through the same bounded analysis-option parser as normal settings.
- User-supplied preset names are rendered with DOM text nodes rather than inserted as HTML.
- Applying a preset writes its values into the existing Settings form and submits through the existing save path, preserving one validation and active-analysis refresh workflow.
- Applying a preset cannot silently change theme, reduced-motion preference, or the recent-file-history opt-in.
- Local-storage write failures are surfaced rather than reported as successful saves/deletions.
- Presets can be deleted individually.
- Presets never store raw source text, source paths, report contents, recent-file entries, encoding samples, credentials, or unrelated privacy/appearance settings.
- Presets are intentionally not included in settings backup schema v2; this is documented rather than implied otherwise.

### Settings backup/restore

- Current settings backup schema version: `2`.
- Schema v2 contains preferences, keyword exclusions, and the boolean recent-file-metadata opt-in.
- Schema v1 remains readable with privacy-preserving defaults for later fields.
- Version `0` and future settings schemas are rejected.
- Backups are capped at 64 KiB before parsing.
- Unknown fields and invalid ranges are rejected.
- Backup writes use temporary-file + rename replacement behavior.
- Recent-file metadata entries and analysis presets are deliberately excluded from the current settings backup schema.

### Privacy-bounded recent-file metadata

- Optional recent-file metadata history is disabled by default.
- Stores at most 10 entries.
- Each entry contains only display filename, analyzed size, and opened timestamp.
- Full paths, directory identities, raw source text, report data, and encoding samples are never stored in this history.
- Path-like display names containing separators are rejected by the metadata parser.
- Duplicate display names collapse to the newest entry because directory identity is intentionally not retained.
- Individual entries can be removed.
- Full history can be cleared.
- Disabling the feature or restoring defaults clears retained metadata.
- History is informational only and cannot reopen a historical file because historical paths are not retained.

### Quick actions and desktop UX

- Searchable keyboard-first Quick actions palette.
- `Ctrl/Cmd + Shift + P` opens Quick actions.
- `Ctrl/Cmd + O` opens a text file.
- `Ctrl/Cmd + E` exports Markdown when a report exists.
- `Ctrl/Cmd + K` focuses the editor.
- Quick action search is local, case-insensitive, and supports multiple search terms.
- Report-dependent actions remain visible but disabled when no report exists.
- Quick actions reuse the same application functions as visible controls rather than maintaining duplicate behavior.
- Polished comparison, preset, recent-history, settings, diagnostics, responsive, dark/light/system, and reduced-motion styling is present.

### Internationalization-ready structure

- User-facing English strings are centralized in `src/i18n/en.ts` for implemented interface areas, including preset labels/status text.
- Architecture remains ready for additional locale modules without duplicating analysis logic.

### Tests and fixtures

Frontend unit coverage includes:

- settings parsing/range validation;
- shared analysis-option parsing;
- keyword-exclusion bounds/deduplication;
- analysis-preset name/collection bounds;
- case-insensitive preset deduplication and replacement ordering;
- preset application while preserving unrelated privacy/appearance settings;
- malformed preset storage handling;
- preset local-storage write-failure handling;
- recent-file metadata parsing/path rejection/size/timestamp validation/deduplication/10-entry cap;
- formatting/presentation helpers;
- report comparison helpers;
- legacy report comparison compatibility;
- Quick actions filtering and multi-term matching.

Rust coverage includes:

- core counts and vocabulary metrics;
- keyword filtering semantics;
- Unicode segmentation and property-based invariants;
- mixed/repeated sentence punctuation;
- apostrophe behavior;
- report rendering/import/round-trip/schema compatibility/validation/size bounds;
- settings backup round-trip, v1 migration, invalid values, future-version rejection, exclusion validation, and unknown-field rejection;
- deterministic encoding behavior in `fileio.rs`, including malformed UTF-8, undefined Windows-1252 bytes, and an odd UTF-16LE byte boundary.

Checked-in synthetic fixtures:

- `src-tauri/tests/fixtures/multilingual.txt`
- `src-tauri/tests/fixtures/punctuation.txt`
- `src-tauri/tests/fixtures/malformed-utf8.hex`
- `src-tauri/tests/fixtures/windows-1252-edge.hex`
- `src-tauri/tests/fixtures/utf16le-boundary.hex`

The multilingual/punctuation fixtures are wired into regression tests and the three `.hex` fixtures are wired into deterministic `fileio.rs` decoding tests.

### Performance

- Large-file streaming threshold defaults to 8 MiB and is configurable through `TEXTLENS_LARGE_FILE_THRESHOLD_MIB` within documented bounds.
- A release-mode synthetic analyzer benchmark exists and accepts input size/iteration arguments.
- Performance budgets, complexity notes, and benchmark methodology are documented.

### Documentation and governance

Maintained documentation includes:

- `README.md`
- `LICENSE`
- `CONTRIBUTING.md`
- `CODE_OF_CONDUCT.md`
- `SECURITY.md`
- `SUPPORT.md`
- `PRIVACY.md`
- `CHANGELOG.md`
- `ROADMAP.md`
- `what_changed.md`
- `docs/architecture.md`
- `docs/setup.md`
- `docs/development.md`
- `docs/testing.md`
- `docs/release.md`
- `docs/troubleshooting.md`
- `docs/accessibility.md`
- `docs/performance.md`
- repository governance guidance
- release template/checklist

ADRs now cover:

1. Rust + Tauri modular monolith.
2. Offline-first privacy.
3. Conservative encoding.
4. Versioned settings backups.
5. Versioned report import/comparison.
6. Local keyword exclusions.
7. Keyboard-first Quick actions.
8. Opt-in recent-file metadata.
9. Local analysis presets.

### Repository/CI hardening

- GitHub issue templates and pull-request template.
- Dependabot configuration.
- CODEOWNERS and funding configuration.
- CI for frontend and Rust quality gates.
- CodeQL/security workflow and Rust dependency audit configuration.
- Cross-platform draft release workflow.
- Pull-request dependency review workflow that fails on high-severity dependency changes.
- Offline repository Markdown local-link/image target checker: `scripts/check-doc-links.mjs`.
- `npm run docs:check` exposed in `package.json` and included in CI/release/setup documentation.
- Pull request #1 was opened specifically so CI/Security/Dependency Review results are observable through the connector rather than inferred from workflow files.

## Important files/modules added or substantially changed in this continuation

### Frontend

- `index.html`
- `src/types.ts`
- `src/state.ts`
- `src/state.test.ts`
- `src/i18n/en.ts`
- `src/presets-ui.ts`
- `src/presets.css`
- `src/lib/presets.ts`
- `src/lib/presets.test.ts`
- `src-tauri/src/fileio.rs` (latest pre-branch encoding-fixture wiring commit)

### Documentation

- `README.md`
- `PRIVACY.md`
- `CHANGELOG.md`
- `ROADMAP.md`
- `what_changed.md`
- `docs/architecture.md`
- `docs/testing.md`
- `docs/adr/0009-local-analysis-presets.md`

## Verification actually performed in this continuation

- GitHub repository/tree/file inspection through the connected GitHub integration.
- Recent commit-history inspection through the connected GitHub integration.
- `TODO`/`FIXME` repository search returned no unresolved implementation placeholders.
- The prior encoding-fixture wiring commit was inspected directly and confirmed to connect all three deterministic `.hex` fixtures to `fileio.rs` tests.
- Node.js and npm availability were checked in the local execution environment.
- Strict standalone TypeScript compilation was run for the new/changed preset, state, type, and preset-UI modules using the locally available TypeScript compiler; those targeted compilations passed.
- A compile-level excess-property issue in the preset unit test was detected during review and corrected before PR creation.
- The connected GitHub API accepted all source/documentation commits in this continuation.
- Pull request #1 was opened from `feat/local-analysis-presets` to `main`.
- CI, Security, and Dependency Review workflows were observed as triggered for the PR. At the time this handoff entry was written, the observed runs were still queued and therefore are **not** claimed as passing.

## Verification not completed — do not treat as passing

The following release gates have not yet been truthfully completed in the local execution environment:

```bash
npm install
npm run check
npm run lint
npm run format:check
npm run docs:check
npm run test
npm run build

cd src-tauri
cargo fmt --check
cargo clippy --all-targets --all-features -- -D warnings
cargo test --all-targets
cargo run --release --example benchmark -- 16 5
```

Reasons:

- The local execution environment does not have `rustc`/`cargo` installed.
- Repository `package-lock.json` and `src-tauri/Cargo.lock` are currently absent and must be generated by the real package managers in a registry-capable environment rather than fabricated.
- Direct dependency-registry/network access in the local execution environment has not been reliable enough to claim a clean dependency install/build.
- PR workflows are now observable, but their latest runs must reach a completed state before any CI pass/fail claim is made.

## Known limitations / release blockers

1. `package-lock.json` is absent.
2. `src-tauri/Cargo.lock` is absent.
3. Rust formatting, Clippy, tests, and benchmark have not run in the current local environment because the Rust toolchain is absent.
4. The full npm type/lint/format/docs/test/build suite has not been completed from a clean dependency install in the local environment.
5. PR CI/Security/Dependency Review must finish and any failure must be fixed before merge.
6. Windows, macOS, and Linux packaged builds have not been installed and manually verified from clean checkouts.
7. Real release-candidate platform screenshots have not replaced the repository-owned preview/mock.
8. Windows signing and Apple signing/notarization have not been performed because signing credentials are external secrets.
9. Native screen-reader/manual accessibility review has not been completed on each supported desktop OS.
10. Branch protection for `main` is guidance/documented but is not enabled at this checkpoint.
11. Line-oriented streaming retains the current logical line; an extremely large single-line file can therefore still require memory proportional to that line.
12. Analysis presets are device-local and are not included in settings backup schema v2; changing that later requires an explicit schema/privacy decision.

## Next exact tasks

1. Observe PR #1 CI, Security, and Dependency Review to completion; inspect logs and fix every failure.
2. Merge PR #1 only after the repository checks are acceptably green, preserving the atomic commit history rather than squashing it.
3. In a registry-capable environment, generate and commit `package-lock.json` using npm and `src-tauri/Cargo.lock` using Cargo. Do not hand-edit or invent either lockfile.
4. Run the complete frontend suite including `npm run docs:check`, fix every failure, and record exact outputs.
5. Install the Rust toolchain and run `cargo fmt --check`, Clippy with warnings denied, and all-target tests; fix every failure.
6. Run the release-mode synthetic benchmark and record machine/toolchain/input/iteration evidence.
7. Build/package from clean Windows, macOS, and Linux checkouts and install each produced artifact.
8. Perform the documented manual acceptance and native screen-reader/accessibility review on each supported platform, including analysis preset controls.
9. Capture real screenshots from verified packaged release candidates and replace mock/placeholder preview evidence.
10. Configure Windows signing and Apple notarization when credentials are available.
11. Enable documented branch protection/rules for `main` and require meaningful CI checks.
12. Re-run clean-checkout release-candidate verification and update this handoff before tagging a stable release.
13. After release-blocking verification is stable, consider the remaining roadmap item for richer privacy-safe report customization without embedding source text.

## Release notes draft

### Added

- Vocabulary richness metrics: unique words and longest-word length.
- Versioned report schema v2.
- Bounded validated JSON report import and local comparison.
- Compatible schema-v1 report comparison.
- Local keyword exclusions.
- Searchable keyboard-first Quick actions.
- Opt-in privacy-bounded recent-file metadata.
- Reusable privacy-bounded local analysis presets.
- Settings backup schema v2 with migration from v1.
- Synthetic multilingual/punctuation fixtures and deterministic encoding-boundary fixtures with automated wiring.
- Offline Markdown local-link verification.
- Pull-request dependency review workflow.

### Fixed/hardened

- Undefined Windows-1252 bytes are surfaced rather than silently treated as ordinary content.
- Malformed UTF-8 and odd UTF-16LE boundaries have deterministic regression fixtures.
- Settings Close no longer submits/saves the settings form.
- Active file analyses are refreshed when analysis-affecting settings change.
- Imported reports, restored settings, and persisted analysis presets are bounded and validated before use.
- Legacy report comparisons do not invent vocabulary values that did not exist in schema v1.
- Recent metadata remains disabled by default and is deleted when disabled/defaults are restored.
- Preset local-storage failures are surfaced rather than silently reported as successful changes.

### Privacy/security

- Report comparison operates only on aggregate report files.
- Source text and full source paths remain absent from exported reports.
- Historical file paths are not retained in recent metadata.
- The active selected path is memory-only and never persisted.
- Settings backup contains preferences only and excludes recent-history entries and analysis presets.
- Analysis presets contain configuration only and exclude text, paths, reports, history entries, and unrelated privacy/appearance preferences.
- Imported local JSON and persisted local preset data are treated as untrusted input with explicit validation.

## Recent meaningful commits

This continuation intentionally used small meaningful Conventional Commits. Current branch commits include:

- `a6cb2f6bcd4a8f1574788608774ae1dcfed486b9` — `feat: define reusable analysis preset type`
- `d44d30c3cbc68662c9c49052fb7f68bdb3990477` — `refactor: centralize analysis option validation`
- `d12d5f6e7970740008a46e7fc2677a4e7f5d8336` — `feat: add bounded local analysis preset storage`
- `9347beaa0402a4de83134bbe7abd997d8b572f77` — `test: cover local analysis preset lifecycle`
- `8ecd6e56737d700a96a7f9e06935df0e8a7b5c63` — `feat: add analysis preset interface copy`
- `ebe2fe8fd2c5f4c89c0d2f296f26df4039585309` — `test: verify shared analysis option validation`
- `47912ad2dfe18d7dd9c52f4259db6fcd50815735` — `refactor: decouple preset creation from app settings`
- `e2b49d7dd9a26bcd90c402bccbe74f756b5decbb` — `feat: add preset persistence error copy`
- `16d42f07076b82738e04a15fc20a3cb4bbbc3243` — `feat: add settings analysis preset controls`
- `7f346f9b3ecb4c109785197a9e542a2b5f3b3d59` — `style: polish analysis preset settings panel`
- `d01fb59fe608cd55f32b94d2a262df75381ad78f` — `feat: load analysis preset settings module`
- `07dbd5bb4d7240a58656d5f59c9719def7a40b8b` — `docs: record local analysis preset design`
- `98bdb99b84cb542d71f8b1fe750e6e9ab4fc5e92` — `feat: externalize preset summary units`
- `c842605487fae633f37e106d3187dabba38a80ed` — `refactor: externalize preset summary labels`
- `3ca3533e7c3373ad130ddde2d9b4a79209290b56` — `test: harden analysis preset persistence coverage`
- `27c802bed082a73830c25787293c99a76ecdb2e6` — `docs: document local analysis preset privacy boundary`
- `6b17e4e0e5e7cdc4e0a9bf7a1a3e7f8ca4ff1a9f` — `docs: mark encoding fixtures and analysis presets complete`
- `ba6928ad8afa606938b42fb65af3eed29619a70c` — `docs: add local analysis presets to changelog`
- `45e436c6a698706ba0f39f0221b8e2f0fb45594d` — `docs: document reusable local analysis presets`
- `fa5b579353b889fc7d7fcdf3079cb5fcae732f94` — `docs: add local presets to architecture guide`
- `c04341173c914c8ab8b2724a2dbd697468824f08` — `docs: expand analysis preset verification coverage`

Preceding main commit:

- `c9ba53edebc65e9fa1909a338c7a9f755d37453f` — `test: wire deterministic encoding byte fixtures`

## Definition-of-done status

The implementation and repository documentation cover the requested product scope plus coherent power-user/reliability extensions including analysis presets. **The repository must not yet be declared fully release-complete or bug-free** because clean dependency installation, the full npm/Rust quality suite, completed observable PR checks, cross-platform packaged-build verification, signing/notarization, native accessibility review, and real release-candidate screenshots remain verification work.

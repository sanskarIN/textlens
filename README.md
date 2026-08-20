<div align="center">
  <img src="public/logo.svg" width="108" height="108" alt="TextLens logo">

# TextLens

**Private, precise text analysis — entirely on your device.**

[![CI](https://github.com/sanskarIN/textlens/actions/workflows/ci.yml/badge.svg)](https://github.com/sanskarIN/textlens/actions/workflows/ci.yml)
[![Security](https://github.com/sanskarIN/textlens/actions/workflows/security.yml/badge.svg)](https://github.com/sanskarIN/textlens/actions/workflows/security.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-sanskarIN-FFDD00?logo=buy-me-a-coffee&logoColor=000000)](https://buymeacoffee.com/sanskarIN)

**Current source version: 2.0.12**

**Made by the Sanskar**

</div>

TextLens is an open-source, privacy-first text analyzer for **Windows, macOS, Linux, Android, iPhone/iPad, Web/PWA, and ChromeOS through the PWA**. The desktop runtime uses Rust + Tauri, while Web/PWA and mobile builds use a browser-safe local analysis adapter so document contents stay on the device instead of being sent to a TextLens server.

## Preview

![TextLens interface concept](docs/screenshots/app-preview.svg)

> The preview is a repository-owned UI mock that tracks the implemented layout. Platform release documentation should use real captures only after the corresponding build has been produced and tested.

## Features

- Word, unique-word, longest-word, character, grapheme, sentence, paragraph, line, and byte counts.
- Configurable reading-time and speaking-time estimates.
- Ranked keyword frequency, bigrams, and trigrams.
- Local keyword-exclusion lists that do not alter core counts or n-grams.
- Reusable device-local analysis presets for reading/speaking rates, result limits, and keyword exclusions.
- Whitespace diagnostics, blank-line counts, trailing-whitespace counts, and LF/CRLF/CR detection.
- Live analysis for pasted text.
- Local file analysis with UTF-8, UTF-16 BOM handling, and a labelled Windows-1252 fallback.
- Desktop streaming analysis for large UTF-8/Windows-1252 files.
- Browser/mobile in-memory file analysis with an explicit 64 MiB source-file bound.
- Canonical JSON report export plus customizable Markdown export.
- Source document text is deliberately excluded from every TextLens report.
- Markdown section picker for source metadata, core metrics, keywords, bigrams, trigrams, and whitespace diagnostics.
- Versioned JSON report schema with bounded import and legacy schema-v1 compatibility.
- Frozen report schema-v2 compatibility target for the TextLens 2.x application line.
- Local comparison with previously exported TextLens JSON reports.
- Versioned settings backup/restore with bounded validation.
- Optional path-free recent-file metadata history, disabled by default.
- Per-entry and clear-all recent-history controls.
- Device-local analysis presets with bounded names and values.
- Searchable Quick actions and keyboard shortcuts.
- Light, dark, and system themes.
- Reduced-motion support and accessible focus/semantic states.
- Touch-safe mobile layout, safe-area handling, dynamic viewport sizing, and 16 px mobile form controls.
- Installable PWA manifest and offline application-shell service worker.
- Failure-safe local preference storage with a session-only in-memory fallback.
- Guarded startup recovery instead of a blank application window.
- Manual-only update/release link with no background update polling.
- Release-tag validation plus deterministic SHA-256 artifact checksum tools.
- No account, analytics SDK, cloud analysis API, or donation gate.

## Supported platforms

| Platform | Runtime | Support | Primary command |
| --- | --- | --- | --- |
| Windows 10/11 | Tauri 2 + Rust | ✅ Supported | `npm run tauri:dev` / `npm run tauri:build` |
| macOS | Tauri 2 + Rust | ✅ Supported | `npm run tauri:dev` / `npm run tauri:build` |
| Linux desktop | Tauri 2 + Rust | ✅ Supported | `npm run tauri:dev` / `npm run tauri:build` |
| Android | Tauri mobile + portable frontend | ✅ Source supported | `npm run tauri:android:dev` / `npm run tauri:android:build` |
| iPhone / iPad | Tauri mobile + portable frontend | ✅ Source supported | `npm run tauri:ios:dev` / `npm run tauri:ios:build` |
| Modern Web | Browser-local runtime | ✅ Supported | `npm run dev:web` / `npm run build:web` |
| PWA | Browser-local runtime + service worker | ✅ Supported | `npm run build:web` |
| ChromeOS | Web/PWA | ✅ Supported through PWA | `npm run build:web` |

See [docs/platforms.md](docs/platforms.md) for prerequisites, architecture, capability boundaries, platform limitations, packaging expectations, and the complete acceptance matrix.

### Source support is not the same as a published binary

Android/iOS source configuration and build commands are included, but this repository does not claim a signed APK/AAB/IPA or store release unless one has actually been built and verified in the required platform environment. The same evidence rule applies to signed/notarized desktop packages and hosted PWA deployments.

## One UI, two local execution paths

TextLens deliberately does not force desktop filesystem assumptions onto browsers or mobile document providers.

```text
                               ┌─────────────────────────────┐
                               │ Shared TypeScript/Vite UI   │
                               └──────────────┬──────────────┘
                                              │
                         ┌────────────────────┴────────────────────┐
                         │                                         │
                  desktop/native                           web/mobile
                         │                                         │
                 Tauri JavaScript APIs                     Vite aliases
                         │                                         │
                    Tauri IPC                              local browser APIs
                         │                                         │
              Rust analysis/file/report               TypeScript portable
                    implementation                     analysis implementation
```

Desktop builds retain the Rust streaming/file-decoding path. Web/PWA and mobile builds replace only the Tauri-facing JavaScript modules at bundle time with adapters in `src/platform/`; the rest of the UI remains shared. Both analysis paths emit TextLens report schema v2.

## Keyboard shortcuts

| Shortcut | Action |
| --- | --- |
| `Ctrl/Cmd + Shift + P` | Open Quick actions |
| `Ctrl/Cmd + O` | Open a local text file |
| `Ctrl/Cmd + E` | Open Markdown report section picker |
| `Ctrl/Cmd + K` | Focus the text editor |

Touch devices expose the same actions through visible controls and dialogs instead of requiring keyboard shortcuts.

## Quick start

### Desktop

Install Node.js 20.19+ (or 22.12+), Rust stable via `rustup`, and Tauri's OS-native prerequisites. Then:

```bash
git clone https://github.com/sanskarIN/textlens.git
cd textlens
npm install
npm run tauri:dev
```

### Web/PWA

```bash
npm install
npm run dev:web
```

Production bundle:

```bash
npm run build:web
npm run preview:web
```

Deploy `dist/` from HTTPS for production PWA/service-worker behavior.

### Android

After installing the Android/Tauri prerequisites described in [docs/platforms.md](docs/platforms.md):

```bash
npm install
npm run tauri:android:init
npm run tauri:android:dev
```

Build command:

```bash
npm run tauri:android:build
```

### iPhone/iPad

iOS development requires macOS/Xcode plus the Tauri iOS prerequisites. Then:

```bash
npm install
npm run tauri:ios:init
npm run tauri:ios:dev
```

Build command:

```bash
npm run tauri:ios:build
```

## Privacy-first local preferences

Recent-file history is an explicit opt-in. It stores at most 10 metadata entries and records display filename, size, and opened time only. It does not persist full source paths or source text.

Analysis presets are also local-only. A preset stores only its display name plus analysis configuration: reading/speaking rates, result limits, and keyword exclusions. It never stores document contents, source paths, recent-file entries, reports, credentials, or external account data.

Settings, recent metadata, and presets share a failure-safe storage boundary. If persistent WebView/browser storage is unavailable, TextLens attempts to continue with session-only in-memory preferences and clearly reports that persistence is unavailable. This fallback never uploads preferences or document content.

## Privacy-safe reports

JSON exports stay complete and canonical because they are the validated import/comparison format. Markdown exports can omit optional aggregate sections. Disabling **Source metadata** removes display filename, analysis mode, and encoding information from the Markdown report.

The original document text is never an export section. Report comparison operates on exported aggregate values rather than reconstructing the source document.

## Platform-specific file behavior

### Desktop

The Rust backend owns local file decoding and can stream large UTF-8/Windows-1252 inputs. UTF-16 BOM inputs use full-file decoding where byte-oriented streaming could split code units.

### Web/PWA and mobile portable runtime

The portable runtime uses sandboxed `File`, `TextDecoder`, `Blob`, and local download/document-picker behavior. It detects UTF-8 BOM, UTF-16 LE/BE BOM, valid UTF-8, and otherwise uses a labelled Windows-1252 fallback. Selected text files are bounded to 64 MiB because this runtime analyzes them in memory.

Report imports remain bounded to 512 KiB and settings-backup imports to 64 KiB.

## PWA behavior

`public/manifest.webmanifest` makes the web build installable on compatible browsers. `public/sw.js` caches the application shell and same-origin application assets for offline relaunch after they have been fetched. It does **not** cache analyzed source documents or generated reports.

The PWA path is also the supported ChromeOS route.

## Tauri platform capabilities

Permissions are intentionally split instead of granting one broad capability everywhere:

- `src-tauri/capabilities/default.json` → Linux, macOS, Windows only.
- `src-tauri/capabilities/mobile.json` → Android and iOS only.

The application does not request broad shell, process, filesystem, or network capabilities merely to achieve cross-platform packaging.

## Tech stack

- **Rust** — native desktop analysis, file decoding/streaming, report validation/import/export, settings backup validation.
- **Tauri 2** — Windows/macOS/Linux native shell plus Android/iOS mobile shell.
- **TypeScript** — shared UI and portable Web/mobile analysis adapters.
- **Web Platform APIs** — sandboxed browser/mobile file selection, decoding, download, and PWA support.
- **Vite** — mode-specific native/Web/mobile builds and adapter aliases.
- **Vitest + Rust tests + proptest** — automated verification.
- **GitHub Actions** — CI, security checks, release automation, and version/tag consistency enforcement.

## Development and verification

Frontend/source checks:

```bash
npm install
npm run version:check
npm run check
npm run lint
npm run format:check
npm run docs:check
npm run test
npm run build
npm run build:web
npm run build:mobile
```

Rust checks:

```bash
cd src-tauri
cargo fmt --check
cargo clippy --all-targets --all-features -- -D warnings
cargo test --all-targets
```

CI runs the desktop, web, and mobile frontend bundles so portability regressions are caught even when a full signed Android/iOS package cannot be produced on the Linux frontend runner.

## Documentation

- [Cross-platform support](docs/platforms.md)
- [Setup](docs/setup.md)
- [Development](docs/development.md)
- [Architecture](docs/architecture.md)
- [Testing](docs/testing.md)
- [Report schema compatibility](docs/report-schema.md)
- [Release](docs/release.md)
- [Troubleshooting](docs/troubleshooting.md)
- [Accessibility](docs/accessibility.md)
- [Performance](docs/performance.md)
- [Architecture decisions](docs/adr)

## Build and release

Before packaging, verify synchronized application identity:

```bash
npm run version:check
npm run release:tag-check -- v2.0.12
```

Desktop package:

```bash
npm run tauri:build
```

Web/PWA bundle:

```bash
npm run build:web
```

Android and iOS packages use their platform commands documented above. Final store signing, notarization, provisioning, screenshots, store metadata, and native-device acceptance are release-environment gates rather than assumptions made by source code.

After collecting final release artifacts into one directory, generate and verify a SHA-256 manifest:

```bash
npm run release:checksums -- artifacts release-metadata/SHA256SUMS.txt
npm run release:checksums:verify -- artifacts release-metadata/SHA256SUMS.txt
```

See [docs/release.md](docs/release.md) before publishing artifacts.

## Report compatibility

Application version **2.0.12** continues to emit report schema **v2**. Application versioning and report-schema versioning are deliberately independent.

TextLens can import schema-v1 JSON reports for comparison. Metrics that did not exist in v1 are not presented as meaningful comparison deltas. Unknown future schema versions are rejected rather than guessed. Existing valid schema-v2 reports remain the stable compatibility target for the TextLens 2.x line.

See [docs/report-schema.md](docs/report-schema.md) for the complete compatibility contract.

## Privacy and security

TextLens is designed for local analysis. It does not send analyzed text to a TextLens server. Full source paths are not included in reports; exported reports omit source document contents; recent-file metadata is path-free and opt-in; presets contain configuration only; and settings backups contain preferences only.

The update section performs no background check and opens the official Releases page only after explicit user action. The hosted Web/PWA build necessarily downloads its static application assets from its host, but analysis happens locally after those assets load.

See [PRIVACY.md](PRIVACY.md) and [SECURITY.md](SECURITY.md). Do not report security vulnerabilities in a public issue.

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) and the [Code of Conduct](CODE_OF_CONDUCT.md). Keep changes focused and add regression tests for bug fixes. Changes to report compatibility must update [docs/report-schema.md](docs/report-schema.md). Platform-specific changes must preserve the local-first boundary and update [docs/platforms.md](docs/platforms.md) when behavior or prerequisites change.

## Roadmap

See [ROADMAP.md](ROADMAP.md).

## License

MIT — see [LICENSE](LICENSE).

## Support, contact, and funding

- Business: `sanskarin@outlook.in`
- Business: `sanskarin.business@gmail.com`
- Support: `supportramsandesh@gmail.com`
- GitHub: https://github.com/sanskarIN
- Project: https://github.com/sanskarIN/textlens
- Buy Me a Coffee: https://buymeacoffee.com/sanskarIN

[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-sanskarIN-FFDD00?logo=buy-me-a-coffee&logoColor=000000)](https://buymeacoffee.com/sanskarIN)

Funding is optional and never changes product functionality.

---

**Made by the Sanskar**

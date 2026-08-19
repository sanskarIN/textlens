<div align="center">
  <img src="public/logo.svg" width="108" height="108" alt="TextLens logo">

# TextLens

**Private, precise text analysis — entirely on your device.**

[![CI](https://github.com/sanskarIN/textlens/actions/workflows/ci.yml/badge.svg)](https://github.com/sanskarIN/textlens/actions/workflows/ci.yml)
[![Security](https://github.com/sanskarIN/textlens/actions/workflows/security.yml/badge.svg)](https://github.com/sanskarIN/textlens/actions/workflows/security.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-sanskarIN-FFDD00?logo=buy-me-a-coffee&logoColor=000000)](https://buymeacoffee.com/sanskarIN)

**Made by the Sanskar**

</div>

TextLens is an open-source desktop text analyzer for Windows, macOS, and Linux. It combines a Rust analysis engine with a lightweight Tauri + TypeScript interface and keeps document contents local by default.

## Preview

![TextLens interface concept](docs/screenshots/app-preview.svg)

> The preview is a repository-owned UI mock that tracks the implemented layout. Release documentation will use real platform captures when packaged binaries are produced.

## Features

- Word, unique-word, longest-word, character, grapheme, sentence, paragraph, line, and byte counts.
- Configurable reading-time and speaking-time estimates.
- Ranked keyword frequency, bigrams, and trigrams.
- Whitespace diagnostics, blank-line counts, trailing-whitespace counts, and LF/CRLF/CR detection.
- Live analysis for pasted text.
- Local file analysis with UTF-8, UTF-16 BOM handling, and a clearly labelled Windows-1252 safe fallback.
- Invalid UTF-8 and undefined Windows-1252 bytes are surfaced through an encoding warning rather than silently hidden.
- Streaming analysis for large UTF-8/Windows-1252 files to avoid loading the entire document at once.
- JSON and Markdown report export; source document text is deliberately excluded from reports.
- Versioned settings backup/restore with strict validation and a size limit.
- Light, dark, and system themes plus reduced-motion support.
- Keyboard shortcuts and accessible focus/semantic states.
- No account, analytics SDK, cloud API, or donation gate.

## Supported platforms

| Platform | Target | Notes |
|---|---|---|
| Windows | Windows 10/11 | MSI/NSIS bundle through Tauri release builds |
| macOS | Current supported macOS | App/DMG bundle through Tauri release builds |
| Linux | Modern desktop distributions | AppImage/deb/rpm availability depends on Tauri host tooling |

## Tech stack

- **Rust** — analysis engine, file decoding/streaming, report writing, settings backup validation.
- **Tauri 2** — native desktop shell and secure IPC.
- **TypeScript** — strongly typed UI behavior.
- **Vite** — frontend development/build.
- **Vitest + Rust tests + proptest** — automated verification.
- **GitHub Actions** — CI, security checks, and release automation.

## Quick start

### Prerequisites

Install Node.js 20.19+ (or 22.12+), Rust stable via `rustup`, and Tauri's OS-native prerequisites. See [docs/setup.md](docs/setup.md).

```bash
git clone https://github.com/sanskarIN/textlens.git
cd textlens
npm install
npm run tauri:dev
```

## Development setup

```bash
npm install
npm run check
npm run lint
npm run test
npm run build

cd src-tauri
cargo fmt --check
cargo clippy --all-targets --all-features -- -D warnings
cargo test --all-targets
```

Full guides:

- [Setup](docs/setup.md)
- [Development](docs/development.md)
- [Architecture](docs/architecture.md)
- [Testing](docs/testing.md)
- [Release](docs/release.md)
- [Troubleshooting](docs/troubleshooting.md)
- [Accessibility](docs/accessibility.md)
- [Performance](docs/performance.md)

## Build and release

```bash
npm run tauri:build
```

Tagged releases are automated by `.github/workflows/release.yml`. See [docs/release.md](docs/release.md) before publishing artifacts.

## Architecture overview

```text
TypeScript/Vite UI
      │ Tauri IPC
      ▼
commands.rs
      │
      ├── domain/analyzer.rs  ← pure counting/frequency logic
      ├── fileio.rs           ← encoding + streaming adapter
      ├── report.rs           ← privacy-safe JSON/Markdown export
      └── settings_backup.rs  ← validated local preference backup/restore
```

Architecture decisions are recorded in [docs/adr](docs/adr).

## Privacy and security

TextLens is designed for offline use. It does not send analyzed text to a server. Full source paths are not included in the analysis report, exported reports intentionally omit source document contents, and settings backups contain preferences only. See [PRIVACY.md](PRIVACY.md) and [SECURITY.md](SECURITY.md).

Do not report security vulnerabilities in a public issue.

## Testing

```bash
npm run check
npm run lint
npm run format:check
npm run test
npm run build
cd src-tauri
cargo fmt --check
cargo clippy --all-targets --all-features -- -D warnings
cargo test --all-targets
```

See [docs/testing.md](docs/testing.md) for manual acceptance and Unicode/large-file checks.

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) and the [Code of Conduct](CODE_OF_CONDUCT.md). Keep changes focused and add regression tests for bug fixes.

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

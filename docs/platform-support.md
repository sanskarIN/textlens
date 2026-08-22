# Platform Support

TextLens is designed as a desktop application for Windows, macOS, and Linux. Cross-platform support is treated as a combination of portable source code, locked dependency resolution, native compilation, packaging, installation, and platform-specific acceptance evidence.

## Support matrix

| Platform | Source target | Native smoke CI | Release packaging | Signing/notarization |
|---|---|---|---|---|
| Windows | Supported | `windows-latest` | Tauri MSI/NSIS release job | External release credential gate |
| macOS | Supported | `macos-latest` | Tauri App/DMG release job | External Apple credential gate |
| Linux | Supported | `ubuntu-22.04` | Tauri Linux bundle release job | Distribution-specific review gate |

The native smoke workflow compiles the application without producing distributable bundles. A green smoke build proves that the checked-out source, committed npm/Cargo dependency locks, frontend build, Rust/Tauri core, and native host toolchain compile together on that runner. It does **not** by itself prove installer correctness, signing, notarization, runtime accessibility, or behavior on every OS version/distribution.

## Continuous native smoke gate

`.github/workflows/platform-smoke.yml` runs for relevant source/dependency changes on pull requests and `main`, and can also be started manually.

Each matrix entry:

1. checks out the same repository revision;
2. installs Node.js 22 and restores the npm cache keyed by `package-lock.json`;
3. runs the dependency-free application/release identity check;
4. installs frontend dependencies exactly with `npm ci`;
5. installs the stable Rust toolchain and restores the Rust build cache where available;
6. verifies `src-tauri/Cargo.lock` with `cargo metadata --locked`;
7. installs the required Linux WebKit/Tauri build packages on the Linux runner;
8. runs `npm run native:smoke`.

The reusable smoke command is:

```bash
npm run native:smoke
```

It expands to a Tauri debug build with `--no-bundle`, intentionally separating portable native compilation from installer-generation claims.

## Portability rules for contributors

Changes should preserve these rules unless an explicit platform-specific implementation is documented and tested:

- use Tauri APIs for native dialogs, opening external pages, application metadata, and IPC instead of shelling out to platform commands;
- do not hard-code drive letters, home directories, path separators, temporary directories, or executable suffixes;
- keep filesystem paths out of exported reports and persisted recent-file metadata;
- keep source text handling byte/Unicode based rather than relying on host locale defaults;
- keep line-ending diagnostics explicit for LF, CRLF, CR, and mixed inputs;
- avoid assumptions about `Ctrl` versus `Cmd` in user-facing shortcut behavior;
- keep CSS responsive to narrow desktop windows and scaling;
- do not add native dependencies that compile on only one supported host without a documented fallback or conditional implementation;
- keep dependency manifest changes paired with package-manager-generated lockfile updates;
- keep release packaging logic in Tauri/GitHub Actions rather than undocumented developer-machine scripts.

## Local development prerequisites

### Windows

Use a current Visual Studio 2022/Build Tools installation with Desktop development with C++, a Windows SDK, Rust stable, Node.js, and the WebView2 runtime.

### macOS

Install Xcode command-line tools, Rust stable, and Node.js. Public signed distribution additionally requires appropriate Apple signing/notarization credentials.

### Linux

Linux package names vary by distribution. The CI reference environment is Ubuntu 22.04 and installs the WebKitGTK/AppIndicator/SVG/patchelf prerequisites required by the Tauri build.

See [setup.md](setup.md) for concrete setup commands.

## Release evidence required per platform

Before describing a binary release as verified on a platform, record all of the following for the exact release candidate:

1. clean checkout plus `npm ci` and locked Cargo dependency verification;
2. frontend static/type/test/build gates;
3. Rust format, locked Clippy/test, and native build gates;
4. packaged bundle generation;
5. installation/launch of the generated artifact;
6. local file open/analyze/export/import/compare smoke tests;
7. encoding fixtures and large-file behavior;
8. keyboard-only navigation, reduced motion, scaling, and native screen-reader acceptance;
9. platform-native signing/notarization status where applicable;
10. real screenshots captured from the verified packaged application;
11. artifact SHA-256 manifest generation and verification.

Until those checks are executed, source compatibility and CI compilation should be described separately from verified packaged-release support.

## Platform-specific regressions

When a bug occurs only on one operating system, add the narrowest practical regression coverage and include the affected host in the pull-request verification notes. If the issue requires a real packaged application or assistive technology, keep the automated source test and manual native acceptance step distinct rather than claiming one replaces the other.

---

**Made by the Sanskar**

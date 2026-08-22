# Setup

## Node.js

Use Node.js 20.19+ or 22.12+. Node.js 22 LTS is a good default.

```bash
node --version
npm --version
```

## Rust

Install Rust with `rustup` and select stable:

```bash
rustup toolchain install stable
rustup default stable
rustc --version
cargo --version
```

## Tauri native prerequisites

### Windows

Install Visual Studio 2022/Build Tools with **Desktop development with C++**, a current Windows SDK, and ensure Microsoft Edge WebView2 Runtime is present.

### macOS

```bash
xcode-select --install
```

Apple signing/notarization is needed for signed public releases, not ordinary local development.

### Debian/Ubuntu Linux

Typical Tauri 2 packages:

```bash
sudo apt update
sudo apt install -y \
  libwebkit2gtk-4.1-dev \
  build-essential \
  curl \
  wget \
  file \
  libxdo-dev \
  libssl-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev \
  patchelf
```

Package names vary by distribution.

## Clone and install

```bash
git clone https://github.com/sanskarIN/textlens.git
cd textlens
npm ci
npm run tauri:dev
```

`npm ci` installs exactly the dependency graph committed in `package-lock.json`. Use `npm install` only when you intentionally change npm dependencies and intend to review and commit the resulting lockfile update.

## Validate toolchains

Run the frontend, documentation, and Rust quality gates before opening a pull request:

```bash
npm run version:check
npm run check
npm run lint
npm run format:check
npm run docs:check
npm run test
npm run build

cd src-tauri
cargo fmt --check
cargo clippy --locked --all-targets --all-features -- -D warnings
cargo test --locked --all-targets
```

`npm run docs:check` verifies repository-local Markdown link and image targets without making network requests.

After the native prerequisites for the current host are installed, run the same no-bundle desktop smoke command used by the cross-platform CI matrix:

```bash
npm run native:smoke
```

This performs a Tauri debug build without creating distributable installers. Passing it confirms that the frontend and Rust/Tauri application compile together on the current host; it does not replace packaged installer, signing/notarization, accessibility, or runtime release-candidate verification. See [platform-support.md](platform-support.md) for the full support contract.

## Dependency lockfiles

`package-lock.json` and `src-tauri/Cargo.lock` are committed source inputs and are enforced by CI. Do not hand-edit or invent either file.

When dependency manifests intentionally change:

```bash
npm install
cargo generate-lockfile --manifest-path src-tauri/Cargo.toml
```

Review both manifest and lockfile diffs, then verify the resulting graph before committing:

```bash
npm ci --no-audit --no-fund
cargo metadata --manifest-path src-tauri/Cargo.toml --locked --no-deps --format-version 1
```

## Configuration

Copy `.env.example` only when overriding local defaults. `TEXTLENS_LARGE_FILE_THRESHOLD_MIB` accepts 1..1024 and defaults to 8 MiB. No credential is needed for core analysis.

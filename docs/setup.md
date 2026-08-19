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
npm install
npm run tauri:dev
```

## Validate toolchains

```bash
npm run check
npm run test
cd src-tauri
cargo check
cargo test --all-targets
```

## Configuration

Copy `.env.example` only when overriding local defaults. `TEXTLENS_LARGE_FILE_THRESHOLD_MIB` accepts 1..1024 and defaults to 8 MiB. No credential is needed for core analysis.

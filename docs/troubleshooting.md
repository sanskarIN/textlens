# Troubleshooting

## Cargo not found

Install Rust with `rustup`, open a new terminal, then verify `rustc --version` and `cargo --version`.

## `npm ci` reports a lockfile mismatch

Do not bypass the error with `npm install` unless you are intentionally changing dependencies. First confirm `package.json` and `package-lock.json` came from the same repository revision. For an intentional dependency change, run `npm install`, review the generated lockfile diff, run `npm ci --no-audit --no-fund`, and commit the manifest and lockfile together.

## Cargo `--locked` reports an outdated lockfile

Confirm `src-tauri/Cargo.toml` and `src-tauri/Cargo.lock` came from the same revision. For an intentional Rust dependency change, regenerate with `cargo generate-lockfile --manifest-path src-tauri/Cargo.toml`, review the diff, then verify it with `cargo metadata --manifest-path src-tauri/Cargo.toml --locked --no-deps --format-version 1` before committing both files.

## Linux WebKit/GTK errors

Install the Tauri 2 native packages in `docs/setup.md`; distribution package names can differ.

## Windows linker/SDK errors

Use Visual Studio Installer to add **Desktop development with C++** and a current Windows SDK.

## Blank dev window

Run `npm run dev` and confirm Vite is available on port 1420. The port is intentionally strict.

## Windows-1252 fallback appears

Files without a UTF BOM that are not valid UTF-8 are decoded using a deterministic Windows-1252 fallback and visibly labelled. Convert the file to UTF-8 if you know the true encoding.

## Large UTF-16 file uses memory mode

This is deliberate in the current 2.0.12 source line to avoid splitting two-byte code units during byte-oriented streaming. UTF-8 and Windows-1252 large files stream where the encoding strategy permits.

## Export fails

Check destination-directory existence, write permission, file locks, and free space.

## Counts differ from another word counter

Word and sentence definitions differ between products. TextLens uses Unicode word segmentation and a punctuation-based sentence heuristic.

## Still stuck?

Use a GitHub bug report with synthetic text. For vulnerabilities, follow `SECURITY.md`.

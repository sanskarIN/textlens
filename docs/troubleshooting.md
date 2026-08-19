# Troubleshooting

## Cargo not found

Install Rust with `rustup`, open a new terminal, then verify `rustc --version` and `cargo --version`.

## Linux WebKit/GTK errors

Install the Tauri 2 native packages in `docs/setup.md`; distribution package names can differ.

## Windows linker/SDK errors

Use Visual Studio Installer to add **Desktop development with C++** and a current Windows SDK.

## Blank dev window

Run `npm run dev` and confirm Vite is available on port 1420. The port is intentionally strict.

## Windows-1252 fallback appears

Files without a UTF BOM that are not valid UTF-8 are decoded using a deterministic Windows-1252 fallback and visibly labelled. Convert the file to UTF-8 if you know the true encoding.

## Large UTF-16 file uses memory mode

This is deliberate in 0.1 to avoid splitting two-byte code units during byte-oriented streaming. UTF-8 and Windows-1252 large files stream.

## Export fails

Check destination-directory existence, write permission, file locks, and free space.

## Counts differ from another word counter

Word and sentence definitions differ between products. TextLens uses Unicode word segmentation and a punctuation-based sentence heuristic.

## Still stuck?

Use a GitHub bug report with synthetic text. For vulnerabilities, follow `SECURITY.md`.

# ADR-0012: Portable cross-platform runtime

## Status

Accepted — 2026-08-20.

## Context

TextLens originally routed every frontend operation through Tauri desktop APIs and a Rust backend. That is appropriate for Windows, macOS, and Linux, but a normal browser cannot invoke Tauri IPC or access arbitrary filesystem paths. Mobile document providers also do not guarantee desktop-style path semantics.

Treating browser/mobile document handles as desktop paths would make the source look cross-platform while leaving file workflows fragile or non-functional.

## Decision

Keep one shared TypeScript UI but support two local execution paths.

### Native desktop

Windows, macOS, and Linux continue to use real Tauri JavaScript APIs and the Rust backend for analysis, decoding, streaming, report import/export, and settings backup/restore.

### Portable Web/mobile runtime

Web/PWA and Android/iOS frontend builds use Vite mode aliases that replace the Tauri-facing JavaScript modules with browser-safe adapters under `src/platform/`.

The portable runtime:

- analyzes text locally in TypeScript;
- emits TextLens report schema v2;
- uses sandboxed `File` input instead of assuming arbitrary filesystem paths;
- decodes UTF-8/UTF-16 BOM input and uses a labelled Windows-1252 fallback;
- exports through local browser/download behavior;
- preserves the existing report and settings size limits;
- places a 64 MiB bound on selected source files because analysis is in memory;
- does not register the PWA service worker in Tauri mobile mode.

The PWA service worker caches application assets only and is not a document cache.

## Capability separation

Desktop and mobile Tauri capability files are separate and platform-scoped. Cross-platform support must not be implemented by granting broad shell, filesystem, process, or network permissions.

## Consequences

Benefits:

- one UI codebase covers desktop, Web/PWA, Android, and iOS/iPadOS;
- browser builds no longer crash on direct Tauri imports;
- mobile document-provider behavior is not forced through desktop path assumptions;
- the local-first privacy boundary is retained;
- ChromeOS is supported through the PWA without another native codebase.

Trade-offs:

- the portable analysis implementation must be regression-tested against the shared report contract;
- portable file analysis is currently memory-bound rather than streamed;
- platform signing, stores, and real-device acceptance remain separate release evidence.

## Verification rule

CI must type-check, test, and build the native, web, and mobile frontend modes. Release documentation must not claim a signed/store artifact until it has been produced and tested in the corresponding platform environment.

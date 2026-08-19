# ADR-0001: Rust + Tauri modular monolith

- Status: Accepted
- Date: 2026-08-19

## Context

TextLens needs native file access, strong text-processing performance, Windows/macOS/Linux packaging, and a modern UI without a cloud backend.

## Decision

Use a modular monolith: Rust for domain/filesystem logic, Tauri 2 for the desktop boundary, and TypeScript/Vite for the UI. Keep analysis logic independent from Tauri commands.

## Consequences

Benefits include one installable app, direct Rust tests, a narrow IPC surface, and no server deployment. Tradeoffs include OS-specific native build prerequisites and the need to validate packaging on each target platform.

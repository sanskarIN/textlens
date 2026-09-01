# RustSec Dependency Triage

TextLens keeps RustSec advisory tracking separate from the release lockfile gate. A reproducible lockfile proves which dependency graph is being shipped; it does not prove that every transitive advisory has an upstream fix.

## Current release-branch findings

The `release/v2.0.13-reproducible-evidence` dependency graph still contains the GTK3/GLib family that triggered the repository's RustSec issues #23-#32 and #39. Those crates are transitive through the desktop WebView/native stack and are not direct dependencies of the TextLens application crate.

The Unicode `unic-*` advisories tracked by #34-#38 and the `proc-macro-error` advisory tracked by #33 must likewise be treated according to their actual dependency path rather than silenced globally.

## Triage policy

1. **Security/unsoundness first.** An advisory describing undefined behaviour or a security vulnerability is a release blocker until the affected dependency is upgraded, removed, or a documented and tested mitigation makes the affected code path unreachable for the shipped product.
2. **Unmaintained transitive crates are not automatically equivalent to vulnerabilities.** They remain tracked, but the release decision must consider reachability, upstream ownership, and whether a maintained replacement can be adopted without destabilising the platform stack.
3. **Never suppress advisories merely to make CI green.** Any ignored advisory must have a specific package, reason, reachability assessment, owner, and removal condition.
4. **Prefer upstream fixes.** Do not patch generated lockfiles by hand. Dependency changes must be made through Cargo manifests/resolution and then regenerated with Cargo.
5. **Re-audit the exact release graph.** A later lockfile or toolchain change can alter the advisory set, so old green CI results must not be reused as proof for a newer commit.

## Issue mapping

| GitHub issues | Dependency family | Current action |
| --- | --- | --- |
| #39 | `glib` | Block stable binary release until the affected version is removed/upgraded or a documented upstream-safe mitigation is verified. |
| #23-#32 | GTK3 / GDK / ATK bindings | Track as transitive platform-stack maintenance debt; prefer a supported upstream Tauri/WebView stack rather than direct GTK3 substitutions. |
| #34-#38 | `unic-*` | Identify the introducing crate in the locked graph and replace the direct Unicode dependency where practical; do not add unused replacement crates merely to silence RustSec. |
| #33 | `proc-macro-error` | Identify the introducing procedural macro dependency and upgrade its parent dependency when a compatible maintained release exists. |

## Required evidence before stable release

- `cargo tree --locked` captured from the exact release commit.
- RustSec/audit output captured from the exact release commit.
- Each open advisory mapped to a direct or transitive dependency path.
- A written disposition for every advisory: fixed, removed, mitigated, or accepted as non-blocking with justification.
- Regression tests for any application-level mitigation.
- Final native builds and runtime acceptance on Windows, macOS, and Linux.

## Important limitation

This document intentionally does **not** claim that the RustSec issues are fixed. The current release branch is a reproducibility/evidence milestone; native platform packaging and dependency remediation remain separate release gates.

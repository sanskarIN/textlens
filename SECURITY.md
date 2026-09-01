# Security Policy

## Supported versions

Security fixes are applied to the current 2.0.x source/release line. Older development lines receive only best-effort fixes when practical.

| Version | Supported |
|---|---|
| 2.0.13 | Yes (release-candidate source line) |
| 2.0.x | Yes |
| 0.1.x | Best effort only |
| Older | No |

## Reporting a vulnerability

Please **do not open a public GitHub issue** for a vulnerability that could put users at risk.

Report privately to:

- `sanskarin@outlook.in`
- Support fallback: `supportramsandesh@gmail.com`

Include affected version/commit, operating system, reproduction steps, expected/actual behavior, impact, and a suggested mitigation if known. Never include real user documents, credentials, tokens, or another person's private data.

## Security design

- Analysis is local and account-free.
- No cloud endpoint is required for core functionality.
- Source document contents are omitted from exported reports.
- Full private paths are not returned as report metadata.
- Failed report/settings export destination validation uses a generic user-facing error and does not echo the missing directory path.
- Tauri capabilities are limited to core behavior, native file dialogs, and explicit external links.
- Report and settings export use a temporary file plus rename to reduce partial-write risk.
- Settings restore is capped at 64 KiB and validates version, fields, ranges, and bounded keyword exclusions before use.
- Saved-report import is capped at 512 KiB and validates schema version, metadata bounds, frequency bounds, percentages, and core metric relationships before presentation.
- Unknown future report schemas are rejected rather than partially interpreted.
- Imported report text fields are escaped before HTML presentation.
- Optional recent-file metadata is disabled by default, capped at 10 entries, excludes full paths/content, rejects path-like names, and provides immediate deletion controls.
- Quick actions search is static/local and invokes existing application functions rather than evaluating user-provided commands.

## Untrusted local input

Treat selected text files, imported reports, restored settings backups, and modified WebView local-storage values as untrusted input.

Security-sensitive changes must preserve these boundaries:

1. Do not deserialize an imported file directly into application state without validation.
2. Do not render imported filenames, report terms, or other strings through `innerHTML` without context-appropriate escaping.
3. Keep filesystem work behind explicit user-selected paths or established local application storage.
4. Do not add network transmission of analyzed text, report contents, recent metadata, or settings as an incidental feature.
5. Bound collections and imported file sizes before expensive processing when practical.
6. Add a regression test for every validation, disclosure, or escaping defect fixed.

## Threat boundary

The local operating-system user controls selected input and export paths. TextLens does not attempt to defend against a fully compromised host or malicious administrator/root account.

## Dependencies

CI includes static and dependency checks, and Dependabot is configured for npm, Cargo, and GitHub Actions updates. The scheduled Rust audit may open public tracking issues for advisories that are already publicly disclosed in the RustSec database; those automated issues are distinct from privately reported, not-yet-public vulnerabilities.

Dependency advisory triage follows the detailed policy in [`docs/rustsec-triage.md`](docs/rustsec-triage.md):

1. Confirm the affected crate/version and dependency path from a generated, reviewed Cargo lockfile.
2. Treat vulnerability, memory-safety, or unsoundness advisories as release-review blockers until a patched dependency path is available or a documented technical assessment shows the affected code is not reachable in the shipped target.
3. Review unmaintained-package advisories for upstream migration options and transitive dependency ownership; do not automatically label them as exploitable vulnerabilities.
4. Do not silence or ignore an advisory solely to make CI green.
5. Prefer an upstream-supported dependency update over local patching or forced incompatible versions.
6. Record unresolved release-relevant advisories and their status in the version-specific release notes.

The release process additionally requires reviewed npm and Cargo lockfiles before a tag can package binaries. See `docs/release-evidence.md`.

# Security Policy

## Supported versions

Until TextLens reaches 1.0, security fixes are applied to the latest development/release line.

| Version | Supported |
|---|---|
| 0.1.x | Yes |
| Older | Best effort only |

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
6. Add a regression test for every validation or escaping defect fixed.

## Threat boundary

The local operating-system user controls selected input and export paths. TextLens does not attempt to defend against a fully compromised host or malicious administrator/root account.

## Dependencies

CI includes static and dependency checks, and Dependabot is configured for npm, Cargo, and GitHub Actions updates.

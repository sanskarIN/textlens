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
- Tauri capabilities are limited to core behavior, file dialogs, and explicit external links.
- Report export uses a temporary file plus rename to reduce partial-write risk.

## Threat boundary

The local operating-system user controls selected input and export paths. TextLens does not attempt to defend against a fully compromised host or malicious administrator/root account.

## Dependencies

CI includes static and dependency checks, and Dependabot is configured for npm, Cargo, and GitHub Actions updates.

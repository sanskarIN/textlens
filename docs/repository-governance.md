# Repository Governance

This document describes recommended GitHub settings for the public TextLens repository. GitHub account-level settings are not stored in Git, so maintainers should apply these controls in the repository UI when their plan supports them.

## Default branch protection

Protect `main` with a ruleset or branch protection rule that:

- requires a pull request before merging for normal contributor work;
- requires the `Frontend quality`, `Rust quality`, and `Rust MSRV 1.77.2` CI checks once their exact contexts have reported successfully;
- requires the three native platform-smoke checks for changes covered by that workflow when GitHub ruleset configuration can accommodate path-filtered checks without blocking unrelated documentation-only pull requests;
- keeps dependency review and security scanning enabled;
- requires branches to be up to date before merge when practical;
- blocks force pushes and branch deletion;
- requires conversation resolution;
- applies to administrators unless an emergency recovery exception is explicitly needed;
- keeps bypass permissions limited to trusted maintainers.

Do not configure a required status-check name before that check has run at least once, because GitHub cannot validate a nonexistent check reliably. Path-filtered workflows require special care: do not make a skipped context mandatory in a way that permanently blocks unrelated pull requests.

## Merge policy

Prefer squash merge for external pull requests that contain fix-up commits. Rebase merge is acceptable for already-clean atomic histories. Normal merge commits are also acceptable when preserving a deliberate granular project history is valuable.

## Suggested labels

- `bug` — confirmed or suspected defect
- `enhancement` — user-facing improvement
- `accessibility` — keyboard, screen-reader, contrast, motion, or semantic UI work
- `performance` — CPU, memory, startup, or large-file work
- `security` — non-sensitive public hardening work only
- `documentation` — docs-only changes
- `dependencies` — dependency maintenance
- `good first issue` — tightly scoped contributor task
- `help wanted` — maintainer welcomes implementation help
- `platform: windows`, `platform: macos`, `platform: linux` — platform-specific behavior

Never use a public issue for an undisclosed vulnerability; follow `SECURITY.md` instead.

## Milestones

Recommended milestone names should reflect the current release line rather than obsolete pre-1.0 planning labels. Examples:

1. `2.0.x Reliability`
2. `2.0.x Release evidence`
3. `Next feature milestone`
4. `Accessibility & platform verification`

Create a milestone only when there is real scoped work for it. Close or move stale issues during milestone review rather than leaving inaccurate target versions.

## Discussions

If GitHub Discussions is enabled, suggested categories are:

- Announcements (maintainer-only creation)
- Ideas
- Q&A
- Show and tell

Support requests containing private documents or sensitive content should not be pasted publicly. Direct users to the support contact in `SUPPORT.md`.

## Dependencies

`package-lock.json` and `src-tauri/Cargo.lock` are reviewed repository inputs. Dependabot updates must preserve manifest/lockfile consistency and pass the same `npm ci`, Cargo `--locked`, security, and platform gates as human-authored dependency changes.

## Releases

Create releases from signed or trusted version tags after the release workflow and manual platform checks succeed. Use `.github/RELEASE_TEMPLATE.md` as the release-note checklist and keep `CHANGELOG.md` synchronized.

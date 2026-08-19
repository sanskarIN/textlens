# Repository Governance

This document describes recommended GitHub settings for the public TextLens repository. GitHub account-level settings are not stored in Git, so maintainers should apply these controls in the repository UI when their plan supports them.

## Default branch protection

Protect `main` with a ruleset or branch protection rule that:

- requires a pull request before merging for normal contributor work;
- requires the `Frontend quality`, `Rust quality`, and security-related status checks once their exact check names are visible in GitHub Actions;
- requires branches to be up to date before merge when practical;
- blocks force pushes and branch deletion;
- requires conversation resolution;
- applies to administrators unless an emergency recovery exception is explicitly needed;
- keeps bypass permissions limited to trusted maintainers.

Do not configure a required status-check name before that check has run at least once, because GitHub cannot validate a nonexistent check reliably.

## Merge policy

Prefer squash merge for external pull requests that contain fix-up commits. Rebase merge is acceptable for already-clean atomic histories. Avoid merge commits unless preserving a multi-commit feature history is valuable.

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

Recommended milestones mirror the engineering plan:

1. `v0.1 MVP`
2. `v0.2 Core completeness`
3. `v0.3 UX & hardening`
4. `v0.4 Quality & performance`
5. `v1.0 Release candidate`

Close or move stale issues during milestone review rather than leaving inaccurate target versions.

## Discussions

If GitHub Discussions is enabled, suggested categories are:

- Announcements (maintainer-only creation)
- Ideas
- Q&A
- Show and tell

Support requests containing private documents or sensitive content should not be pasted publicly. Direct users to the support contact in `SUPPORT.md`.

## Releases

Create releases from signed or trusted version tags after the release workflow and manual platform checks succeed. Use `.github/RELEASE_TEMPLATE.md` as the release-note checklist and keep `CHANGELOG.md` synchronized.

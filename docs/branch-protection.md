# Main Branch Protection Guide

TextLens should protect `main` from accidental direct changes while keeping the repository's granular merge-commit history intact.

This document describes the recommended GitHub repository settings. It does **not** claim that the settings are currently enabled.

## Recommended `main` rules

Configure a branch ruleset or branch protection rule targeting `main` with these settings.

### Pull requests

- Require changes to arrive through a pull request.
- Require conversation resolution before merge.
- Require the branch to be up to date before merge once the required checks are stable and reliably available.
- For a solo-maintainer repository, an approval requirement can remain at `0` until another trusted reviewer is available. Do not create a meaningless self-approval requirement merely to satisfy a number.
- If additional maintainers are added later, require at least one approval and dismiss stale approvals when new commits materially change the reviewed code.

### Required status checks

The primary merge gates defined by `.github/workflows/ci.yml` are:

- `Frontend quality`
- `Rust quality`

Require these only after GitHub has observed them successfully at least once and their check contexts appear in the repository's branch-rules UI. This avoids accidentally blocking every merge because of a misspelled or never-created context.

Additional security workflows should remain enabled, including dependency review and the repository's security scanning workflow. If their individual check contexts are made required later, select the exact context displayed by GitHub rather than typing a guessed name.

### History and destructive operations

- Block force pushes to `main`.
- Block branch deletion for `main`.
- Do **not** enable **Require linear history** while TextLens intentionally uses normal merge commits to preserve granular feature histories.
- Keep merge commits enabled as an allowed pull-request merge method.
- Squash/rebase may remain available for other contributions, but repository-maintained feature work should prefer ordinary merge commits when preserving the individual commits is useful.

### Administrator behavior

Once CI is proven reliable, apply the same protection to administrators/maintainers where the selected GitHub ruleset supports it. Emergency bypass should be limited to trusted maintainers and used only for genuine recovery situations.

Do not enable a rule that depends on unavailable signing credentials, external deployment environments, or checks that have never successfully reported to GitHub.

## Suggested setup order

1. Confirm `Frontend quality` and `Rust quality` have completed successfully on a recent pull request or `main` commit.
2. Open **Settings → Rules → Rulesets** (or **Branches → Branch protection rules**, depending on the GitHub UI available to the repository).
3. Create a rule targeting the exact branch `main`.
4. Require pull requests and conversation resolution.
5. Require the two confirmed CI check contexts above.
6. Block force pushes and deletion.
7. Leave **Require linear history** disabled.
8. Save the rule.
9. Open a small documentation pull request and verify that merging is blocked until required checks finish, then permitted after they pass.
10. Record the enabled rule in `what_changed.md` only after the repository UI confirms it is active.

## Why linear history stays off

TextLens intentionally used normal merge commits for feature/security work so each focused commit remains visible. Enabling GitHub's linear-history requirement would conflict with that policy by disallowing merge commits.

## Recovery guidance

If a newly enabled rule blocks all legitimate merges:

1. Inspect the exact missing check context in the pull request.
2. Compare it with the workflow/job names in `.github/workflows/`.
3. Remove only the invalid required context or correct the workflow; do not disable all protection as the first response.
4. Re-run the affected workflow.
5. Restore/strengthen the rule after the repository has a known-good check run.

Never weaken branch protection merely to make a failing quality gate disappear. Fix the failing gate or the incorrect rule instead.

## What changed

Describe the user-visible and technical change.

## Why

Explain the problem this solves.

## Verification

- [ ] `npm run version:check`
- [ ] `npm ci --no-audit --no-fund`
- [ ] `npm run check`
- [ ] `npm run lint`
- [ ] `npm run format:check`
- [ ] `npm run docs:check`
- [ ] `npm run test`
- [ ] `npm run build`
- [ ] `cargo metadata --manifest-path src-tauri/Cargo.toml --locked --no-deps --format-version 1`
- [ ] `cargo fmt --check`
- [ ] `cargo clippy --locked --all-targets --all-features -- -D warnings`
- [ ] `cargo test --locked --all-targets`
- [ ] `npm run native:smoke` or the cross-platform smoke matrix completed where native/platform-sensitive code changed
- [ ] Manual UI/accessibility checks completed where relevant

## Dependencies

- [ ] No dependency manifests changed, or the matching package-manager-generated lockfile diff is included and reviewed.

## Privacy and security

- [ ] No secrets, credentials, private documents, or personal user data were added.
- [ ] Raw analyzed text is not newly logged or persisted.
- [ ] New permissions/network behavior are documented and justified, or this change adds none.

## Documentation

- [ ] Documentation/changelog updated, or no documentation change is required.

# Contributing to TextLens

Thank you for improving TextLens. The project values focused changes, reproducible bug reports, privacy-preserving defaults, and tests that explain behavior.

## Before you start

1. Search existing issues and pull requests.
2. For a large behavior or architecture change, open an issue first.
3. Do not include private documents, credentials, real API keys, or personal user data in fixtures.
4. Keep TextLens usable without an account or network connection.

## Development workflow

```bash
git clone https://github.com/sanskarIN/textlens.git
cd textlens
npm install
npm run tauri:dev
```

Run the full suite before a pull request:

```bash
npm run check
npm run lint
npm run format:check
npm run test
npm run build
cd src-tauri
cargo fmt --check
cargo clippy --all-targets --all-features -- -D warnings
cargo test --all-targets
```

## Commit style

Prefer Conventional Commits: `feat:`, `fix:`, `test:`, `docs:`, `refactor:`, `perf:`, `build:`, `ci:`, and `chore:`.

A commit should be small enough to review and large enough to represent one coherent change.

## Pull requests

A pull request should explain the user-visible effect, privacy/security impact, tests, and documentation changes. Avoid unrelated formatting churn.

## Coding expectations

### Rust

- Keep domain logic independent of UI/platform concerns.
- Prefer explicit error handling over panics.
- Never log analyzed document contents.
- Run `cargo fmt` and `cargo clippy`.

### TypeScript/UI

- Keep strict TypeScript enabled.
- Escape user-derived strings before injecting HTML.
- Preserve keyboard navigation and visible focus states.
- Avoid third-party network scripts.

## Accessibility

New UI must support keyboard use, clear labels, sufficient contrast, and non-color-only status communication. See `docs/accessibility.md`.

## Security

Do not open public issues for vulnerabilities. Follow `SECURITY.md`.

## License

By contributing, you agree that your contributions are licensed under this repository's MIT License.

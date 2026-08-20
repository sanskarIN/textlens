# Contributing to TextLens

Thank you for improving TextLens. The project values focused changes, reproducible bug reports, privacy-preserving defaults, and tests that explain behavior.

## Before you start

1. Search existing issues and pull requests.
2. For a large behavior or architecture change, open an issue first.
3. Do not include private documents, credentials, real API keys, or personal user data in fixtures.
4. Keep TextLens usable without an account or network connection.
5. Read the relevant ADR before changing report schemas, settings backups, encoding behavior, or local persistence.

## Development workflow

```bash
git clone https://github.com/sanskarIN/textlens.git
cd textlens
npm ci
npm run tauri:dev
```

Use `npm install` instead of `npm ci` only when you intentionally change npm dependencies and need to update `package-lock.json`.

Run the full suite before a pull request:

```bash
npm run version:check
npm run check
npm run lint
npm run format:check
npm run docs:check
npm run test
npm run build
npm run build:web
npm run build:mobile

cd src-tauri
cargo fmt --check
cargo clippy --locked --all-targets --all-features -- -D warnings
cargo test --locked --all-targets
```

## Dependency and lockfile discipline

`package-lock.json` and `src-tauri/Cargo.lock` are committed build inputs. Do not delete, hand-edit, or regenerate them casually.

When a dependency manifest changes:

1. refresh the matching lockfile with npm or Cargo;
2. review manifest and lockfile changes together;
3. run the full validation suite;
4. keep unrelated dependency churn out of the same pull request.

CI and release workflows intentionally use `npm ci` and locked Cargo resolution so unexpected dependency drift fails early.

## Commit style

Prefer Conventional Commits: `feat:`, `fix:`, `test:`, `docs:`, `refactor:`, `perf:`, `build:`, `ci:`, and `chore:`.

A commit should be small enough to review and large enough to represent one coherent change.

## Pull requests

A pull request should explain the user-visible effect, privacy/security impact, tests, and documentation changes. Avoid unrelated formatting churn.

## Coding expectations

### Rust

- Keep domain logic independent of UI/platform concerns.
- Prefer explicit error handling over panics.
- Never log analyzed document contents or full selected paths.
- Treat report/settings imports as untrusted input and preserve size/range/schema validation.
- Keep report schema compatibility explicit. New fields with changed required semantics should trigger a version decision and compatibility tests.
- Keep settings backup migrations explicit; old supported backups should have deterministic defaults or an intentional rejection path.
- Run `cargo fmt` and `cargo clippy --locked`.

### TypeScript/UI

- Keep strict TypeScript enabled.
- Escape user-derived strings before injecting HTML.
- Preserve keyboard navigation and visible focus states.
- Avoid third-party network scripts.
- Reuse existing action functions from Quick actions instead of creating duplicate implementations.
- Validate values read from WebView storage rather than trusting stored JSON.

## Local persistence rules

TextLens intentionally keeps persistence small. Before adding a new local store:

1. Explain why persistence is required rather than keeping the value in memory.
2. Store the minimum fields needed for the feature.
3. Set collection/string/size bounds.
4. Provide deletion controls where retained user activity is involved.
5. Prefer opt-in for activity metadata.
6. Never persist analyzed source text or full source paths as incidental convenience data.
7. Add parsing/validation tests for malformed local-storage values.
8. Document whether a settings backup contains the preference, the data, both, or neither.

## Fixtures

Synthetic fixtures belong under `src-tauri/tests/fixtures/` when they improve regression readability. Keep them deterministic, fictional, small, and free of real personal or proprietary content.

## Accessibility

New UI must support keyboard use, clear labels, sufficient contrast, and non-color-only status communication. See `docs/accessibility.md`.

## Security

Do not open public issues for vulnerabilities. Follow `SECURITY.md`.

## License

By contributing, you agree that your contributions are licensed under this repository's MIT License.

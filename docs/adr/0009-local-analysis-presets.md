# ADR-0009 — Local analysis presets

- Status: Accepted
- Date: 2026-08-19

## Context

TextLens has several analysis-affecting preferences: reading rate, speaking rate, keyword result limits, n-gram result limits, and keyword exclusions. Power users may switch repeatedly between configurations such as proofreading, presentation rehearsal, or keyword-focused review. Re-entering the same values is unnecessary friction.

The feature must remain privacy-first. A reusable preset must not become a hidden document-history store, and applying one must not silently alter unrelated appearance or privacy preferences.

## Decision

1. TextLens stores analysis presets only in local WebView storage under a versioned key.
2. A preset contains only:
   - a user-supplied display name;
   - reading words per minute;
   - speaking words per minute;
   - top-keyword result limit;
   - top-n-gram result limit;
   - bounded keyword exclusions.
3. Presets never contain source text, file paths, recent-file entries, report contents, encoding samples, theme choice, reduced-motion preference, or the recent-file-history opt-in.
4. Preset names are trimmed and capped at 48 Unicode scalar values.
5. The collection is capped at 12 presets.
6. Preset names are deduplicated case-insensitively. Saving a name that already exists replaces the previous preset and moves the new value to the front.
7. Persisted preset data is parsed as untrusted input and routed through the same bounded analysis-option validation used by ordinary settings.
8. Applying a preset writes its analysis values into the existing settings form and submits through the normal settings save path. This preserves one validation and reanalysis workflow instead of duplicating application behavior.
9. Preset UI renders user-provided names through DOM text nodes rather than inserting them as HTML.
10. A local-storage write failure is surfaced to the user instead of being treated as a successful save or deletion.

## Consequences

- Users can switch between common analysis configurations with one action.
- Applying a preset cannot unexpectedly change theme, reduced-motion behavior, or recent-file privacy settings.
- The feature remains entirely offline and does not create a new Rust command or filesystem permission.
- Presets are device-local and are not currently included in the versioned settings backup file. A future schema revision may add this only with explicit compatibility and privacy rules.
- The fixed collection/name limits keep parsing, storage, and UI behavior predictable.

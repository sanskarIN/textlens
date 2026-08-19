# Accessibility

TextLens targets practical WCAG-oriented desktop accessibility.

## Implemented baseline

- Semantic headings and regions.
- Labels for editor/settings controls.
- Keyboard-accessible native controls and dialogs.
- Strong `:focus-visible` treatment.
- Live status announcements.
- Responsive layout.
- Light/dark/system themes.
- Reduced-motion preference and `prefers-reduced-motion`.
- Non-color-only status text.
- Approximately 44 CSS-pixel primary targets.

## Keyboard shortcuts

- `Ctrl/Cmd + O`: open file.
- `Ctrl/Cmd + E`: export current report as Markdown.
- `Ctrl/Cmd + K`: focus editor.

All core functionality remains available without shortcuts.

## Manual release review

Review with keyboard-only navigation, 200% scaling, Windows Narrator, VoiceOver, and relevant high-contrast/system themes.

A UI change must not remove focus visibility, accessible names, semantic control types, or keyboard reachability.

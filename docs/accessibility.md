# Accessibility

TextLens targets practical WCAG-oriented desktop accessibility.

## Implemented baseline

- Semantic headings and regions.
- Labels and descriptions for editor/settings controls.
- Keyboard-accessible native controls and dialogs.
- Strong `:focus-visible` treatment.
- Live status announcements.
- Responsive layout.
- Light/dark/system themes.
- Reduced-motion preference and `prefers-reduced-motion`.
- Non-color-only status text; comparison deltas include signed numeric values in addition to styling.
- Approximately 44 CSS-pixel primary targets.
- Report comparison uses a semantic table with row headers and text labels.
- Recent-file metadata controls use descriptive remove-button accessible names containing the display filename.
- Quick actions uses a labelled search input, native buttons, visible disabled states, and a close control.

## Keyboard shortcuts

- `Ctrl/Cmd + Shift + P`: open Quick actions.
- `Ctrl/Cmd + O`: open file.
- `Ctrl/Cmd + E`: export current report as Markdown.
- `Ctrl/Cmd + K`: focus editor.

All core functionality remains available without shortcuts. Quick actions is an additional route to existing commands rather than the only route.

## Dialog behavior

Settings, About, comparison, and Quick actions use the native HTML `dialog` element. When Quick actions opens, focus moves to its search field. Closing a dialog returns control to normal document navigation through native dialog focus handling.

Report-dependent Quick actions remain visible but disabled before an analysis exists so keyboard users can discover the available commands without triggering invalid operations.

## Recent metadata accessibility

The Recent files panel appears only after the user opts into local metadata history. Filename, size, and time remain visible as text; deletion is exposed through a real button. Empty history uses explanatory text rather than color or iconography alone.

## Manual release review

Review with keyboard-only navigation, 200% scaling, Windows Narrator, VoiceOver, and relevant high-contrast/system themes.

The release review must specifically verify:

1. Quick actions focus placement, search filtering, disabled commands, Escape/close behavior, and focus recovery.
2. Settings controls for keyword exclusions and recent-file opt-in at 200% scaling.
3. Comparison table reading order, horizontal scrolling at narrow widths, and signed delta announcements.
4. Recent-file remove/clear controls and empty-state announcements.
5. All visible controls in light, dark, system, reduced-motion, and platform high-contrast modes where available.

A UI change must not remove focus visibility, accessible names, semantic control types, or keyboard reachability.

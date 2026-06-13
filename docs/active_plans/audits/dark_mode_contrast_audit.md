# Dark-mode contrast audit (2026-06-12)

Read-only WCAG AA contrast audit. Covers dark-mode and light-mode text pairs across
the six UI chrome tokens, SVG map inline colors, rubric badge chips, danger-red error
states, and the two-state appearance toggle button.

## Method

Relative luminance computed per WCAG 2.1 section 1.4.3 using the standard sRGB
linearization formula. Contrast ratio = (L_lighter + 0.05) / (L_darker + 0.05).
Thresholds: normal text >= 4.5:1, large text and graphical elements >= 3:1.
Map SVG background in dark mode is the CSS `.map-pane` background which resolves
`var(--color-surface)` = `#252525`.

## Summary

- Pairs audited: 55
- PASS: 45
- FAIL: 10
- Toggle a11y: PASS (all 6 checks)

## Worst offenders

| Ratio | Context | FG | BG |
| --- | --- | --- | --- |
| 2.22:1 | DARK rubric hint chip text | #a0a0a0 (--color-muted) | #e9ecef (hardcoded) |
| 2.24:1 | Node label earth depth 5, both modes | #000000 / #0a0a0a | #2e4a10 |
| 2.30:1 | Node label fire depth 5, both modes | #000000 / #0a0a0a | #8a1a00 |
| 2.83:1 | DARK toolbar danger red | #c0392b (hardcoded) | #252525 |
| 4.25:1 | Node label fire depth 4, both modes | #000000 / #0a0a0a | #d03010 |
| 4.47:1 | Node label earth depth 4, both modes | #000000 / #0a0a0a | #4d7a28 |

## Failing pairs (full)

- DARK rubric hint chip: #a0a0a0 on #e9ecef = 2.22:1 (FAIL). Hint chip text uses --color-muted which darkens in dark mode; chip bg is hardcoded light.
- Node label earth depth 4 (#4d7a28) = 4.47:1 and depth 5 (#2e4a10) = 2.24:1 (FAIL, both modes).
- Node label fire depth 4 (#d03010) = 4.25:1 and depth 5 (#8a1a00) = 2.30:1 (FAIL, both modes).
- DARK toolbar danger red #c0392b on #252525 = 2.83:1 (FAIL). Hardcoded red in .toolbar-btn-danger / .toolbar-open-error / .toolbar-btn-dismiss does not flip for dark.

## Passing highlights

- All six chrome token text pairs pass in dark (5.87:1 to 13.55:1) and light.
- Theme-picker SHAPE/PALETTE labels (--color-heading on --color-surface): 12.50:1 dark, 16.10:1 light.
- Map verb labels: 11.74:1 dark (on map bg), 12.73:1 dark (on halo); 14.35:1 light.
- Edge/marker strokes (graphical, >=3:1): 5.46:1 dark, 5.41:1 light.
- Node labels on palette depths 0-3 pass in both modes.

## Toggle accessibility

All 6 checks PASS: dynamic aria-label naming state and action ("Appearance: light, click for dark"), icon aria-hidden, native button (keyboard focusable), focus-visible outline, no color-only state, two-state only (no ambiguous auto).

## Hardcoded colors not on tokens (no dark flip)

- toolbar.css: #c0392b danger red in .toolbar-btn-danger, .toolbar-open-error, .toolbar-btn-dismiss. Fix: route to a --color-danger token with a dark variant.
- rubric.css: status badge chips hardcoded; hint chip text uses --color-muted (fails in dark). Fix: dark override keeping hint text dark, or token-based chip bg.
- editor.css: .triple-delete-btn:hover #ffeaea/#b00000 hardcoded (low severity, hover only). Cell tint inputs (#1a1a1a on --from/to/same-tint light tints) stay readable but appear as light islands on the dark pane (visual nit, not a WCAG fail).

## Palette design note

palettes.ts node fills at depth 4 and 5 (earth and fire) fail WCAG AA with the near-black node label, in BOTH modes. The node renderer does not adapt label color to fill luminance. Fix: switch node label to white when fill luminance < ~0.18.

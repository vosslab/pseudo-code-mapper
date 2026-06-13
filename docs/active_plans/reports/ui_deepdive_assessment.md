# UI deepdive assessment

Visual and UX assessment of the concept-map-maker app from the screenshot
gallery in `/tmp/ui_deepdive/`. Themes light and dark at widths 1440, 1024,
and 768, plus toolbar, table, map, theme-picker, export, and print close-ups.

Accessibility target is the repo standard of 5.5:1 (stricter than WCAG AA),
per [docs/COLOR_CONTRAST_ACCESSIBILITY.md](../../COLOR_CONTRAST_ACCESSIBILITY.md).
Contrast notes below are visual estimates, not measured; flagged pairs should
be measured with `tools/contrast_calculator.py` or the WebAIM checker.

## Status summary

The four recent fixes all verify visually. The dark-mode export renders light.
The main remaining defects are horizontal overflow of the triples table at the
1024 and 768 viewports (both themes) and an inverted dark pill behind verb
labels in print preview.

## Recent fix confirmation (item 2)

| Fix | Result | Evidence |
| --- | --- | --- |
| "+ Add row" visible in dark | CONFIRMED | `table_dark.png`, `app_dark_1440.png` show the button with a visible border and readable label |
| No white box behind map verb label in dark | CONFIRMED | `map_dark.png`: "make", "include", "have gender", etc. sit directly on the dark canvas with no backing box |
| Theme-picker labels readable in dark | CONFIRMED | `theme_picker_dark.png`: "SHAPE" and "PALETTE" render as light gray on dark; dropdowns show light text on dark |
| Toolbar buttons wrap to two lines tidily | CONFIRMED | `toolbar_dark.png`, `toolbar_light.png`: "Save project", "Export triples CSV", "Export PNG" wrap cleanly and stay aligned within their group cards |
| Delete button shows danger red | CONFIRMED | `table_dark.png`: first-row delete renders as a red X in a red-bordered box; "Clear" toolbar button is also red |

## Export-light proof (item 3)

CONFIRMED. `export_svg_rendered.png` (the dark-mode SVG export rendered on
white) shows a fully light figure: white background, dark node text, no
selection highlights, and the "make" verb label drops its blue selection
color to plain black. `export_dark_render.png` confirms the app UI stays dark
during export while the map clears its selection. The export correctly strips
theme and selection state.

## Dark/light correctness (item 1)

Most surfaces flip correctly: app background, toolbar group cards, triples
panel, map pane, rubric bar, and autosave text all darken in dark mode and the
text stays light. The "THIS CONCEPT" / "POINTS TO THIS CONCEPT" header pills
and the row highlight colors (green source, orange target) appear in both
themes (see `app_dark_768.png`, `app_dark_1024.png`).

Items to review:

- Map node fills do not flip. In `map_dark.png` the concept bubbles keep their
  light cream and green palette fills with black text. This is arguably correct
  (the map mirrors the export look), but the root "honeybees" cream node sits on
  near-black canvas with a thin border; verify the node-to-canvas separation
  reads well and the black node text on pale-green fills still clears 5.5:1.
- `table_dark.png` close-up shows plain white input cells with no row highlight,
  while `app_dark_768.png` and `app_dark_1024.png` show the highlights present.
  This is a capture-state difference (no row selected in the close-up), not a
  theme bug.

## General UI quality (item 4)

- Visual hierarchy is clear: grouped toolbar cards (FILE / CSV / IMAGE AND
  PRINT), a two-column triples-plus-map body, and a rubric footer.
- The appearance toggle is icon-only. In light mode (`toolbar_light.png`,
  `app_light_1024.png`) it renders as a gear/cog; in dark mode
  (`toolbar_dark.png`) it renders as a moon. The icon meaning is not obvious
  and the light/dark intent is ambiguous without a label. The planned Light/Dark
  text label will resolve this; until then it reads as a generic settings cog.
- Toolbar wrapping and alignment are tidy across all three widths.
- The triples table does not fit its panel at 1024 and 768 (see defects below).

## Defects

| Severity | File(s) | Issue | Suggested fix |
| --- | --- | --- | --- |
| Major | `app_dark_1024.png`, `app_light_1024.png` | Row action buttons (delete X, chain) are clipped at the right edge of the triples panel; only partial glyphs/dots are visible | Reduce input min-widths, let cells flex, or allow the action column to stay pinned so it is never clipped |
| Major | `app_dark_768.png`, `app_light_768.png` | The third column ("POINTS TO THIS CONCEPT") overflows the panel; only a partial header and a sliver of the cell show at the right edge | At narrow widths, stack the three concept fields vertically per row, or make the triples panel horizontally scrollable with a visible scrollbar |
| Minor | `print_preview_dark.png` | Verb labels render as light text inside a dark rounded pill on the white print page (inverted look); the on-screen dark map style leaks into print | Force verb labels to dark text with no pill background under print media, matching `export_svg_rendered.png` |
| Minor | `toolbar_light.png`, `toolbar_dark.png` | Appearance toggle is icon-only and ambiguous (cog in light, moon in dark) | Add the planned Light/Dark text label and use a consistent sun/moon pair so current state is obvious |
| Nit | `app_dark_1024.png`, `app_dark_768.png` | Header pill text ("THIS CONCEPT") is muted/low-emphasis on the pale pill in dark mode | Verify the pill-label contrast clears 5.5:1; bump label weight or darken text if needed |

## Possible contrast concerns (unmeasured)

Flag for measurement against the 5.5:1 standard:

- "autosave on" footer text: light gray on dark in dark mode; appears faint
  (`toolbar_dark.png`, `app_dark_1440.png`).
- "SHAPE" / "PALETTE" picker labels in dark: readable but muted
  (`theme_picker_dark.png`).
- Map verb labels in dark: gray "are divided into" / "include" on near-black
  canvas (`map_dark.png`); the white labels are fine, the gray ones are
  borderline.
- Header pill labels in dark mode (`app_dark_1024.png`).

## Limitations

- No measurement tool was run; all contrast calls are visual estimates from the
  PNGs and should be confirmed with `tools/contrast_calculator.py` or WebAIM.
- Assessment is limited to the static screenshots provided; no interaction,
  hover, focus-ring, or keyboard-navigation states beyond what the captures show.
- The `export_dark.svg` raw file was not parsed; the rendered PNG
  (`export_svg_rendered.png`) was used as the export-light proof.

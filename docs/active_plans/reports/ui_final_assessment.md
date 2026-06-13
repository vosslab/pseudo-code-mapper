# UI final assessment

Second-pass visual and UX assessment of the concept-map-maker app from the
screenshot gallery in `/tmp/ui_final/` (captured 2026-06-13). Themes light and
dark at widths 1440, 1024, and 768, plus toolbar, triples-table, concept-map,
rubric, export, and print close-ups.

Accessibility target is the repo standard of 5.5:1 (stricter than WCAG AA),
per [docs/COLOR_CONTRAST_ACCESSIBILITY.md](../../COLOR_CONTRAST_ACCESSIBILITY.md).
Contrast notes below are visual estimates from the PNGs, not measured; flagged
pairs should be confirmed with `tools/contrast_calculator.py` or the WebAIM
checker. This report compares against the prior pass
[ui_deepdive_assessment.md](ui_deepdive_assessment.md).

## Status summary

Most prior defects are resolved. The appearance toggle is now labeled and clear,
the dark concept-map verb labels lost their white box, the export renders light,
and rubric chips read in both themes. The one substantive remaining defect is the
triples third column plus row-action buttons being clipped at the 768 viewport
(both themes). The inverted print pill remains visible but is now a known
synthetic capture artifact, not a real-print defect.

## Fix confirmation

| Fix | Result | Evidence |
| --- | --- | --- |
| Appearance toggle labeled (icon + Light/Dark text) | CONFIRMED | `toolbar_closeup_light.png` shows gear icon + "Light"; `toolbar_closeup_dark.png` shows moon icon + "Dark". Readable, state unambiguous |
| No white box behind verb labels in dark map | CONFIRMED | `concept_map_dark.png`: "are divided into", "include", "have gender", "has gender" sit as white glyphs directly on the dark canvas, no backing box |
| Dark verb labels readable | CONFIRMED | `concept_map_dark.png`: white verb labels clearly legible on near-black canvas; selected "make" is the blue accent |
| Triples table all three columns at 1024 | CONFIRMED | `full_app_1024_light.png`, `full_app_1024_dark.png`: THIS CONCEPT, VERB PHRASE, and POINTS TO THIS CONCEPT all present and filled |
| Rubric chips readable in dark | CONFIRMED | `rubric_panel_dark.png`: FAIL (red on pink) and OK (green on light green) opaque chips legible; body text light gray on dark |
| Danger red readable in dark | CONFIRMED | `full_app_1024_dark.png`, `full_app_768_dark.png`: "Clear" toolbar button renders red on dark; trash icon red |
| Theme-picker labels readable in dark | CONFIRMED | `full_app_1024_dark.png`, `full_app_768_dark.png`: SHAPE and PALETTE labels and the Rounded/Earth dropdowns read light on dark |
| Export render is light | CONFIRMED | `export_dark_render.png`: white background, dark node text, plain black "make" (selection stripped), no dark theme leak |

## Triples table at 768 (clipping verdict)

At 1024 (both themes), all three columns render and are reachable, though the
action column (delete X, chain) sits hard against the right panel edge with only
a faint sliver of glyph visible (`full_app_1024_light.png`,
`full_app_1024_dark.png`). The buttons are present but visually crowded at the
boundary.

At 768 the clipping is real and reproduced in the dedicated close-ups. In
`triples_table_768_light.png` and `triples_table_768_dark.png`, columns 1 (THIS
CONCEPT) and 2 (VERB PHRASE) render fully, but column 3 (POINTS TO THIS CONCEPT)
is cut off: only the header initials and the orange left border of the cell show
at the right edge. The third-column input fields and the row-action buttons
(delete X, chain) are entirely off-panel and unreachable. The full-app shots
`full_app_768_light.png` and `full_app_768_dark.png` confirm this: the side-by-
side triples+map body layout squeezes the triples panel so the third column and
actions fall outside it.

Precise answer: at 768 the third column and the row-action buttons are NOT
reachable. This matches the in-progress fix note.

## Concept-map node labels

`concept_map_dark.png` and `concept_map_light.png` show black labels on the
light/medium Earth fills (depths 0 through ~3) plus mid-green "female"/"male"
fills, all legible. The sample data does not include the darkest depth-4/5 fills
that the doc says use near-white labels, so the specific "white labels on deep
fills" claim cannot be fully verified from this gallery. The documented residual
(Earth depth 4 `#4d7a28` at ~5.1:1) is not exercised by this data.

## Defects

| Severity | File(s) | Issue | Concrete fix |
| --- | --- | --- | --- |
| Major | `triples_table_768_light.png`, `triples_table_768_dark.png`, `full_app_768_light.png`, `full_app_768_dark.png` | Third column (POINTS TO THIS CONCEPT) and the row-action buttons (delete X, chain) are clipped off the panel and unreachable at 768 | At narrow widths, stack the body single-column (map below table) or stack the three concept fields per row; alternatively make the triples panel horizontally scrollable with a visible scrollbar so the action column is reachable |
| Minor | `full_app_1024_light.png`, `full_app_1024_dark.png` | Action column (delete X, chain) sits flush against the right panel edge; only a sliver of glyph shows, crowding the boundary | Add right padding/min-width to the action column or pin it so it never touches the panel edge |
| Nit (synthetic) | `print_emulated_dark.png` | Verb labels render as white text in dark rounded pills on the white print page (inverted look) | Known emulateMedia(print) artifact: emulateMedia does not fire beforeprint, so the dark halo leaks. Real Cmd+P fires beforeprint and prints light (see `print_emulated_light.png`). No code change needed; confirm with a real print if desired |

## RESOLVED vs REMAIN (vs prior report)

RESOLVED:
- Appearance toggle icon-only and ambiguous (prior Minor) -> now labeled
  icon + Light/Dark text, state obvious. `toolbar_closeup_*.png`.
- Triples row action buttons clipped at 1024 (prior Major) -> downgraded to
  Minor: buttons now present and reachable at 1024, only crowded at the edge.
- Inverted dark pill behind verb labels in print (prior Minor) -> reclassified
  as a synthetic capture artifact (emulateMedia limitation), not a real defect.
- Export-light proof -> still CONFIRMED via `export_dark_render.png`.
- No white box behind dark map verb labels -> still CONFIRMED.
- Theme-picker labels readable in dark -> still CONFIRMED.

REMAIN:
- Triples third column + action buttons overflow at 768 (prior Major) -> still
  a Major defect; third column and actions unreachable at 768. A separate fix is
  in progress per the task note.

NEW / RECLASSIFIED:
- 1024 action-column edge crowding noted as a Minor follow-on to the 768 fix.

## Limitations

- No contrast measurement tool was run on the rendered pixels; all 5.5:1 calls
  are visual estimates from the PNGs and should be confirmed with
  `tools/contrast_calculator.py` or WebAIM.
- The darkest Earth/fire palette fills (depth 4/5, white-label cases) are not
  present in the sample data, so the white-on-deep-fill node-label contrast was
  not directly observable.
- Assessment is limited to the static screenshots; no hover, focus-ring, or
  keyboard states beyond what the captures show.
- `export_dark.svg` raw markup was not parsed; the rendered
  `export_dark_render.png` was used as the export-light proof.
- Print behavior is inferred from emulated captures plus the documented
  beforeprint behavior; no real OS print dialog was exercised.

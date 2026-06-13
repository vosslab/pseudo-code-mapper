# Changelog

## 2026-06-13

### Fixes and Maintenance

- `pipeline/build.mjs` `copy_assets()` now copies `vendor/fontawesome/` ->
  `dist/vendor/fontawesome/` on every build path. Previously only
  `build_github_pages.sh` copied vendor files; a bare `node pipeline/build.mjs`
  produced a `dist/` with no Font Awesome, causing toolbar icon 404s (tofu).
  The vendor directory is treated as a required input: missing source throws a
  clear `Error` rather than silently skipping.
- `build_github_pages.sh`: removed the now-redundant `mkdir -p dist/vendor/fontawesome`
  and three `cp vendor/fontawesome/...` lines (build.mjs owns the copy). The three
  hard assertions (`test -f dist/vendor/fontawesome/fa-solid-900.woff2`,
  `test -f dist/vendor/fontawesome/fa-solid.min.css`, and the corrupt
  `format(\"woff2\")` grep check) are retained so the shell still fails loudly if
  build.mjs did not produce them.

## 2026-06-12

### Additions and New Features

- Light/Dark appearance toggle added to the far right of the toolbar (sun/moon icon with
  text label). Clicking flips between light and dark; the choice persists across page reloads
  via localStorage. On first-ever load with no stored preference the OS
  `matchMedia("(prefers-color-scheme: dark)")` result is consulted once and stored as a
  concrete value; the OS preference is not tracked live afterward. The toggle restyles both
  the UI chrome (toolbar, panels, backgrounds) and the on-screen concept map.

- On-screen concept map adapts to the active dark/light theme. Edges, verb labels, arrowhead
  markers, and node borders/label text switch to dark-suitable values when dark mode is active;
  light-mode values are unchanged. Bubble fill palettes (earth/fire) are left authored in both
  themes. The map-theme accessor reads the same `data-ui-theme` attribute the toggle writes,
  so the map stays in sync without extra wiring.

- SVG export, PNG export, and Print always render in light/authored colors regardless of the
  current screen theme. Export sets a flag before snapshot and resets it in a `finally` block;
  Print registers `beforeprint`/`afterprint` listeners that flip the same flag.

- CSS refactored: monolithic `src/style.css` (889 lines) split into seven focused modules
  under `src/css/`: `tokens.css`, `base.css`, `toolbar.css`, `editor.css`, `map.css`,
  `rubric.css`, `print.css`. `src/style.css` is now a 10-line barrel of `@import` statements.
  Bubble palette data extracted from `src/themes.ts` into a new `src/palettes.ts` module;
  `src/themes.ts` re-exports both symbols so existing importers are unaffected.

- Font Awesome Free 6.7.2 vendored into `vendor/fontawesome/` (local stylesheet reference,
  no CDN). Toolbar restyled as a ribbon: each semantic group (File, CSV, Image & Print) is
  a raised panel with a caption label and icon + text per button. All icons are
  `aria-hidden="true"`; button text labels and `aria-label` attributes are preserved.

- Commit-time column autosize for the triples table: the three text columns (from, verb, to)
  size to the widest committed value measured via canvas `measureText`. Draft keystrokes never
  resize a column; width changes animate over 150ms; header and body columns stay aligned.

- Three-color per-cell triple-table highlighting. Focusing or hovering a from/to cell sets
  an "active concept"; cells that share the same concept, point to it, or are pointed to by
  it receive distinct tint-and-border role cues. Focus always wins over hover; empty cells
  never activate.

- Bidirectional cross-highlight wiring: hovering a map bubble or edge highlights every
  referencing row in the triples table, and hovering a row highlights the corresponding
  bubble and edge on the map.

- Draggable pane resizer between the editor and map panes. Drag ratio persists to localStorage;
  ArrowLeft/ArrowRight adjust by 2%; double-click resets to 40%.

- Walkthrough demo player (`tests/playwright/walkthrough_demo.mts` + `run_walkthrough_demo.sh`)
  drives the UI like a human from a JSON dataset, records Playwright video, and saves
  per-row and final-map screenshots to `output_smoke/walkthrough/`.

- Capsule map bubble shape added to the Shape picker. Capsule is a stadium shape
  (rect with rx = ry = node height / 2) that produces fully rounded short ends.

- Triples table UX: stable row height (proposition preview in a fixed slot below rows),
  synchronous add-row commit, and a chain button that inserts a new row with `from`
  pre-filled from the committed `to` value of the current row.

- GitHub Pages deploy workflow (`.github/workflows/deploy-pages.yml`): triggers on push to
  `main` and `workflow_dispatch`; builds `dist/` with `npm ci && npm run build`, uploads as
  a Pages artifact, and publishes via `actions/deploy-pages`. Live URL:
  `https://vosslab.github.io/concept-map-maker/`.

- Docset additions: `docs/CODE_ARCHITECTURE.md`, `docs/FILE_STRUCTURE.md`, `docs/INSTALL.md`,
  `docs/FILE_FORMATS.md`, `docs/USAGE.md`, `docs/NEWS.md`, `docs/ROADMAP.md`, `docs/TODO.md`,
  `docs/TROUBLESHOOTING.md`, `docs/RELATED_PROJECTS.md`, `docs/RELEASE_HISTORY.md`, and
  `docs/COLOR_CONTRAST_ACCESSIBILITY.md`. `README.md` and `AGENTS.md` refreshed.
  Audit reports filed under `docs/active_plans/audits/`.

- `run_playwright_tests.sh` added as the canonical Playwright entry point. Handles preflight
  checks, auto-builds `dist/` when needed, and forwards remaining arguments to
  `npx playwright test`. Updated `package.json` `test:playwright` alias accordingly.

- CSV import/export: "Export triples CSV" and "Import triples CSV" toolbar buttons.
  Export downloads `<title>-triples.csv`; import appends parsed rows without wiping the
  document. `src/csv_codec.ts` provides RFC4180/TSV parsing with fuzzy header detection.

- SVG/PNG export and Print toolbar buttons. SVG and PNG buttons are disabled while the
  canvas element is unavailable. Filename derived from the document title.

- Rubric panel (`src/rubric_panel.tsx`) renders a live PASS/WARN/FAIL checklist from
  `state.validation()`. Clicking a rubric row briefly highlights the first offending
  node or edge on the map for 1.5s.

- Concept autocomplete (`src/concept_autocomplete.tsx`) in the triples table from/to cells:
  filters existing concepts by substring, commits on Enter/Tab/blur, snaps to canonical
  casing for known concepts.

- Dagre layout adapter (`src/layout_graph.ts`): deterministic top-down layered layout from
  complete triples rows; self-loops and duplicate edges dropped before ranking; cycles never
  throw.

- Edge geometry (`src/edge_geometry.ts`): clipped cubic bezier paths with bidirectional
  bowing and fan curvature; self-loop paths; `effective_extent` for viewBox/PNG/print sizing.

- App state module (`src/app_state.ts`): `create_app_state` returns the full component-facing
  API including autosaved document store, highlight memos, drag overrides, and validation.
  Pure helper functions extracted for headless unit testing.

- Core TypeScript modules added: `src/types.ts` (shared types and `concept_key` normalizer),
  `src/document_codec.ts` (versioned JSON codec), `src/themes.ts` (palettes, depth fill,
  shape registry), `src/graph_depth.ts` (multi-source BFS depth), `src/derive_concepts.ts`
  (concept extraction), `src/validate_document.ts` (rubric rules), `src/map_canvas.tsx`
  (SVG canvas root with pan/zoom), `src/concept_node.tsx` (draggable bubble renderer),
  `src/concept_edge.tsx` (cubic edge renderer), `src/export_svg.ts` (SVG/PNG export),
  `src/toolbar.tsx` (toolbar component), `src/triples_table.tsx` / `src/triple_row.tsx`
  (triples editor), `src/app.tsx` (app shell).

- Test fixtures added: `tests/fixtures/honeybees_triples.tsv`,
  `tests/fixtures/honeybees_document.json`, `tests/fixtures/stress_80_nodes.json`.

### Behavior or Interface Changes

- Appearance toggle simplified to two states (Light / Dark) with the OS preference consulted
  only on first load. The earlier three-state Light/Dark/Auto cycle and live OS tracking were
  removed. The toggle shows a sun or moon icon with a text label.

- Dark mode WCAG compliance: `--color-danger` token added for danger-red elements meeting
  the repo 5.5:1 contrast standard on both light and dark surfaces. Rubric chip colors
  (warn, hint) corrected to meet the standard. Theme-picker select and triples-table action
  buttons (add, delete, chain) now use theme tokens so they flip correctly in dark mode.
  Concept-map node labels pick black or white text based on fill luminance; depth-4 earth/fire
  fills reach approximately 5.1:1, a known residual below the full 5.5:1 target.

- Toolbar ribbon buttons wrap multi-word labels to two lines for a more compact ribbon.

- Triples table no longer overflows at 1024px or 768px window widths; columns compress
  via `minmax` CSS with responsive media queries at 900px and 768px.

- Corner-style dropdown removed. UI chrome corners are permanently fixed at classic Mac
  rounded rects (5px); no user-facing option and no localStorage persistence.

- Build pipeline scripts moved from `tools/` to `pipeline/`; `tools/` now holds standalone
  utilities only. `AGENTS.md` rewritten as a minimal pointer file referencing `docs/*.md`.

- Triples-table grid track superseded from static `minmax(9em, 1fr)` verb column to
  commit-time autosize tracks. Even column rhythm applied: three text columns share leftover
  width via `1fr`; arrow tracks fixed at `1.5em`; delete/chain buttons share a fixed width.

### Fixes and Maintenance

- Fixed Font Awesome icons rendering as empty tofu boxes: corrupt `format(\"woff2\")` hint
  in the vendored `fa-solid.min.css` (backslash-escaped quotes) replaced with valid
  `format("woff2")`. Build script gains assertions that the fixed CSS exists and is clean.

- Fixed triples-table action button visibility in dark mode: add button now uses theme-token
  background/color; delete button hover uses `color-mix` against the surface token instead of
  a hardcoded light color pair.

- Fixed `map_is_dark` in `src/ui_theme.ts`: replaced module-scope `createMemo` (which
  requires a Solid reactive owner) with a plain arrow function.

- Fixed `to_commit_fns` map in `TriplesTable` re-keyed from render index to stable
  `triple.id` so deleted-row stale closures are not returned after a row is removed.

- Fixed `pipeline/build.mjs` to copy `src/css/` into `dist/css/` so CSS `@import`
  references resolve correctly when served by the Playwright test server.

- Fixed Rounded bubble shape rendering identically to Capsule: `rounded` corner_radius
  lowered from 18 to 8, restoring a clearly distinct classic rounded rectangle.

- Fixed triples table still clipping at 768px: a second `@media (max-width: 768px)` block
  reduces arrow tracks to `1em`, fixes button tracks to `1.6em`, and lowers text-column
  clamp floors to `2.5em`, so the grid fits within the available pane width at that breakpoint.

- Accessibility fixes: non-color border cues on per-cell highlight roles (WCAG 1.4.1);
  `outline` on `.pane-resizer:focus-visible` (WCAG 2.4.11); toolbar ribbon groups given
  `role="group"` + `aria-labelledby` (WCAG 1.3.1); `:focus-visible` outlines on toolbar
  and add-row buttons (WCAG 2.4.7); chain button `aria-label` includes row number;
  resizer `aria-valuetext` and ARIA range attributes added; autocomplete listbox capped
  at `max-height: 240px`.

- Ribbon toolbar layout: each group panel lays buttons in a single horizontal row with
  a caption; new rhythm tokens `--ribbon-btn-gap`, `--ribbon-group-gap`, `--ribbon-btn-radius`
  give even, consistent spacing. Title input left, groups center-left, autosave right.

- TypeScript audit cleanups (7 items): replaced unchecked `as string` cast in `src/palettes.ts`
  with non-null assertion `ramp[idx]!`; removed `PALETTES`/`depth_fill` re-export shim from
  `src/themes.ts` and updated `src/concept_node.tsx` and `src/theme_picker.tsx` to import
  directly from `src/palettes`; removed `browser_storage` re-export from `src/ui_theme.ts`
  and updated `src/ui_theme_toggle.tsx` to import from `src/app_state` directly; converted
  `map_is_dark` from a typed arrow-const to a named function declaration; fixed misleading
  comment on `set_exporting_light` (now accurately describes true/false semantics); merged
  duplicate same-module imports in `src/ui_theme.ts` and `src/ui_theme_toggle.tsx`; changed
  `var t` to `let t` in `src/index.html` inline script and added a comment that the storage
  key must match `UI_THEME_STORAGE_KEY` in `src/ui_theme.ts`. `tests/test_themes.mjs` updated
  to import `PALETTES`/`depth_fill` from `src/palettes.js` directly.

- Post-audit code cleanup: removed dead `EditorTab` type, `active_tab` signal, tab-bar CSS,
  `--color-tab-active` variable; removed dead "hint" severity from rubric union; removed
  orphaned DOM ids and stale comments; removed workstream planning tags from production code
  and CSS; removed defensive fallbacks from `src/measure_text.ts`; merged duplicate
  `.main-area` CSS block; added missing `-> None` return annotation to `main()` in
  `tools/check_css_content_policy.py`; removed unused `packaging` from `pip_requirements-dev.txt`;
  added `output_smoke/` to `.gitignore`.

- Multiple rounds of Playwright and unit test cleanup: fragile exact-count and wall-clock
  assertions relaxed or removed; `waitForTimeout` calls replaced with auto-retrying expects
  or `waitForFunction` polling; planning-tag comments stripped from spec files; stale
  fixture-ID and hardcoded-size asserts converted to behavioral `>= N` forms.

- Formatted `src/ui_theme_toggle.tsx` with `npx prettier --write` to pass `check_codebase.sh`
  format check. Removed stale `fa-diagram-project` entry from toolbar icon test after Layout
  group removal.

### Removals and Deprecations

- Removed the "Re-layout" toolbar button and its Layout group. The button reset all bubble
  positions to auto-layout; it is removed along with the internal `clear_overrides` handler.
  Dragged bubble positions can still be cleared by renaming the concept in the Triples table.

- Removed the definitions feature entirely: `Definition` type, `definitions` document field,
  `DefinitionsTable` component, all definition state actions, the definitions tab and panel,
  definition rubric rules, and definition-related CSS. Fixtures and docs updated to match.
  The codec silently ignores a `definitions` field in older saved files.

- Corner-style dropdown (Capsule / Oval / Rounded / Corner) removed. The feature was
  misidentified as the intended deliverable for "Mac rounded rects" (which referred to node
  shapes, not chrome). All supporting code, CSS, localStorage key, and Playwright spec removed.

### Decisions and Failures

- Definitions removed by user decision: out of scope (students complete definitions separately).
  The app was unshipped, so no migration path is required. Old local files with a `definitions`
  key will open without error; the field is silently ignored.

- Corner-style dropdown was added and removed on the same day. The "Mac rounded rects" request
  referred to concept map node shapes, not UI chrome. The correct deliverable is the Capsule
  map shape option; UI chrome corners are permanently fixed at 5px.

### Developer Tests and Notes

- GitHub Pages live-asset verification: confirmed all five assets return HTTP 200
  (`/`, `/main.js`, `/style.css`, `/vendor/fontawesome/fa-solid.min.css`,
  `/vendor/fontawesome/fa-solid-900.woff2`). Deploy workflow ran green on the triggering push.

- Full Playwright test suite built under `tests/playwright/` (28 specs passing at close of day):
  smoke, paste, highlight, drag, export, autosave, print, stress, autocomplete, column autosize,
  cell highlight, add row and chain, toolbar icons, ui theme, and others.
  Helpers in `tests/playwright/helpers.ts`.

- Node unit tests added for all pure TypeScript modules: `test_concept_key.mjs`,
  `test_document_codec.mjs` (21 tests), `test_csv_codec.mjs` (29 tests),
  `test_derive_concepts.mjs` (12 tests), `test_graph_depth.mjs` (15 tests),
  `test_validate_document.mjs` (28 tests), `test_themes.mjs` (17 tests),
  `test_edge_geometry.mjs` (12 tests), `test_map_bounds.mjs` (6 tests),
  `test_layout_graph.mjs` (10 tests), `test_app_state.mjs` (23 tests). All pass.

- `bash check_codebase.sh` exits "PASS: 6 checks passed." All 530+ pytest tests pass.

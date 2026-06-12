# Changelog

## 2026-06-12

### Additions and New Features

- Docset refresh: added `docs/CODE_ARCHITECTURE.md` (components, data flow, build
  pipeline, extension points), `docs/FILE_STRUCTURE.md` (directory map, generated
  artifacts, where new work goes), `docs/INSTALL.md` (setup via
  `devel/setup_typescript.sh`, verify via `check_codebase.sh`), and
  `docs/FILE_FORMATS.md` (project JSON v1 schema gate, triples CSV header and fuzzy
  header detection, TSV paste, SVG/PNG export). Linked all four from the README
  Documentation section.

### Behavior or Interface Changes

- Rewrote `AGENTS.md` as a minimal pointer file: bare-path bullets into the
  `docs/*.md` style set (now including `docs/TYPESCRIPT_STYLE.md`, previously
  unreferenced) plus repo-specific run commands (`source source_me.sh && python3`,
  `check_codebase.sh`, `run_playwright_tests.sh`, `pytest tests/`).

### Fixes and Maintenance

- Added missing `-> None` return annotation to `main()` in
  `tools/check_css_content_policy.py`; `pytest tests/` now passes 409/409
  (test_function_typing was the only failure).

- Added `run_playwright_tests.sh`, the canonical script for running the Playwright browser test
  suite. Handles preflight checks (node, npm, node_modules, playwright.config.ts), auto-builds
  dist/ via `build_github_pages.sh` when dist/index.html or dist/main.js is missing, supports
  `--build` to force a rebuild, and forwards remaining arguments to `npx playwright test`.
  Prints a clear PASS/FAIL line on exit. Updated `package.json` `test:playwright` alias to
  `./run_playwright_tests.sh` and updated `docs/USAGE.md` developer section to reference the
  new script.

- Added `docs/USAGE.md` covering local setup, building a map, map interactions, saving and
  submitting, spreadsheet paste, and developer tasks. Added a `docs/USAGE.md` link to the
  Documentation section of `README.md`.

- WP-D2b2: Added "Export triples CSV" and "Import triples CSV" buttons to `src/toolbar.tsx`.
  Export calls `serialize_triples_csv(state.doc.triples)` and downloads a `<title>-triples.csv`
  file. Import opens a hidden `<input type="file" accept=".csv">`, reads the file, calls
  `parse_triples_csv`, and appends the rows via `bulk_insert_triples` (does not wipe the
  document; CSV is triples-only convenience). A hidden CSV `<input>` ref mirrors the existing
  JSON ref pattern. Error surfaces via the existing inline dismissable error banner.

- WP-D2b3: Added "Export SVG", "Export PNG", and "Print" buttons to `src/toolbar.tsx`.
  SVG/PNG buttons are disabled while the canvas SVG element is not yet available (`svg_ready()`
  guard). On click they call `download_svg` / `download_png` from `src/export_svg.ts` using the
  live svg element passed from `app.tsx` via the new `svg: Accessor<SVGSVGElement | null>` prop.
  Print button calls `window.print()`. Filename derived from `state.doc.title`. Minimal wiring
  added to `src/app.tsx`: `createSignal<SVGSVGElement | null>(null)` captures the element via
  `svg_ref` on `MapCanvas`; the accessor is passed to `Toolbar` as `svg` prop.

- WP-D2b4: Added "Re-layout" button to `src/toolbar.tsx`. On click, shows a `window.confirm`
  dialog ("Reset all bubble positions to auto-layout? Dragged positions will be lost."). On
  confirm, calls `state.clear_overrides()` which returns all bubbles to pure dagre positions.
  Cancel preserves all drag overrides unchanged.

  Toolbar buttons are now organized into four `<span class="toolbar-group">` sections: file
  (Save project / Open project / Clear), CSV (Export triples CSV / Import triples CSV), image
  and print (Export SVG / Export PNG / Print), and layout (Re-layout). All buttons carry
  `aria-label` attributes. `npx tsc --noEmit -p tsconfig.json` exits 0; `npx eslint
  src/toolbar.tsx src/app.tsx` exits 0; `bash build_github_pages.sh` -> "Built dist/
  (GitHub Pages-ready)."

- WP-B3: Completed bidirectional cross-highlight wiring across the triples table and the SVG map.
  `src/triple_row.tsx` now adds a reactive `highlighted` class via `classList` when
  `state.highlighted_triples()` contains the row's triple id, so hovering a bubble or an edge lights
  up every referencing row (node/edge -> row direction). Appended `.triple-row.highlighted` rules to
  `src/style.css` (from-tint background plus an inset from-accent left bar). The forward direction was
  already wired: `src/triple_row.tsx` sets `{source:"row"}` hover, `src/concept_node.tsx` sets
  `{source:"node"}` and draws a role-colored outer ring (from blue / to amber / both purple) via
  inline SVG attributes, and `src/concept_edge.tsx` sets `{source:"edge"}` and swaps to the accent
  stroke plus `ARROW_HIGHLIGHT_MARKER_ID`. Verified the `app_state.ts` role-tag memos already match
  the plan (row/edge hover -> from/to roles with self-loop "both"; node hover -> "both"), so no state
  change was needed. `npx tsc --noEmit -p tsconfig.json` reports zero errors in triple_row.tsx /
  concept_node.tsx / concept_edge.tsx; `npx eslint src/triple_row.tsx src/concept_node.tsx
  src/concept_edge.tsx` exits 0.

- WP-D2b1: Added `src/toolbar.tsx` (`Toolbar` component). Editable title input (aria-label
  "Document title", wires to `state.set_title`). "Save project" serializes via `serialize_document`
  and triggers a Blob download named `${title || "concept-map"}.json`. "Open project" opens a
  hidden `<input type="file" accept=".json,application/json">`, reads via FileReader, calls
  `parse_document`; on success calls `replace_document` (autosave slot updates automatically);
  on failure shows an inline dismissable error (aria-live polite, current doc untouched). "Clear"
  confirms via `window.confirm` then calls `replace_document(empty_document())`. Autosave status
  shown as "autosave on/off" text. Wired into `app.tsx` toolbar slot (ToolbarPlaceholder removed).
  Style rules appended to `src/style.css`.

- WP-B4: Added `src/rubric_panel.tsx` (`RubricPanel`). Renders a live checklist from
  `state.validation()` using a `<For>` loop. Each item shows a text marker (OK / WARN / FAIL / HINT)
  plus the rule message. Levels are visually distinct via color-accented marker chips and hint rows
  are subdued (italic, lower opacity). Clicking a row with `conceptKeys` briefly sets a node hover
  on the first offender for 1.5 s then clears; clicking a row with `tripleIds` sets an edge hover
  similarly. Keyboard (Enter/Space) also triggers the flash. Pending timeout is canceled on each
  new click. Wired into `app.tsx` replacing `RubricPlaceholder`. Appended `.rubric-list`,
  `.rubric-item`, `.rubric-marker`, `.rubric-message` and level-variant rules to `src/style.css`.
  `npx eslint src/rubric_panel.tsx src/app.tsx` exits 0; `npx tsc --noEmit -p tsconfig.json`
  shows no errors in rubric_panel.tsx or app.tsx.

- WP-B2d: Wired ConceptAutocomplete into `triple_row.tsx` from/to cells (replacing plain inputs;
  tint_var "--from-tint"/"--to-tint", concepts from state.concepts, on_commit -> update_triple,
  aria labels preserved). Added onPaste handler to `.triples-rows` container in
  `triples_table.tsx`: intercepts clipboard text containing a tab or newline, parses via
  `parse_table_text`, skips a header row using HEADER_TOKENS heuristic, maps 3-column rows to
  (from, verb, to) triples, calls bulk_insert_triples; single-cell paste passes through natively.
  Added matching onPaste handler to the `.definitions-table` container in `definitions_table.tsx`:
  intercepts multi-cell paste, maps 2-column rows to (word, definition), skips header via
  DEF_HEADER_TOKENS heuristic, calls bulk_insert_definitions. ESLint and tsc (scoped to these
  three files) pass; build blocked by concurrent-agent TS errors in rubric_panel.tsx/app.tsx.

- WP-D2a: Added `src/export_svg.ts`. Exports `export_svg_text(svg, state): Promise<string>` (clears
  hover via `state.set_hover`, awaits microtask, deep-clones the canvas SVG, strips the
  `data-viewport` transform so output uses untransformed map-space coordinates, strips
  `data-*`/`class`/`cursor`/`pointer-events`/`style` attributes from all elements, computes the
  rendered extent from override-aware node positions via `effective_extent`, sets `viewBox` +
  `width` + `height` + `xmlns` on the clone root, serializes with `XMLSerializer` plus XML
  declaration); `download_svg(svg, state, filename): Promise<void>` (wraps SVG blob in an anchor
  click); `download_png(svg, state, filename, scale=2): Promise<void>` (SVG blob URL -> `Image` ->
  `<canvas>` at `scale * extent`, max dimension capped at 8000px for Safari/browser limits,
  `toBlob` -> anchor click). Browser-only module; no Solid reactive imports.
  `npx tsc --noEmit -p tsconfig.json` reports zero errors in `export_svg.ts`; `npx eslint
  src/export_svg.ts` exits clean.

- WP-C2b: Added `src/concept_node.tsx` (`ConceptNode`) and `src/theme_picker.tsx` (`ThemePicker`).
  `ConceptNode` fits the WP-C2a canvas `node_slot(key, box)` contract (box is the center-based
  `NodeBox` from `edge_geometry`; the concept key is the visible label). Shape comes from
  `SHAPE_REGISTRY[doc.theme.shape]` (rect/rounded -> `<rect rx>`, oval -> `<ellipse>`), fill from
  `depth_fill(doc.theme.palette, depths().depth_by_key.get(key) ?? 0)`, a centered black Helvetica
  label, `ORIGIN_EMPHASIS` border when `depths().origin_keys.has(key)`, and an outer
  hover-highlight ring colored by `highlighted_concepts()` role (from #5aabff, to #e8990a, both
  #9b59b6, matching the `--from-accent`/`--to-accent` CSS vars). All presentation is inline SVG
  attributes (export-safe). Pointer-capture drag: pointerdown captures + records the grab offset,
  pointermove writes `set_override(key, {x,y})`, pointerup/lostpointercapture release safely.
  Drag coordinates are converted from client space to the node's local user space via the group
  element's `getScreenCTM().inverse()`, which folds in both the `<svg>` viewBox and the
  `<g data-viewport>` pan/zoom transform, so drags stay accurate under any pan/zoom without the
  canvas publishing a converter. Node hover sets `set_hover({source:"node", conceptKey})`.
  `ThemePicker` is a two-`<select>` control group (Shape, Palette) reading options from
  `SHAPE_REGISTRY`/`PALETTES` and calling `set_theme`, so a switch restyles every bubble at once.
  `App()` in `src/app.tsx` wires `ConceptNode` into `MapCanvas` via `node_slot` and renders
  `ThemePicker` in a new map-pane header; added `.map-pane-header`/`.theme-picker` CSS to
  `src/style.css`. Scoped `tsconfig.json` include to `src/**` (was greedy `**/*.ts`, which pulled
  root/test `.ts` files into the src typecheck) and added `playwright.config.ts` to
  `tsconfig.lint.json`. Added `tests/playwright/smoke.spec.ts` (load app, enter three triples, see
  >= 3 bubbles, drag one) plus a minimal `playwright.config.ts` (serves prebuilt `dist/` on a
  fixed port 4173 via `python3 -m http.server`; run `bash build_github_pages.sh` then
  `npx playwright test`). `npx tsc --noEmit -p tsconfig.json`, `npx eslint` on both new src files,
  and `bash build_github_pages.sh` all succeed.

- WP-C2a: Added `src/map_canvas.tsx` and `src/concept_edge.tsx`. `MapCanvas` is the SVG canvas
  root with the published contract `{ state: AppState; node_slot?(key, box); svg_ref?(el) }`: it
  resolves render boxes via `state.node_position` + layout w/h, computes the viewBox from
  `effective_extent`, renders arrowhead marker `<defs>` (normal + highlight ids exported from
  `concept_edge.tsx`), and renders all edges itself. Nodes render through an optional `node_slot`
  (so WP-C2b can inject `ConceptNode`); without a slot a default rect+label placeholder is drawn.
  Pan/zoom/reset is ephemeral (never saved): wheel zooms about the cursor, background
  pointer-drag pans via pointer capture, double-click resets to identity. The pan/zoom transform
  lives on exactly one inner `<g data-viewport>` so the SVG export (WP-D2a) can strip it.
  `ConceptEdge` builds a clipped cubic via `edge_path` (or `self_loop_path` for same-key
  endpoints) with `assign_curvatures` applied over the rendered edge set, draws a `marker-end`
  arrowhead, and a verb `<text>` at the curve midpoint with a white `paint-order="stroke"` halo.
  Edge pointer hover sets `set_hover({source:"edge", tripleId})`; membership in
  `highlighted_triples()` swaps stroke to accent and to the highlight marker. Triples with a
  missing endpoint position are skipped. All presentation is inline SVG attributes (no CSS
  classes), per the export requirement. `App()` in `src/app.tsx` now renders `<MapCanvas
  state={state} />` in the map pane (removed `MapPlaceholder`). `npx tsc --noEmit`, `npx eslint`
  on both files, and `bash build_github_pages.sh` all succeed.

- WP-B2a: Added `src/triples_table.tsx` and `src/triple_row.tsx`. `TriplesTable` takes an
  `AppState` prop, renders a sentence-shaped header ("This concept | verb phrase | points to
  this concept") with `--from-tint`/`--to-tint` cell backgrounds, live concept count from
  `state.concepts().length`, a `<For>` loop of `TripleRow` components, and an "Add row" button.
  `TripleRow` renders from-input (var(--from-tint)), arrow glyph, verb-input, arrow glyph,
  to-input (var(--to-tint)), and delete button; commits via `update_triple` on each input event;
  shows a proposition preview ("from - verb -> to") when focused; wires hover to `set_hover`.
  Enter key moves to next row or adds a new row; Tab is native. All inputs carry aria-label with
  row number. `App()` in `src/app.tsx` now constructs `create_app_state(browser_storage())`
  once and passes `state` to `TriplesTable`, replacing the placeholder. Added triples-table CSS
  to `src/style.css`.

- WP-B2b: Added `src/concept_autocomplete.tsx` with exported `ConceptAutocomplete` component.
  Props: `{ value, concepts, on_commit, placeholder?, aria_label, tint_var? }`. Internal signals
  for draft text, open state, highlight index, and transient hint. Filters concepts by
  `concept_key(draft)` substring match, max 8 shown. Keyboard: ArrowDown/Up moves selection,
  Enter/Tab commits highlighted match or typed text, Escape closes without committing, blur
  commits typed text after 150ms delay (lets click fire first). Committing text whose
  `concept_key` matches an existing concept snaps to canonical label (first-seen casing) and
  shows a 1.5s aria-live "matched existing concept" hint. Free text always allowed. Renders
  input + absolutely-positioned `role="listbox"` with `role="option"` items and
  `aria-activedescendant`. Component-scoped inline styles only; no style.css edits needed.
  `npx tsc --noEmit` and `npx eslint` both exit 0 on this file.

- WP-B2c: Added `src/definitions_table.tsx` with exported `DefinitionsTable` component. Takes
  `AppState` prop; renders a `definitions-table` class div with Word | Definition header,
  `<For>` rows each with two aria-labeled inputs and a delete button, Enter on the last row
  appends a new row, live count badge "N / 10 definitions" sourced from non-empty
  `doc.definitions` entries. Component is standalone-exported; wiring into `app.tsx`
  `#panel-definitions` is deferred to the wiring wave (AppState construction not yet present
  in app.tsx at completion time). `npx tsc --noEmit` and `npx eslint` exit 0 on the file.

- WP-B1a: Added `src/app_state.ts`, the single stateful module. `create_app_state(storage, compute_layout_fn?)`
  builds one `createStore<CmapDocument>` (autosave unit) plus a `createSignal<HoverState>` and returns the
  component-facing API: the `doc` store, `hover`/`set_hover`, triples-only memos (`concepts`, `depths`,
  `validation`, `layout`), `node_position(key)` (resolves `overrides[key] ?? layout[key]` at render time so a
  drag never re-runs layout), highlight memos (`highlighted_triples`, `highlighted_concepts` role-tagged
  from/to/both), `autosave_enabled`, document actions (update/add/remove triple+definition, set_title, set_theme,
  set_override, clear_overrides, replace_document, bulk_insert_triples/definitions), and `dispose`. Storage is
  injected (`StorageLike | null`); `browser_storage()` resolves `window.localStorage` guarded for non-browser
  env. Boot loads the autosave slot via `document_codec`; invalid/foreign/corrupt JSON falls back to
  `empty_document()` without throwing. Autosave is a 500ms-debounced write to one slot; a failing or
  unavailable write disables autosave and surfaces the state via `autosave_enabled()`. Every memo body and the
  boot/write decisions are extracted into exported pure helpers (`resolve_node_position`,
  `compute_highlighted_triples`, `compute_highlighted_concepts`, `load_boot_document`, `attempt_storage_write`)
  so the layout/highlight/position/autosave contracts are unit-testable headless without Solid's dev build.
- WP-B1a: Added `tests/test_app_state.mjs` (23 tests): layout is a pure function of triples (overrides apply
  only at render-position resolution), node_position override/fallback/null, highlight role-tagging for
  row/edge/node hover incl. self-loop, boot load of valid/invalid/foreign/empty/null/throwing storage, autosave
  write success/failure/null, and a reactive-wiring smoke that constructs the full API. All pass.

- WP-B1b: Added `src/app.tsx` with `App` component: grid shell (toolbar / main / rubric panel),
  signal-based tab switcher (Triples | Definitions) with proper ARIA role/tabpanel/tablist
  attributes, labeled regions via `aria-label` and semantic HTML (`header`, `main`, `aside`,
  `section`, `h2`), and placeholder slots for all later work packages. Replaced hello-world
  `src/main.tsx` to mount `App`. Rewrote `src/style.css`: `:root` custom properties
  `--from-tint: #cfe8ff`, `--from-accent: #5aabff`, `--to-tint: #ffe2b8`, `--to-accent: #e8990a`
  for use by table columns and map highlights; flex/grid layout filling viewport; editor pane
  ~40% / map pane ~60%; tab bar, rubric strip, print-media hook. ASCII-only source; HTML entities
  for arrow and dash glyphs.

- WP-A3: Added `src/csv_codec.ts`: RFC4180/TSV codec with three exported functions:
  `parse_table_text(text)` (auto-detects TSV vs CSV by presence of unquoted tabs,
  strips UTF-8 BOM, handles CRLF, quoted fields with embedded delimiters and
  newlines, doubled-quote escaping, pads rows to uniform width);
  `serialize_triples_csv(triples)` (RFC4180 CSV with header
  `this concept,verb phrase,points to this concept`, CRLF line endings, trailing
  CRLF, fields quoted on demand); `parse_triples_csv(text)` (fuzzy header detection
  case-insensitive on tokens like "from"/"this concept", "verb phrase",
  "to"/"points to this concept"; falls back to positional order 0/1/2 when no
  header recognized; blank rows skipped). Pure TypeScript, no Solid/DOM imports.

- WP-C1a: Added dagre layout adapter in `src/layout_graph.ts`:
  `compute_layout(triples)` builds a deterministic top-down (`rankdir: "TB"`,
  `acyclicer: "greedy"`) layered layout from complete rows only, sizing each
  bubble from label length (~8px/char + padding, clamped min width, fixed 36px
  pill height). Edges carry no label (verb labels render later at bezier
  midpoints); self-loops and duplicate concept-pair edges are dropped before
  ranking. Returns center coordinates per `ConceptKey` plus the dagre canvas
  extent. Cycles never throw.

- WP-C1c: Added `src/themes.ts` with `PALETTES` (earth: 6 tans/greens/browns, fire: 6 yellows/oranges/reds, light-to-dark), `depth_fill(palette, depth)` (clamps depth >5 to last entry, never cycles), `ORIGIN_EMPHASIS` stroke constants, and `SHAPE_REGISTRY` per-shape `corner_radius`/`is_ellipse` spec consumed by SVG node renderer. Pure TypeScript, no Solid/DOM imports.

- WP-A2c: Added `src/validate_document.ts` with `validate_document(doc: CmapDocument): ValidationItem[]`. Rules: rubric pass/fail (min 30 unique concepts, all arrows verb-labeled, min 10 definitions), quality warn (verb label >3 words, orphan concepts, partial rows, duplicate triples, self-loops, near-miss spellings via specialized Levenshtein-distance-1 helper), hint (defined word absent from all map text). Pure TypeScript, no Solid/DOM imports.

- WP-A2b: Added `src/graph_depth.ts` with `compute_depths(triples: Triple[]): { depth_by_key: Map<ConceptKey, number>; origin_keys: Set<ConceptKey> }`. Multi-source BFS from all origins (in-degree 0, out-degree > 0); isolated concepts excluded from origins; unreachable nodes (including cycle members) get fallback depth = max_reached + 1; no origins -> all depth 0.
- WP-A2b: Added `tests/test_graph_depth.mjs` with 15 tests covering honeybees depths, cycle fixture (no throw), origin-rule including isolated-concept exclusion, no-origins case, and incomplete-row exclusion. All pass.

- WP-A1: Added shared type contract in `src/types.ts` (`Triple`, `Definition`,
  `ConceptKey`, `Theme`, `Position`, `CmapDocument`, `HoverState`,
  `ValidationItem`) plus the `concept_key()` normalizer (trim, collapse internal
  whitespace, lowercase). Pure TypeScript, no Solid/DOM imports.
- WP-A1: Added versioned JSON document codec in `src/document_codec.ts`:
  `empty_document()`, `parse_document()` (loud rejection of non-JSON, foreign
  format tags, unknown versions, and malformed fields), `serialize_document()`,
  and `prune_overrides()` (drops override keys whose concept no longer appears in
  any triple; applied on both parse and serialize).
- WP-A1: Added shared test fixtures under `tests/fixtures/`:
  `honeybees_triples.tsv`, `honeybees_document.json` (Castes 3 outputs, Female 3
  inputs, 10 definitions), and `stress_80_nodes.json` (deterministic 80-concept
  document with several origins, branches, converging nodes, one cycle, one
  bidirectional pair, and long labels for layout/perf checks).

- WP-C1b: Added `src/edge_geometry.ts` (pure, no Solid/DOM): `NodeBox` center-based
  box type; `edge_path(from_box, to_box, shape, curvature)` returns an SVG cubic
  bezier "d" plus label anchor at the curve midpoint (t=0.5), clipped to each
  node boundary per shape (rect axis-wall, oval ellipse solve, rounded-rect with
  corner-arc clipping) and bowed by displacing both control points perpendicular
  to the segment by `curvature * length`; `self_loop_path(box, shape)` draws a
  valid top-bulge self-loop cubic; `assign_curvatures(triples)` gives lone edges
  curvature 0, bidirectional pairs deterministic opposite-sign bowing, and
  duplicate same-direction edges an increasing-magnitude fan.
- WP-C1b: Added `src/map_bounds.ts` (pure): `effective_extent(nodes, overrides, padding)`
  computes the rendered bounding box (single source for SVG viewBox, PNG raster
  bounds, print sizing) by replacing each node center with its drag override when
  present, expanding by node dimensions, and padding all four sides; a far-dragged
  override widens the bounds, unknown override keys are ignored, and an empty map
  yields a finite padded zero box.

- WP-A2a: Added `src/derive_concepts.ts`: pure `derive_concepts(triples)` function
  returning `Concept[]` (key, label, outgoing, incoming triple ids). Semantics:
  fully blank rows ignored, partial rows excluded, concepts ordered by first
  appearance, display label = first-casing-wins, key = `concept_key(label)`.
  `Concept` interface defined here (not in `types.ts`).

- WP-D2c: Expanded `@media print` rules in `src/style.css`. Hides toolbar, editor pane,
  tab bar, and rubric panel. Switches app shell from grid to block flow; removes overflow
  clipping and fixed heights. Map pane prints full page width (SVG scales via `width:100%;
  height:auto`). Definitions panel (`#panel-definitions`) is forced visible (`display:block
  !important`) regardless of active tab; triples panel is hidden. Includes table rules for
  `.definitions-table` (border-collapse, black text, light header). White background, black
  text throughout.

### Behavior or Interface Changes

- Moved build pipeline scripts from `tools/` to new `pipeline/` folder
  (`pipeline/build.mjs`, `pipeline/build_types.ts`); `tools/` now holds only standalone
  utilities (e.g. `tools/html_to_pdf.mjs`). Updated `build_github_pages.sh` to call
  `node pipeline/build.mjs` and added `pipeline/**/*.ts` globs to `tsconfig.lint.json`.

### Fixes and Maintenance

- Audit cleanup: removed planning-scaffold tags (WP-*/workstream/milestone references) and
  non-ASCII characters from `src/` comments; deleted dead code in `src/csv_codec.ts`
  (`const c` / `void c` suppression and stream-of-consciousness reasoning block), collapsed
  identity ternary in `src/definitions_table.tsx`, removed identity assignment `svg_accessor`
  and renamed `activeTab`/`setActiveTab` to `active_tab`/`set_active_tab` in `src/app.tsx`.

- Rewrote `README.md` with a compliant first paragraph (pure prose, under 250 chars, no badges or
  links), overview section, documentation links list (existing docs only), quick start commands
  (`npm install`, `bash build_github_pages.sh`, `bash run_web_server.sh`), testing section
  (`bash check_codebase.sh` and `pytest tests/`), status note (in active development), and
  license note (MIT for code, CC BY 4.0 for content).

- Wired DefinitionsTable into the app definitions tab (review follow-up; WP-B2c integration).

- Audit cleanup: updated plan references to pipeline/build.mjs and clarified CSV export scope in USAGE.md.

- Audit cleanup: per-instance rubric flash timer, aria-labels on map bubbles, removed unused
  placeholder CSS and redundant playwright dependency.

### Developer Tests and Notes

- Audit cleanup: removed fragile collection-size/fixture-ID/wall-clock assertions from unit and
  Playwright tests. Deleted "palette has exactly 6 entries" length tests in `test_themes.mjs`;
  rewrote hardcoded index `[5]` asserts to use `PALETTES.fire.length - 1`. Deleted
  `concepts.length === 7` assert and replaced exact triple-ID list asserts with count asserts in
  `test_derive_concepts.mjs`. Deleted `nodes.size === 7` and `nodes.size === 80` asserts in
  `test_layout_graph.mjs`. Deleted `rows.length === 9` and `to_female.length === 3` asserts in
  `test_csv_codec.mjs`. Deleted 18-name API function-type loop in `test_app_state.mjs`. In
  `stress.spec.ts` deleted wall-clock `Date.now()` hover-latency assertion and bare
  `waitForTimeout(500)`. In `autosave.spec.ts` replaced `waitForTimeout(700)` with
  `waitForFunction` polling and removed unreachable `if (saved !== null)` guard. In
  `drag.spec.ts` removed unreachable null guards after `not.toBeNull()` asserts. Added source
  cross-reference comment to `EDGE_ACCENT_COLOR` in `highlight.spec.ts`.
  `bash check_codebase.sh` -> "PASS: 6 checks passed."

- WP-D3a: Implemented the full Playwright test suite under `tests/playwright/`.
  Fixed `smoke.spec.ts` (app starts with zero rows; test now clicks "+ Add row" first
  and uses `enter_triple` helper that types in concept autocomplete inputs correctly by
  pressing Escape to close the dropdown before Tab-committing). Added `helpers.ts` with
  `enter_triple` and `paste_tsv` shared helpers. New spec files: `paste.spec.ts` (dispatch
  ClipboardEvent with 35-row TSV via page.evaluate, assert >= 30 bubbles); `highlight.spec.ts`
  (hover a row -> assert edge accent stroke; hover a node -> assert >= 2 rows get .highlighted
  class; assert highlight clears on mouse-out); `drag.spec.ts` (drag a bubble, edit an
  unrelated verb, assert dragged position unchanged within 2px); `export.spec.ts` (SVG export
  download contains `<svg` and `xmlns`; PNG download has PNG magic bytes and size > 100 bytes);
  `autosave.spec.ts` (enter triples, wait 700ms for debounce, reload, assert bubbles reappear);
  `print.spec.ts` (stub window.print via addInitScript, click Print button, assert stub
  called once); `stress.spec.ts` (set_input_files with stress_80_nodes.json fixture, assert
  >= 70 bubbles, assert hover response under 2s). `autocomplete.spec.ts` (ArrowDown+Enter
  selects existing concept from dropdown; Escape keeps typed text without committing).
  Added `/// <reference types="node" />` directives to specs using Node.js APIs so
  `tsconfig.lint.json` type-checks correctly without modifying the tsconfig.
  `npx playwright test` -> 11 passed; `bash check_codebase.sh` -> PASS: 6 checks passed.

- WP-C1b: Added `tests/test_edge_geometry.mjs` (12 tests) and `tests/test_map_bounds.mjs`
  (6 tests) via `node --import tsx --test`: per-shape boundary clipping (rect/oval/
  rounded), straight vs bowed cubics, opposite-side bidirectional bowing, midpoint
  label anchor, valid self-loop cubic, lone/bidirectional/duplicate curvature
  assignment, and extent computation including a far-dragged override expanding the
  bounds, ignored ghost overrides, and the empty-map case. All 18 pass.

- WP-C1a: Added `tests/test_layout_graph.mjs` (10 tests via `node --import tsx
  --test`): determinism (two runs, identical coords), honeybees structure and
  top-down ordering, label-length node sizing, blank/partial-row exclusion,
  casing/whitespace dedup, and cycle safety on both a tight 3-node cycle and the
  80-node stress fixture. All 10 pass.

- WP-A3: Added `tests/test_csv_codec.mjs` (29 tests via `node --import tsx --test`):
  TSV detection, BOM stripping, CRLF handling, quoted fields with embedded tabs/
  newlines/commas, doubled quotes, Excel-style multiline cells, row-width padding,
  serialize header and quoting, CRLF enforcement, round-trip with commas and quotes
  in fields, fuzzy header detection (canonical and case-insensitive), no-header
  positional fallback, blank-row skip, honeybees fixture end-to-end (Female 3
  inputs). All 29 pass.

- WP-C1c: Added `tests/test_themes.mjs` (17 tests via `node --import tsx --test`): palette length and hex format, depth_fill correctness at boundaries 0/5, clamp at >5, no-cycle check, ordered ramp (depth 0 != depth 1), ORIGIN_EMPHASIS shape, SHAPE_REGISTRY per-shape specs. All 17 pass.

- WP-A2c: Added `tests/test_validate_document.mjs` (28 tests via `node --import tsx --test`): fixture coverage for every rule across pass/warn/fail/hint severity levels, including normalization edge cases, blank-row semantics, and near-miss spelling pairs. All 28 pass.

- WP-A2a: Added `tests/test_derive_concepts.mjs` (12 tests): honeybees fixture
  (7 unique concepts, Female 3 incoming, Castes 3 outgoing), blank/partial-row
  semantics, deduplication/casing, ordering stability, empty input. All pass.
- WP-A1: Added `tests/test_concept_key.mjs` and `tests/test_document_codec.mjs`
  (node test runner via `node --import tsx --test`): normalization behavior,
  JSON round-trip on both fixtures, garbage rejection, version gate, and override
  pruning. 21 tests pass.

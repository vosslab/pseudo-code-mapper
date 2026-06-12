# Usage

How to run, build, and use the Concept Map Maker. See [../README.md](../README.md) for an
overview and quick start.

## Running locally

```bash
npm install
bash build_github_pages.sh
bash run_web_server.sh
```

`run_web_server.sh` serves the built `dist/` folder. Open the URL printed in
the terminal (usually `http://localhost:8080`).

## Building a map

### Triples table

The editor has two tabs: Triples and Definitions.

The Triples tab is a spreadsheet-style table with three columns:

| Column | Meaning |
| --- | --- |
| This concept | the source bubble (noun phrase, 1-3 words) |
| verb phrase | the arrow label (a relationship verb) |
| points to this concept | the destination bubble |

Each row reads as a sentence: "photosynthesis --produces--> glucose". The map
auto-updates as you type. Autocomplete in the concept columns reuses existing
bubble names so you do not create duplicate concepts by accident.

### Definitions tab

Switch to the Definitions tab to enter word definitions. The rubric requires at
least 10 entries to satisfy the definitions criterion.

### Live rubric panel

The rubric panel at the bottom of the page updates in real time. Watch for
items such as:

- 30 unique concepts (bubbles) in the map.
- A verb phrase on every arrow (no blank labels).
- Sufficient definitions entered in the Definitions tab.

Items are marked OK, WARN, FAIL, or HINT.

## Map interactions

- **Auto layout** - dagre places bubbles automatically when you add or edit triples.
- **Drag bubbles** - drag a bubble to reposition it. Dragged positions persist until
  you use Re-layout.
- **Re-layout button** - resets all bubbles to auto-layout positions (confirms before
  clearing dragged positions).
- **Renaming a concept** - editing a concept name in the Triples table resets that
  bubble's dragged position back to auto-layout.
- **Pan and zoom** - scroll or pinch to zoom, drag the background to pan. Double-click
  the background to reset the view.
- **Themes** - the theme picker in the map pane header changes bubble shape and color
  palette (earth and fire palettes available).
- **Bubble color** - color reflects distance from origin bubbles. An origin bubble has
  only outgoing arrows (no incoming arrows).

## Saving and submitting

| Action | Button | Notes |
| --- | --- | --- |
| Save project | Save project | Downloads a `.json` file (full save: triples, positions, definitions, title) |
| Open project | Open project | Replaces the current map; also overwrites the autosave slot |
| Clear map | Clear | Confirms before wiping the document |
| Export triples CSV | Export triples CSV | Downloads a `.csv` with triples only (definitions, positions, and title are not included; use Save project for a full save); opens in Excel or Google Sheets |
| Import triples CSV | Import triples CSV | Appends triples from a CSV file; does not wipe existing work |
| Export map image | Export SVG / Export PNG | Downloads the current map as a vector or raster image |
| Print | Print | Opens the browser print dialog; prints the map plus definitions |
| Autosave | (automatic) | One browser localStorage slot; shown as "autosave on" in the toolbar |

**Opening a project file replaces the current autosave slot.** Always save a
`.json` project file before switching to a different student's work.

## Pasting from a spreadsheet

You can copy rows directly from Excel or Google Sheets and paste them into the
triples table:

- Copy 3-column rows (From concept | verb phrase | To concept) and paste into any
  cell in the Triples tab.
- Copy 2-column rows (word | definition) and paste into any cell in the Definitions tab.

The paste handler reads the clipboard as tab-separated values, matching the default
copy format of most spreadsheet apps.

## Developer tasks

Run all checks (TypeScript type-check, ESLint, node unit tests):

```bash
bash check_codebase.sh
```

Run node unit tests directly:

```bash
node --import tsx --test tests/test_*.mjs
```

Run Playwright browser tests:

```bash
bash run_playwright_tests.sh
```

Pass `--build` to force a dist/ rebuild before running, or forward any
extra arguments to Playwright (for example a spec file path or `--headed`).

Run Python hygiene tests (linting, link checks, shebang checks):

```bash
source source_me.sh && python3 -m pytest tests/
```

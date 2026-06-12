# File structure

## Top-level layout

```text
concept-map-maker/
+- src/                    # SolidJS + TypeScript app source
+- pipeline/               # esbuild build scripts
+- tests/                  # node unit tests, Playwright specs, Python hygiene tests
+- tools/                  # standalone helper scripts (html_to_pdf.mjs)
+- devel/                  # developer maintenance scripts (changelog, setup, version)
+- docs/                   # project documentation
+- build_github_pages.sh   # canonical production build into dist/
+- run_web_server.sh       # build then serve dist/ locally
+- run_playwright_tests.sh # build (if needed) and run Playwright suite
+- check_codebase.sh       # typecheck + lint + format + node test gate
+- source_me.sh            # Python environment bootstrap
+- package.json            # npm scripts and dependencies
+- playwright.config.ts    # Playwright configuration
+- tsconfig.json           # app typecheck config
+- tsconfig.lint.json      # wider typecheck config (tests, tools, pipeline)
+- eslint.config.js        # ESLint flat config
+- Brewfile, pip_requirements*.txt  # system and Python dependency manifests
+- README.md, AGENTS.md, CLAUDE.md, VERSION, REPO_TYPE
+- LICENSE.MIT.md, LICENSE.CC-BY-4.0.md
```

## Key subtrees

### src/

- Components: [src/app.tsx](../src/app.tsx), [src/toolbar.tsx](../src/toolbar.tsx),
  [src/map_canvas.tsx](../src/map_canvas.tsx), [src/concept_node.tsx](../src/concept_node.tsx),
  [src/concept_edge.tsx](../src/concept_edge.tsx), [src/triples_table.tsx](../src/triples_table.tsx),
  [src/triple_row.tsx](../src/triple_row.tsx), [src/definitions_table.tsx](../src/definitions_table.tsx),
  [src/rubric_panel.tsx](../src/rubric_panel.tsx), [src/theme_picker.tsx](../src/theme_picker.tsx),
  [src/concept_autocomplete.tsx](../src/concept_autocomplete.tsx)
- State and types: [src/app_state.ts](../src/app_state.ts), [src/types.ts](../src/types.ts)
- Pure modules: [src/derive_concepts.ts](../src/derive_concepts.ts),
  [src/layout_graph.ts](../src/layout_graph.ts), [src/graph_depth.ts](../src/graph_depth.ts),
  [src/validate_document.ts](../src/validate_document.ts),
  [src/edge_geometry.ts](../src/edge_geometry.ts), [src/map_bounds.ts](../src/map_bounds.ts),
  [src/themes.ts](../src/themes.ts)
- Codecs and export: [src/document_codec.ts](../src/document_codec.ts),
  [src/csv_codec.ts](../src/csv_codec.ts), [src/export_svg.ts](../src/export_svg.ts)
- Static assets: [src/index.html](../src/index.html), [src/style.css](../src/style.css)
  (copied verbatim into `dist/` by the build)

See [CODE_ARCHITECTURE.md](CODE_ARCHITECTURE.md) for how these fit together.

### tests/

- `tests/test_*.mjs` - node unit tests for pure src modules; run via
  `node --import tsx --test` inside [check_codebase.sh](../check_codebase.sh).
- `tests/playwright/*.spec.ts` - browser E2E specs plus
  [tests/playwright/helpers.ts](../tests/playwright/helpers.ts); run via
  [run_playwright_tests.sh](../run_playwright_tests.sh).
- `tests/test_*.py` - Python hygiene pytest suite (whitespace, indentation, ASCII,
  markdown links, shebangs, imports, bandit); run with `pytest tests/`.
- [tests/conftest.py](../tests/conftest.py) excludes `e2e/` and `playwright/` from
  pytest collection.

### devel/

- Changelog tooling: [devel/rotate_changelog.py](../devel/rotate_changelog.py),
  [devel/query_changelog.py](../devel/query_changelog.py),
  [devel/commit_changelog.py](../devel/commit_changelog.py),
  [devel/changelog_lib.py](../devel/changelog_lib.py)
- Setup: [devel/setup_typescript.sh](../devel/setup_typescript.sh),
  [devel/setup_playwright.sh](../devel/setup_playwright.sh)
- Misc: [devel/bump_version.py](../devel/bump_version.py),
  [devel/dist_clean.sh](../devel/dist_clean.sh)

## Generated artifacts (gitignored)

- `dist/` - production build output (`main.js`, `main.js.map`, `index.html`,
  `style.css`, `.nojekyll`)
- `node_modules/`, `package-lock.json` - npm dependencies
- `test-results/`, `playwright-report/`, `blob-report/`, `coverage/` - test outputs
- `*.tsbuildinfo`, `.eslintcache`, `.prettiercache` - tool caches
- `_temp*` files and `report_*.txt` - scratch and hygiene-report files

## Documentation map

- Root docs: [README.md](../README.md), [AGENTS.md](../AGENTS.md)
- Project docs: [USAGE.md](USAGE.md), [CHANGELOG.md](CHANGELOG.md),
  [CODE_ARCHITECTURE.md](CODE_ARCHITECTURE.md), [FILE_STRUCTURE.md](FILE_STRUCTURE.md)
- Style and convention docs (centrally maintained): [REPO_STYLE.md](REPO_STYLE.md),
  [PYTHON_STYLE.md](PYTHON_STYLE.md), [TYPESCRIPT_STYLE.md](TYPESCRIPT_STYLE.md),
  [PYTEST_STYLE.md](PYTEST_STYLE.md), [MARKDOWN_STYLE.md](MARKDOWN_STYLE.md),
  [E2E_TESTS.md](E2E_TESTS.md), [PLAYWRIGHT_USAGE.md](PLAYWRIGHT_USAGE.md),
  [CLAUDE_HOOK_USAGE_GUIDE.md](CLAUDE_HOOK_USAGE_GUIDE.md)
- Working plans: `docs/active_plans/` (filed by kind per
  [REPO_STYLE.md](REPO_STYLE.md))

## Where to add new work

- App code: `src/` (pure logic in a Solid-free `.ts` module when possible)
- Unit tests: `tests/test_<module>.mjs` mirroring the src module name
- Browser tests: `tests/playwright/<feature>.spec.ts`
- Docs: `docs/` with SCREAMING_SNAKE_CASE filenames
- Developer scripts: `devel/`; user-facing entry points stay as repo-root `*.sh`

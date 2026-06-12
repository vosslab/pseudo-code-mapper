# Install

Installed means the npm dev dependencies are present in `node_modules/` so the app can be
built into `dist/` and served locally. The app itself is browser-only; end users need no
install, only a browser pointed at the built page.

## Requirements

- Node.js with `npm` (for example `brew install node`).
- Python 3.12 for the local web server and developer hygiene tests
  (`run_web_server.sh` uses `python3 -m http.server`).
- Python dev tools for the pytest suite are listed in
  [../pip_requirements-dev.txt](../pip_requirements-dev.txt) (bandit, packaging,
  pyflakes, pytest, rich).

## Install steps

```bash
bash devel/setup_typescript.sh
```

This runs `npm install` against [../package.json](../package.json) (TypeScript, esbuild,
SolidJS, ESLint, Prettier, tsx, Playwright).

Optional, only for browser tests:

```bash
bash devel/setup_playwright.sh
```

## Verify install

```bash
bash check_codebase.sh
```

Exits 0 with a PASS summary (typecheck, lint, format check, node unit tests).

## Known gaps

- [ ] Document the pip install command for the dev tools once a repo-standard
  command is confirmed (pip_requirements-dev.txt exists; Brewfile and
  pip_requirements.txt are currently empty).

#!/usr/bin/env bash
# run_playwright_tests.sh - run the Playwright browser test suite.
#
# Contract:
#   - Requires node and npm on PATH.
#   - Requires node_modules to be installed (npm install).
#   - Requires playwright.config.ts at the repo root.
#   - The config serves a prebuilt dist/ folder on port 4173 via Python
#     http.server. If dist/index.html or dist/main.js is missing, this script
#     runs bash build_github_pages.sh first.
#   - Pass --build to force a rebuild even when dist/ is already present.
#   - Remaining arguments are forwarded to 'npx playwright test' (e.g. a
#     spec filter or --headed).
#   - Exits with playwright's exit code.
#   - Prints a clear PASS or FAIL line on completion.
#
# Flags:
#   -h, --help    Print usage and exit 0.
#   --build       Force rebuild of dist/ before running tests.
#
# Examples:
#   bash run_playwright_tests.sh
#   bash run_playwright_tests.sh --build
#   bash run_playwright_tests.sh tests/playwright/smoke.spec.ts

set -euo pipefail

# Usage
usage() {
	cat <<'USAGE'
Usage: run_playwright_tests.sh [-h|--help] [--build] [PLAYWRIGHT_ARGS...]

  -h, --help    Print this help and exit 0.
  --build       Force a dist/ rebuild before running tests.

Any remaining arguments are forwarded to 'npx playwright test'.
USAGE
}

# Parse script-level flags; collect the rest for playwright.
FORCE_BUILD=0
PLAYWRIGHT_ARGS=()

while [ "$#" -gt 0 ]; do
	case "$1" in
		-h|--help)
			usage
			exit 0
			;;
		--build)
			FORCE_BUILD=1
			shift
			;;
		*)
			PLAYWRIGHT_ARGS+=("$1")
			shift
			;;
	esac
done

# Preflight
cd "$(git rev-parse --show-toplevel)"

if ! command -v node >/dev/null 2>&1; then
	echo "ERROR: node not found on PATH." >&2
	exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
	echo "ERROR: npm not found on PATH." >&2
	exit 1
fi

if [ ! -d node_modules ]; then
	echo "ERROR: node_modules missing. Run 'npm install' first." >&2
	exit 1
fi

if [ ! -f playwright.config.ts ]; then
	echo "ERROR: playwright.config.ts not found. Is this the right repo root?" >&2
	exit 1
fi

# Build dist/ if needed.
if [ "$FORCE_BUILD" -eq 1 ]; then
	echo "==> --build flag set: rebuilding dist/..."
	bash build_github_pages.sh
elif [ ! -f dist/index.html ] || [ ! -f dist/main.js ]; then
	echo "==> dist/index.html or dist/main.js missing: running build_github_pages.sh..."
	bash build_github_pages.sh
fi

# Run Playwright.
echo "==> npx playwright test ${PLAYWRIGHT_ARGS[*]+"${PLAYWRIGHT_ARGS[*]}"}"
PW_EXIT=0
set +e
npx playwright test "${PLAYWRIGHT_ARGS[@]}"
PW_EXIT=$?
set -e

# Summary line.
if [ "$PW_EXIT" -eq 0 ]; then
	echo "PASS: playwright tests passed."
else
	echo "FAIL: playwright tests failed (exit code $PW_EXIT)."
fi

exit "$PW_EXIT"

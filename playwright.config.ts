// playwright.config.ts - minimal Playwright config for the smoke suite.
//
// How to run:
//   1. Build the GitHub Pages artifact:  bash build_github_pages.sh
//   2. Run the suite:                     npx playwright test
//
// The config serves the built dist/ folder on a fixed local port (4173) via
// Python's http.server, so the baseURL is stable (unlike run_web_server.sh,
// which picks a random port per session). webServer.reuseExistingServer lets a
// dev keep a server running across reruns. Tests live in tests/playwright/.

import { defineConfig, devices } from "@playwright/test";

// Fixed port for the smoke server; stable so baseURL never changes.
const PORT = 4173;
const BASE_URL = `http://localhost:${PORT}`;

// Detect CI without depending on Node's process typings (kept out of the src
// tsconfig types). Reads the CI env var off globalThis.process when present.
function is_ci(): boolean {
  const proc = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process;
  return proc?.env?.CI !== undefined && proc.env.CI !== "";
}
const CI = is_ci();

export default defineConfig({
  // Smoke and other browser specs live alongside the Playwright helpers.
  testDir: "tests/playwright",
  // Only *.spec.ts files are Playwright specs; *.mjs files are plain helpers.
  testMatch: "**/*.spec.ts",
  // Fail the CI build if test.only is left in the source.
  forbidOnly: CI,
  // Keep the suite serial-friendly and deterministic for a smoke check.
  fullyParallel: false,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  // Serve the prebuilt dist/ folder. The build is a separate step (run
  // build_github_pages.sh first); this only serves the static artifact.
  webServer: {
    command: `python3 -m http.server ${PORT} --directory dist`,
    url: BASE_URL,
    reuseExistingServer: !CI,
    timeout: 30_000,
  },
});

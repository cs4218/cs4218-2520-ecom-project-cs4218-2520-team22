// QINZHE Wang, A0337880U
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 45000,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: "http://localhost:3000",
    headless: true,
    screenshot: "only-on-failure",
    // Short navigation timeout so tests fail fast on broken redirects
    navigationTimeout: 15000,
  },
  globalSetup: "./e2e/helpers/globalSetup.js",
  globalTeardown: "./e2e/helpers/globalTeardown.js",
  // Assume both servers are already running (npm run dev or start them separately).
  // If CI=true starts them automatically.
  webServer: [
    {
      command: "node server.js",
      url: "http://localhost:6060",
      reuseExistingServer: !process.env.CI,
      timeout: 30000,
    },
    {
      command: "npx cross-env BROWSER=none npm run client",
      url: "http://localhost:3000",
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
  ],
});

// QINZHE Wang, A0337880U
// Song Yichao, A0255686M

import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  timeout: 45000,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
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
      command: "cross-env E2E_MODE=true node server.js",
      url: "http://localhost:6060",
      reuseExistingServer: true,
      timeout: 30000,
    },
    {
      command: "npm run client",
      url: "http://localhost:3000",
      reuseExistingServer: true,
      timeout: 120000,
    },
  ],
});

// QINZHE Wang, A0337880U
// Song Yichao, A0255686M

import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  timeout: 45000,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: "http://localhost:3000",
    headless: true,
    screenshot: "only-on-failure",
    navigationTimeout: 15000,
  },
  globalSetup: "./e2e/helpers/globalSetup.js",
  globalTeardown: "./e2e/helpers/globalTeardown.js",
  webServer: [
    {
      command: "node server.js",
      url: "http://localhost:6060",
      reuseExistingServer: false,
      timeout: 30000,
    },
    {
      command: "npx cross-env BROWSER=none npm run client",
      url: "http://localhost:3000",
      reuseExistingServer: false,
      timeout: 120000,
    },
  ],
});

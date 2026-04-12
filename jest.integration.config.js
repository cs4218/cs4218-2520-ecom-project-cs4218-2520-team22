export default {
  displayName: "integration",
  testEnvironment: "node",
  testMatch: ["<rootDir>/server_test/**/*.integration.test.js"],
  // No coverage thresholds — integration tests are not source files
  collectCoverage: false,
  // Longer timeout for DB spin-up
  testTimeout: 30000,
  // maxWorkers: 1 alone is not enough — use --runInBand in the npm script
};

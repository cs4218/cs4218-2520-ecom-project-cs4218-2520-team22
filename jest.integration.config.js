export default {
  displayName: "integration",
  testEnvironment: "node",
  testMatch: ["<rootDir>/**/*.integration.test.js"],
  // No coverage thresholds — integration tests are not source files
  collectCoverage: false,
  // Longer timeout for DB spin-up
  testTimeout: 30000,
  // Run in the main process (not workers) to avoid concurrent MongoMemoryServer
  // instances competing over process.env.MONGO_URL / mongoose singleton
  runner: "jest-runner",
  runInBand: true,
};

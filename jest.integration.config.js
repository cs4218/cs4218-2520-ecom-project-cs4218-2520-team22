export default {
  displayName: "integration",
  testEnvironment: "node",
  testMatch: ["<rootDir>/server_test/**/*.integration.test.js"],
  // No coverage thresholds — integration tests are not source files
  collectCoverage: false,
  // Longer timeout for DB spin-up
  testTimeout: 30000,
  // Run test files serially to avoid concurrent MongoMemoryServer instances
  // competing over process.env.MONGO_URL / mongoose singleton
  maxWorkers: 1,
};

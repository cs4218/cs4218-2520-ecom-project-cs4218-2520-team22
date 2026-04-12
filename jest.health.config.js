// Jest config for health check tests
export default {
  displayName: "health-check",
  testEnvironment: "node",
  testMatch: [
    "<rootDir>/server_test/healthcheck.js",
  ],
  collectCoverage: false,
  testTimeout: 30000,
  runner: "jest-runner",
  setupFiles: ["./server_test/helpers/braintreeSetup.cjs"],
};

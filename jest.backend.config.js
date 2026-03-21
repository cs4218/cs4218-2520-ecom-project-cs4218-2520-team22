export default {
  // display name
  displayName: "backend",

  // when testing backend
  testEnvironment: "node",

  // which test to run
  testMatch: [
    "<rootDir>/config/*.test.js",
    "<rootDir>/controllers/*.test.js",
    "<rootDir>/helpers/*.test.js",
    "<rootDir>/middlewares/*.test.js",
    "<rootDir>/models/*.test.js",
    "<rootDir>/routes/*.test.js", // if there are any added later
  ],

  // jest code coverage
  collectCoverage: true,
  collectCoverageFrom: [
    "**/*.js",
    "!**/*.test.js",
    "!**/*.test.jsx",
    
    "!client/**",
    "!coverage/**",
    "!e2e/**",
    "!node_modules/**",
    "!playwright-report/**",
    "!server_test/**",
    "!test-results/**",

    "!*.config.js",
    "!server.js",
  ],
  coverageThreshold: {
    global: {
      lines: 85,
      functions: 85,
      branches: 80,
      statements: 85,
    },
  },
};

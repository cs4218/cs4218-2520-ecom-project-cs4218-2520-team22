export default {
  // display name
  displayName: "backend",

  // when testing backend
  testEnvironment: "node",

  // which test to run
  testMatch: [
    // Original
    //"<rootDir>/controllers/*.test.js",

    "<rootDir>/controllers/*.test.js",
    "<rootDir>/models/*.test.js",
    "<rootDir>/helpers/*.test.js",
    "<rootDir>/config/*.test.js",
    "<rootDir>/middlewares/*.test.js",
  ],

  // jest code coverage
  collectCoverage: true,
  collectCoverageFrom: [
    // Original
    // "controllers/**",

    "**/*.js",
    "!routes/**",
    "!server.js",
    "!node_modules/**",
    "!coverage/**",
    "!playwright-report/**",
    "!client/**",
    "!**/*.config.js",

    "!**/*.test.js",
    "!**/*.test.jsx",
    "!**/__tests__/**",
    "!**/tests/**",
  ],
  coverageThreshold: {
    global: {
      lines: 90,
      functions: 90,
      branches: 80,
      statements: 90,
    },
  },
};

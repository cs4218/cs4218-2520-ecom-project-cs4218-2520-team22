export default {
  // display name
  displayName: "backend",

  // when testing backend
  testEnvironment: "node",

  // which test to run
  testMatch: ["<rootDir>/**/*.test.js"],

  testPathIgnorePatterns: [
    "<rootDir>/client/",
    "<rootDir>/node_modules/",
    "<rootDir>/coverage/",
    "<rootDir>/playwright-report/",],

  // jest code coverage
  collectCoverage: true,
  collectCoverageFrom: [
    "helpers/**/*.js",
    "middlewares/**/*.js",
    // "**/*.js",
    "!node_modules/**",
    "!coverage/**",
    "!playwright-report/**",

  ],
  coverageThreshold: {
    global: {
      lines: 90,
      functions: 90,
    },
  },
};

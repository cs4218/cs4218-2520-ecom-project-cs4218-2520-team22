export default {
  // display name
  displayName: "backend",

  // when testing backend
  testEnvironment: "node",

  // which test to run
  testMatch: ["<rootDir>/**/*.test.{js,jsx}"],

  testPathIgnorePatterns: [
    "<rootDir>/client/",
    "<rootDir>/node_modules/",
    "<rootDir>/coverage/",
    "<rootDir>/playwright-report/",],

  // jest code coverage
  collectCoverage: true,
  collectCoverageFrom: [
    "**/*.js",
    "!node_modules/**",
    "!coverage/**",
    "!playwright-report/**",
    "!client/**",
    "!**/*.config.js",
  ],
  coverageThreshold: {
    global: {
      lines: 90,
      functions: 90,
    },
  },
};

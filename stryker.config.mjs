/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
  packageManager: "npm",
  testRunner: "jest",
  jest: {
    configFile: "jest.backend.config.js",
    enableFindRelatedTests: true,
  },
  mutate: [
    "controllers/**/*.js",
    "helpers/**/*.js",
    "models/**/*.js",
    "middlewares/**/*.js",
    "!controllers/**/*.test.js",
    "!helpers/**/*.test.js",
    "!models/**/*.test.js",
    "!middlewares/**/*.test.js",
    "!**/*.integration.test.js",
  ],
  thresholds: {
    high: 90,
    low: 70,
    break: 90,
  },
  reporters: ["json", "progress"],
  coverageAnalysis: "perTest",
  jsonReporter: {
    fileName: "reports/mutation/mutation.json",
  },
  timeoutMS: 60000,
  timeoutFactor: 1.5,
};

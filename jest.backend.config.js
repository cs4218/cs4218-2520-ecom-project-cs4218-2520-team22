export default {
  // display name
  displayName: "backend",

  // when testing backend
  testEnvironment: "node",

  // which test to run
  testMatch: [
    // Original
    //"<rootDir>/controllers/*.test.js",

    // Song Yichao, A025686M
    "<rootDir>/controllers/authController.test.js",
    "<rootDir>/models/*.test.js",
  ],

  // jest code coverage
  collectCoverage: true,
  collectCoverageFrom: [
    // Original
    // "controllers/**",

    "controllers/authController.js",
    "models/userModel.js",
    "models/orderModel.js",
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

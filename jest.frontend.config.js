export default {
  // name displayed during tests
  displayName: "frontend",

  // simulates browser environment in jest
  // e.g., using document.querySelector in your tests
  testEnvironment: "jest-environment-jsdom",

  // jest does not recognise jsx files by default, so we use babel to transform any jsx files
  transform: {
    "^.+\\.jsx?$": "babel-jest",
  },

  // tells jest how to handle css/scss imports in your tests
  moduleNameMapper: {
    "\\.(css|scss)$": "identity-obj-proxy",
  },

  // ignore all node_modules except styleMock (needed for css imports)
  transformIgnorePatterns: ["/node_modules/(?!(styleMock\\.js)$)"],

  // only run these tests
  testMatch: [
    // Original
    // "<rootDir>/client/src/pages/Auth/*.test.js",

    // Song Yichao, A0255686M
    "<rootDir>/client/src/components/Routes/*.test.js",
    "<rootDir>/client/src/components/Form/*.test.js",
    "<rootDir>/client/src/components/*.test.js",
    "<rootDir>/client/src/context/*.test.js",
    "<rootDir>/client/src/pages/user/*.test.js",
    "<rootDir>/client/src/pages/*.test.js",
  ],

  // jest code coverage
  collectCoverage: true,
  collectCoverageFrom: [
    // Original
    // "client/src/pages/Auth/**",

    // Song Yichao, A0255686M
    "client/src/components/Routes/Private.js",
    "client/src/components/UserMenu.js",
    "client/src/pages/user/Dashboard.js",
    "client/src/pages/user/Orders.js",
    "client/src/pages/user/Profile.js",
    "client/src/components/Form/SearchInput.js",
    "client/src/context/search.js",
    "client/src/pages/Search.js",
  ],
  coverageThreshold: {
    global: {
      lines: 90,
      functions: 90,
      statements: 90,
      branches: 80,
    },
  },
  setupFilesAfterEnv: ["<rootDir>/client/src/setupTests.js"],

};

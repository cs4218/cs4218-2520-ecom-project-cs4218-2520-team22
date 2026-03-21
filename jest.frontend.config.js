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
    "\\.(css|less|sass|scss)$": "identity-obj-proxy",
    "^react$": "<rootDir>/client/node_modules/react",
    "^react-dom$": "<rootDir>/client/node_modules/react-dom",
    "^react-dom/(.*)$": "<rootDir>/client/node_modules/react-dom/$1",
  },

  // only run these tests
  testMatch: [
    "<rootDir>/client/src/**/*.test.js",
    "<rootDir>/client/src/**/*.test.jsx",
  ],

  // exclude _site directory (generated build files)
  testPathIgnorePatterns: ["<rootDir>/client/src/_site/"],
  
  // jest code coverage
  collectCoverage: true,
  collectCoverageFrom: [
    "client/src/**/*.{js,jsx}",
    "!client/src/_site/**",
    "!client/src/**/*.test.{js,jsx}",
    "!client/src/index.js",
    "!client/src/App.js",
    "!client/src/reportWebVitals.js",
    "!client/src/**/__tests__/**",
    "!client/src/**/setupTests.js",
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

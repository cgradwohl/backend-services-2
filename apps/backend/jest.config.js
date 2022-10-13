module.exports = {
  collectCoverage: true,
  collectCoverageFrom: [
    "!.webpack/**",
    "!**/__mocks__/**",
    "!**/__smoke_tests__/**",
    "!**/__tests__/**",
    "!**/@types/**",
    "!**/*.d.ts",
    "!**/*.spec.ts",
    "!**/bin/**",
    "!**/libjsonnet.js",
    "!**/node_modules/**",
    "!jest.config.js",
    "**/*.{js,ts}",
  ],
  coverageReporters: ["text", "text-summary", "html", "json"],
  moduleFileExtensions: ["js", "ts", "json", "d.ts", ".hbs"],
  moduleNameMapper: {
    "~/(.*)$": "<rootDir>/$1",
  },
  roots: ["<rootDir>"],
  testRegex: `${
    process.env.SMOKE_TEST ? "__smoke_tests__" : "__tests__"
  }/*/.*(test|spec).ts$`,
  transform: {
    "^.+\\.ts?$": "ts-jest",
    "\\.hbs$": "jest-raw-loader",
  },
  ...(process.env.VERBOSE && {
    setupFiles: ["<rootDir>/jest.verbose-env.js"],
  }),
  ...(!process.env.VERBOSE && {
    setupFilesAfterEnv: ["<rootDir>/jest.verbose.js"],
  }),
  ...(!process.env.SMOKE_TEST && { setupFiles: ["<rootDir>/jest.setup.js"] }),
  // https://stackoverflow.com/questions/49963437/response-for-preflight-has-invalid-http-status-code-401-testing/49964414#49964414
  ...(process.env.SMOKE_TEST && { testEnvironment: "node" }),
  verbose: false,
};

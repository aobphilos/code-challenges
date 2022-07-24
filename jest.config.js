/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  displayName: "Code-Challenges",
  preset: "./jest.preset.js",
  passWithNoTests: true,
  globals: {
    "ts-jest": {
      tsconfig: "<rootDir>/tsconfig.spec.json"
    }
  },
  transform: {
    "^.+\\.[tj]s$": "ts-jest"
  },
  moduleFileExtensions: ["ts", "js", "html"],
  coverageDirectory: "./coverage/"
};

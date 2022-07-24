module.exports = {
  moduleFileExtensions: ["ts", "js"],
  coverageReporters: ["json"],
  testEnvironment: "node",
  bail: 0,
  color: true,
  colors: true,
  detectOpenHandles: true,
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 50,
      functions: 50,
      lines: 50
    }
  }
};

// eslint-disable-next-line no-undef
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testPathIgnorePatterns: ["examples", "node_modules", "dist"],
  testTimeout: 10000, // Increase timeout to 10 seconds
};

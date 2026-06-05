/** @type {import('jest') */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/*.test.js'],
  coveragePathIgnorePatterns: ['/node_modules/', '/src/server.js'],
  modulePathIgnorePatterns: ['<rootDir>/data/'],
};
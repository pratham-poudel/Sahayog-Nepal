module.exports = {
  testEnvironment: 'node',
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/tests/'
  ],
  testTimeout: 30000,
  setupFilesAfterEnv: ['<rootDir>/tests/jest.setup.js'],
  testMatch: [
    '<rootDir>/tests/**/*.test.js',
    '<rootDir>/tests/**/*.spec.js',
    '<rootDir>/tests/**/*Test.js'
  ]
};

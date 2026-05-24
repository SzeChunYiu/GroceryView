export default {
  testEnvironment: 'node',
  roots: ['<rootDir>/apps', '<rootDir>/tests'],
  testMatch: [
    '<rootDir>/apps/**/__tests__/**/*.test.ts',
    '<rootDir>/apps/**/test/**/*.test.ts',
    '<rootDir>/tests/**/*.test.mjs'
  ],
  testPathIgnorePatterns: ['/node_modules/'],
  verbose: false
};

export default {
  clearMocks: true,
  resetMocks: false,
  restoreMocks: true,
  setupFilesAfterEnv: ['<rootDir>/packages/db/src/test/setup.ts'],
  testEnvironment: 'node'
};

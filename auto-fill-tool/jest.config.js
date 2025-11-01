/**
 * Fast Jest Configuration for Development
 * Optimized for speed over comprehensive testing
 */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node', // Faster than jsdom
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  roots: ['<rootDir>/src'],
  testMatch: ['**/src/**/__tests__/**/*.test.ts'],
  testPathIgnorePatterns: [
    '/node_modules/',
    'testHelpers.ts',
    '/tests/', // Skip integration/e2e tests
  ],
  transformIgnorePatterns: ['node_modules/'],
  maxWorkers: '50%', // Use half of available cores
  workerIdleMemoryLimit: '128MB',
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache',
  globals: {
    'ts-jest': {
      tsconfig: {
        target: 'es2020',
        module: 'commonjs',
        skipLibCheck: true,
        isolatedModules: true,
      }
    }
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@domain/(.*)$': '<rootDir>/src/domain/$1',
    '^@usecases/(.*)$': '<rootDir>/src/usecases/$1',
    '^@infrastructure/(.*)$': '<rootDir>/src/infrastructure/$1',
    '^@presentation/(.*)$': '<rootDir>/src/presentation/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
  },
  collectCoverage: false, // Disable coverage for speed
  verbose: false,
  silent: true,
  bail: 1, // Stop on first failure
  errorOnDeprecated: false,
  detectOpenHandles: false,
  forceExit: true,
};

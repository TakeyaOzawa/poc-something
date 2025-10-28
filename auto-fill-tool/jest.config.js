module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/src/**/__tests__/**/*.test.ts', // Unit tests in src/
    '**/tests/**/*.test.ts', // Integration, performance tests in tests/
  ],
  testPathIgnorePatterns: ['/node_modules/', 'testHelpers.ts'],
  transformIgnorePatterns: ['node_modules/(?!(jsonpath-plus)/)'],
  // Parallel execution: Use 50% of CPU cores for balanced performance
  maxWorkers: '50%',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@domain/(.*)$': '<rootDir>/src/domain/$1',
    '^@usecases/(.*)$': '<rootDir>/src/usecases/$1',
    '^@infrastructure/(.*)$': '<rootDir>/src/infrastructure/$1',
    '^@presentation/(.*)$': '<rootDir>/src/presentation/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
    '!src/**/index.ts', // Exclude index files
    '!src/**/types/*.ts', // Exclude type definition files
    '!src/**/**types.ts', // Exclude type definition files
    '!src/domain/repositories/*Repository.ts', // Exclude domain repository interface files
    '!src/presentation/**/components/atoms/**.ts', // Exclude UI atom components
    '!src/presentation/**/components/molecules/**.ts', // Exclude UI molecule components
    '!src/presentation/**/components/organisms/**.ts', // Exclude UI organism components
    '!src/presentation/**/components/templates/**.ts', // Exclude UI template components
    // '!src/presentation/**/*.ts', // Exclude presentation layer (UI, requires E2E testing)
    // Files with @coverage 0% comment (DOM-heavy UI components requiring E2E testing)
    '!src/presentation/common/UnifiedNavigationBar.ts',
    '!src/presentation/storage-sync-manager/StorageSyncManagerView.ts',
    '!src/infrastructure/adapters/ChromeTabCaptureAdapter.ts',
    '!src/infrastructure/adapters/ContentScriptTabCaptureAdapter.ts',
    '!src/infrastructure/adapters/OffscreenTabCaptureAdapter.ts',
    // DOM-heavy presentation layer files (user request - excluded from coverage)
    '!src/presentation/automation-variables-manager/AutomationVariablesManagerCoordinator.ts',
    '!src/presentation/common/ProgressIndicator.ts',
    '!src/presentation/content-script/AutoFillHandler.ts',
    '!src/presentation/content-script/ContentScriptMediaRecorder.ts',
    '!src/presentation/popup/PopupAlpine.ts',
    '!src/presentation/popup/WebsiteListPresenter.ts',
    '!src/presentation/stores/AppStore.ts',
    '!src/presentation/system-settings/SystemSettingsCoordinator.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 65,
      functions: 75,
      lines: 80,
      statements: 80,
    },
  },
};

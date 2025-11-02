/**
 * Unit Tests: RepositoryFactory
 * Tests the repository factory implementation
 */

import {
  RepositoryFactory,
  setGlobalFactory,
  getGlobalFactory,
  resetGlobalFactory,
  repositoryFactory,
} from '../RepositoryFactory';
import { SecureStorage } from '@domain/types/secure-storage-port.types';

// Mock SecureStorage
const createMockSecureStorage = (): jest.Mocked<SecureStorage> => ({
  isInitialized: jest.fn(),
  initialize: jest.fn(),
  unlock: jest.fn(),
  lock: jest.fn(),
  isUnlocked: jest.fn(),
  getSessionExpiresAt: jest.fn(),
  extendSession: jest.fn(),
  saveEncrypted: jest.fn(),
  loadEncrypted: jest.fn(),
  removeEncrypted: jest.fn(),
  clearAllEncrypted: jest.fn(),
  changeMasterPassword: jest.fn(),
  reset: jest.fn(),
});

// Import repository implementations for type checking
import { SecureAutomationVariablesRepository } from '@infrastructure/repositories/SecureAutomationVariablesRepository';
import { SecureWebsiteRepository } from '@infrastructure/repositories/SecureWebsiteRepository';
import { SecureXPathRepository } from '@infrastructure/repositories/SecureXPathRepository';
import { SecureSystemSettingsRepository } from '@infrastructure/repositories/SecureSystemSettingsRepository';
import { ChromeStorageAutomationVariablesRepository } from '@infrastructure/repositories/ChromeStorageAutomationVariablesRepository';
import { ChromeStorageWebsiteRepository } from '@infrastructure/repositories/ChromeStorageWebsiteRepository';
import { ChromeStorageXPathRepository } from '@infrastructure/repositories/ChromeStorageXPathRepository';
import { ChromeStorageSystemSettingsRepository } from '@infrastructure/repositories/ChromeStorageSystemSettingsRepository';
import { ChromeStorageAutomationResultRepository } from '@infrastructure/repositories/ChromeStorageAutomationResultRepository';
import { IdGenerator } from '@domain/types/id-generator.types';

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('RepositoryFactory', () => {
  let mockSecureStorage: jest.Mocked<SecureStorage>;

  beforeEach(() => {
    mockSecureStorage = createMockSecureStorage();
    // Clear environment variables
    delete process.env.ENCRYPTION_ENABLED;
    // Reset global factory
    resetGlobalFactory();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should create factory with default chrome mode when no config provided', () => {
      const factory = new RepositoryFactory();

      expect(factory.getMode()).toBe('chrome');
      expect(factory.isSecureMode()).toBe(false);
    });

    it('should create factory with explicit secure mode', () => {
      const factory = new RepositoryFactory({
        mode: 'secure',
        secureStorage: mockSecureStorage,
      });

      expect(factory.getMode()).toBe('secure');
      expect(factory.isSecureMode()).toBe(true);
    });

    it('should create factory with explicit chrome mode', () => {
      const factory = new RepositoryFactory({
        mode: 'chrome',
      });

      expect(factory.getMode()).toBe('chrome');
      expect(factory.isSecureMode()).toBe(false);
    });

    it('should throw error when secure mode without secureStorage', () => {
      expect(() => {
        new RepositoryFactory({ mode: 'secure' });
      }).toThrow(
        'RepositoryFactory: secureStorage is required when using secure mode. ' +
          'Please provide secureStorage in the factory configuration.'
      );
    });

    it('should use environment variable ENCRYPTION_ENABLED=true for secure mode', () => {
      process.env.ENCRYPTION_ENABLED = 'true';

      const factory = new RepositoryFactory({
        secureStorage: mockSecureStorage,
      });

      expect(factory.getMode()).toBe('secure');
      expect(factory.isSecureMode()).toBe(true);
    });

    it('should use environment variable ENCRYPTION_ENABLED=false for chrome mode', () => {
      process.env.ENCRYPTION_ENABLED = 'false';

      const factory = new RepositoryFactory();

      expect(factory.getMode()).toBe('chrome');
    });

    it('should default to chrome mode when ENCRYPTION_ENABLED is not set', () => {
      // No ENCRYPTION_ENABLED set
      const factory = new RepositoryFactory();

      expect(factory.getMode()).toBe('chrome');
    });

    it('should allow explicit mode to override environment variable', () => {
      process.env.ENCRYPTION_ENABLED = 'true';

      // Explicit chrome mode overrides env var
      const factory = new RepositoryFactory({ mode: 'chrome' });

      expect(factory.getMode()).toBe('chrome');
    });
  });

  describe('createAutomationVariablesRepository()', () => {
    it('should create SecureAutomationVariablesRepository in secure mode', () => {
      const factory = new RepositoryFactory({
        mode: 'secure',
        secureStorage: mockSecureStorage,
      });

      const repository = factory.createAutomationVariablesRepository();

      expect(repository).toBeInstanceOf(SecureAutomationVariablesRepository);
    });

    it('should create ChromeStorageAutomationVariablesRepository in chrome mode', () => {
      const factory = new RepositoryFactory({ mode: 'chrome' });

      const repository = factory.createAutomationVariablesRepository();

      expect(repository).toBeInstanceOf(ChromeStorageAutomationVariablesRepository);
    });

    it('should create new instance on each call', () => {
      const factory = new RepositoryFactory({ mode: 'chrome' });

      const repo1 = factory.createAutomationVariablesRepository();
      const repo2 = factory.createAutomationVariablesRepository();

      expect(repo1).not.toBe(repo2);
    });
  });

  describe('createWebsiteRepository()', () => {
    it('should create SecureWebsiteRepository in secure mode', () => {
      const factory = new RepositoryFactory({
        mode: 'secure',
        secureStorage: mockSecureStorage,
      });

      const repository = factory.createWebsiteRepository();

      expect(repository).toBeInstanceOf(SecureWebsiteRepository);
    });

    it('should create ChromeStorageWebsiteRepository in chrome mode', () => {
      const factory = new RepositoryFactory({ mode: 'chrome' });

      const repository = factory.createWebsiteRepository();

      expect(repository).toBeInstanceOf(ChromeStorageWebsiteRepository);
    });
  });

  describe('createXPathRepository()', () => {
    it('should create SecureXPathRepository in secure mode', () => {
      const factory = new RepositoryFactory({
        mode: 'secure',
        secureStorage: mockSecureStorage,
      });

      const repository = factory.createXPathRepository();

      expect(repository).toBeInstanceOf(SecureXPathRepository);
    });

    it('should create ChromeStorageXPathRepository in chrome mode', () => {
      const factory = new RepositoryFactory({ mode: 'chrome' });

      const repository = factory.createXPathRepository();

      expect(repository).toBeInstanceOf(ChromeStorageXPathRepository);
    });
  });

  describe('createSystemSettingsRepository()', () => {
    it('should create SecureSystemSettingsRepository in secure mode', () => {
      const factory = new RepositoryFactory({
        mode: 'secure',
        secureStorage: mockSecureStorage,
      });

      const repository = factory.createSystemSettingsRepository();

      expect(repository).toBeInstanceOf(SecureSystemSettingsRepository);
    });

    it('should create ChromeStorageSystemSettingsRepository in chrome mode', () => {
      const factory = new RepositoryFactory({ mode: 'chrome' });

      const repository = factory.createSystemSettingsRepository();

      expect(repository).toBeInstanceOf(ChromeStorageSystemSettingsRepository);
    });
  });

  describe('createAutomationResultRepository()', () => {
    it('should always create ChromeStorageAutomationResultRepository in secure mode', () => {
      const factory = new RepositoryFactory({
        mode: 'secure',
        secureStorage: mockSecureStorage,
      });

      const repository = factory.createAutomationResultRepository();

      // AutomationResult is always ChromeStorage (no secure version)
      expect(repository).toBeInstanceOf(ChromeStorageAutomationResultRepository);
    });

    it('should create ChromeStorageAutomationResultRepository in chrome mode', () => {
      const factory = new RepositoryFactory({ mode: 'chrome' });

      const repository = factory.createAutomationResultRepository();

      expect(repository).toBeInstanceOf(ChromeStorageAutomationResultRepository);
    });
  });

  describe('createAllRepositories()', () => {
    it('should create all repositories in secure mode', () => {
      const factory = new RepositoryFactory({
        mode: 'secure',
        secureStorage: mockSecureStorage,
      });

      const repositories = factory.createAllRepositories();

      expect(repositories.automationVariables).toBeInstanceOf(SecureAutomationVariablesRepository);
      expect(repositories.website).toBeInstanceOf(SecureWebsiteRepository);
      expect(repositories.xpath).toBeInstanceOf(SecureXPathRepository);
      expect(repositories.systemSettings).toBeInstanceOf(SecureSystemSettingsRepository);
      expect(repositories.automationResult).toBeInstanceOf(ChromeStorageAutomationResultRepository);
    });

    it('should create all repositories in chrome mode', () => {
      const factory = new RepositoryFactory({ mode: 'chrome' });

      const repositories = factory.createAllRepositories();

      expect(repositories.automationVariables).toBeInstanceOf(
        ChromeStorageAutomationVariablesRepository
      );
      expect(repositories.website).toBeInstanceOf(ChromeStorageWebsiteRepository);
      expect(repositories.xpath).toBeInstanceOf(ChromeStorageXPathRepository);
      expect(repositories.systemSettings).toBeInstanceOf(ChromeStorageSystemSettingsRepository);
      expect(repositories.automationResult).toBeInstanceOf(ChromeStorageAutomationResultRepository);
    });

    it('should return object with all repository keys', () => {
      const factory = new RepositoryFactory({ mode: 'chrome' });

      const repositories = factory.createAllRepositories();

      expect(repositories).toHaveProperty('automationVariables');
      expect(repositories).toHaveProperty('website');
      expect(repositories).toHaveProperty('xpath');
      expect(repositories).toHaveProperty('systemSettings');
      expect(repositories).toHaveProperty('automationResult');
    });

    it('should create new instances on each call', () => {
      const factory = new RepositoryFactory({ mode: 'chrome' });

      const repos1 = factory.createAllRepositories();
      const repos2 = factory.createAllRepositories();

      expect(repos1.automationVariables).not.toBe(repos2.automationVariables);
      expect(repos1.website).not.toBe(repos2.website);
    });
  });

  describe('Global Factory Singleton', () => {
    it('should set and get global factory', () => {
      const factory = new RepositoryFactory({ mode: 'chrome' });

      setGlobalFactory(factory);

      expect(getGlobalFactory()).toBe(factory);
    });

    it('should throw error when getting global factory before initialization', () => {
      // Don't set global factory

      expect(() => {
        getGlobalFactory();
      }).toThrow(
        'RepositoryFactory: Global factory not initialized. ' +
          'Call setGlobalFactory() during application initialization.'
      );
    });

    it('should access global factory via repositoryFactory.instance', () => {
      const factory = new RepositoryFactory({ mode: 'chrome' });
      setGlobalFactory(factory);

      expect(repositoryFactory.instance).toBe(factory);
    });

    it('should allow replacing global factory', () => {
      const factory1 = new RepositoryFactory({ mode: 'chrome' });
      const factory2 = new RepositoryFactory({
        mode: 'secure',
        secureStorage: mockSecureStorage,
      });

      setGlobalFactory(factory1);
      expect(getGlobalFactory()).toBe(factory1);

      setGlobalFactory(factory2);
      expect(getGlobalFactory()).toBe(factory2);
    });
  });

  describe('Mode Detection', () => {
    it('should correctly report secure mode', () => {
      const factory = new RepositoryFactory({
        mode: 'secure',
        secureStorage: mockSecureStorage,
      });

      expect(factory.isSecureMode()).toBe(true);
      expect(factory.getMode()).toBe('secure');
    });

    it('should correctly report chrome mode', () => {
      const factory = new RepositoryFactory({ mode: 'chrome' });

      expect(factory.isSecureMode()).toBe(false);
      expect(factory.getMode()).toBe('chrome');
    });
  });

  describe('Integration Scenarios', () => {
    it('should create consistent repository types across multiple calls', () => {
      const factory = new RepositoryFactory({
        mode: 'secure',
        secureStorage: mockSecureStorage,
      });

      // Create repositories multiple times
      const automationRepo1 = factory.createAutomationVariablesRepository();
      const automationRepo2 = factory.createAutomationVariablesRepository();
      const websiteRepo1 = factory.createWebsiteRepository();

      // All should be Secure implementations
      expect(automationRepo1).toBeInstanceOf(SecureAutomationVariablesRepository);
      expect(automationRepo2).toBeInstanceOf(SecureAutomationVariablesRepository);
      expect(websiteRepo1).toBeInstanceOf(SecureWebsiteRepository);
    });

    it('should support environment-based configuration workflow', () => {
      process.env.ENCRYPTION_ENABLED = 'true';

      // Application initialization
      const factory = new RepositoryFactory({
        secureStorage: mockSecureStorage,
      });

      setGlobalFactory(factory);

      // Application code using global factory
      const globalRepo = repositoryFactory.instance.createWebsiteRepository();

      expect(globalRepo).toBeInstanceOf(SecureWebsiteRepository);
    });

    it('should support manual configuration workflow', () => {
      // Explicit configuration (ignoring environment)
      const factory = new RepositoryFactory({
        mode: 'chrome',
      });

      setGlobalFactory(factory);

      const repos = repositoryFactory.instance.createAllRepositories();

      // All should be ChromeStorage implementations
      expect(repos.automationVariables).toBeInstanceOf(ChromeStorageAutomationVariablesRepository);
      expect(repos.website).toBeInstanceOf(ChromeStorageWebsiteRepository);
      expect(repos.xpath).toBeInstanceOf(ChromeStorageXPathRepository);
    });

    it('should allow factory to be used for dependency injection', () => {
      const factory = new RepositoryFactory({
        mode: 'secure',
        secureStorage: mockSecureStorage,
      });

      // Simulating DI container
      const container = {
        automationVariablesRepository: factory.createAutomationVariablesRepository(),
        websiteRepository: factory.createWebsiteRepository(),
        xpathRepository: factory.createXPathRepository(),
        systemSettingsRepository: factory.createSystemSettingsRepository(),
      };

      expect(container.automationVariablesRepository).toBeInstanceOf(
        SecureAutomationVariablesRepository
      );
      expect(container.websiteRepository).toBeInstanceOf(SecureWebsiteRepository);
      expect(container.xpathRepository).toBeInstanceOf(SecureXPathRepository);
      expect(container.systemSettingsRepository).toBeInstanceOf(SecureSystemSettingsRepository);
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing process.env gracefully', () => {
      // Simulate browser environment without process.env
      const originalProcess = global.process;
      (global as any).process = undefined;

      const factory = new RepositoryFactory();

      expect(factory.getMode()).toBe('chrome'); // Should default to chrome

      // Restore process
      global.process = originalProcess;
    });

    it('should handle ENCRYPTION_ENABLED with unexpected values', () => {
      process.env.ENCRYPTION_ENABLED = 'yes'; // Not 'true'

      const factory = new RepositoryFactory();

      expect(factory.getMode()).toBe('chrome'); // Should default to chrome
    });

    it('should allow secureStorage to be provided in chrome mode', () => {
      // SecureStorage provided but mode is chrome (secureStorage is ignored)
      const factory = new RepositoryFactory({
        mode: 'chrome',
        secureStorage: mockSecureStorage,
      });

      const repository = factory.createWebsiteRepository();

      expect(repository).toBeInstanceOf(ChromeStorageWebsiteRepository);
      expect(factory.getMode()).toBe('chrome');
    });
  });
});

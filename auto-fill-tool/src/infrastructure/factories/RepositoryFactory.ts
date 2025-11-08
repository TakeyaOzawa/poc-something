/**
 * Infrastructure: Repository Factory
 * Creates appropriate repositories based on encryption mode
 *
 * Factory Pattern:
 * - Provides centralized repository creation
 * - Supports both Secure (encrypted) and ChromeStorage (unencrypted) implementations
 * - Uses dependency injection for SecureStorage
 * - Environment-based or explicit mode selection
 */

import { AutomationVariablesRepository } from '@domain/repositories/AutomationVariablesRepository';
import { WebsiteRepository } from '@domain/repositories/WebsiteRepository';
import { XPathRepository } from '@domain/repositories/XPathRepository';
import { SystemSettingsRepository } from '@domain/repositories/SystemSettingsRepository';
import { AutomationResultRepository } from '@domain/repositories/AutomationResultRepository';
import { StorageSyncConfigRepository } from '@domain/repositories/StorageSyncConfigRepository';
import { SecureStorage } from '@domain/types/secure-storage-port.types';
import { IdGenerator } from '@domain/types/id-generator.types';
import { Factory } from '@domain/factories/Factory';

// Secure implementations
import { SecureAutomationVariablesRepository } from '@infrastructure/repositories/SecureAutomationVariablesRepository';
import { SecureWebsiteRepository } from '@infrastructure/repositories/SecureWebsiteRepository';
import { SecureXPathRepository } from '@infrastructure/repositories/SecureXPathRepository';
import { SecureSystemSettingsRepository } from '@infrastructure/repositories/SecureSystemSettingsRepository';

// ChromeStorage implementations
import { ChromeStorageAutomationVariablesRepository } from '@infrastructure/repositories/ChromeStorageAutomationVariablesRepository';
import { ChromeStorageWebsiteRepository } from '@infrastructure/repositories/ChromeStorageWebsiteRepository';
import { ChromeStorageXPathRepository } from '@infrastructure/repositories/ChromeStorageXPathRepository';
import { ChromeStorageSystemSettingsRepository } from '@infrastructure/repositories/ChromeStorageSystemSettingsRepository';
import { ChromeStorageAutomationResultRepository } from '@infrastructure/repositories/ChromeStorageAutomationResultRepository';
import { ChromeStorageStorageSyncConfigRepository } from '@infrastructure/repositories/ChromeStorageStorageSyncConfigRepository';

// Logger
import { LoggerFactory } from '@infrastructure/loggers/LoggerFactory';
import { UuidIdGenerator } from '@infrastructure/adapters/UuidIdGenerator';

/**
 * Repository mode: Secure (encrypted) or ChromeStorage (unencrypted)
 */
export type RepositoryMode = 'secure' | 'chrome';

/**
 * Factory configuration
 */
export interface RepositoryFactoryConfig {
  /**
   * Repository mode (secure or chrome)
   * If not specified, determined by environment variable ENCRYPTION_ENABLED
   */
  mode?: RepositoryMode;

  /**
   * SecureStorage instance (required for secure mode)
   */
  secureStorage?: SecureStorage;

  /**
   * IdGenerator instance (optional, defaults to UuidIdGenerator)
   */
  idGenerator?: IdGenerator;
}

/**
 * Repository Factory
 *
 * Usage:
 * ```typescript
 * // Environment-based (checks ENCRYPTION_ENABLED env var)
 * const factory = new RepositoryFactory({ secureStorage });
 *
 * // Explicit mode
 * const factory = new RepositoryFactory({ mode: 'secure', secureStorage });
 *
 * // Create repositories
 * const automationRepo = factory.createAutomationVariablesRepository();
 * const websiteRepo = factory.createWebsiteRepository();
 * ```
 */
export class RepositoryFactory implements Factory<unknown> {
  private readonly mode: RepositoryMode;
  private readonly secureStorage?: SecureStorage;
  private readonly idGenerator: IdGenerator;

  /**
   * Creates a new RepositoryFactory instance
   *
   * @param config - Factory configuration
   * @throws Error if secure mode is selected but secureStorage is not provided
   */
  constructor(config: RepositoryFactoryConfig = {}) {
    // Determine mode
    this.mode = config.mode || this.getDefaultMode();

    if (config.secureStorage !== undefined) {
      this.secureStorage = config.secureStorage;
    }

    // Initialize IdGenerator
    this.idGenerator = config.idGenerator || new UuidIdGenerator();

    // Validate configuration
    if (this.mode === 'secure' && !this.secureStorage) {
      throw new Error(
        'RepositoryFactory: secureStorage is required when using secure mode. ' +
          'Please provide secureStorage in the factory configuration.'
      );
    }
  }

  /**
   * Get default repository mode from environment
   *
   * Checks ENCRYPTION_ENABLED environment variable:
   * - 'true' → secure mode
   * - 'false' or undefined → chrome mode
   */
  private getDefaultMode(): RepositoryMode {
    // In browser environment, we might not have process.env
    // Default to 'chrome' mode for safety
    if (typeof process === 'undefined' || !process.env) {
      return 'chrome';
    }

    return process.env.ENCRYPTION_ENABLED === 'true' ? 'secure' : 'chrome';
  }

  /**
   * Get current repository mode
   */
  getMode(): RepositoryMode {
    return this.mode;
  }

  /**
   * Check if factory is in secure mode
   */
  isSecureMode(): boolean {
    return this.mode === 'secure';
  }

  /**
   * Get IdGenerator instance
   */
  getIdGenerator(): IdGenerator {
    return this.idGenerator;
  }

  /**
   * Create AutomationVariablesRepository
   *
   * @returns AutomationVariablesRepository instance (Secure or ChromeStorage)
   */
  createAutomationVariablesRepository(): AutomationVariablesRepository {
    if (this.mode === 'secure') {
      return new SecureAutomationVariablesRepository(this.secureStorage!);
    }
    const logger = LoggerFactory.createLogger('AutomationVariablesRepository');
    return new ChromeStorageAutomationVariablesRepository(logger);
  }

  /**
   * Create WebsiteRepository
   *
   * @returns WebsiteRepository instance (Secure or ChromeStorage)
   */
  createWebsiteRepository(): WebsiteRepository {
    if (this.mode === 'secure') {
      return new SecureWebsiteRepository(this.secureStorage!);
    }
    const logger = LoggerFactory.createLogger('WebsiteRepository');
    return new ChromeStorageWebsiteRepository(logger);
  }

  /**
   * Create XPathRepository
   *
   * @returns XPathRepository instance (Secure or ChromeStorage)
   */
  createXPathRepository(): XPathRepository {
    if (this.mode === 'secure') {
      return new SecureXPathRepository(this.secureStorage!);
    }
    const logger = LoggerFactory.createLogger('XPathRepository');
    return new ChromeStorageXPathRepository(logger);
  }

  /**
   * Create SystemSettingsRepository
   *
   * @returns SystemSettingsRepository instance (Secure or ChromeStorage)
   */
  createSystemSettingsRepository(): SystemSettingsRepository {
    if (this.mode === 'secure') {
      return new SecureSystemSettingsRepository(this.secureStorage!);
    }
    const logger = LoggerFactory.createLogger('SystemSettingsRepository');
    return new ChromeStorageSystemSettingsRepository(logger);
  }

  /**
   * Create AutomationResultRepository
   *
   * Note: Only ChromeStorage implementation exists.
   * AutomationResult is transient data and doesn't require encryption.
   *
   * @returns AutomationResultRepository instance (ChromeStorage only)
   */
  createAutomationResultRepository(): AutomationResultRepository {
    // AutomationResult is always ChromeStorage (no secure version)
    // Results are transient and don't contain sensitive data
    const logger = LoggerFactory.createLogger('AutomationResultRepository');
    return new ChromeStorageAutomationResultRepository(logger);
  }

  /**
   * Create StorageSyncConfigRepository
   *
   * Note: Only ChromeStorage implementation exists.
   * Storage sync config is used for configuration and doesn't require encryption.
   *
   * @returns StorageSyncConfigRepository instance (ChromeStorage only)
   */
  createStorageSyncConfigRepository(): StorageSyncConfigRepository {
    // StorageSyncConfig is always ChromeStorage (no secure version)
    // Configuration data doesn't require encryption
    const logger = LoggerFactory.createLogger('StorageSyncConfigRepository');
    return new ChromeStorageStorageSyncConfigRepository(logger);
  }

  /**
   * Create all repositories at once
   *
   * Useful for dependency injection containers
   *
   * @returns Object containing all repository instances
   */
  createAllRepositories() {
    return {
      automationVariables: this.createAutomationVariablesRepository(),
      website: this.createWebsiteRepository(),
      xpath: this.createXPathRepository(),
      systemSettings: this.createSystemSettingsRepository(),
      automationResult: this.createAutomationResultRepository(),
      storageSyncConfig: this.createStorageSyncConfigRepository(),
    };
  }

  /**
   * Factory実装: リポジトリタイプに応じてリポジトリを生成
   * 
   * @param repositoryType リポジトリタイプ
   * @returns 対応するリポジトリインスタンス
   */
  create(repositoryType: string): unknown {
    switch (repositoryType) {
      case 'automationVariables':
        return this.createAutomationVariablesRepository();
      case 'website':
        return this.createWebsiteRepository();
      case 'xpath':
        return this.createXPathRepository();
      case 'systemSettings':
        return this.createSystemSettingsRepository();
      case 'automationResult':
        return this.createAutomationResultRepository();
      case 'storageSyncConfig':
        return this.createStorageSyncConfigRepository();
      default:
        throw new Error(`Unknown repository type: ${repositoryType}`);
    }
  }
}

/**
 * Singleton factory instance for global access
 *
 * Usage:
 * ```typescript
 * import { repositoryFactory } from '@infrastructure/factories/RepositoryFactory';
 *
 * const repo = repositoryFactory.createWebsiteRepository();
 * ```
 *
 * Note: Must be initialized before use with setGlobalFactory()
 */
let globalFactory: RepositoryFactory | null = null;

/**
 * Set global repository factory instance
 *
 * Should be called during application initialization
 *
 * @param factory - RepositoryFactory instance
 */
export function setGlobalFactory(factory: RepositoryFactory): void {
  globalFactory = factory;
}

/**
 * Get global repository factory instance
 *
 * @throws Error if global factory is not initialized
 */
export function getGlobalFactory(): RepositoryFactory {
  if (!globalFactory) {
    throw new Error(
      'RepositoryFactory: Global factory not initialized. ' +
        'Call setGlobalFactory() during application initialization.'
    );
  }
  return globalFactory;
}

/**
 * Reset global repository factory instance
 *
 * Useful for testing - clears the global factory
 */
export function resetGlobalFactory(): void {
  globalFactory = null;
}

/**
 * Singleton accessor for convenience
 *
 * @deprecated Use dependency injection instead of global singleton when possible
 */
export const repositoryFactory = {
  get instance(): RepositoryFactory {
    return getGlobalFactory();
  },
};

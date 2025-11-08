/**
 * Use Case: Migrate to Secure Storage
 * Migrates existing plaintext data to encrypted storage
 * Provides backup and rollback functionality
 */

import { SecureStorage } from '@domain/types/secure-storage-port.types';
import { STORAGE_KEYS } from '@domain/constants/StorageKeys';
import { Result } from '@domain/values/result.value';
import browser from 'webextension-polyfill';

export interface MigrationResult {
  migratedKeys: string[];
  skippedKeys: string[];
  backupCreated: boolean;
  backupKey: string | null;
}

export interface MigrationBackup {
  timestamp: string;
  data: Record<string, any>;
  version: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- Empty input interface for consistency with other UseCases
export interface MigrateToSecureStorageInput {}

export class MigrateToSecureStorageUseCase {
  private static readonly BACKUP_KEY_PREFIX = '_migration_backup_';
  private static readonly MIGRATION_FLAG_KEY = '_secure_storage_migrated';
  private static readonly MIGRATION_VERSION = '1.0.0';

  constructor(private secureStorage: SecureStorage) {}

  /**
   * Execute migration from plaintext to encrypted storage
   * Returns Result with migration details
   */
  async execute(
    _input: MigrateToSecureStorageInput = {}
  ): Promise<Result<MigrationResult, string>> {
    try {
      const preconditionError = await this.validateMigrationPreconditions();
      if (preconditionError) {
        return preconditionError;
      }

      const existingData = await this.readPlaintextData();
      const keysWithData = Object.keys(existingData).filter(
        (key) => existingData[key] !== undefined
      );

      if (keysWithData.length === 0) {
        return await this.handleNoDataMigration();
      }

      const backupKey = await this.createBackup(existingData);
      return await this.performMigration(existingData, backupKey);
    } catch (error) {
      return Result.failure(
        `Migration failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private async validateMigrationPreconditions(): Promise<Result<MigrationResult, string> | null> {
    const alreadyMigrated = await this.isMigrated();
    if (alreadyMigrated) {
      return Result.failure('Migration already completed', {
        migratedKeys: [],
        skippedKeys: Object.values(STORAGE_KEYS),
        backupCreated: false,
        backupKey: null,
      });
    }

    if (!this.secureStorage.isUnlocked()) {
      return Result.failure('Storage must be unlocked before migration');
    }

    return null;
  }

  private async handleNoDataMigration(): Promise<Result<MigrationResult, string>> {
    await this.markAsMigrated();
    return Result.success({
      migratedKeys: [],
      skippedKeys: Object.values(STORAGE_KEYS),
      backupCreated: false,
      backupKey: null,
    });
  }

  private async performMigration(
    existingData: Record<string, any>,
    backupKey: string
  ): Promise<Result<MigrationResult, string>> {
    const migratedKeys: string[] = [];
    const skippedKeys: string[] = [];

    for (const [key, value] of Object.entries(existingData)) {
      if (value === undefined) {
        skippedKeys.push(key);
        continue;
      }

      try {
        await this.secureStorage.saveEncrypted(key, value);
        migratedKeys.push(key);
      } catch (error) {
        await this.rollback(backupKey);
        return Result.failure(
          `Migration failed for key "${key}": ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    await this.removePlaintextData(migratedKeys);
    await this.markAsMigrated();

    return Result.success({
      migratedKeys,
      skippedKeys,
      backupCreated: true,
      backupKey,
    });
  }

  /**
   * Check if migration has already been completed
   */
  async isMigrated(): Promise<boolean> {
    const result = await browser.storage.local.get(
      MigrateToSecureStorageUseCase.MIGRATION_FLAG_KEY
    );
    return result[MigrateToSecureStorageUseCase.MIGRATION_FLAG_KEY] === true;
  }

  /**
   * Read existing plaintext data from storage
   */
  private async readPlaintextData(): Promise<Record<string, any>> {
    const storageKeys = Object.values(STORAGE_KEYS);
    const result = await browser.storage.local.get(storageKeys);
    return result;
  }

  /**
   * Create backup of existing data
   * Returns backup key for later rollback
   */
  private async createBackup(data: Record<string, any>): Promise<string> {
    const timestamp = new Date().toISOString();
    const backupKey = `${MigrateToSecureStorageUseCase.BACKUP_KEY_PREFIX}${timestamp}`;

    const backup: MigrationBackup = {
      timestamp,
      data,
      version: MigrateToSecureStorageUseCase.MIGRATION_VERSION,
    };

    await browser.storage.local.set({ [backupKey]: backup });
    return backupKey;
  }

  /**
   * Rollback to backup if migration fails
   */
  async rollback(backupKey: string): Promise<Result<void, string>> {
    try {
      // Load backup
      const result = await browser.storage.local.get(backupKey);
      const backup = result[backupKey] as MigrationBackup | undefined;

      if (!backup) {
        return Result.failure(`Backup not found: ${backupKey}`);
      }

      // Restore plaintext data
      await browser.storage.local.set(backup.data);

      // Remove encrypted data
      const storageKeys = Object.values(STORAGE_KEYS);
      for (const key of storageKeys) {
        try {
          await this.secureStorage.removeEncrypted(key);
        } catch {
          // Ignore errors during cleanup
        }
      }

      // Remove migration flag
      await browser.storage.local.remove(MigrateToSecureStorageUseCase.MIGRATION_FLAG_KEY);

      // Keep backup for manual inspection
      return Result.success(undefined);
    } catch (error) {
      return Result.failure(
        `Rollback failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Remove plaintext data after successful migration
   */
  private async removePlaintextData(keys: string[]): Promise<void> {
    await browser.storage.local.remove(keys);
  }

  /**
   * Mark migration as complete
   */
  private async markAsMigrated(): Promise<void> {
    await browser.storage.local.set({
      [MigrateToSecureStorageUseCase.MIGRATION_FLAG_KEY]: true,
    });
  }

  /**
   * List all available backups
   */
  async listBackups(): Promise<string[]> {
    const allKeys = await browser.storage.local.get(null);
    return Object.keys(allKeys).filter((key) =>
      key.startsWith(MigrateToSecureStorageUseCase.BACKUP_KEY_PREFIX)
    );
  }

  /**
   * Remove old backups (keep only the most recent N backups)
   */
  async cleanupOldBackups(keepCount: number = 3): Promise<number> {
    const backups = await this.listBackups();

    if (backups.length <= keepCount) {
      return 0;
    }

    // Sort by timestamp (oldest first)
    const sortedBackups = backups.sort();

    // Remove oldest backups
    const toRemove = sortedBackups.slice(0, backups.length - keepCount);
    await browser.storage.local.remove(toRemove);

    return toRemove.length;
  }

  /**
   * Get backup data for inspection
   */
  async getBackup(backupKey: string): Promise<MigrationBackup | null> {
    const result = await browser.storage.local.get(backupKey);
    return (result[backupKey] as MigrationBackup) || null;
  }

  /**
   * Manually restore from a specific backup
   * WARNING: This will overwrite current encrypted data
   */
  async restoreFromBackup(backupKey: string): Promise<Result<void, string>> {
    try {
      const backup = await this.getBackup(backupKey);

      if (!backup) {
        return Result.failure(`Backup not found: ${backupKey}`);
      }

      // Restore plaintext data
      await browser.storage.local.set(backup.data);

      // Remove encrypted data
      const storageKeys = Object.values(STORAGE_KEYS);
      for (const key of storageKeys) {
        try {
          await this.secureStorage.removeEncrypted(key);
        } catch {
          // Ignore errors
        }
      }

      // Remove migration flag to allow re-migration
      await browser.storage.local.remove(MigrateToSecureStorageUseCase.MIGRATION_FLAG_KEY);

      return Result.success(undefined);
    } catch (error) {
      return Result.failure(
        `Restore failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}

/**
 * MigrateToSecureStorageUseCase Tests
 * Tests for data migration from plaintext to encrypted storage
 */

import { MigrateToSecureStorageUseCase, MigrationBackup } from '../MigrateToSecureStorageUseCase';
import { MockSecureStorage } from '@tests/helpers/MockSecureStorage';
import { STORAGE_KEYS } from '@domain/constants/StorageKeys';
import browser from 'webextension-polyfill';

describe('MigrateToSecureStorageUseCase', () => {
  let mockStorage: MockSecureStorage;
  let useCase: MigrateToSecureStorageUseCase;
  let mockBrowserStorage: Map<string, any>;

  beforeEach(() => {
    mockStorage = new MockSecureStorage();
    useCase = new MigrateToSecureStorageUseCase(mockStorage);

    // Setup mock browser.storage.local
    mockBrowserStorage = new Map<string, any>();

    (browser.storage.local.get as any) = jest.fn((keys: string[] | string | null) => {
      if (keys === null) {
        return Promise.resolve(Object.fromEntries(mockBrowserStorage));
      }

      const keysArray = Array.isArray(keys) ? keys : [keys];
      const result: Record<string, any> = {};

      for (const key of keysArray) {
        if (mockBrowserStorage.has(key)) {
          result[key] = mockBrowserStorage.get(key);
        }
      }

      return Promise.resolve(result);
    });

    (browser.storage.local.set as any) = jest.fn((items: Record<string, any>) => {
      for (const [key, value] of Object.entries(items)) {
        mockBrowserStorage.set(key, value);
      }
      return Promise.resolve();
    });

    (browser.storage.local.remove as any) = jest.fn((keys: string | string[]) => {
      const keysArray = Array.isArray(keys) ? keys : [keys];
      for (const key of keysArray) {
        mockBrowserStorage.delete(key);
      }
      return Promise.resolve();
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    mockBrowserStorage.clear();
  });

  describe('migration not needed', () => {
    it('should skip migration if already migrated', async () => {
      // Mark as already migrated
      mockBrowserStorage.set('_secure_storage_migrated', true);

      const result = await useCase.execute();

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Migration already completed');
      expect(result.data?.migratedKeys).toEqual([]);
      expect(result.data?.backupCreated).toBe(false);
    });

    it('should skip migration if storage is locked', async () => {
      mockStorage.setUnlocked(false);
      mockBrowserStorage.set(STORAGE_KEYS.XPATH_COLLECTION, { some: 'data' });

      const result = await useCase.execute();

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Storage must be unlocked');
    });

    it('should complete migration successfully with no data', async () => {
      mockStorage.setUnlocked(true);

      const result = await useCase.execute();

      expect(result.isSuccess).toBe(true);
      expect(result.value?.migratedKeys).toEqual([]);
      expect(result.value?.backupCreated).toBe(false);
      expect(await useCase.isMigrated()).toBe(true);
    });
  });

  describe('migration success', () => {
    beforeEach(() => {
      mockStorage.setUnlocked(true);
    });

    it('should migrate single storage key', async () => {
      const testData = { id: '1', value: 'test' };
      mockBrowserStorage.set(STORAGE_KEYS.XPATH_COLLECTION, testData);

      const result = await useCase.execute();

      expect(result.isSuccess).toBe(true);
      expect(result.value?.migratedKeys).toEqual([STORAGE_KEYS.XPATH_COLLECTION]);
      expect(result.value?.backupCreated).toBe(true);
      expect(result.value?.backupKey).toBeDefined();
    });

    it('should migrate all storage keys', async () => {
      const testData = {
        [STORAGE_KEYS.XPATH_COLLECTION]: { xpath: 'data' },
        [STORAGE_KEYS.WEBSITE_CONFIGS]: [{ id: '1' }],
        [STORAGE_KEYS.SYSTEM_SETTINGS]: { enabled: true },
        [STORAGE_KEYS.AUTOMATION_VARIABLES]: [{ id: 'var1' }],
        [STORAGE_KEYS.AUTOMATION_RESULTS]: [{ id: 'result1' }],
        [STORAGE_KEYS.STORAGE_SYNC_CONFIGS]: { syncEnabled: true },
      };

      for (const [key, value] of Object.entries(testData)) {
        mockBrowserStorage.set(key, value);
      }

      const result = await useCase.execute();

      expect(result.isSuccess).toBe(true);
      expect(result.value?.migratedKeys.sort()).toEqual(Object.values(STORAGE_KEYS).sort());
      expect(result.value?.skippedKeys).toEqual([]);
      expect(result.value?.backupCreated).toBe(true);
    });

    it('should create backup before migration', async () => {
      const testData = { xpath: 'data' };
      mockBrowserStorage.set(STORAGE_KEYS.XPATH_COLLECTION, testData);

      const result = await useCase.execute();

      expect(result.isSuccess).toBe(true);
      const backupKey = result.value?.backupKey;
      expect(backupKey).toBeDefined();

      const backup = await useCase.getBackup(backupKey!);
      expect(backup).toBeDefined();
      expect(backup?.data[STORAGE_KEYS.XPATH_COLLECTION]).toEqual(testData);
      expect(backup?.version).toBe('1.0.0');
    });

    it('should remove plaintext data after migration', async () => {
      const testData = { xpath: 'data' };
      mockBrowserStorage.set(STORAGE_KEYS.XPATH_COLLECTION, testData);

      await useCase.execute();

      // Plaintext data should be removed
      expect(mockBrowserStorage.has(STORAGE_KEYS.XPATH_COLLECTION)).toBe(false);
    });

    it('should mark migration as complete', async () => {
      mockBrowserStorage.set(STORAGE_KEYS.XPATH_COLLECTION, { xpath: 'data' });

      await useCase.execute();

      expect(await useCase.isMigrated()).toBe(true);
    });

    it('should encrypt data during migration', async () => {
      const testData = { xpath: 'data', nested: { value: 123 } };
      mockBrowserStorage.set(STORAGE_KEYS.XPATH_COLLECTION, testData);

      await useCase.execute();

      // Verify saveEncrypted was called with correct data (no manual stringification)
      expect(mockStorage.saveEncrypted).toHaveBeenCalledWith(
        STORAGE_KEYS.XPATH_COLLECTION,
        testData
      );
    });
  });

  describe('migration failure and rollback', () => {
    beforeEach(() => {
      mockStorage.setUnlocked(true);
    });

    it('should rollback on encryption failure', async () => {
      const testData = { xpath: 'data' };
      mockBrowserStorage.set(STORAGE_KEYS.XPATH_COLLECTION, testData);

      // Make encryption fail
      mockStorage.saveEncrypted = jest.fn().mockRejectedValue(new Error('Encryption failed'));

      const result = await useCase.execute();

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Migration failed');
      expect(result.error).toContain('Encryption failed');

      // Plaintext data should be restored
      expect(mockBrowserStorage.has(STORAGE_KEYS.XPATH_COLLECTION)).toBe(true);
      expect(mockBrowserStorage.get(STORAGE_KEYS.XPATH_COLLECTION)).toEqual(testData);
    });

    it('should rollback multiple keys on failure', async () => {
      const testData = {
        [STORAGE_KEYS.XPATH_COLLECTION]: { xpath: 'data' },
        [STORAGE_KEYS.WEBSITE_CONFIGS]: [{ id: '1' }],
        [STORAGE_KEYS.SYSTEM_SETTINGS]: { enabled: true },
      };

      for (const [key, value] of Object.entries(testData)) {
        mockBrowserStorage.set(key, value);
      }

      // Make second encryption fail
      let callCount = 0;
      mockStorage.saveEncrypted = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 2) {
          return Promise.reject(new Error('Encryption failed'));
        }
        return Promise.resolve();
      });

      const result = await useCase.execute();

      expect(result.isFailure).toBe(true);

      // All plaintext data should be restored
      for (const [key, value] of Object.entries(testData)) {
        expect(mockBrowserStorage.get(key)).toEqual(value);
      }
    });

    it('should keep backup after rollback', async () => {
      const testData = { xpath: 'data' };
      mockBrowserStorage.set(STORAGE_KEYS.XPATH_COLLECTION, testData);

      mockStorage.saveEncrypted = jest.fn().mockRejectedValue(new Error('Encryption failed'));

      await useCase.execute();

      // Backup should still exist
      const backups = await useCase.listBackups();
      expect(backups.length).toBeGreaterThan(0);
    });

    it('should not mark as migrated on failure', async () => {
      const testData = { xpath: 'data' };
      mockBrowserStorage.set(STORAGE_KEYS.XPATH_COLLECTION, testData);

      mockStorage.saveEncrypted = jest.fn().mockRejectedValue(new Error('Encryption failed'));

      await useCase.execute();

      expect(await useCase.isMigrated()).toBe(false);
    });
  });

  describe('backup management', () => {
    beforeEach(() => {
      mockStorage.setUnlocked(true);
    });

    it('should list all backups', async () => {
      // Create multiple migrations/backups
      for (let i = 0; i < 3; i++) {
        mockBrowserStorage.set(STORAGE_KEYS.XPATH_COLLECTION, { data: i });
        mockBrowserStorage.delete('_secure_storage_migrated'); // Allow re-migration
        await useCase.execute();
        // Add small delay to ensure different timestamps
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      const backups = await useCase.listBackups();
      expect(backups.length).toBeGreaterThanOrEqual(3);
    });

    it('should get backup data', async () => {
      const testData = { xpath: 'data' };
      mockBrowserStorage.set(STORAGE_KEYS.XPATH_COLLECTION, testData);

      const result = await useCase.execute();
      const backupKey = result.value?.backupKey;

      const backup = await useCase.getBackup(backupKey!);
      expect(backup).toBeDefined();
      expect(backup?.data[STORAGE_KEYS.XPATH_COLLECTION]).toEqual(testData);
      expect(backup?.timestamp).toBeDefined();
      expect(backup?.version).toBe('1.0.0');
    });

    it('should return null for non-existent backup', async () => {
      const backup = await useCase.getBackup('non_existent_key');
      expect(backup).toBeNull();
    });

    it('should cleanup old backups', async () => {
      // Create 5 backups
      for (let i = 0; i < 5; i++) {
        mockBrowserStorage.set(STORAGE_KEYS.XPATH_COLLECTION, { data: i });
        mockBrowserStorage.delete('_secure_storage_migrated');
        await useCase.execute();
        // Add small delay to ensure different timestamps
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      const initialBackups = await useCase.listBackups();
      expect(initialBackups.length).toBe(5);

      // Cleanup, keeping only 3 most recent
      const removed = await useCase.cleanupOldBackups(3);
      expect(removed).toBe(2);

      const remainingBackups = await useCase.listBackups();
      expect(remainingBackups.length).toBe(3);
    });

    it('should not remove backups if count is below threshold', async () => {
      // Create 2 backups
      for (let i = 0; i < 2; i++) {
        mockBrowserStorage.set(STORAGE_KEYS.XPATH_COLLECTION, { data: i });
        mockBrowserStorage.delete('_secure_storage_migrated');
        await useCase.execute();
        // Add small delay to ensure different timestamps
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      const removed = await useCase.cleanupOldBackups(3);
      expect(removed).toBe(0);

      const backups = await useCase.listBackups();
      expect(backups.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('manual restore', () => {
    beforeEach(() => {
      mockStorage.setUnlocked(true);
    });

    it('should restore from backup', async () => {
      const testData = { xpath: 'original_data' };
      mockBrowserStorage.set(STORAGE_KEYS.XPATH_COLLECTION, testData);

      // Perform migration
      const migrationResult = await useCase.execute();
      const backupKey = migrationResult.value?.backupKey;

      // Plaintext should be gone
      expect(mockBrowserStorage.has(STORAGE_KEYS.XPATH_COLLECTION)).toBe(false);

      // Restore from backup
      const restoreResult = await useCase.restoreFromBackup(backupKey!);

      expect(restoreResult.isSuccess).toBe(true);
      // Plaintext should be restored
      expect(mockBrowserStorage.get(STORAGE_KEYS.XPATH_COLLECTION)).toEqual(testData);
      // Migration flag should be removed
      expect(await useCase.isMigrated()).toBe(false);
    });

    it('should fail to restore from non-existent backup', async () => {
      const result = await useCase.restoreFromBackup('non_existent_key');

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Backup not found');
    });

    it('should remove encrypted data on restore', async () => {
      mockBrowserStorage.set(STORAGE_KEYS.XPATH_COLLECTION, { xpath: 'data' });

      const migrationResult = await useCase.execute();
      const backupKey = migrationResult.value?.backupKey;

      // Verify encrypted data exists
      expect(mockStorage.saveEncrypted).toHaveBeenCalled();

      // Restore
      await useCase.restoreFromBackup(backupKey!);

      // removeEncrypted should have been called
      expect(mockStorage.removeEncrypted).toHaveBeenCalled();
    });
  });

  describe('rollback functionality', () => {
    beforeEach(() => {
      mockStorage.setUnlocked(true);
    });

    it('should successfully rollback migration', async () => {
      const testData = { xpath: 'data' };
      mockBrowserStorage.set(STORAGE_KEYS.XPATH_COLLECTION, testData);

      const migrationResult = await useCase.execute();
      const backupKey = migrationResult.value?.backupKey;
      expect(backupKey).toBeDefined();

      // Manually trigger rollback
      const rollbackResult = await useCase.rollback(backupKey as string);

      expect(rollbackResult.isSuccess).toBe(true);
      // Plaintext should be restored
      expect(mockBrowserStorage.get(STORAGE_KEYS.XPATH_COLLECTION)).toEqual(testData);
      // Migration flag should be removed
      expect(await useCase.isMigrated()).toBe(false);
    });

    it('should fail rollback with invalid backup key', async () => {
      const result = await useCase.rollback('invalid_key');

      expect(result.isFailure).toBe(true);
      expect(result.error).toContain('Backup not found');
    });

    it('should clean up encrypted data on rollback', async () => {
      const testData = { xpath: 'data' };
      mockBrowserStorage.set(STORAGE_KEYS.XPATH_COLLECTION, testData);

      const migrationResult = await useCase.execute();
      const backupKey = migrationResult.value?.backupKey;
      expect(backupKey).toBeDefined();

      await useCase.rollback(backupKey as string);

      // removeEncrypted should have been called for all keys
      expect(mockStorage.removeEncrypted).toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    beforeEach(() => {
      mockStorage.setUnlocked(true);
    });

    it('should handle mixed data types', async () => {
      const testData = {
        [STORAGE_KEYS.XPATH_COLLECTION]: { xpath: 'string' },
        [STORAGE_KEYS.WEBSITE_CONFIGS]: [1, 2, 3],
        [STORAGE_KEYS.SYSTEM_SETTINGS]: true,
        [STORAGE_KEYS.AUTOMATION_VARIABLES]: null,
      };

      for (const [key, value] of Object.entries(testData)) {
        mockBrowserStorage.set(key, value);
      }

      const result = await useCase.execute();

      expect(result.isSuccess).toBe(true);
      expect(result.value?.migratedKeys.length).toBe(4);
    });

    it('should handle empty objects and arrays', async () => {
      const testData = {
        [STORAGE_KEYS.XPATH_COLLECTION]: {},
        [STORAGE_KEYS.WEBSITE_CONFIGS]: [],
      };

      for (const [key, value] of Object.entries(testData)) {
        mockBrowserStorage.set(key, value);
      }

      const result = await useCase.execute();

      expect(result.isSuccess).toBe(true);
      expect(result.value?.migratedKeys.length).toBe(2);
    });

    it('should skip undefined values', async () => {
      mockBrowserStorage.set(STORAGE_KEYS.XPATH_COLLECTION, { xpath: 'data' });
      // WEBSITE_CONFIGS is undefined (not set) - won't be returned by storage.get()

      const result = await useCase.execute();

      expect(result.isSuccess).toBe(true);
      expect(result.value?.migratedKeys).toContain(STORAGE_KEYS.XPATH_COLLECTION);
      expect(result.value?.migratedKeys).not.toContain(STORAGE_KEYS.WEBSITE_CONFIGS);
      // Only keys present in storage are migrated
      expect(result.value?.migratedKeys.length).toBe(1);
      // Skipped keys only includes keys with explicit undefined values
      // Keys not in storage won't appear in either list
    });

    it('should handle large data sets', async () => {
      const largeArray = Array.from({ length: 1000 }, (_, i) => ({ id: i, value: `value${i}` }));
      mockBrowserStorage.set(STORAGE_KEYS.AUTOMATION_RESULTS, largeArray);

      const result = await useCase.execute();

      expect(result.isSuccess).toBe(true);
      expect(result.value?.migratedKeys).toContain(STORAGE_KEYS.AUTOMATION_RESULTS);
    });

    it('should handle nested objects', async () => {
      const nestedData = {
        level1: {
          level2: {
            level3: {
              value: 'deep',
            },
          },
        },
      };
      mockBrowserStorage.set(STORAGE_KEYS.SYSTEM_SETTINGS, nestedData);

      const result = await useCase.execute();

      expect(result.isSuccess).toBe(true);
      expect(result.value?.migratedKeys).toContain(STORAGE_KEYS.SYSTEM_SETTINGS);
    });
  });

  describe('concurrent operations', () => {
    beforeEach(() => {
      mockStorage.setUnlocked(true);
    });

    it('should handle sequential migrations', async () => {
      mockBrowserStorage.set(STORAGE_KEYS.XPATH_COLLECTION, { data: 1 });

      const result1 = await useCase.execute();
      expect(result1.isSuccess).toBe(true);

      // Second migration should fail (already migrated)
      const result2 = await useCase.execute();
      expect(result2.isFailure).toBe(true);
      expect(result2.error).toContain('already completed');
    });

    it('should handle concurrent migrations gracefully', async () => {
      mockBrowserStorage.set(STORAGE_KEYS.XPATH_COLLECTION, { data: 1 });

      // Start two migrations simultaneously
      const [result1, result2] = await Promise.all([useCase.execute(), useCase.execute()]);

      // At least one should complete (both might succeed due to race condition)
      const successCount = [result1, result2].filter((r) => r.isSuccess).length;
      const failureCount = [result1, result2].filter((r) => r.isFailure).length;

      expect(successCount + failureCount).toBe(2);
      expect(successCount).toBeGreaterThan(0);
      // Note: Without distributed locking, both might succeed in test environment
    });
  });

  describe('migration status check', () => {
    it('should return false before migration', async () => {
      expect(await useCase.isMigrated()).toBe(false);
    });

    it('should return true after successful migration', async () => {
      mockStorage.setUnlocked(true);
      mockBrowserStorage.set(STORAGE_KEYS.XPATH_COLLECTION, { data: 'test' });

      await useCase.execute();

      expect(await useCase.isMigrated()).toBe(true);
    });

    it('should return false after rollback', async () => {
      mockStorage.setUnlocked(true);
      mockBrowserStorage.set(STORAGE_KEYS.XPATH_COLLECTION, { data: 'test' });

      const result = await useCase.execute();
      const backupKey = result.value?.backupKey;
      expect(backupKey).toBeDefined();

      await useCase.rollback(backupKey as string);

      expect(await useCase.isMigrated()).toBe(false);
    });
  });
});

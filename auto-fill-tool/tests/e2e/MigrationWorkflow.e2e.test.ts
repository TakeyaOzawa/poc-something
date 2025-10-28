/**
 * E2E Tests: Complete Migration Workflow
 * Tests the end-to-end flow of migrating from plaintext to encrypted storage
 */

import { SecureStorageAdapter } from '@infrastructure/adapters/SecureStorageAdapter';
import { WebCryptoAdapter } from '@infrastructure/adapters/CryptoAdapter';
import {
  LockoutManager as ILockoutManager,
  LockoutStorage,
  LockoutState,
} from '@domain/types/lockout-manager.types';
import { LockoutManager } from '@domain/services/LockoutManager';
import { MasterPasswordPolicy } from '@domain/entities/MasterPasswordPolicy';
import { InitializeMasterPasswordUseCase } from '@usecases/storage/InitializeMasterPasswordUseCase';
import { UnlockStorageUseCase } from '@usecases/storage/UnlockStorageUseCase';
import { LockStorageUseCase } from '@usecases/storage/LockStorageUseCase';
import { CheckUnlockStatusUseCase } from '@usecases/storage/CheckUnlockStatusUseCase';
import { MigrateToSecureStorageUseCase } from '@usecases/storage/MigrateToSecureStorageUseCase';
import { STORAGE_KEYS } from '@domain/constants/StorageKeys';
import browser from 'webextension-polyfill';
import { LogAggregatorPort } from '@domain/types/log-aggregator-port.types';
import { LogEntry } from '@domain/entities/LogEntry';

// Mock LockoutStorage implementation

class MockLockoutStorage implements LockoutStorage {
  async save(state: LockoutState): Promise<void> {
    (global as any).mockBrowserStorage.set('_lockoutState', state);
  }

  async load(): Promise<LockoutState | null> {
    return (global as any).mockBrowserStorage.get('_lockoutState') || null;
  }

  async clear(): Promise<void> {
    (global as any).mockBrowserStorage.delete('_lockoutState');
  }
}

// Mock LogAggregator implementation
class MockLogAggregator implements LogAggregatorPort {
  private logs: LogEntry[] = [];

  async addLog(log: LogEntry): Promise<void> {
    this.logs.push(log);
  }

  async getLogs(): Promise<LogEntry[]> {
    return this.logs;
  }

  async getLogCount(): Promise<number> {
    return this.logs.length;
  }

  async deleteOldLogs(retentionDays: number): Promise<number> {
    const count = this.logs.length;
    this.logs = [];
    return count;
  }

  async clearAllLogs(): Promise<void> {
    this.logs = [];
  }

  async deleteLog(id: string): Promise<boolean> {
    const index = this.logs.findIndex((log) => log.getId() === id);
    if (index !== -1) {
      this.logs.splice(index, 1);
      return true;
    }
    return false;
  }

  async applyRotation(maxLogs: number): Promise<number> {
    const removed = Math.max(0, this.logs.length - maxLogs);
    this.logs = this.logs.slice(-maxLogs);
    return removed;
  }
}

describe('E2E: Migration Workflow', () => {
  let secureStorage: SecureStorageAdapter;
  let lockoutManager: LockoutManager;
  let logAggregator: MockLogAggregator;
  let policy: MasterPasswordPolicy;
  let migrateUseCase: MigrateToSecureStorageUseCase;

  beforeEach(async () => {
    // Clear all mocks
    jest.clearAllMocks();

    // Clear global storage completely
    const storage = (global as any).mockBrowserStorage;
    if (storage && storage.clear) {
      storage.clear();
    }

    // Explicitly clear migration flag
    await browser.storage.local.remove('_secure_storage_migrated');

    // Initialize real implementations
    const cryptoAdapter = new WebCryptoAdapter();
    secureStorage = new SecureStorageAdapter(cryptoAdapter);
    await secureStorage.reset();

    const lockoutStorage = new MockLockoutStorage();
    logAggregator = new MockLogAggregator();
    lockoutManager = new LockoutManager(lockoutStorage, logAggregator, 5, 5 * 60 * 1000);
    await lockoutManager.initialize();

    policy = MasterPasswordPolicy.default();
    migrateUseCase = new MigrateToSecureStorageUseCase(secureStorage);
  });

  afterEach(async () => {
    (global as any).mockBrowserStorage.clear();
    await browser.storage.local.remove('_secure_storage_migrated');
    jest.clearAllMocks();
  });

  describe('Complete First-Time Setup with Migration', () => {
    it('should complete full flow: plaintext data → master password setup → migration → data access', async () => {
      // Step 1: Setup plaintext data (simulating existing extension data)
      const existingData = {
        [STORAGE_KEYS.XPATH_COLLECTION]: {
          elements: [
            { id: '1', xpath: '//input[@name="username"]', label: 'Username' },
            { id: '2', xpath: '//input[@name="password"]', label: 'Password' },
          ],
        },
        [STORAGE_KEYS.WEBSITE_CONFIGS]: [
          {
            id: 'site1',
            url: 'https://example.com',
            name: 'Example Site',
            enabled: true,
          },
        ],
        [STORAGE_KEYS.AUTOMATION_VARIABLES]: [
          { id: 'var1', name: 'username', value: 'testuser', type: 'string' },
          { id: 'var2', name: 'email', value: 'test@example.com', type: 'string' },
        ],
        [STORAGE_KEYS.SYSTEM_SETTINGS]: {
          theme: 'dark',
          autoFill: true,
          timeout: 30,
        },
      };

      await browser.storage.local.set(existingData);

      // Verify plaintext data exists
      const storedData = await browser.storage.local.get(Object.values(STORAGE_KEYS));
      expect(storedData[STORAGE_KEYS.XPATH_COLLECTION]).toEqual(
        existingData[STORAGE_KEYS.XPATH_COLLECTION]
      );
      expect(storedData[STORAGE_KEYS.WEBSITE_CONFIGS]).toEqual(
        existingData[STORAGE_KEYS.WEBSITE_CONFIGS]
      );

      // Step 2: Initialize master password (first-time setup)
      const masterPassword = 'SecurePass123!@#';
      const initUseCase = new InitializeMasterPasswordUseCase(secureStorage, policy);
      const initResult = await initUseCase.execute({
        password: masterPassword,
        confirmation: masterPassword,
      });

      expect(initResult.isSuccess).toBe(true);
      expect(secureStorage.isUnlocked()).toBe(true);

      // Step 3: Execute migration
      const migrationResult = await migrateUseCase.execute();

      expect(migrationResult.isSuccess).toBe(true);
      expect(migrationResult.value?.migratedKeys).toContain(STORAGE_KEYS.XPATH_COLLECTION);
      expect(migrationResult.value?.migratedKeys).toContain(STORAGE_KEYS.WEBSITE_CONFIGS);
      expect(migrationResult.value?.migratedKeys).toContain(STORAGE_KEYS.AUTOMATION_VARIABLES);
      expect(migrationResult.value?.migratedKeys).toContain(STORAGE_KEYS.SYSTEM_SETTINGS);
      expect(migrationResult.value?.backupCreated).toBe(true);
      expect(migrationResult.value?.backupKey).toBeDefined();

      // Step 4: Verify plaintext data is removed
      const afterMigration = await browser.storage.local.get(Object.values(STORAGE_KEYS));
      expect(afterMigration[STORAGE_KEYS.XPATH_COLLECTION]).toBeUndefined();
      expect(afterMigration[STORAGE_KEYS.WEBSITE_CONFIGS]).toBeUndefined();

      // Step 5: Verify encrypted data is accessible
      const decryptedXPath = await secureStorage.loadEncrypted<any>(STORAGE_KEYS.XPATH_COLLECTION);
      expect(decryptedXPath).toEqual(existingData[STORAGE_KEYS.XPATH_COLLECTION]);

      const decryptedWebsites = await secureStorage.loadEncrypted<any>(
        STORAGE_KEYS.WEBSITE_CONFIGS
      );
      expect(decryptedWebsites).toEqual(existingData[STORAGE_KEYS.WEBSITE_CONFIGS]);

      // Step 6: Lock and unlock cycle
      const lockUseCase = new LockStorageUseCase(secureStorage, logAggregator);
      await lockUseCase.execute();
      expect(secureStorage.isUnlocked()).toBe(false);

      // Try to access data while locked (should fail)
      await expect(secureStorage.loadEncrypted(STORAGE_KEYS.XPATH_COLLECTION)).rejects.toThrow(
        'Storage is locked'
      );

      // Unlock
      const unlockUseCase = new UnlockStorageUseCase(secureStorage, lockoutManager, logAggregator);
      const unlockResult = await unlockUseCase.execute({ password: masterPassword });
      expect(unlockResult.isSuccess).toBe(true);

      // Step 7: Verify data is still accessible after unlock
      const afterUnlock = await secureStorage.loadEncrypted<any>(STORAGE_KEYS.XPATH_COLLECTION);
      expect(afterUnlock).toEqual(existingData[STORAGE_KEYS.XPATH_COLLECTION]);
    });

    it('should handle migration with no existing data', async () => {
      // Step 1: No plaintext data exists

      // Step 2: Initialize master password
      const masterPassword = 'SecurePass123!@#';
      const initUseCase = new InitializeMasterPasswordUseCase(secureStorage, policy);
      await initUseCase.execute({
        password: masterPassword,
        confirmation: masterPassword,
      });

      // Step 3: Execute migration (should succeed with no keys migrated)
      const migrationResult = await migrateUseCase.execute();

      expect(migrationResult.isSuccess).toBe(true);
      expect(migrationResult.value?.migratedKeys).toEqual([]);
      expect(migrationResult.value?.backupCreated).toBe(false);
      expect(await migrateUseCase.isMigrated()).toBe(true);
    });

    it('should prevent duplicate migration', async () => {
      // Setup plaintext data
      await browser.storage.local.set({
        [STORAGE_KEYS.XPATH_COLLECTION]: { data: 'test' },
      });

      // Initialize master password
      const masterPassword = 'SecurePass123!@#';
      const initUseCase = new InitializeMasterPasswordUseCase(secureStorage, policy);
      await initUseCase.execute({
        password: masterPassword,
        confirmation: masterPassword,
      });

      // First migration
      const firstMigration = await migrateUseCase.execute();
      expect(firstMigration.isSuccess).toBe(true);

      // Second migration should fail
      const secondMigration = await migrateUseCase.execute();
      expect(secondMigration.isFailure).toBe(true);
      expect(secondMigration.error).toContain('Migration already completed');
    });
  });

  describe('Migration with Data Operations', () => {
    it('should allow CRUD operations on migrated data', async () => {
      // Setup and migrate
      const originalData = [
        { id: 'var1', name: 'username', value: 'testuser' },
        { id: 'var2', name: 'password', value: 'secret123' },
      ];

      await browser.storage.local.set({
        [STORAGE_KEYS.AUTOMATION_VARIABLES]: originalData,
      });

      const masterPassword = 'SecurePass123!@#';
      const initUseCase = new InitializeMasterPasswordUseCase(secureStorage, policy);
      await initUseCase.execute({
        password: masterPassword,
        confirmation: masterPassword,
      });

      await migrateUseCase.execute();

      // READ: Verify migrated data
      const readData = await secureStorage.loadEncrypted<any>(STORAGE_KEYS.AUTOMATION_VARIABLES);
      expect(readData).toEqual(originalData);

      // UPDATE: Modify data
      const updatedData = [
        ...originalData,
        { id: 'var3', name: 'email', value: 'test@example.com' },
      ];
      await secureStorage.saveEncrypted(STORAGE_KEYS.AUTOMATION_VARIABLES, updatedData);

      const afterUpdate = await secureStorage.loadEncrypted<any>(STORAGE_KEYS.AUTOMATION_VARIABLES);
      expect(afterUpdate).toEqual(updatedData);
      expect(afterUpdate.length).toBe(3);

      // DELETE: Remove data
      await secureStorage.removeEncrypted(STORAGE_KEYS.AUTOMATION_VARIABLES);

      const afterDelete = await secureStorage.loadEncrypted(STORAGE_KEYS.AUTOMATION_VARIABLES);
      expect(afterDelete).toBeNull();
    });

    it('should preserve data integrity across lock/unlock cycles', async () => {
      // Setup
      const testData = {
        [STORAGE_KEYS.SYSTEM_SETTINGS]: {
          theme: 'dark',
          language: 'ja',
          notifications: true,
        },
      };

      await browser.storage.local.set(testData);

      const masterPassword = 'SecurePass123!@#';
      const initUseCase = new InitializeMasterPasswordUseCase(secureStorage, policy);
      await initUseCase.execute({
        password: masterPassword,
        confirmation: masterPassword,
      });

      await migrateUseCase.execute();

      // Multiple lock/unlock cycles
      const lockUseCase = new LockStorageUseCase(secureStorage, logAggregator);
      const unlockUseCase = new UnlockStorageUseCase(secureStorage, lockoutManager, logAggregator);

      for (let i = 0; i < 3; i++) {
        // Lock
        await lockUseCase.execute();
        expect(secureStorage.isUnlocked()).toBe(false);

        // Unlock
        await unlockUseCase.execute({ password: masterPassword });
        expect(secureStorage.isUnlocked()).toBe(true);

        // Verify data integrity
        const loaded = await secureStorage.loadEncrypted<any>(STORAGE_KEYS.SYSTEM_SETTINGS);
        expect(loaded).toEqual(testData[STORAGE_KEYS.SYSTEM_SETTINGS]);
      }
    });
  });

  describe('Migration Rollback Scenarios', () => {
    it('should rollback migration on encryption failure', async () => {
      // Setup plaintext data
      const testData = {
        [STORAGE_KEYS.XPATH_COLLECTION]: { elements: ['elem1', 'elem2'] },
        [STORAGE_KEYS.WEBSITE_CONFIGS]: [{ id: 'site1' }],
      };

      await browser.storage.local.set(testData);

      // Initialize
      const masterPassword = 'SecurePass123!@#';
      const initUseCase = new InitializeMasterPasswordUseCase(secureStorage, policy);
      await initUseCase.execute({
        password: masterPassword,
        confirmation: masterPassword,
      });

      // Mock encryption failure on second key
      let callCount = 0;
      const originalSaveEncrypted = secureStorage.saveEncrypted.bind(secureStorage);
      secureStorage.saveEncrypted = jest.fn(async (key: string, data: any) => {
        callCount++;
        if (callCount === 2) {
          throw new Error('Simulated encryption failure');
        }
        return originalSaveEncrypted(key, data);
      });

      // Execute migration (should fail and rollback)
      const migrationResult = await migrateUseCase.execute();

      expect(migrationResult.isFailure).toBe(true);
      expect(migrationResult.error).toContain('Migration failed');

      // Verify plaintext data is restored
      const restoredData = await browser.storage.local.get(Object.values(STORAGE_KEYS));
      expect(restoredData[STORAGE_KEYS.XPATH_COLLECTION]).toEqual(
        testData[STORAGE_KEYS.XPATH_COLLECTION]
      );
      expect(restoredData[STORAGE_KEYS.WEBSITE_CONFIGS]).toEqual(
        testData[STORAGE_KEYS.WEBSITE_CONFIGS]
      );

      // Verify migration flag is not set
      expect(await migrateUseCase.isMigrated()).toBe(false);
    });

    it('should allow manual rollback after successful migration', async () => {
      // Setup and migrate
      const originalData = {
        [STORAGE_KEYS.AUTOMATION_VARIABLES]: [{ id: 'var1', name: 'test', value: 'value1' }],
      };

      await browser.storage.local.set(originalData);

      const masterPassword = 'SecurePass123!@#';
      const initUseCase = new InitializeMasterPasswordUseCase(secureStorage, policy);
      await initUseCase.execute({
        password: masterPassword,
        confirmation: masterPassword,
      });

      const migrationResult = await migrateUseCase.execute();
      expect(migrationResult.isSuccess).toBe(true);

      const backupKey = migrationResult.value?.backupKey;
      expect(backupKey).toBeDefined();

      // Verify plaintext is gone
      const afterMigration = await browser.storage.local.get(STORAGE_KEYS.AUTOMATION_VARIABLES);
      expect(afterMigration[STORAGE_KEYS.AUTOMATION_VARIABLES]).toBeUndefined();

      // Manual rollback
      const rollbackResult = await migrateUseCase.rollback(backupKey as string);
      expect(rollbackResult.isSuccess).toBe(true);

      // Verify plaintext is restored
      const afterRollback = await browser.storage.local.get(STORAGE_KEYS.AUTOMATION_VARIABLES);
      expect(afterRollback[STORAGE_KEYS.AUTOMATION_VARIABLES]).toEqual(
        originalData[STORAGE_KEYS.AUTOMATION_VARIABLES]
      );

      // Verify migration flag is removed
      expect(await migrateUseCase.isMigrated()).toBe(false);
    });
  });

  describe('Session Management with Migrated Data', () => {
    it('should handle session timeout correctly with encrypted data', async () => {
      // Setup and migrate
      const testData = {
        [STORAGE_KEYS.SYSTEM_SETTINGS]: { timeout: 30 },
      };

      await browser.storage.local.set(testData);

      const masterPassword = 'SecurePass123!@#';
      const initUseCase = new InitializeMasterPasswordUseCase(secureStorage, policy);
      await initUseCase.execute({
        password: masterPassword,
        confirmation: masterPassword,
      });

      await migrateUseCase.execute();

      // Check initial session
      const statusUseCase = new CheckUnlockStatusUseCase(secureStorage, lockoutManager);
      const initialStatus = await statusUseCase.execute();
      expect(initialStatus.value?.isUnlocked).toBe(true);
      expect(initialStatus.value?.sessionExpiresAt).not.toBeNull();

      // Simulate session expiry by locking
      const lockUseCase = new LockStorageUseCase(secureStorage, logAggregator);
      await lockUseCase.execute();

      // Verify data is inaccessible
      await expect(secureStorage.loadEncrypted(STORAGE_KEYS.SYSTEM_SETTINGS)).rejects.toThrow(
        'Storage is locked'
      );

      // Unlock to restore session
      const unlockUseCase = new UnlockStorageUseCase(secureStorage, lockoutManager, logAggregator);
      await unlockUseCase.execute({ password: masterPassword });

      // Verify data is accessible again
      const afterUnlock = await secureStorage.loadEncrypted<any>(STORAGE_KEYS.SYSTEM_SETTINGS);
      expect(afterUnlock).toEqual(testData[STORAGE_KEYS.SYSTEM_SETTINGS]);
    });
  });

  describe('Lockout with Migration Scenarios', () => {
    it('should enforce lockout even after successful migration', async () => {
      // Setup and migrate
      await browser.storage.local.set({
        [STORAGE_KEYS.XPATH_COLLECTION]: { data: 'test' },
      });

      const correctPassword = 'SecurePass123!@#';
      const initUseCase = new InitializeMasterPasswordUseCase(secureStorage, policy);
      await initUseCase.execute({
        password: correctPassword,
        confirmation: correctPassword,
      });

      await migrateUseCase.execute();

      // Lock
      const lockUseCase = new LockStorageUseCase(secureStorage, logAggregator);
      await lockUseCase.execute();

      // Exceed max unlock attempts
      const unlockUseCase = new UnlockStorageUseCase(secureStorage, lockoutManager, logAggregator);
      for (let i = 0; i < 5; i++) {
        await unlockUseCase.execute({ password: 'WrongPassword123!@#' });
      }

      // Verify lockout
      const statusUseCase = new CheckUnlockStatusUseCase(secureStorage, lockoutManager);
      const status = await statusUseCase.execute();
      expect(status.value?.isLockedOut).toBe(true);

      // Try to unlock with correct password (should fail)
      const unlockAttempt = await unlockUseCase.execute({ password: correctPassword });
      expect(unlockAttempt.isFailure).toBe(true);
      expect(unlockAttempt.error).toContain('Too many failed attempts');

      // Data should remain inaccessible
      await expect(secureStorage.loadEncrypted(STORAGE_KEYS.XPATH_COLLECTION)).rejects.toThrow(
        'Storage is locked'
      );
    });
  });

  describe('Backup Management', () => {
    it('should list and retrieve backups', async () => {
      // Setup and migrate
      await browser.storage.local.set({
        [STORAGE_KEYS.XPATH_COLLECTION]: { iteration: 1 },
      });

      const masterPassword = 'SecurePass123!@#';
      const initUseCase = new InitializeMasterPasswordUseCase(secureStorage, policy);
      await initUseCase.execute({
        password: masterPassword,
        confirmation: masterPassword,
      });

      const migrationResult = await migrateUseCase.execute();
      const backupKey = migrationResult.value?.backupKey;
      expect(backupKey).toBeDefined();

      // List backups
      const backups = await migrateUseCase.listBackups();
      expect(backups).toContain(backupKey as string);
      expect(backups.length).toBeGreaterThan(0);

      // Retrieve backup
      const backup = await migrateUseCase.getBackup(backupKey as string);
      expect(backup).not.toBeNull();
      expect(backup?.data[STORAGE_KEYS.XPATH_COLLECTION]).toEqual({ iteration: 1 });
      expect(backup?.version).toBe('1.0.0');
      expect(backup?.timestamp).toBeDefined();
    });

    it('should cleanup old backups', async () => {
      // Create multiple migrations (by resetting migration flag)
      const masterPassword = 'SecurePass123!@#';
      const initUseCase = new InitializeMasterPasswordUseCase(secureStorage, policy);
      await initUseCase.execute({
        password: masterPassword,
        confirmation: masterPassword,
      });

      for (let i = 0; i < 5; i++) {
        await browser.storage.local.set({
          [STORAGE_KEYS.XPATH_COLLECTION]: { iteration: i },
        });
        await browser.storage.local.remove('_secure_storage_migrated'); // Allow re-migration
        await migrateUseCase.execute();
        await new Promise((resolve) => setTimeout(resolve, 10)); // Ensure different timestamps
      }

      // Verify 5 backups exist
      const allBackups = await migrateUseCase.listBackups();
      expect(allBackups.length).toBeGreaterThanOrEqual(5);

      // Cleanup, keeping only 2 most recent
      const removedCount = await migrateUseCase.cleanupOldBackups(2);
      expect(removedCount).toBeGreaterThanOrEqual(3);

      // Verify only 2 remain
      const remainingBackups = await migrateUseCase.listBackups();
      expect(remainingBackups.length).toBe(2);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle migration without unlock', async () => {
      // Setup plaintext data
      await browser.storage.local.set({
        [STORAGE_KEYS.XPATH_COLLECTION]: { data: 'test' },
      });

      // Initialize master password
      const masterPassword = 'SecurePass123!@#';
      const initUseCase = new InitializeMasterPasswordUseCase(secureStorage, policy);
      await initUseCase.execute({
        password: masterPassword,
        confirmation: masterPassword,
      });

      // Lock storage
      const lockUseCase = new LockStorageUseCase(secureStorage, logAggregator);
      await lockUseCase.execute();

      // Try migration while locked (should fail)
      const migrationResult = await migrateUseCase.execute();
      expect(migrationResult.isFailure).toBe(true);
      expect(migrationResult.error).toContain('Storage must be unlocked');
    });

    it('should handle large datasets during migration', async () => {
      // Create large dataset
      const largeArray = Array.from({ length: 1000 }, (_, i) => ({
        id: `id${i}`,
        name: `name${i}`,
        value: `value${i}`,
        nested: {
          level1: { level2: { data: `data${i}` } },
        },
      }));

      await browser.storage.local.set({
        [STORAGE_KEYS.AUTOMATION_RESULTS]: largeArray,
      });

      // Initialize and migrate
      const masterPassword = 'SecurePass123!@#';
      const initUseCase = new InitializeMasterPasswordUseCase(secureStorage, policy);
      await initUseCase.execute({
        password: masterPassword,
        confirmation: masterPassword,
      });

      const migrationResult = await migrateUseCase.execute();
      expect(migrationResult.isSuccess).toBe(true);
      expect(migrationResult.value?.migratedKeys).toContain(STORAGE_KEYS.AUTOMATION_RESULTS);

      // Verify data integrity
      const decrypted = await secureStorage.loadEncrypted<any>(STORAGE_KEYS.AUTOMATION_RESULTS);
      expect(decrypted).toEqual(largeArray);
      expect(decrypted.length).toBe(1000);
    });

    it('should handle mixed empty and populated storage keys', async () => {
      // Setup mixed data
      await browser.storage.local.set({
        [STORAGE_KEYS.XPATH_COLLECTION]: { data: 'test' },
        [STORAGE_KEYS.WEBSITE_CONFIGS]: [],
        [STORAGE_KEYS.SYSTEM_SETTINGS]: {},
      });

      // Initialize and migrate
      const masterPassword = 'SecurePass123!@#';
      const initUseCase = new InitializeMasterPasswordUseCase(secureStorage, policy);
      await initUseCase.execute({
        password: masterPassword,
        confirmation: masterPassword,
      });

      const migrationResult = await migrateUseCase.execute();
      expect(migrationResult.isSuccess).toBe(true);

      // Verify all keys were migrated (even empty ones)
      expect(migrationResult.value?.migratedKeys).toContain(STORAGE_KEYS.XPATH_COLLECTION);
      expect(migrationResult.value?.migratedKeys).toContain(STORAGE_KEYS.WEBSITE_CONFIGS);
      expect(migrationResult.value?.migratedKeys).toContain(STORAGE_KEYS.SYSTEM_SETTINGS);

      // Verify empty data is preserved
      const emptyArray = await secureStorage.loadEncrypted<any>(STORAGE_KEYS.WEBSITE_CONFIGS);
      expect(emptyArray).toEqual([]);

      const emptyObject = await secureStorage.loadEncrypted<any>(STORAGE_KEYS.SYSTEM_SETTINGS);
      expect(emptyObject).toEqual({});
    });
  });

  describe('Complete User Journey', () => {
    it('should simulate a complete user journey from installation to daily use', async () => {
      // Day 1: User installs extension with existing plaintext data
      const existingUserData = {
        [STORAGE_KEYS.AUTOMATION_VARIABLES]: [
          { id: '1', name: 'username', value: 'john_doe' },
          { id: '2', name: 'email', value: 'john@example.com' },
        ],
        [STORAGE_KEYS.WEBSITE_CONFIGS]: [
          { id: 'site1', url: 'https://banking.example.com', name: 'Banking' },
        ],
        [STORAGE_KEYS.SYSTEM_SETTINGS]: {
          theme: 'light',
          notifications: true,
        },
      };

      await browser.storage.local.set(existingUserData);

      // Day 1: User sets up master password
      const masterPassword = 'UserMasterPass2024!';
      const initUseCase = new InitializeMasterPasswordUseCase(secureStorage, policy);
      const setupResult = await initUseCase.execute({
        password: masterPassword,
        confirmation: masterPassword,
      });

      expect(setupResult.isSuccess).toBe(true);

      // Day 1: Extension prompts for migration
      const migrationResult = await migrateUseCase.execute();
      expect(migrationResult.isSuccess).toBe(true);
      expect(migrationResult.value?.migratedKeys.length).toBeGreaterThan(0);

      // Day 1: User adds new variable
      const currentVariables = await secureStorage.loadEncrypted<any>(
        STORAGE_KEYS.AUTOMATION_VARIABLES
      );
      const newVariables = [...currentVariables, { id: '3', name: 'phone', value: '+1-555-0100' }];
      await secureStorage.saveEncrypted(STORAGE_KEYS.AUTOMATION_VARIABLES, newVariables);

      // Day 1: User locks before closing
      const lockUseCase = new LockStorageUseCase(secureStorage, logAggregator);
      await lockUseCase.execute();

      // Day 2: User opens extension
      const statusUseCase = new CheckUnlockStatusUseCase(secureStorage, lockoutManager);
      const status = await statusUseCase.execute();
      expect(status.value?.isUnlocked).toBe(false);
      expect(status.value?.needsUnlock()).toBe(true);

      // Day 2: User unlocks
      const unlockUseCase = new UnlockStorageUseCase(secureStorage, lockoutManager, logAggregator);
      const unlockResult = await unlockUseCase.execute({ password: masterPassword });
      expect(unlockResult.isSuccess).toBe(true);

      // Day 2: User accesses their data
      const accessedVariables = await secureStorage.loadEncrypted<any>(
        STORAGE_KEYS.AUTOMATION_VARIABLES
      );
      expect(accessedVariables.length).toBe(3);
      expect(accessedVariables[2]).toEqual({ id: '3', name: 'phone', value: '+1-555-0100' });

      // Day 2: Verify all original data is intact
      const accessedSettings = await secureStorage.loadEncrypted<any>(STORAGE_KEYS.SYSTEM_SETTINGS);
      expect(accessedSettings).toEqual(existingUserData[STORAGE_KEYS.SYSTEM_SETTINGS]);

      const accessedWebsites = await secureStorage.loadEncrypted<any>(STORAGE_KEYS.WEBSITE_CONFIGS);
      expect(accessedWebsites).toEqual(existingUserData[STORAGE_KEYS.WEBSITE_CONFIGS]);
    });
  });
});

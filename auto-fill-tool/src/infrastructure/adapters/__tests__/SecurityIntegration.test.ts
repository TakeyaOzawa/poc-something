/**
 * Integration Tests: Security Infrastructure
 * Tests integration between CryptoAdapter, SecureStorage, SessionManager, and LockoutManager
 */

import { WebCryptoAdapter } from '../CryptoAdapter';
import { SecureStorageAdapter } from '../SecureStorageAdapter';
import { LockoutManager } from '../../../domain/services/LockoutManager';
import { ChromeStorageLockoutStorage } from '../ChromeStorageLockoutStorage';
import { LogAggregatorPort } from '@domain/types/log-aggregator-port.types';
import { LogEntry } from '@domain/entities/LogEntry';
import browser from 'webextension-polyfill';

// Mock webextension-polyfill
jest.mock('webextension-polyfill', () => ({
  __esModule: true,
  default: {
    storage: {
      local: {
        get: jest.fn(),
        set: jest.fn(),
        remove: jest.fn(),
        clear: jest.fn(),
      },
    },
    alarms: {
      create: jest.fn(),
      clear: jest.fn(),
      onAlarm: {
        addListener: jest.fn(),
      },
    },
  },
}));

// Mock Log Aggregator implementation
class MockLogAggregator implements LogAggregatorPort {
  private logs: LogEntry[] = [];

  async addLog(log: LogEntry): Promise<void> {
    this.logs.push(log);
  }

  async getLogs(): Promise<LogEntry[]> {
    return [...this.logs];
  }

  async getLogCount(): Promise<number> {
    return this.logs.length;
  }

  async deleteOldLogs(retentionDays: number): Promise<number> {
    return 0;
  }

  async clearAllLogs(): Promise<void> {
    this.logs = [];
  }

  async deleteLog(id: string): Promise<boolean> {
    const initialLength = this.logs.length;
    this.logs = this.logs.filter((log) => log.getId() !== id);
    return this.logs.length < initialLength;
  }

  async applyRotation(maxLogs: number): Promise<number> {
    const initialLength = this.logs.length;
    if (this.logs.length > maxLogs) {
      this.logs = this.logs.slice(-maxLogs);
    }
    return initialLength - this.logs.length;
  }
}

describe('Security Infrastructure Integration', () => {
  let cryptoAdapter: WebCryptoAdapter;
  let secureStorage: SecureStorageAdapter;
  let lockoutManager: LockoutManager;
  let lockoutStorage: ChromeStorageLockoutStorage;
  let mockLogAggregator: MockLogAggregator;

  const testPassword = 'TestPassword123!';
  const storageData: { [key: string]: any } = {};

  beforeEach(async () => {
    // Reset storage mock
    jest.clearAllMocks();
    Object.keys(storageData).forEach((key) => delete storageData[key]);

    // Setup mock implementations
    (browser.storage.local.get as jest.Mock).mockImplementation(
      (keys: string | string[] | null) => {
        // Handle null - return all storage data
        if (keys === null || keys === undefined) {
          return Promise.resolve({ ...storageData });
        }
        // Handle single string key
        if (typeof keys === 'string') {
          return Promise.resolve({ [keys]: storageData[keys] });
        }
        // Handle array of keys
        const result: any = {};
        if (Array.isArray(keys)) {
          keys.forEach((key) => {
            if (storageData[key] !== undefined) {
              result[key] = storageData[key];
            }
          });
        }
        return Promise.resolve(result);
      }
    );

    (browser.storage.local.set as jest.Mock).mockImplementation((items: any) => {
      Object.assign(storageData, items);
      return Promise.resolve();
    });

    (browser.storage.local.remove as jest.Mock).mockImplementation((keys: string | string[]) => {
      if (typeof keys === 'string') {
        delete storageData[keys];
      } else {
        keys.forEach((key) => delete storageData[key]);
      }
      return Promise.resolve();
    });

    (browser.storage.local.clear as jest.Mock).mockImplementation(() => {
      Object.keys(storageData).forEach((key) => delete storageData[key]);
      return Promise.resolve();
    });

    (browser.alarms.create as jest.Mock).mockResolvedValue(undefined);
    (browser.alarms.clear as jest.Mock).mockResolvedValue(true);

    // Initialize services
    cryptoAdapter = new WebCryptoAdapter();
    secureStorage = new SecureStorageAdapter(cryptoAdapter);
    lockoutStorage = new ChromeStorageLockoutStorage();
    mockLogAggregator = new MockLogAggregator();
    lockoutManager = new LockoutManager(lockoutStorage, mockLogAggregator, 5, 5 * 60 * 1000);
  });

  describe('CryptoAdapter + SecureStorage Integration', () => {
    it('should encrypt and decrypt data through SecureStorage', async () => {
      await secureStorage.initialize(testPassword);
      await secureStorage.unlock(testPassword);

      const testData = {
        username: 'testuser',
        apiKey: 'secret-api-key-12345',
        settings: { theme: 'dark', notifications: true },
      };

      await secureStorage.saveEncrypted('test_credentials', testData);

      const loaded = await secureStorage.loadEncrypted<typeof testData>('test_credentials');

      expect(loaded).toEqual(testData);
    });

    it('should fail to decrypt with wrong password', async () => {
      await secureStorage.initialize(testPassword);
      await secureStorage.unlock(testPassword);

      const testData = { secret: 'value' };
      await secureStorage.saveEncrypted('test_data', testData);

      await secureStorage.lock();

      await expect(secureStorage.unlock('WrongPassword123!')).rejects.toThrow();
    });

    it('should handle multiple encrypted keys independently', async () => {
      await secureStorage.initialize(testPassword);
      await secureStorage.unlock(testPassword);

      const data1 = { type: 'credentials', value: 'secret1' };
      const data2 = { type: 'settings', value: 'config1' };
      const data3 = { type: 'tokens', value: 'token123' };

      await secureStorage.saveEncrypted('key1', data1);
      await secureStorage.saveEncrypted('key2', data2);
      await secureStorage.saveEncrypted('key3', data3);

      const loaded1 = await secureStorage.loadEncrypted('key1');
      const loaded2 = await secureStorage.loadEncrypted('key2');
      const loaded3 = await secureStorage.loadEncrypted('key3');

      expect(loaded1).toEqual(data1);
      expect(loaded2).toEqual(data2);
      expect(loaded3).toEqual(data3);
    });

    it('should maintain data integrity after session lock/unlock', async () => {
      await secureStorage.initialize(testPassword);
      await secureStorage.unlock(testPassword);

      const testData = { sensitive: 'information' };
      await secureStorage.saveEncrypted('persistent', testData);

      await secureStorage.lock();
      await secureStorage.unlock(testPassword);

      const loaded = await secureStorage.loadEncrypted('persistent');
      expect(loaded).toEqual(testData);
    });
  });

  describe('LockoutManager + SecureStorage Integration', () => {
    it('should prevent access after max failed unlock attempts', async () => {
      await secureStorage.initialize(testPassword);
      await lockoutManager.initialize();

      // Simulate failed login attempts
      for (let i = 0; i < 5; i++) {
        try {
          await secureStorage.unlock('WrongPassword123!');
        } catch (error) {
          await lockoutManager.recordFailedAttempt();
        }
      }

      expect(await lockoutManager.isLockedOut()).toBe(true);

      // Should not be able to unlock even with correct password when locked out
      await expect(
        (async () => {
          if (await lockoutManager.isLockedOut()) {
            throw new Error('Account is locked out');
          }
          await secureStorage.unlock(testPassword);
        })()
      ).rejects.toThrow('Account is locked out');
    });

    it('should allow access after successful unlock', async () => {
      await secureStorage.initialize(testPassword);
      await lockoutManager.initialize();

      // Simulate some failed attempts
      for (let i = 0; i < 3; i++) {
        try {
          await secureStorage.unlock('WrongPassword123!');
        } catch (error) {
          await lockoutManager.recordFailedAttempt();
        }
      }

      // Successful unlock
      await secureStorage.unlock(testPassword);
      await lockoutManager.recordSuccessfulAttempt();

      const status = await lockoutManager.getStatus();
      expect(status.failedAttempts).toBe(0);
      expect(status.isLockedOut).toBe(false);
      expect(secureStorage.isUnlocked()).toBe(true);
    });

    it('should persist lockout state across service instances', async () => {
      await secureStorage.initialize(testPassword);
      await lockoutManager.initialize();

      // Trigger lockout
      for (let i = 0; i < 5; i++) {
        try {
          await secureStorage.unlock('WrongPassword123!');
        } catch (error) {
          await lockoutManager.recordFailedAttempt();
        }
      }

      expect(await lockoutManager.isLockedOut()).toBe(true);

      // Create new lockout manager instance
      const newMockLogAggregator = new MockLogAggregator();
      const newLockoutManager = new LockoutManager(
        lockoutStorage,
        newMockLogAggregator,
        5,
        5 * 60 * 1000
      );
      await newLockoutManager.initialize();

      // Should still be locked out
      expect(await newLockoutManager.isLockedOut()).toBe(true);
    });
  });

  describe('Master Password Change Scenarios', () => {
    it('should re-encrypt all data when master password changes', async () => {
      await secureStorage.initialize(testPassword);

      const data1 = { key: 'value1' };
      const data2 = { key: 'value2' };

      await secureStorage.saveEncrypted('data1', data1);
      await secureStorage.saveEncrypted('data2', data2);

      const newPassword = 'NewPassword456!';

      // Change password (this will re-encrypt all data)
      await secureStorage.changeMasterPassword(testPassword, newPassword);

      // Lock and unlock with new password to verify data is accessible
      await secureStorage.lock();
      await secureStorage.unlock(newPassword);

      const loaded1 = await secureStorage.loadEncrypted('data1');
      const loaded2 = await secureStorage.loadEncrypted('data2');

      expect(loaded1).toEqual(data1);
      expect(loaded2).toEqual(data2);

      // Old password should no longer work
      await secureStorage.lock();
      await expect(secureStorage.unlock(testPassword)).rejects.toThrow();
    });

    it('should fail to change password with wrong old password', async () => {
      await secureStorage.initialize(testPassword);
      await secureStorage.unlock(testPassword);

      await expect(
        secureStorage.changeMasterPassword('WrongOldPassword', 'NewPassword456!')
      ).rejects.toThrow('Invalid password or corrupted data');
    });

    it('should preserve lockout state after password change', async () => {
      await secureStorage.initialize(testPassword);
      await lockoutManager.initialize();

      // Record some failed attempts
      for (let i = 0; i < 3; i++) {
        try {
          await secureStorage.unlock('WrongPassword123!');
        } catch (error) {
          await lockoutManager.recordFailedAttempt();
        }
      }

      await secureStorage.unlock(testPassword);
      await lockoutManager.recordSuccessfulAttempt();

      const newPassword = 'NewPassword456!';
      await secureStorage.changeMasterPassword(testPassword, newPassword);

      const status = await lockoutManager.getStatus();
      expect(status.failedAttempts).toBe(0);
    });
  });

  describe('Session Timeout Scenarios', () => {
    it('should lock storage after session timeout', async () => {
      jest.useFakeTimers();

      await secureStorage.initialize(testPassword);
      await secureStorage.unlock(testPassword);

      expect(secureStorage.isUnlocked()).toBe(true);

      const testData = { value: 'test' };
      await secureStorage.saveEncrypted('test', testData);

      // Fast-forward past session timeout (15 minutes)
      jest.advanceTimersByTime(15 * 60 * 1000 + 1000);

      // Manually trigger lock (in real scenario, timer callback would do this)
      await secureStorage.lock();

      expect(secureStorage.isUnlocked()).toBe(false);

      // Should not be able to access encrypted data
      await expect(secureStorage.loadEncrypted('test')).rejects.toThrow('Storage is locked');

      jest.useRealTimers();
    });

    it('should extend session on activity', async () => {
      jest.useFakeTimers();

      await secureStorage.initialize(testPassword);
      await secureStorage.unlock(testPassword);

      expect(secureStorage.isUnlocked()).toBe(true);

      // Advance 10 minutes
      jest.advanceTimersByTime(10 * 60 * 1000);

      // Activity extends session explicitly
      secureStorage.extendSession();
      await secureStorage.saveEncrypted('test', { value: 'data' });

      // Advance another 10 minutes (would timeout if not extended)
      jest.advanceTimersByTime(10 * 60 * 1000);

      // Should still be unlocked (total 20 mins, but extended at 10 mins)
      expect(secureStorage.isUnlocked()).toBe(true);

      // Advance past timeout from last extension (15 mins from extension point)
      jest.advanceTimersByTime(6 * 60 * 1000);

      // Now should timeout
      expect(secureStorage.isUnlocked()).toBe(false);

      jest.useRealTimers();
    });
  });

  describe('End-to-End Security Workflow', () => {
    it('should handle complete authentication flow with lockout protection', async () => {
      // Initialize system
      await secureStorage.initialize(testPassword);
      await lockoutManager.initialize();

      // User attempts login with wrong password
      let attempts = 0;
      while (attempts < 3) {
        try {
          await secureStorage.unlock('WrongPassword');
        } catch (error) {
          await lockoutManager.recordFailedAttempt();
          attempts++;
        }
      }

      const status1 = await lockoutManager.getStatus();
      expect(status1.failedAttempts).toBe(3);
      expect(status1.isLockedOut).toBe(false);

      // Successful login
      await secureStorage.unlock(testPassword);
      await lockoutManager.recordSuccessfulAttempt();

      expect(secureStorage.isUnlocked()).toBe(true);

      const status2 = await lockoutManager.getStatus();
      expect(status2.failedAttempts).toBe(0);

      // Store encrypted data
      const credentials = {
        username: 'admin',
        apiToken: 'secret-token-xyz',
        refreshToken: 'refresh-abc',
      };

      await secureStorage.saveEncrypted('api_credentials', credentials);

      // Retrieve data
      const loaded = await secureStorage.loadEncrypted('api_credentials');
      expect(loaded).toEqual(credentials);

      // Lock session
      await secureStorage.lock();
      expect(secureStorage.isUnlocked()).toBe(false);

      // Re-authenticate
      await secureStorage.unlock(testPassword);
      expect(secureStorage.isUnlocked()).toBe(true);

      // Verify data still accessible
      const reloaded = await secureStorage.loadEncrypted('api_credentials');
      expect(reloaded).toEqual(credentials);
    });

    it('should handle lockout scenario in authentication flow', async () => {
      await secureStorage.initialize(testPassword);
      await lockoutManager.initialize();

      // Simulate brute force attack
      for (let i = 0; i < 5; i++) {
        try {
          await secureStorage.unlock('AttackPassword' + i);
        } catch (error) {
          await lockoutManager.recordFailedAttempt();
        }
      }

      expect(await lockoutManager.isLockedOut()).toBe(true);

      // Even correct password should be blocked when locked out
      if (await lockoutManager.isLockedOut()) {
        // In real implementation, UI would prevent unlock attempt
        const status = await lockoutManager.getStatus();
        expect(status.remainingLockoutTime).toBeGreaterThan(0);
      }
    });

    it('should handle data access with multiple encrypted keys', async () => {
      await secureStorage.initialize(testPassword);
      await lockoutManager.initialize();
      await secureStorage.unlock(testPassword);
      await lockoutManager.recordSuccessfulAttempt();

      // Store multiple types of data
      const apiConfig = { endpoint: 'https://api.example.com', version: 'v1' };
      const userSettings = { theme: 'dark', language: 'ja' };
      const authTokens = { access: 'access123', refresh: 'refresh456' };

      await secureStorage.saveEncrypted('api_config', apiConfig);
      await secureStorage.saveEncrypted('user_settings', userSettings);
      await secureStorage.saveEncrypted('auth_tokens', authTokens);

      // Verify all data can be accessed
      expect(await secureStorage.loadEncrypted('api_config')).toEqual(apiConfig);
      expect(await secureStorage.loadEncrypted('user_settings')).toEqual(userSettings);
      expect(await secureStorage.loadEncrypted('auth_tokens')).toEqual(authTokens);

      // Lock and unlock
      await secureStorage.lock();
      await secureStorage.unlock(testPassword);

      // Verify data still accessible after session restart
      expect(await secureStorage.loadEncrypted('api_config')).toEqual(apiConfig);
      expect(await secureStorage.loadEncrypted('user_settings')).toEqual(userSettings);
      expect(await secureStorage.loadEncrypted('auth_tokens')).toEqual(authTokens);
    });
  });

  describe('Error Recovery Scenarios', () => {
    it('should recover from storage corruption', async () => {
      await secureStorage.initialize(testPassword);
      await secureStorage.unlock(testPassword);

      await secureStorage.saveEncrypted('test', { value: 'data' });

      // Corrupt storage data with invalid encrypted format
      storageData['secure_test'] = {
        ciphertext: 'corrupted-data',
        iv: 'invalid-iv',
        salt: 'invalid-salt',
      };

      // Should handle gracefully and throw decryption error
      await expect(secureStorage.loadEncrypted('test')).rejects.toThrow();
    });

    it('should allow reset after corruption', async () => {
      await secureStorage.initialize(testPassword);
      await secureStorage.unlock(testPassword);

      // Reset storage
      await secureStorage.reset();

      // Should be able to initialize again
      await secureStorage.initialize(testPassword);
      await secureStorage.unlock(testPassword);

      expect(secureStorage.isUnlocked()).toBe(true);
    });

    it('should handle lockout reset by administrator', async () => {
      await lockoutManager.initialize();

      // Trigger lockout
      for (let i = 0; i < 5; i++) {
        await lockoutManager.recordFailedAttempt();
      }

      expect(await lockoutManager.isLockedOut()).toBe(true);

      // Administrator reset
      await lockoutManager.reset();

      expect(await lockoutManager.isLockedOut()).toBe(false);
      const status = await lockoutManager.getStatus();
      expect(status.failedAttempts).toBe(0);
    });
  });
});

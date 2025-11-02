/**
 * Unit Tests: SecureSystemSettingsRepository
 * Tests the secure repository implementation with encryption
 */

import { SecureSystemSettingsRepository } from '../SecureSystemSettingsRepository';
import { SystemSettingsCollection, SystemSettings } from '@domain/entities/SystemSettings';
import { SecureStorage } from '@domain/types/secure-storage-port.types';
import { Result } from '@domain/values/result.value';

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

describe('SecureSystemSettingsRepository', () => {
  let repository: SecureSystemSettingsRepository;
  let mockSecureStorage: jest.Mocked<SecureStorage>;

  beforeEach(() => {
    mockSecureStorage = createMockSecureStorage();
    repository = new SecureSystemSettingsRepository(mockSecureStorage);
  });

  describe('save()', () => {
    it('should save settings encrypted when storage is unlocked', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);
      mockSecureStorage.saveEncrypted.mockResolvedValue(Result.success(undefined));

      const settings = new SystemSettingsCollection();

      const result = await repository.save(settings);

      expect(result.isSuccess).toBe(true);
      expect(mockSecureStorage.saveEncrypted).toHaveBeenCalledWith(
        'system_settings',
        expect.any(Object)
      );
    });

    it('should return failure when storage is locked', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(false);

      const settings = new SystemSettingsCollection();

      const result = await repository.save(settings);

      expect(result.isFailure).toBe(true);
      expect(result.error?.message).toContain('Storage is locked');
    });
  });

  describe('load()', () => {
    it('should load and decrypt settings when they exist', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);

      const settingsData: SystemSettings = {
        retryWaitSecondsMin: 30,
        retryWaitSecondsMax: 60,
        retryCount: 3,
        enabledLogSources: ['background', 'popup'],
        securityEventsOnly: false,
        maxStoredLogs: 100,
        logRetentionDays: 7,
      };

      mockSecureStorage.loadEncrypted.mockResolvedValue(Result.success(settingsData));

      const result = await repository.load();

      expect(result.isSuccess).toBe(true);
      const loaded = result.value!;
      expect(loaded).toBeInstanceOf(SystemSettingsCollection);
      expect(loaded.getRetryCount()).toBe(3);
    });

    it('should return default settings when none exist', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);
      mockSecureStorage.loadEncrypted.mockResolvedValue(Result.success(null));

      const result = await repository.load();

      expect(result.isSuccess).toBe(true);
      const loaded = result.value!;
      expect(loaded).toBeInstanceOf(SystemSettingsCollection);
    });

    it('should return failure when storage is locked', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(false);

      const result = await repository.load();

      expect(result.isFailure).toBe(true);
      expect(result.error?.message).toContain('Storage is locked');
    });
  });
});

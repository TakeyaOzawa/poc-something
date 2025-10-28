/**
 * Unit Tests: SecureSystemSettingsRepository
 * Tests the secure system settings repository implementation with encryption
 */

import { SecureSystemSettingsRepository } from '../SecureSystemSettingsRepository';
import { SystemSettingsCollection } from '@domain/entities/SystemSettings';
import { SecureStorage } from '@domain/types/secure-storage-port.types';
import { LogLevel } from '@domain/types/logger.types';

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
  let mockSecureStorage: jest.Mocked<SecureStorage>;
  let repository: SecureSystemSettingsRepository;

  beforeEach(() => {
    mockSecureStorage = createMockSecureStorage();
    repository = new SecureSystemSettingsRepository(mockSecureStorage);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should create repository with SecureStorage dependency', () => {
      expect(repository).toBeInstanceOf(SecureSystemSettingsRepository);
    });
  });

  describe('save()', () => {
    it('should save collection encrypted when storage is unlocked', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);

      const collection = new SystemSettingsCollection({
        retryWaitSecondsMin: 10,
        retryWaitSecondsMax: 30,
        retryCount: 5,
        autoFillProgressDialogMode: 'hidden',
        waitForOptionsMilliseconds: 1000,
        logLevel: LogLevel.DEBUG,
      });

      const result = await repository.save(collection);

      expect(result.isSuccess).toBe(true);
      expect(mockSecureStorage.isUnlocked).toHaveBeenCalled();
      expect(mockSecureStorage.saveEncrypted).toHaveBeenCalledWith(
        'system_settings',
        expect.objectContaining({
          retryWaitSecondsMin: 10,
          retryWaitSecondsMax: 30,
          retryCount: 5,
          autoFillProgressDialogMode: 'hidden',
          waitForOptionsMilliseconds: 1000,
          logLevel: LogLevel.DEBUG,
        })
      );
      expect(mockSecureStorage.extendSession).toHaveBeenCalled();
    });

    it('should save default collection', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);

      const collection = new SystemSettingsCollection();

      const result = await repository.save(collection);

      expect(result.isSuccess).toBe(true);
      expect(mockSecureStorage.saveEncrypted).toHaveBeenCalledWith(
        'system_settings',
        expect.objectContaining({
          retryWaitSecondsMin: 30,
          retryWaitSecondsMax: 60,
          retryCount: 3,
          autoFillProgressDialogMode: 'withCancel',
          waitForOptionsMilliseconds: 500,
          logLevel: LogLevel.INFO,
          enableTabRecording: true,
          enableAudioRecording: false,
          recordingBitrate: 2500000,
          recordingRetentionDays: 10,
          gradientStartColor: '#667eea',
          gradientEndColor: '#764ba2',
          gradientAngle: 135,
        })
      );
    });

    it('should save collection with partial settings', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);

      const collection = new SystemSettingsCollection({
        retryCount: 10,
        logLevel: LogLevel.ERROR,
      });

      const result = await repository.save(collection);

      expect(result.isSuccess).toBe(true);
      const savedData = (mockSecureStorage.saveEncrypted as jest.Mock).mock.calls[0][1];
      expect(savedData.retryCount).toBe(10);
      expect(savedData.logLevel).toBe(LogLevel.ERROR);
      // Other values should be defaults
      expect(savedData.retryWaitSecondsMin).toBe(30);
      expect(savedData.retryWaitSecondsMax).toBe(60);
    });

    it('should return failure when storage is locked', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(false);

      const collection = new SystemSettingsCollection();

      const result = await repository.save(collection);

      expect(result.isFailure).toBe(true);
      expect(result.error?.message).toContain('Failed to save system settings');
      expect(result.error?.message).toContain(
        'Cannot access encrypted data: Storage is locked. Please authenticate first.'
      );
      expect(mockSecureStorage.saveEncrypted).not.toHaveBeenCalled();
      expect(mockSecureStorage.extendSession).not.toHaveBeenCalled();
    });

    it('should preserve all settings during save', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);

      const collection = new SystemSettingsCollection({
        retryWaitSecondsMin: 15,
        retryWaitSecondsMax: 45,
        retryCount: -1, // Infinite retries
        autoFillProgressDialogMode: 'withCancel',
        waitForOptionsMilliseconds: 750,
        logLevel: LogLevel.WARN,
      });

      const result = await repository.save(collection);

      expect(result.isSuccess).toBe(true);
      const savedData = (mockSecureStorage.saveEncrypted as jest.Mock).mock.calls[0][1];
      expect(savedData).toEqual({
        retryWaitSecondsMin: 15,
        retryWaitSecondsMax: 45,
        retryCount: -1,
        autoFillProgressDialogMode: 'withCancel',
        waitForOptionsMilliseconds: 750,
        logLevel: LogLevel.WARN,
        enableTabRecording: true,
        enableAudioRecording: false,
        recordingBitrate: 2500000,
        recordingRetentionDays: 10,
        gradientStartColor: '#667eea',
        gradientEndColor: '#764ba2',
        gradientAngle: 135,
        enabledLogSources: [
          'background',
          'popup',
          'content-script',
          'xpath-manager',
          'automation-variables-manager',
        ],
        securityEventsOnly: false,
        maxStoredLogs: 100,
        logRetentionDays: 7,
      });
    });

    it('should save collection with all log levels', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);

      const logLevels = [
        LogLevel.DEBUG,
        LogLevel.INFO,
        LogLevel.WARN,
        LogLevel.ERROR,
        LogLevel.NONE,
      ];

      for (const level of logLevels) {
        const collection = new SystemSettingsCollection({ logLevel: level });
        const result = await repository.save(collection);

        expect(result.isSuccess).toBe(true);
        const savedData = (mockSecureStorage.saveEncrypted as jest.Mock).mock.calls[
          logLevels.indexOf(level)
        ][1];
        expect(savedData.logLevel).toBe(level);
      }
    });
  });

  describe('load()', () => {
    it('should load and decrypt collection when it exists', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);

      const settingsData = {
        retryWaitSecondsMin: 20,
        retryWaitSecondsMax: 40,
        retryCount: 7,
        autoFillProgressDialogMode: 'hidden',
        waitForOptionsMilliseconds: 800,
        logLevel: LogLevel.DEBUG,
      };

      mockSecureStorage.loadEncrypted.mockResolvedValue(settingsData);

      const result = await repository.load();

      expect(result.isSuccess).toBe(true);
      const loaded = result.value!;
      expect(loaded).toBeInstanceOf(SystemSettingsCollection);
      expect(loaded.getRetryWaitSecondsMin()).toBe(20);
      expect(loaded.getRetryWaitSecondsMax()).toBe(40);
      expect(loaded.getRetryCount()).toBe(7);
      expect(loaded.getAutoFillProgressDialogMode()).toBe('hidden');
      expect(loaded.getWaitForOptionsMilliseconds()).toBe(800);
      expect(loaded.getLogLevel()).toBe(LogLevel.DEBUG);

      expect(mockSecureStorage.isUnlocked).toHaveBeenCalled();
      expect(mockSecureStorage.loadEncrypted).toHaveBeenCalledWith('system_settings');
      expect(mockSecureStorage.extendSession).toHaveBeenCalled();
    });

    it('should return default collection when no data exists', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);
      mockSecureStorage.loadEncrypted.mockResolvedValue(null);

      const result = await repository.load();

      expect(result.isSuccess).toBe(true);
      const loaded = result.value!;
      expect(loaded).toBeInstanceOf(SystemSettingsCollection);
      expect(loaded.getRetryWaitSecondsMin()).toBe(30);
      expect(loaded.getRetryWaitSecondsMax()).toBe(60);
      expect(loaded.getRetryCount()).toBe(3);
      expect(loaded.getAutoFillProgressDialogMode()).toBe('withCancel');
      expect(loaded.getWaitForOptionsMilliseconds()).toBe(500);
      expect(loaded.getLogLevel()).toBe(LogLevel.INFO);
      expect(mockSecureStorage.extendSession).toHaveBeenCalled();
    });

    it('should return default collection when storage returns undefined', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);
      mockSecureStorage.loadEncrypted.mockResolvedValue(undefined);

      const result = await repository.load();

      expect(result.isSuccess).toBe(true);
      const loaded = result.value!;
      expect(loaded).toBeInstanceOf(SystemSettingsCollection);
      expect(loaded.getAll()).toEqual({
        retryWaitSecondsMin: 30,
        retryWaitSecondsMax: 60,
        retryCount: 3,
        autoFillProgressDialogMode: 'withCancel',
        waitForOptionsMilliseconds: 500,
        logLevel: LogLevel.INFO,
        enableTabRecording: true,
        enableAudioRecording: false,
        recordingBitrate: 2500000,
        recordingRetentionDays: 10,
        gradientStartColor: '#667eea',
        gradientEndColor: '#764ba2',
        gradientAngle: 135,
        enabledLogSources: [
          'background',
          'popup',
          'content-script',
          'xpath-manager',
          'automation-variables-manager',
        ],
        securityEventsOnly: false,
        maxStoredLogs: 100,
        logRetentionDays: 7,
      });
    });

    it('should return failure when storage is locked', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(false);

      const result = await repository.load();

      expect(result.isFailure).toBe(true);
      expect(result.error?.message).toContain(
        'Cannot access encrypted data: Storage is locked. Please authenticate first.'
      );

      expect(mockSecureStorage.loadEncrypted).not.toHaveBeenCalled();
      expect(mockSecureStorage.extendSession).not.toHaveBeenCalled();
    });

    it('should correctly reconstruct collection with all properties', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);

      const settingsData = {
        retryWaitSecondsMin: 5,
        retryWaitSecondsMax: 15,
        retryCount: 2,
        autoFillProgressDialogMode: 'withCancel',
        waitForOptionsMilliseconds: 300,
        logLevel: LogLevel.ERROR,
        enableTabRecording: false,
        enableAudioRecording: false,
        recordingBitrate: 3000000,
        recordingRetentionDays: 15,
        gradientStartColor: '#667eea',
        gradientEndColor: '#764ba2',
        gradientAngle: 135,
        enabledLogSources: [
          'background',
          'popup',
          'content-script',
          'xpath-manager',
          'automation-variables-manager',
        ],
        securityEventsOnly: false,
        maxStoredLogs: 100,
        logRetentionDays: 7,
      };

      mockSecureStorage.loadEncrypted.mockResolvedValue(settingsData);

      const result = await repository.load();
      expect(result.isSuccess).toBe(true);
      const loaded = result.value!;
      const allSettings = loaded.getAll();

      expect(allSettings).toEqual(settingsData);
    });

    it('should handle partial settings data with defaults', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);

      const partialData = {
        retryCount: 10,
        logLevel: LogLevel.WARN,
      };

      mockSecureStorage.loadEncrypted.mockResolvedValue(partialData);

      const result = await repository.load();
      expect(result.isSuccess).toBe(true);
      const loaded = result.value!;

      expect(loaded.getRetryCount()).toBe(10);
      expect(loaded.getLogLevel()).toBe(LogLevel.WARN);
      // Other values should be defaults
      expect(loaded.getRetryWaitSecondsMin()).toBe(30);
      expect(loaded.getRetryWaitSecondsMax()).toBe(60);
      expect(loaded.getAutoFillProgressDialogMode()).toBe('withCancel');
      expect(loaded.getWaitForOptionsMilliseconds()).toBe(500);
    });

    it('should load infinite retry count correctly', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);

      const settingsData = {
        retryWaitSecondsMin: 30,
        retryWaitSecondsMax: 60,
        retryCount: -1, // Infinite
        autoFillProgressDialogMode: 'withCancel',
        waitForOptionsMilliseconds: 500,
        logLevel: LogLevel.INFO,
      };

      mockSecureStorage.loadEncrypted.mockResolvedValue(settingsData);

      const result = await repository.load();
      expect(result.isSuccess).toBe(true);
      const loaded = result.value!;

      expect(loaded.getRetryCount()).toBe(-1);
    });
  });

  describe('Session Management', () => {
    it('should extend session after successful save', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);

      const collection = new SystemSettingsCollection();

      await repository.save(collection);

      expect(mockSecureStorage.extendSession).toHaveBeenCalledTimes(1);
    });

    it('should extend session after successful load', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);
      mockSecureStorage.loadEncrypted.mockResolvedValue({});

      await repository.load();

      expect(mockSecureStorage.extendSession).toHaveBeenCalledTimes(1);
    });

    it('should extend session even when no data exists', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);
      mockSecureStorage.loadEncrypted.mockResolvedValue(null);

      await repository.load();

      expect(mockSecureStorage.extendSession).toHaveBeenCalledTimes(1);
    });

    it('should not extend session when operation fails due to lock', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(false);

      const collection = new SystemSettingsCollection();

      const result = await repository.save(collection);

      expect(result.isFailure).toBe(true);
      expect(mockSecureStorage.extendSession).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should provide descriptive error message when locked', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(false);

      const collection = new SystemSettingsCollection();

      const result = await repository.save(collection);

      expect(result.isFailure).toBe(true);
      expect(result.error?.message).toContain(
        'Cannot access encrypted data: Storage is locked. Please authenticate first.'
      );
    });

    it('should propagate SecureStorage errors during save', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);
      mockSecureStorage.saveEncrypted.mockRejectedValue(new Error('Storage write error'));

      const collection = new SystemSettingsCollection();

      const result = await repository.save(collection);

      expect(result.isFailure).toBe(true);
      expect(result.error?.message).toContain('Storage write error');
    });

    it('should propagate SecureStorage errors during load', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);
      mockSecureStorage.loadEncrypted.mockRejectedValue(new Error('Decryption failed'));

      const result = await repository.load();

      expect(result.isFailure).toBe(true);
      expect(result.error?.message).toContain('Decryption failed');
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete workflow: save and load', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);

      // Create and save collection
      const originalCollection = new SystemSettingsCollection({
        retryWaitSecondsMin: 25,
        retryWaitSecondsMax: 50,
        retryCount: 8,
        autoFillProgressDialogMode: 'hidden',
        waitForOptionsMilliseconds: 900,
        logLevel: LogLevel.DEBUG,
      });

      const saveResult = await repository.save(originalCollection);
      expect(saveResult.isSuccess).toBe(true);

      // Load collection
      const savedData = (mockSecureStorage.saveEncrypted as jest.Mock).mock.calls[0][1];
      mockSecureStorage.loadEncrypted.mockResolvedValue(savedData);

      const loadResult = await repository.load();
      expect(loadResult.isSuccess).toBe(true);
      const loadedCollection = loadResult.value!;

      expect(loadedCollection.getAll()).toEqual(originalCollection.getAll());
    });

    it('should handle save-load-modify-save cycle', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);

      // Initial save
      const collection1 = new SystemSettingsCollection({
        retryCount: 5,
        logLevel: LogLevel.INFO,
      });
      const saveResult1 = await repository.save(collection1);
      expect(saveResult1.isSuccess).toBe(true);

      // Load
      const savedData1 = (mockSecureStorage.saveEncrypted as jest.Mock).mock.calls[0][1];
      mockSecureStorage.loadEncrypted.mockResolvedValue(savedData1);
      const loadResult = await repository.load();
      expect(loadResult.isSuccess).toBe(true);
      const loadedCollection = loadResult.value!;

      // Modify
      const collection2 = loadedCollection.withRetryCount(10).withLogLevel(LogLevel.WARN);
      const saveResult2 = await repository.save(collection2);
      expect(saveResult2.isSuccess).toBe(true);

      // Load again
      const savedData2 = (mockSecureStorage.saveEncrypted as jest.Mock).mock.calls[1][1];
      mockSecureStorage.loadEncrypted.mockResolvedValue(savedData2);
      const loadResult2 = await repository.load();
      expect(loadResult2.isSuccess).toBe(true);
      const finalCollection = loadResult2.value!;

      expect(finalCollection.getRetryCount()).toBe(10);
      expect(finalCollection.getLogLevel()).toBe(LogLevel.WARN);
    });

    it('should preserve data integrity through save-load cycle', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);

      const originalSettings = {
        retryWaitSecondsMin: 12,
        retryWaitSecondsMax: 36,
        retryCount: 4,
        autoFillProgressDialogMode: 'withCancel' as const,
        waitForOptionsMilliseconds: 650,
        logLevel: LogLevel.WARN,
        enableTabRecording: true,
        enableAudioRecording: false,
        recordingBitrate: 2500000,
        recordingRetentionDays: 10,
        gradientStartColor: '#667eea',
        gradientEndColor: '#764ba2',
        gradientAngle: 135,
        enabledLogSources: [
          'background',
          'popup',
          'content-script',
          'xpath-manager',
          'automation-variables-manager',
        ],
        securityEventsOnly: false,
        maxStoredLogs: 100,
        logRetentionDays: 7,
      };

      const originalCollection = new SystemSettingsCollection(originalSettings);
      const saveResult = await repository.save(originalCollection);
      expect(saveResult.isSuccess).toBe(true);

      const savedData = (mockSecureStorage.saveEncrypted as jest.Mock).mock.calls[0][1];
      mockSecureStorage.loadEncrypted.mockResolvedValue(savedData);

      const loadResult = await repository.load();
      expect(loadResult.isSuccess).toBe(true);
      const loadedCollection = loadResult.value!;

      expect(loadedCollection.getAll()).toEqual(originalSettings);
    });

    it('should handle multiple consecutive saves', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);

      const collection1 = new SystemSettingsCollection({ retryCount: 1 });
      const collection2 = new SystemSettingsCollection({ retryCount: 2 });
      const collection3 = new SystemSettingsCollection({ retryCount: 3 });

      const result1 = await repository.save(collection1);
      expect(result1.isSuccess).toBe(true);
      const result2 = await repository.save(collection2);
      expect(result2.isSuccess).toBe(true);
      const result3 = await repository.save(collection3);
      expect(result3.isSuccess).toBe(true);

      expect(mockSecureStorage.saveEncrypted).toHaveBeenCalledTimes(3);

      // Last save should have retryCount = 3
      const lastSavedData = (mockSecureStorage.saveEncrypted as jest.Mock).mock.calls[2][1];
      expect(lastSavedData.retryCount).toBe(3);
    });
  });

  describe('Tab Recording Settings', () => {
    it('should save and load tab recording settings', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);

      const collection = new SystemSettingsCollection({
        enableTabRecording: false,
        recordingBitrate: 5000000,
        recordingRetentionDays: 30,
      });

      const saveResult = await repository.save(collection);
      expect(saveResult.isSuccess).toBe(true);

      const savedData = (mockSecureStorage.saveEncrypted as jest.Mock).mock.calls[0][1];
      expect(savedData.enableTabRecording).toBe(false);
      expect(savedData.recordingBitrate).toBe(5000000);
      expect(savedData.recordingRetentionDays).toBe(30);

      mockSecureStorage.loadEncrypted.mockResolvedValue(savedData);
      const loadResult = await repository.load();
      expect(loadResult.isSuccess).toBe(true);
      const loaded = loadResult.value!;

      expect(loaded.getEnableTabRecording()).toBe(false);
      expect(loaded.getRecordingBitrate()).toBe(5000000);
      expect(loaded.getRecordingRetentionDays()).toBe(30);
    });

    it('should use default tab recording settings when not specified', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);

      const collection = new SystemSettingsCollection();

      await repository.save(collection);

      const savedData = (mockSecureStorage.saveEncrypted as jest.Mock).mock.calls[0][1];
      expect(savedData.enableTabRecording).toBe(true);
      expect(savedData.recordingBitrate).toBe(2500000);
      expect(savedData.recordingRetentionDays).toBe(10);
    });

    it('should handle tab recording settings in save-load cycle', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);

      const collection = new SystemSettingsCollection({
        enableTabRecording: true,
        recordingBitrate: 8000000,
        recordingRetentionDays: 7,
      });

      const saveResult = await repository.save(collection);
      expect(saveResult.isSuccess).toBe(true);

      const savedData = (mockSecureStorage.saveEncrypted as jest.Mock).mock.calls[0][1];
      mockSecureStorage.loadEncrypted.mockResolvedValue(savedData);

      const loadResult = await repository.load();
      expect(loadResult.isSuccess).toBe(true);
      const loaded = loadResult.value!;

      expect(loaded.getAll()).toEqual({
        retryWaitSecondsMin: 30,
        retryWaitSecondsMax: 60,
        retryCount: 3,
        autoFillProgressDialogMode: 'withCancel',
        waitForOptionsMilliseconds: 500,
        logLevel: LogLevel.INFO,
        enableTabRecording: true,
        enableAudioRecording: false,
        recordingBitrate: 8000000,
        recordingRetentionDays: 7,
        gradientStartColor: '#667eea',
        gradientEndColor: '#764ba2',
        gradientAngle: 135,
        enabledLogSources: [
          'background',
          'popup',
          'content-script',
          'xpath-manager',
          'automation-variables-manager',
        ],
        securityEventsOnly: false,
        maxStoredLogs: 100,
        logRetentionDays: 7,
      });
    });
  });

  describe('Settings Validation', () => {
    it('should save and load collection with boundary values', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);

      const collection = new SystemSettingsCollection({
        retryWaitSecondsMin: 0,
        retryWaitSecondsMax: 0,
        retryCount: 0,
        autoFillProgressDialogMode: 'hidden',
        waitForOptionsMilliseconds: 0,
        logLevel: LogLevel.DEBUG,
      });

      const saveResult = await repository.save(collection);
      expect(saveResult.isSuccess).toBe(true);

      const savedData = (mockSecureStorage.saveEncrypted as jest.Mock).mock.calls[0][1];
      mockSecureStorage.loadEncrypted.mockResolvedValue(savedData);

      const loadResult = await repository.load();
      expect(loadResult.isSuccess).toBe(true);
      const loaded = loadResult.value!;

      expect(loaded.getRetryWaitSecondsMin()).toBe(0);
      expect(loaded.getRetryWaitSecondsMax()).toBe(0);
      expect(loaded.getRetryCount()).toBe(0);
      expect(loaded.getWaitForOptionsMilliseconds()).toBe(0);
    });

    it('should save and load collection with large values', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);

      const collection = new SystemSettingsCollection({
        retryWaitSecondsMin: 1000,
        retryWaitSecondsMax: 9999,
        retryCount: 999,
        autoFillProgressDialogMode: 'withCancel',
        waitForOptionsMilliseconds: 100000,
        logLevel: LogLevel.NONE,
      });

      const saveResult = await repository.save(collection);
      expect(saveResult.isSuccess).toBe(true);

      const savedData = (mockSecureStorage.saveEncrypted as jest.Mock).mock.calls[0][1];
      mockSecureStorage.loadEncrypted.mockResolvedValue(savedData);

      const loadResult = await repository.load();
      expect(loadResult.isSuccess).toBe(true);
      const loaded = loadResult.value!;

      expect(loaded.getRetryWaitSecondsMin()).toBe(1000);
      expect(loaded.getRetryWaitSecondsMax()).toBe(9999);
      expect(loaded.getRetryCount()).toBe(999);
      expect(loaded.getWaitForOptionsMilliseconds()).toBe(100000);
    });

    it('should use immutable builder pattern correctly', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);

      const collection1 = new SystemSettingsCollection();
      const collection2 = collection1.withRetryCount(10);
      const collection3 = collection2.withLogLevel(LogLevel.ERROR);

      // Original should be unchanged
      expect(collection1.getRetryCount()).toBe(3); // default
      expect(collection1.getLogLevel()).toBe(LogLevel.INFO); // default

      // Modified versions should have new values
      expect(collection2.getRetryCount()).toBe(10);
      expect(collection2.getLogLevel()).toBe(LogLevel.INFO); // unchanged

      expect(collection3.getRetryCount()).toBe(10);
      expect(collection3.getLogLevel()).toBe(LogLevel.ERROR);

      const saveResult = await repository.save(collection3);
      expect(saveResult.isSuccess).toBe(true);

      const savedData = (mockSecureStorage.saveEncrypted as jest.Mock).mock.calls[0][1];
      expect(savedData.retryCount).toBe(10);
      expect(savedData.logLevel).toBe(LogLevel.ERROR);
    });
  });
});

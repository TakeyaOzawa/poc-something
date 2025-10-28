/**
 * Unit Tests: ChromeStorageSystemSettingsRepository
 */

import { ChromeStorageSystemSettingsRepository } from '../ChromeStorageSystemSettingsRepository';
import { SystemSettingsCollection } from '@domain/entities/SystemSettings';
import { NoOpLogger } from '@domain/services/NoOpLogger';
import browser from 'webextension-polyfill';

describe('ChromeStorageSystemSettingsRepository', () => {
  let repository: ChromeStorageSystemSettingsRepository;

  beforeEach(() => {
    repository = new ChromeStorageSystemSettingsRepository(new NoOpLogger());
    jest.clearAllMocks();
  });

  describe('save', () => {
    it('should save system settings to chrome storage', async () => {
      const collection = new SystemSettingsCollection({
        retryWaitSecondsMin: 10,
        retryWaitSecondsMax: 20,
        retryCount: 5,
      });
      (browser.storage.local.set as jest.Mock).mockResolvedValue(undefined);

      const result = await repository.save(collection);

      expect(result.isSuccess).toBe(true);
      const call = (browser.storage.local.set as jest.Mock).mock.calls[0][0];
      expect(call.systemSettings).toContain('"retryWaitSecondsMin": 10');
      expect(call.systemSettings).toContain('"retryWaitSecondsMax": 20');
      expect(call.systemSettings).toContain('"retryCount": 5');
    });

    it('should return failure when save fails', async () => {
      const collection = new SystemSettingsCollection();
      (browser.storage.local.set as jest.Mock).mockRejectedValue(new Error('Storage error'));

      const result = await repository.save(collection);

      expect(result.isFailure).toBe(true);
      expect(result.error?.message).toContain('Failed to save system settings');
      expect(result.error?.message).toContain('Storage error');
    });
  });

  describe('load', () => {
    it('should load system settings from chrome storage with min/max', async () => {
      const json = '{"retryWaitSecondsMin":10,"retryWaitSecondsMax":20,"retryCount":5}';
      (browser.storage.local.get as jest.Mock).mockResolvedValue({
        systemSettings: json,
      });

      const result = await repository.load();

      expect(result.isSuccess).toBe(true);
      const collection = result.value!;
      expect(collection.getRetryWaitSecondsMin()).toBe(10);
      expect(collection.getRetryWaitSecondsMax()).toBe(20);
      expect(collection.getRetryCount()).toBe(5);
      expect(browser.storage.local.get).toHaveBeenCalledWith('systemSettings');
    });

    it('should handle backward compatibility with old retryWaitSeconds', async () => {
      const json = '{"retryWaitSeconds":180}';
      (browser.storage.local.get as jest.Mock).mockResolvedValue({
        systemSettings: json,
      });

      const result = await repository.load();

      expect(result.isSuccess).toBe(true);
      const collection = result.value!;
      expect(collection.getRetryWaitSecondsMin()).toBe(180);
      expect(collection.getRetryWaitSecondsMax()).toBe(180);
    });

    it('should return default settings when no data in storage', async () => {
      (browser.storage.local.get as jest.Mock).mockResolvedValue({});

      const result = await repository.load();

      expect(result.isSuccess).toBe(true);
      const collection = result.value!;
      expect(collection.getRetryWaitSecondsMin()).toBe(30);
      expect(collection.getRetryWaitSecondsMax()).toBe(60);
      expect(collection.getRetryCount()).toBe(3);
    });

    it('should return failure when load fails', async () => {
      (browser.storage.local.get as jest.Mock).mockRejectedValue(new Error('Storage read error'));

      const result = await repository.load();

      expect(result.isFailure).toBe(true);
      expect(result.error?.message).toContain('Failed to load system settings');
      expect(result.error?.message).toContain('Storage read error');
    });
  });
});

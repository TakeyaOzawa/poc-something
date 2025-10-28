/**
 * Unit Tests: ChromeStorageSyncHistoryRepository
 */

import browser from 'webextension-polyfill';
import { ChromeStorageSyncHistoryRepository } from '../ChromeStorageSyncHistoryRepository';
import { SyncHistory } from '@domain/entities/SyncHistory';
import { Logger } from '@domain/types/logger.types';
import { Result } from '@domain/values/result.value';

// Mock browser API
jest.mock('webextension-polyfill', () => ({
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
    },
  },
}));

const STORAGE_KEY = 'syncHistories';

describe('ChromeStorageSyncHistoryRepository', () => {
  let repository: ChromeStorageSyncHistoryRepository;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockLogger = {
      info: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      setLevel: jest.fn(),
      getLevel: jest.fn(),
      createChild: jest.fn().mockReturnThis(),
    } as any;

    repository = new ChromeStorageSyncHistoryRepository(mockLogger);
  });

  // Helper to create test sync history
  const createTestHistory = (configId: string = 'config-123', overrides = {}) =>
    SyncHistory.create({
      configId,
      storageKey: 'testKey',
      syncDirection: 'bidirectional',
      startTime: Date.now(),
      ...overrides,
    });

  describe('save', () => {
    it('should save new sync history', async () => {
      const history = createTestHistory();

      (browser.storage.local.get as jest.Mock).mockResolvedValue({
        [STORAGE_KEY]: [],
      });
      (browser.storage.local.set as jest.Mock).mockResolvedValue(undefined);

      await repository.save(history);

      expect(browser.storage.local.set).toHaveBeenCalledWith({
        [STORAGE_KEY]: [history.toData()],
      });
      expect(mockLogger.debug).toHaveBeenCalledWith('Sync history saved', { id: history.getId() });
    });

    it('should update existing sync history', async () => {
      const history = createTestHistory();
      const existingData = [history.toData()];

      (browser.storage.local.get as jest.Mock).mockResolvedValue({
        [STORAGE_KEY]: existingData,
      });
      (browser.storage.local.set as jest.Mock).mockResolvedValue(undefined);

      // Update the history by calling complete()
      history.complete({ status: 'failed', error: 'Test error' });
      await repository.save(history);

      const savedData = (browser.storage.local.set as jest.Mock).mock.calls[0][0][STORAGE_KEY];
      expect(savedData).toHaveLength(1);
      expect(savedData[0].id).toBe(history.getId());
      expect(savedData[0].status).toBe('failed');
      expect(savedData[0].error).toBe('Test error');
    });

    it('should append new history to existing histories', async () => {
      const history1 = createTestHistory('config-1');
      const history2 = createTestHistory('config-2');

      (browser.storage.local.get as jest.Mock).mockResolvedValue({
        [STORAGE_KEY]: [history1.toData()],
      });
      (browser.storage.local.set as jest.Mock).mockResolvedValue(undefined);

      await repository.save(history2);

      const savedData = (browser.storage.local.set as jest.Mock).mock.calls[0][0][STORAGE_KEY];
      expect(savedData).toHaveLength(2);
      expect(savedData[0].id).toBe(history1.getId());
      expect(savedData[1].id).toBe(history2.getId());
    });

    it('should limit histories to MAX_HISTORIES (1000)', async () => {
      const existingHistories = Array.from({ length: 1000 }, (_, i) =>
        createTestHistory(`config-${i}`).toData()
      );

      (browser.storage.local.get as jest.Mock).mockResolvedValue({
        [STORAGE_KEY]: existingHistories,
      });
      (browser.storage.local.set as jest.Mock).mockResolvedValue(undefined);

      const newHistory = createTestHistory('config-new');
      await repository.save(newHistory);

      const savedData = (browser.storage.local.set as jest.Mock).mock.calls[0][0][STORAGE_KEY];
      expect(savedData).toHaveLength(1000); // Should not exceed MAX_HISTORIES
    });

    it('should return failure if save fails', async () => {
      const history = createTestHistory();

      (browser.storage.local.get as jest.Mock).mockResolvedValue({});
      (browser.storage.local.set as jest.Mock).mockRejectedValue(new Error('Storage error'));

      const result = await repository.save(history);
      expect(result.isFailure).toBe(true);
      expect(result.error!.message).toContain('Storage error');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to save sync history',
        expect.any(Error)
      );
    });
  });

  describe('findById', () => {
    it('should find sync history by ID', async () => {
      const history = createTestHistory();

      (browser.storage.local.get as jest.Mock).mockResolvedValue({
        [STORAGE_KEY]: [history.toData()],
      });

      const result = await repository.findById(history.getId());

      expect(result.isSuccess).toBe(true);
      const found = result.value!;
      expect(found).toBeInstanceOf(SyncHistory);
      expect(found?.getId()).toBe(history.getId());
      expect(found?.getConfigId()).toBe('config-123');
    });

    it('should return null if history not found', async () => {
      (browser.storage.local.get as jest.Mock).mockResolvedValue({
        [STORAGE_KEY]: [],
      });

      const result = await repository.findById('nonexistent');

      expect(result.isSuccess).toBe(true);
      expect(result.value).toBeNull();
    });

    it('should return failure if findById fails', async () => {
      (browser.storage.local.get as jest.Mock).mockRejectedValue(new Error('Storage error'));

      const result = await repository.findById('test-id');

      expect(result.isFailure).toBe(true);
      expect(result.error!.message).toContain('Storage error');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to find sync history by ID',
        expect.any(Error)
      );
    });
  });

  describe('findByConfigId', () => {
    it('should find histories by config ID', async () => {
      const history1 = createTestHistory('config-123');
      const history2 = createTestHistory('config-123');
      const history3 = createTestHistory('config-456');

      (browser.storage.local.get as jest.Mock).mockResolvedValue({
        [STORAGE_KEY]: [history1.toData(), history2.toData(), history3.toData()],
      });

      const result = await repository.findByConfigId('config-123');

      expect(result.isSuccess).toBe(true);
      const histories = result.value!;

      expect(histories).toHaveLength(2);
      expect(histories[0].getConfigId()).toBe('config-123');
      expect(histories[1].getConfigId()).toBe('config-123');
    });

    it('should sort histories by created time (newest first)', async () => {
      const history1 = createTestHistory('config-123', { startTime: 1000 });
      const history2 = createTestHistory('config-123', { startTime: 3000 });
      const history3 = createTestHistory('config-123', { startTime: 2000 });

      // Mock createdAt timestamps
      const data1 = history1.toData();
      const data2 = history2.toData();
      const data3 = history3.toData();
      data1.createdAt = 1000;
      data2.createdAt = 3000;
      data3.createdAt = 2000;

      (browser.storage.local.get as jest.Mock).mockResolvedValue({
        [STORAGE_KEY]: [data1, data2, data3],
      });

      const result = await repository.findByConfigId('config-123');

      expect(result.isSuccess).toBe(true);
      const histories = result.value!;

      expect(histories).toHaveLength(3);
      expect(histories[0].toData().createdAt).toBe(3000); // Newest first
      expect(histories[1].toData().createdAt).toBe(2000);
      expect(histories[2].toData().createdAt).toBe(1000);
    });

    it('should apply limit when specified', async () => {
      const historyData = Array.from({ length: 10 }, (_, i) =>
        createTestHistory('config-123').toData()
      );

      (browser.storage.local.get as jest.Mock).mockResolvedValue({
        [STORAGE_KEY]: historyData,
      });

      const result = await repository.findByConfigId('config-123', 5);

      expect(result.isSuccess).toBe(true);
      const histories = result.value!;

      expect(histories).toHaveLength(5);
    });

    it('should return empty array if no histories found', async () => {
      (browser.storage.local.get as jest.Mock).mockResolvedValue({
        [STORAGE_KEY]: [],
      });

      const result = await repository.findByConfigId('config-123');

      expect(result.isSuccess).toBe(true);
      const histories = result.value!;

      expect(histories).toEqual([]);
    });

    it('should return failure if findByConfigId fails', async () => {
      (browser.storage.local.get as jest.Mock).mockRejectedValue(new Error('Storage error'));

      const result = await repository.findByConfigId('config-123');

      expect(result.isFailure).toBe(true);
      expect(result.error!.message).toContain('Storage error');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to find sync histories by config ID',
        expect.any(Error)
      );
    });
  });

  describe('findRecent', () => {
    it('should find recent histories with limit', async () => {
      const historyData = Array.from({ length: 10 }, (_, i) =>
        createTestHistory(`config-${i}`).toData()
      );

      (browser.storage.local.get as jest.Mock).mockResolvedValue({
        [STORAGE_KEY]: historyData,
      });

      const result = await repository.findRecent(5);

      expect(result.isSuccess).toBe(true);
      const histories = result.value!;

      expect(histories).toHaveLength(5);
    });

    it('should sort histories by created time (newest first)', async () => {
      const history1 = createTestHistory('config-1', { startTime: 1000 });
      const history2 = createTestHistory('config-2', { startTime: 3000 });
      const history3 = createTestHistory('config-3', { startTime: 2000 });

      const data1 = history1.toData();
      const data2 = history2.toData();
      const data3 = history3.toData();
      data1.createdAt = 1000;
      data2.createdAt = 3000;
      data3.createdAt = 2000;

      (browser.storage.local.get as jest.Mock).mockResolvedValue({
        [STORAGE_KEY]: [data1, data2, data3],
      });

      const result = await repository.findRecent(3);

      expect(result.isSuccess).toBe(true);
      const histories = result.value!;

      expect(histories).toHaveLength(3);
      expect(histories[0].toData().createdAt).toBe(3000); // Newest first
      expect(histories[1].toData().createdAt).toBe(2000);
      expect(histories[2].toData().createdAt).toBe(1000);
    });

    it('should return empty array if no histories exist', async () => {
      (browser.storage.local.get as jest.Mock).mockResolvedValue({
        [STORAGE_KEY]: [],
      });

      const result = await repository.findRecent(10);

      expect(result.isSuccess).toBe(true);
      const histories = result.value!;

      expect(histories).toEqual([]);
    });

    it('should return failure if findRecent fails', async () => {
      (browser.storage.local.get as jest.Mock).mockRejectedValue(new Error('Storage error'));

      const result = await repository.findRecent(10);

      expect(result.isFailure).toBe(true);
      expect(result.error!.message).toContain('Storage error');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to find recent sync histories',
        expect.any(Error)
      );
    });
  });

  describe('delete', () => {
    it('should delete sync history by ID', async () => {
      const history1 = createTestHistory('config-1');
      const history2 = createTestHistory('config-2');

      (browser.storage.local.get as jest.Mock).mockResolvedValue({
        [STORAGE_KEY]: [history1.toData(), history2.toData()],
      });
      (browser.storage.local.set as jest.Mock).mockResolvedValue(undefined);

      const result = await repository.delete(history1.getId());
      expect(result.isSuccess).toBe(true);

      const savedData = (browser.storage.local.set as jest.Mock).mock.calls[0][0][STORAGE_KEY];
      expect(savedData).toHaveLength(1);
      expect(savedData[0].id).toBe(history2.getId());
      expect(mockLogger.debug).toHaveBeenCalledWith('Sync history deleted', {
        id: history1.getId(),
      });
    });

    it('should handle deleting non-existent history', async () => {
      const history = createTestHistory();

      (browser.storage.local.get as jest.Mock).mockResolvedValue({
        [STORAGE_KEY]: [history.toData()],
      });
      (browser.storage.local.set as jest.Mock).mockResolvedValue(undefined);

      const result = await repository.delete('nonexistent');
      expect(result.isSuccess).toBe(true);

      const savedData = (browser.storage.local.set as jest.Mock).mock.calls[0][0][STORAGE_KEY];
      expect(savedData).toHaveLength(1); // Original history still there
      expect(savedData[0].id).toBe(history.getId());
    });

    it('should return failure if delete fails', async () => {
      (browser.storage.local.get as jest.Mock).mockResolvedValue({
        [STORAGE_KEY]: [],
      });
      (browser.storage.local.set as jest.Mock).mockRejectedValue(new Error('Storage error'));

      const result = await repository.delete('test-id');

      expect(result.isFailure).toBe(true);
      expect(result.error!.message).toContain('Storage error');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to delete sync history',
        expect.any(Error)
      );
    });
  });

  describe('deleteOlderThan', () => {
    it('should delete histories older than specified days', async () => {
      const now = Date.now();
      const oneDayAgo = now - 24 * 60 * 60 * 1000;
      const tenDaysAgo = now - 10 * 24 * 60 * 60 * 1000;
      const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

      const recentHistory = createTestHistory('config-1');
      const oldHistory1 = createTestHistory('config-2');
      const oldHistory2 = createTestHistory('config-3');

      const recentData = recentHistory.toData();
      const oldData1 = oldHistory1.toData();
      const oldData2 = oldHistory2.toData();
      recentData.createdAt = oneDayAgo;
      oldData1.createdAt = tenDaysAgo;
      oldData2.createdAt = thirtyDaysAgo;

      (browser.storage.local.get as jest.Mock).mockResolvedValue({
        [STORAGE_KEY]: [recentData, oldData1, oldData2],
      });
      (browser.storage.local.set as jest.Mock).mockResolvedValue(undefined);

      const result = await repository.deleteOlderThan(7);

      expect(result.isSuccess).toBe(true);
      const deletedCount = result.value!;

      expect(deletedCount).toBe(2); // oldHistory1 and oldHistory2
      const savedData = (browser.storage.local.set as jest.Mock).mock.calls[0][0][STORAGE_KEY];
      expect(savedData).toHaveLength(1);
      expect(savedData[0].id).toBe(recentHistory.getId());
      expect(mockLogger.info).toHaveBeenCalledWith('Deleted old sync histories', {
        deletedCount: 2,
        days: 7,
      });
    });

    it('should return 0 if no old histories to delete', async () => {
      const recentHistory = createTestHistory();
      const recentData = recentHistory.toData();
      recentData.createdAt = Date.now();

      (browser.storage.local.get as jest.Mock).mockResolvedValue({
        [STORAGE_KEY]: [recentData],
      });

      const result = await repository.deleteOlderThan(30);

      expect(result.isSuccess).toBe(true);
      const deletedCount = result.value!;

      expect(deletedCount).toBe(0);
      expect(browser.storage.local.set).not.toHaveBeenCalled(); // No update needed
    });

    it('should return failure if deleteOlderThan fails', async () => {
      (browser.storage.local.get as jest.Mock).mockRejectedValue(new Error('Storage error'));

      const result = await repository.deleteOlderThan(30);

      expect(result.isFailure).toBe(true);
      expect(result.error!.message).toContain('Storage error');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to delete old sync histories',
        expect.any(Error)
      );
    });
  });

  describe('count', () => {
    it('should return total count of histories', async () => {
      const histories = Array.from({ length: 5 }, (_, i) =>
        createTestHistory(`config-${i}`).toData()
      );

      (browser.storage.local.get as jest.Mock).mockResolvedValue({
        [STORAGE_KEY]: histories,
      });

      const result = await repository.count();

      expect(result.isSuccess).toBe(true);
      const count = result.value!;

      expect(count).toBe(5);
    });

    it('should return 0 if no histories exist', async () => {
      (browser.storage.local.get as jest.Mock).mockResolvedValue({
        [STORAGE_KEY]: [],
      });

      const result = await repository.count();

      expect(result.isSuccess).toBe(true);
      const count = result.value!;

      expect(count).toBe(0);
    });

    it('should return failure if count fails', async () => {
      (browser.storage.local.get as jest.Mock).mockRejectedValue(new Error('Storage error'));

      const result = await repository.count();

      expect(result.isFailure).toBe(true);
      expect(result.error!.message).toContain('Storage error');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to count sync histories',
        expect.any(Error)
      );
    });
  });

  describe('countByConfigId', () => {
    it('should return count of histories for specific config', async () => {
      const history1 = createTestHistory('config-123');
      const history2 = createTestHistory('config-123');
      const history3 = createTestHistory('config-456');

      (browser.storage.local.get as jest.Mock).mockResolvedValue({
        [STORAGE_KEY]: [history1.toData(), history2.toData(), history3.toData()],
      });

      const result = await repository.countByConfigId('config-123');

      expect(result.isSuccess).toBe(true);
      const count = result.value!;

      expect(count).toBe(2);
    });

    it('should return 0 if no histories for config', async () => {
      const history = createTestHistory('config-456');

      (browser.storage.local.get as jest.Mock).mockResolvedValue({
        [STORAGE_KEY]: [history.toData()],
      });

      const result = await repository.countByConfigId('config-123');

      expect(result.isSuccess).toBe(true);
      const count = result.value!;

      expect(count).toBe(0);
    });

    it('should return failure if countByConfigId fails', async () => {
      (browser.storage.local.get as jest.Mock).mockRejectedValue(new Error('Storage error'));

      const result = await repository.countByConfigId('config-123');

      expect(result.isFailure).toBe(true);
      expect(result.error!.message).toContain('Storage error');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to count sync histories by config ID',
        expect.any(Error)
      );
    });
  });

  describe('edge cases', () => {
    it('should handle empty storage', async () => {
      (browser.storage.local.get as jest.Mock).mockResolvedValue({});

      const result = await repository.findRecent(10);

      expect(result.isSuccess).toBe(true);
      const histories = result.value!;

      expect(histories).toEqual([]);
    });

    it('should handle storage with non-array value', async () => {
      (browser.storage.local.get as jest.Mock).mockResolvedValue({
        [STORAGE_KEY]: null,
      });

      const result = await repository.findRecent(10);

      expect(result.isSuccess).toBe(true);
      const histories = result.value!;

      expect(histories).toEqual([]);
    });

    it('should handle very large history collections', async () => {
      const historyData = Array.from({ length: 10000 }, (_, i) =>
        createTestHistory(`config-${i}`).toData()
      );

      (browser.storage.local.get as jest.Mock).mockResolvedValue({
        [STORAGE_KEY]: historyData,
      });

      const result = await repository.findRecent(100);

      expect(result.isSuccess).toBe(true);
      const histories = result.value!;

      expect(histories).toHaveLength(100);
    });
  });
});

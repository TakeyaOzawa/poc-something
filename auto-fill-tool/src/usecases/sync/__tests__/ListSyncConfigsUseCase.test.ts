/**
 * Unit Tests: ListSyncConfigsUseCase
 */

import { ListSyncConfigsUseCase } from '../ListSyncConfigsUseCase';
import { StorageSyncConfig } from '@domain/entities/StorageSyncConfig';
import { StorageSyncConfigRepository } from '@domain/repositories/StorageSyncConfigRepository';
import { Logger } from '@domain/types/logger.types';
import { Result } from '@domain/values/result.value';

describe('ListSyncConfigsUseCase', () => {
  let useCase: ListSyncConfigsUseCase;
  let mockRepository: jest.Mocked<StorageSyncConfigRepository>;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRepository = {
      save: jest.fn(),
      load: jest.fn(),
      loadByStorageKey: jest.fn(),
      loadAll: jest.fn(),
      loadAllEnabledPeriodic: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
    } as any;

    mockLogger = {
      info: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      setLevel: jest.fn(),
      getLevel: jest.fn(),
      createChild: jest.fn().mockReturnThis(),
    } as any;

    useCase = new ListSyncConfigsUseCase(mockRepository, mockLogger);
  });

  // Helper to create a test config
  const createTestConfig = (overrides = {}) =>
    StorageSyncConfig.create({
      storageKey: 'testData',
      syncMethod: 'notion' as const,
      syncTiming: 'manual' as const,
      syncDirection: 'bidirectional' as const,
      inputs: [{ key: 'apiKey', value: 'test-token' }],
      outputs: [{ key: 'data', defaultValue: [] }],
      ...overrides,
    });

  describe('execute - list all configs', () => {
    it('should list all configs when no filters specified', async () => {
      const config1 = createTestConfig({ storageKey: 'data1' });
      const config2 = createTestConfig({ storageKey: 'data2' });
      const config3 = createTestConfig({ storageKey: 'data3' });

      mockRepository.loadAll.mockResolvedValue(Result.success([config1, config2, config3]));

      const result = await useCase.execute({});

      expect(result.success).toBe(true);
      expect(result.configs).toHaveLength(3);
      expect(result.count).toBe(3);
      expect(mockRepository.loadAll).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('Listing sync configs');
      expect(mockLogger.info).toHaveBeenCalledWith('Found 3 sync config(s)');
    });

    it('should return empty array when no configs exist', async () => {
      mockRepository.loadAll.mockResolvedValue(Result.success([]));

      const result = await useCase.execute({});

      expect(result.success).toBe(true);
      expect(result.configs).toHaveLength(0);
      expect(result.count).toBe(0);
      expect(mockLogger.info).toHaveBeenCalledWith('Found 0 sync config(s)');
    });

    it('should list single config', async () => {
      const config = createTestConfig();
      mockRepository.loadAll.mockResolvedValue(Result.success([config]));

      const result = await useCase.execute({});

      expect(result.success).toBe(true);
      expect(result.configs).toHaveLength(1);
      expect(result.count).toBe(1);
    });

    it('should list many configs', async () => {
      const configs = Array.from({ length: 10 }, (_, i) =>
        createTestConfig({ storageKey: `data${i}` })
      );
      mockRepository.loadAll.mockResolvedValue(Result.success(configs));

      const result = await useCase.execute({});

      expect(result.success).toBe(true);
      expect(result.configs).toHaveLength(10);
      expect(result.count).toBe(10);
    });
  });

  describe('execute - filter by enabled periodic', () => {
    it('should list only enabled periodic configs', async () => {
      const periodicConfig1 = createTestConfig({
        storageKey: 'periodic1',
        syncTiming: 'periodic',
        syncIntervalSeconds: 300,
      });
      const periodicConfig2 = createTestConfig({
        storageKey: 'periodic2',
        syncTiming: 'periodic',
        syncIntervalSeconds: 600,
      });

      mockRepository.loadAllEnabledPeriodic.mockResolvedValue(
        Result.success([periodicConfig1, periodicConfig2])
      );

      const result = await useCase.execute({ enabledPeriodicOnly: true });

      expect(result.success).toBe(true);
      expect(result.configs).toHaveLength(2);
      expect(result.count).toBe(2);
      expect(mockRepository.loadAllEnabledPeriodic).toHaveBeenCalled();
      expect(mockRepository.loadAll).not.toHaveBeenCalled();
      expect(mockLogger.debug).toHaveBeenCalledWith('Loading enabled periodic sync configs');
    });

    it('should return empty array when no enabled periodic configs exist', async () => {
      mockRepository.loadAllEnabledPeriodic.mockResolvedValue(Result.success([]));

      const result = await useCase.execute({ enabledPeriodicOnly: true });

      expect(result.success).toBe(true);
      expect(result.configs).toHaveLength(0);
      expect(result.count).toBe(0);
    });

    it('should return only enabled periodic configs, not manual configs', async () => {
      const periodicConfig = createTestConfig({
        syncTiming: 'periodic',
        syncIntervalSeconds: 300,
      });
      mockRepository.loadAllEnabledPeriodic.mockResolvedValue(Result.success([periodicConfig]));

      const result = await useCase.execute({ enabledPeriodicOnly: true });

      expect(result.success).toBe(true);
      expect(result.configs).toHaveLength(1);
      expect(result.configs?.[0].getSyncTiming()).toBe('periodic');
    });
  });

  describe('execute - filter by storage key', () => {
    it('should list config for specific storage key when it exists', async () => {
      const config = createTestConfig({ storageKey: 'specificKey' });
      mockRepository.loadByStorageKey.mockResolvedValue(Result.success(config));

      const result = await useCase.execute({ storageKey: 'specificKey' });

      expect(result.success).toBe(true);
      expect(result.configs).toHaveLength(1);
      expect(result.configs?.[0].getStorageKey()).toBe('specificKey');
      expect(result.count).toBe(1);
      expect(mockRepository.loadByStorageKey).toHaveBeenCalledWith('specificKey');
      expect(mockRepository.loadAll).not.toHaveBeenCalled();
      expect(mockLogger.debug).toHaveBeenCalledWith('Loading config for storage key: specificKey');
    });

    it('should return empty array when storage key not found', async () => {
      mockRepository.loadByStorageKey.mockResolvedValue(Result.success(null));

      const result = await useCase.execute({ storageKey: 'nonExistent' });

      expect(result.success).toBe(true);
      expect(result.configs).toHaveLength(0);
      expect(result.count).toBe(0);
      expect(mockRepository.loadByStorageKey).toHaveBeenCalledWith('nonExistent');
    });

    it('should treat empty string storage key as list all', async () => {
      mockRepository.loadAll.mockResolvedValue(Result.success([]));

      const result = await useCase.execute({ storageKey: '' });

      expect(result.success).toBe(true);
      expect(result.configs).toHaveLength(0);
      expect(mockRepository.loadAll).toHaveBeenCalled();
      expect(mockRepository.loadByStorageKey).not.toHaveBeenCalled();
    });
  });

  describe('execute - filter priority', () => {
    it('should prioritize storageKey over enabledPeriodicOnly', async () => {
      const config = createTestConfig({ storageKey: 'testKey' });
      mockRepository.loadByStorageKey.mockResolvedValue(Result.success(config));

      const result = await useCase.execute({
        storageKey: 'testKey',
        enabledPeriodicOnly: true,
      });

      expect(result.success).toBe(true);
      expect(mockRepository.loadByStorageKey).toHaveBeenCalledWith('testKey');
      expect(mockRepository.loadAllEnabledPeriodic).not.toHaveBeenCalled();
      expect(mockRepository.loadAll).not.toHaveBeenCalled();
    });
  });

  describe('execute - error handling', () => {
    it('should handle repository loadAll error', async () => {
      mockRepository.loadAll.mockResolvedValue(
        Result.failure(new Error('Database connection failed'))
      );

      const result = await useCase.execute({});

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database connection failed');
      expect(result.configs).toBeUndefined();
      expect(result.count).toBeUndefined();
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to list sync configs',
        expect.any(Error)
      );
    });

    it('should handle repository loadAllEnabledPeriodic error', async () => {
      mockRepository.loadAllEnabledPeriodic.mockResolvedValue(
        Result.failure(new Error('Query timeout'))
      );

      const result = await useCase.execute({ enabledPeriodicOnly: true });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Query timeout');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to list sync configs',
        expect.any(Error)
      );
    });

    it('should handle repository loadByStorageKey error', async () => {
      mockRepository.loadByStorageKey.mockResolvedValue(
        Result.failure(new Error('Storage key lookup failed'))
      );

      const result = await useCase.execute({ storageKey: 'testKey' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Storage key lookup failed');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to list sync configs',
        expect.any(Error)
      );
    });
  });

  describe('execute - complex scenarios', () => {
    it('should list configs with different sync methods', async () => {
      const notionConfig = createTestConfig({ storageKey: 'notion1', syncMethod: 'notion' });
      const spreadsheetConfig = createTestConfig({
        storageKey: 'sheet1',
        syncMethod: 'spread-sheet',
        inputs: [
          { key: 'spreadsheetId', value: 'sheet-123' },
          { key: 'apiKey', value: 'test-key' },
        ],
      });

      mockRepository.loadAll.mockResolvedValue(Result.success([notionConfig, spreadsheetConfig]));

      const result = await useCase.execute({});

      expect(result.success).toBe(true);
      expect(result.configs).toHaveLength(2);
      expect(result.configs?.[0].getSyncMethod()).toBe('notion');
      expect(result.configs?.[1].getSyncMethod()).toBe('spread-sheet');
    });

    it('should list configs with different sync directions', async () => {
      const bidirectionalConfig = createTestConfig({ syncDirection: 'bidirectional' });
      const receiveOnlyConfig = createTestConfig({
        storageKey: 'receive1',
        syncDirection: 'receive_only',
      });
      const sendOnlyConfig = createTestConfig({
        storageKey: 'send1',
        syncDirection: 'send_only',
      });

      mockRepository.loadAll.mockResolvedValue(
        Result.success([bidirectionalConfig, receiveOnlyConfig, sendOnlyConfig])
      );

      const result = await useCase.execute({});

      expect(result.success).toBe(true);
      expect(result.configs).toHaveLength(3);
    });

    it('should handle disabled configs in list all', async () => {
      const enabledConfig = createTestConfig({ storageKey: 'enabled1' });
      const disabledConfig = createTestConfig({ storageKey: 'disabled1' }).setEnabled(false);

      mockRepository.loadAll.mockResolvedValue(Result.success([enabledConfig, disabledConfig]));

      const result = await useCase.execute({});

      expect(result.success).toBe(true);
      expect(result.configs).toHaveLength(2);
      expect(result.configs?.[0].isEnabled()).toBe(true);
      expect(result.configs?.[1].isEnabled()).toBe(false);
    });
  });
});

/**
 * Unit Tests: ChromeStorageStorageSyncConfigRepository
 */

import browser from 'webextension-polyfill';
import { ChromeStorageStorageSyncConfigRepository } from '../ChromeStorageStorageSyncConfigRepository';
import { IdGenerator } from '@domain/types/id-generator.types';
import { StorageSyncConfig } from '@domain/entities/StorageSyncConfig';
import { Logger } from '@domain/types/logger.types';
import { STORAGE_KEYS } from '@domain/constants/StorageKeys';
import { Result } from '@domain/values/result.value';

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(),
};

// Mock browser API
jest.mock('webextension-polyfill', () => ({
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
    },
  },
}));

describe('ChromeStorageStorageSyncConfigRepository', () => {
  let repository: ChromeStorageStorageSyncConfigRepository;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset mockIdGenerator with fresh IDs for each test
    (mockIdGenerator.generate as jest.Mock)
      .mockReturnValueOnce('config-1')
      .mockReturnValueOnce('config-2')
      .mockReturnValueOnce('config-3')
      .mockReturnValueOnce('config-4')
      .mockReturnValueOnce('config-5')
      .mockReturnValueOnce('config-6')
      .mockReturnValueOnce('config-7')
      .mockReturnValueOnce('config-8')
      .mockReturnValueOnce('config-9')
      .mockReturnValueOnce('config-10')
      .mockReturnValue('mock-sync-id');

    mockLogger = {
      info: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      createChild: jest.fn().mockReturnThis(),
    } as any;

    repository = new ChromeStorageStorageSyncConfigRepository(mockLogger);
  });

  describe(
    'save',
    () => {
      it('should save new storage sync config', async () => {
        const config = StorageSyncConfig.create(
          {
            storageKey: 'automationVariables',
            syncMethod: 'notion',
            syncTiming: 'manual',
            syncDirection: 'bidirectional',
            inputs: [{ key: 'apiKey', value: 'test-key' }],
            outputs: [{ key: 'data', defaultValue: [] }],
          },
          mockIdGenerator
        );

        (browser.storage.local.get as jest.Mock).mockResolvedValue({
          [STORAGE_KEYS.STORAGE_SYNC_CONFIGS]: [],
        });
        (browser.storage.local.set as jest.Mock).mockResolvedValue(undefined);

        const result = await repository.save(config);

        expect(result.isSuccess).toBe(true);
        expect(browser.storage.local.set).toHaveBeenCalledWith({
          [STORAGE_KEYS.STORAGE_SYNC_CONFIGS]: [config.toData()],
        });
        expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('created'));
      });

      it('should update existing storage sync config', async () => {
        const config = StorageSyncConfig.create(
          {
            storageKey: 'automationVariables',
            syncMethod: 'notion',
            syncTiming: 'manual',
            syncDirection: 'bidirectional',
            inputs: [{ key: 'apiKey', value: 'test-key' }],
            outputs: [{ key: 'data', defaultValue: [] }],
          },
          mockIdGenerator
        );

        const existingData = [config.toData()];

        (browser.storage.local.get as jest.Mock).mockResolvedValue({
          [STORAGE_KEYS.STORAGE_SYNC_CONFIGS]: existingData,
        });
        (browser.storage.local.set as jest.Mock).mockResolvedValue(undefined);

        const updated = config.setEnabled(false);
        const result = await repository.save(updated);

        expect(result.isSuccess).toBe(true);
        const savedData = (browser.storage.local.set as jest.Mock).mock.calls[0][0][
          STORAGE_KEYS.STORAGE_SYNC_CONFIGS
        ];
        expect(savedData).toHaveLength(1);
        expect(savedData[0].id).toBe(config.getId());
        expect(savedData[0].enabled).toBe(false);
        expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('updated'));
      });

      it(
        'should append to existing storage',
        async () => {
          const config1 = StorageSyncConfig.create(
            {
              storageKey: 'automationVariables',
              syncMethod: 'spread-sheet',
              syncTiming: 'manual',
              syncDirection: 'bidirectional',
              inputs: [{ key: 'spreadsheetId', value: 'sheet-123' }],
              outputs: [{ key: 'result', defaultValue: null }],
            },
            mockIdGenerator
          );

          const config2 = StorageSyncConfig.create(
            {
              storageKey: 'websiteConfigs',
              syncMethod: 'notion',
              syncTiming: 'periodic',
              syncIntervalSeconds: 300,
              syncDirection: 'receive_only',
              inputs: [{ key: 'databaseId', value: 'db-456' }],
              outputs: [{ key: 'configs', defaultValue: [] }],
            },
            mockIdGenerator
          );

          (browser.storage.local.get as jest.Mock).mockResolvedValue({
            [STORAGE_KEYS.STORAGE_SYNC_CONFIGS]: [config1.toData()],
          });
          (browser.storage.local.set as jest.Mock).mockResolvedValue(undefined);

          const result = await repository.save(config2);

          expect(result.isSuccess).toBe(true);
          const savedData = (browser.storage.local.set as jest.Mock).mock.calls[0][0][
            STORAGE_KEYS.STORAGE_SYNC_CONFIGS
          ];
          expect(savedData).toHaveLength(2);
          expect(savedData[0].id).toBe(config1.getId());
          expect(savedData[1].id).toBe(config2.getId());
        },
        mockIdGenerator
      );

      it(
        'should return failure if save fails',
        async () => {
          const config = StorageSyncConfig.create(
            {
              storageKey: 'automationVariables',
              syncMethod: 'spread-sheet',
              syncTiming: 'manual',
              syncDirection: 'bidirectional',
              inputs: [],
              outputs: [],
            },
            mockIdGenerator
          );

          (browser.storage.local.get as jest.Mock).mockResolvedValue({});
          (browser.storage.local.set as jest.Mock).mockRejectedValue(new Error('Storage error'));

          const result = await repository.save(config);

          expect(result.isFailure).toBe(true);
          expect(result.error!.message).toBe('Storage error');
          expect(mockLogger.error).toHaveBeenCalledWith(
            'Failed to save storage sync config',
            expect.any(Error)
          );
        },
        mockIdGenerator
      );
    },
    mockIdGenerator
  );

  describe('load', () => {
    it(
      'should load storage sync config by id',
      async () => {
        const config = StorageSyncConfig.create(
          {
            storageKey: 'automationVariables',
            syncMethod: 'notion',
            syncTiming: 'manual',
            syncDirection: 'bidirectional',
            inputs: [{ key: 'apiKey', value: 'test-key' }],
            outputs: [{ key: 'data', defaultValue: [] }],
          },
          mockIdGenerator
        );

        (browser.storage.local.get as jest.Mock).mockResolvedValue(
          {
            [STORAGE_KEYS.STORAGE_SYNC_CONFIGS]: [config.toData()],
          },
          mockIdGenerator
        );

        const result = await repository.load(config.getId());

        expect(result.isSuccess).toBe(true);
        const loaded = result.value!;
        expect(loaded).toBeInstanceOf(StorageSyncConfig);
        expect(loaded.getId()).toBe(config.getId());
        expect(loaded.getStorageKey()).toBe('automationVariables');
        expect(loaded.getSyncMethod()).toBe('notion');
      },
      mockIdGenerator
    );

    it('should return success with null value if config not found', async () => {
      (browser.storage.local.get as jest.Mock).mockResolvedValue(
        {
          [STORAGE_KEYS.STORAGE_SYNC_CONFIGS]: [],
        },
        mockIdGenerator
      );

      const result = await repository.load('nonexistent');

      expect(result.isSuccess).toBe(true);
      expect(result.value).toBeNull();
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('No storage sync config found')
      );
    });

    it('should return failure if load fails', async () => {
      (browser.storage.local.get as jest.Mock).mockRejectedValue(new Error('Storage error'));

      const result = await repository.load('test-id');

      expect(result.isFailure).toBe(true);
      expect(result.error!.message).toBe('Storage error');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to load storage sync config',
        expect.any(Error)
      );
    });
  });

  describe('loadByStorageKey', () => {
    it(
      'should load storage sync config by storage key',
      async () => {
        const config = StorageSyncConfig.create(
          {
            storageKey: 'automationVariables',
            syncMethod: 'spread-sheet',
            syncTiming: 'manual',
            syncDirection: 'bidirectional',
            inputs: [{ key: 'spreadsheetId', value: 'sheet-123' }],
            outputs: [{ key: 'result', defaultValue: null }],
          },
          mockIdGenerator
        );

        (browser.storage.local.get as jest.Mock).mockResolvedValue(
          {
            [STORAGE_KEYS.STORAGE_SYNC_CONFIGS]: [config.toData()],
          },
          mockIdGenerator
        );

        const result = await repository.loadByStorageKey('automationVariables');

        expect(result.isSuccess).toBe(true);
        const loaded = result.value!;
        expect(loaded).toBeInstanceOf(StorageSyncConfig);
        expect(loaded.getStorageKey()).toBe('automationVariables');
        expect(loaded.getSyncMethod()).toBe('spread-sheet');
      },
      mockIdGenerator
    );

    it('should return success with null value if config not found by storage key', async () => {
      (browser.storage.local.get as jest.Mock).mockResolvedValue(
        {
          [STORAGE_KEYS.STORAGE_SYNC_CONFIGS]: [],
        },
        mockIdGenerator
      );

      const result = await repository.loadByStorageKey('nonexistent');

      expect(result.isSuccess).toBe(true);
      expect(result.value).toBeNull();
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('No storage sync config found for storage key')
      );
    });

    it('should return failure if load fails', async () => {
      (browser.storage.local.get as jest.Mock).mockRejectedValue(new Error('Storage error'));

      const result = await repository.loadByStorageKey('automationVariables');

      expect(result.isFailure).toBe(true);
      expect(result.error!.message).toBe('Storage error');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to load storage sync config by storage key',
        expect.any(Error)
      );
    });
  });

  describe('loadAll', () => {
    it(
      'should load all storage sync configs',
      async () => {
        const config1 = StorageSyncConfig.create(
          {
            storageKey: 'automationVariables',
            syncMethod: 'spread-sheet',
            syncTiming: 'manual',
            syncDirection: 'bidirectional',
            inputs: [{ key: 'spreadsheetId', value: 'sheet-123' }],
            outputs: [{ key: 'result', defaultValue: null }],
          },
          mockIdGenerator
        );

        const config2 = StorageSyncConfig.create(
          {
            storageKey: 'websiteConfigs',
            syncMethod: 'notion',
            syncTiming: 'periodic',
            syncIntervalSeconds: 300,
            syncDirection: 'receive_only',
            inputs: [{ key: 'databaseId', value: 'db-456' }],
            outputs: [{ key: 'configs', defaultValue: [] }],
          },
          mockIdGenerator
        );

        (browser.storage.local.get as jest.Mock).mockResolvedValue(
          {
            [STORAGE_KEYS.STORAGE_SYNC_CONFIGS]: [config1.toData(), config2.toData()],
          },
          mockIdGenerator
        );

        const result = await repository.loadAll();

        expect(result.isSuccess).toBe(true);
        const configs = result.value!;
        expect(configs).toHaveLength(2);
        expect(configs[0].getId()).toBe(config1.getId());
        expect(configs[1].getId()).toBe(config2.getId());
        expect(mockLogger.info).toHaveBeenCalledWith('Loading all storage sync configs');
      },
      mockIdGenerator
    );

    it('should return success with empty array if no configs exist', async () => {
      (browser.storage.local.get as jest.Mock).mockResolvedValue({});

      const result = await repository.loadAll();

      expect(result.isSuccess).toBe(true);
      expect(result.value).toEqual([]);
    });

    it('should return failure if loadAll fails', async () => {
      (browser.storage.local.get as jest.Mock).mockRejectedValue(new Error('Storage error'));

      const result = await repository.loadAll();

      expect(result.isFailure).toBe(true);
      expect(result.error!.message).toBe('Storage error');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to load all storage sync configs',
        expect.any(Error)
      );
    });
  });

  describe('loadAllEnabledPeriodic', () => {
    it(
      'should load enabled periodic sync configs (all sync methods)',
      async () => {
        const notionPeriodicConfig = StorageSyncConfig.create(
          {
            storageKey: 'automationVariables',
            syncMethod: 'notion',
            syncTiming: 'periodic',
            syncIntervalSeconds: 300,
            syncDirection: 'bidirectional',
            inputs: [{ key: 'databaseId', value: 'db-123' }],
            outputs: [{ key: 'data', defaultValue: [] }],
          },
          mockIdGenerator
        );

        const spreadsheetPeriodicConfig = StorageSyncConfig.create(
          {
            storageKey: 'websiteConfigs',
            syncMethod: 'spread-sheet',
            syncTiming: 'periodic',
            syncIntervalSeconds: 600,
            syncDirection: 'receive_only',
            inputs: [{ key: 'spreadsheetId', value: 'sheet-456' }],
            outputs: [{ key: 'configs', defaultValue: [] }],
          },
          mockIdGenerator
        );

        const disabledPeriodicConfig = notionPeriodicConfig.setEnabled(false);

        const manualConfig = StorageSyncConfig.create(
          {
            storageKey: 'otherData',
            syncMethod: 'notion',
            syncTiming: 'manual',
            syncDirection: 'receive_only',
            inputs: [{ key: 'apiKey', value: 'key-789' }],
            outputs: [{ key: 'result', defaultValue: null }],
          },
          mockIdGenerator
        );

        (browser.storage.local.get as jest.Mock).mockResolvedValue(
          {
            [STORAGE_KEYS.STORAGE_SYNC_CONFIGS]: [
              notionPeriodicConfig.toData(),
              spreadsheetPeriodicConfig.toData(),
              disabledPeriodicConfig.toData(),
              manualConfig.toData(),
            ],
          },
          mockIdGenerator
        );

        const result = await repository.loadAllEnabledPeriodic();

        expect(result.isSuccess).toBe(true);
        const configs = result.value!;
        expect(configs).toHaveLength(2);
        expect(configs[0].getId()).toBe(notionPeriodicConfig.getId());
        expect(configs[0].isEnabled()).toBe(true);
        expect(configs[0].getSyncTiming()).toBe('periodic');
        expect(configs[1].getId()).toBe(spreadsheetPeriodicConfig.getId());
        expect(configs[1].isEnabled()).toBe(true);
        expect(configs[1].getSyncTiming()).toBe('periodic');
      },
      mockIdGenerator
    );

    it('should return success with empty array if no enabled periodic configs exist', async () => {
      (browser.storage.local.get as jest.Mock).mockResolvedValue(
        {
          [STORAGE_KEYS.STORAGE_SYNC_CONFIGS]: [],
        },
        mockIdGenerator
      );

      const result = await repository.loadAllEnabledPeriodic();

      expect(result.isSuccess).toBe(true);
      expect(result.value).toEqual([]);
    });

    it('should return failure if loadAllEnabledPeriodic fails', async () => {
      (browser.storage.local.get as jest.Mock).mockRejectedValue(new Error('Storage error'));

      const result = await repository.loadAllEnabledPeriodic();

      expect(result.isFailure).toBe(true);
      expect(result.error!.message).toBe('Storage error');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to load enabled periodic storage sync configs',
        expect.any(Error)
      );
    });
  });

  describe(
    'delete',
    () => {
      it('should delete storage sync config by id', async () => {
        const config1 = StorageSyncConfig.create(
          {
            storageKey: 'automationVariables',
            syncMethod: 'spread-sheet',
            syncTiming: 'manual',
            syncDirection: 'bidirectional',
            inputs: [],
            outputs: [],
          },
          mockIdGenerator
        );

        const config2 = StorageSyncConfig.create(
          {
            storageKey: 'websiteConfigs',
            syncMethod: 'spread-sheet',
            syncTiming: 'manual',
            syncDirection: 'bidirectional',
            inputs: [],
            outputs: [],
          },
          mockIdGenerator
        );

        (browser.storage.local.get as jest.Mock).mockResolvedValue({
          [STORAGE_KEYS.STORAGE_SYNC_CONFIGS]: [config1.toData(), config2.toData()],
        });
        (browser.storage.local.set as jest.Mock).mockResolvedValue(undefined);

        const result = await repository.delete(config1.getId());

        expect(result.isSuccess).toBe(true);
        const savedData = (browser.storage.local.set as jest.Mock).mock.calls[0][0][
          STORAGE_KEYS.STORAGE_SYNC_CONFIGS
        ];
        expect(savedData).toHaveLength(1);
        expect(savedData[0].id).toBe(config2.getId());
        expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('deleted'));
      });

      it(
        'should return success if config not found to delete',
        async () => {
          (browser.storage.local.get as jest.Mock).mockResolvedValue(
            {
              [STORAGE_KEYS.STORAGE_SYNC_CONFIGS]: [],
            },
            mockIdGenerator
          );

          const result = await repository.delete('nonexistent');

          expect(result.isSuccess).toBe(true);
          expect(mockLogger.warn).toHaveBeenCalledWith(
            expect.stringContaining('No storage sync config found to delete')
          );
        },
        mockIdGenerator
      );

      it(
        'should return failure if delete operation fails',
        async () => {
          const config = StorageSyncConfig.create(
            {
              storageKey: 'automationVariables',
              syncMethod: 'spread-sheet',
              syncTiming: 'manual',
              syncDirection: 'bidirectional',
              inputs: [],
              outputs: [],
            },
            mockIdGenerator
          );

          (browser.storage.local.get as jest.Mock).mockResolvedValue(
            {
              [STORAGE_KEYS.STORAGE_SYNC_CONFIGS]: [config.toData()],
            },
            mockIdGenerator
          );
          (browser.storage.local.set as jest.Mock).mockRejectedValue(new Error('Storage error'));

          const result = await repository.delete(config.getId());

          expect(result.isFailure).toBe(true);
          expect(result.error!.message).toBe('Storage error');
          expect(mockLogger.error).toHaveBeenCalledWith(
            'Failed to delete storage sync config',
            expect.any(Error)
          );
        },
        mockIdGenerator
      );
    },
    mockIdGenerator
  );

  describe(
    'deleteByStorageKey',
    () => {
      it('should delete storage sync config by storage key', async () => {
        const config1 = StorageSyncConfig.create(
          {
            storageKey: 'automationVariables',
            syncMethod: 'spread-sheet',
            syncTiming: 'manual',
            syncDirection: 'bidirectional',
            inputs: [],
            outputs: [],
          },
          mockIdGenerator
        );

        const config2 = StorageSyncConfig.create(
          {
            storageKey: 'websiteConfigs',
            syncMethod: 'spread-sheet',
            syncTiming: 'manual',
            syncDirection: 'bidirectional',
            inputs: [],
            outputs: [],
          },
          mockIdGenerator
        );

        (browser.storage.local.get as jest.Mock).mockResolvedValue({
          [STORAGE_KEYS.STORAGE_SYNC_CONFIGS]: [config1.toData(), config2.toData()],
        });
        (browser.storage.local.set as jest.Mock).mockResolvedValue(undefined);

        const result = await repository.deleteByStorageKey('automationVariables');

        expect(result.isSuccess).toBe(true);
        const savedData = (browser.storage.local.set as jest.Mock).mock.calls[0][0][
          STORAGE_KEYS.STORAGE_SYNC_CONFIGS
        ];
        expect(savedData).toHaveLength(1);
        expect(savedData[0].storageKey).toBe('websiteConfigs');
        expect(mockLogger.info).toHaveBeenCalledWith(
          expect.stringContaining('deleted for storage key')
        );
      });

      it(
        'should return success if config not found to delete by storage key',
        async () => {
          (browser.storage.local.get as jest.Mock).mockResolvedValue({
            [STORAGE_KEYS.STORAGE_SYNC_CONFIGS]: [],
          });

          const result = await repository.deleteByStorageKey('nonexistent');

          expect(result.isSuccess).toBe(true);
          expect(mockLogger.warn).toHaveBeenCalledWith(
            expect.stringContaining('No storage sync config found to delete for storage key')
          );
        },
        mockIdGenerator
      );

      it(
        'should return failure if deleteByStorageKey operation fails',
        async () => {
          const config = StorageSyncConfig.create(
            {
              storageKey: 'automationVariables',
              syncMethod: 'spread-sheet',
              syncTiming: 'manual',
              syncDirection: 'bidirectional',
              inputs: [],
              outputs: [],
            },
            mockIdGenerator
          );

          (browser.storage.local.get as jest.Mock).mockResolvedValue(
            {
              [STORAGE_KEYS.STORAGE_SYNC_CONFIGS]: [config.toData()],
            },
            mockIdGenerator
          );
          (browser.storage.local.set as jest.Mock).mockRejectedValue(new Error('Storage error'));

          const result = await repository.deleteByStorageKey('automationVariables');

          expect(result.isFailure).toBe(true);
          expect(result.error!.message).toBe('Storage error');
          expect(mockLogger.error).toHaveBeenCalledWith(
            'Failed to delete storage sync config by storage key',
            expect.any(Error)
          );
        },
        mockIdGenerator
      );
    },
    mockIdGenerator
  );

  describe('exists', () => {
    it(
      'should return success with true if config exists by id',
      async () => {
        const config = StorageSyncConfig.create(
          {
            storageKey: 'automationVariables',
            syncMethod: 'spread-sheet',
            syncTiming: 'manual',
            syncDirection: 'bidirectional',
            inputs: [],
            outputs: [],
          },
          mockIdGenerator
        );

        (browser.storage.local.get as jest.Mock).mockResolvedValue(
          {
            [STORAGE_KEYS.STORAGE_SYNC_CONFIGS]: [config.toData()],
          },
          mockIdGenerator
        );

        const result = await repository.exists(config.getId());

        expect(result.isSuccess).toBe(true);
        expect(result.value).toBe(true);
      },
      mockIdGenerator
    );

    it(
      'should return success with false if config does not exist',
      async () => {
        (browser.storage.local.get as jest.Mock).mockResolvedValue(
          {
            [STORAGE_KEYS.STORAGE_SYNC_CONFIGS]: [],
          },
          mockIdGenerator
        );

        const result = await repository.exists('nonexistent');

        expect(result.isSuccess).toBe(true);
        expect(result.value).toBe(false);
      },
      mockIdGenerator
    );

    it('should return failure if exists check fails', async () => {
      (browser.storage.local.get as jest.Mock).mockRejectedValue(new Error('Storage error'));

      const result = await repository.exists('test-id');

      expect(result.isFailure).toBe(true);
      expect(result.error!.message).toBe('Storage error');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to check storage sync config existence',
        expect.any(Error)
      );
    });
  });

  describe('existsByStorageKey', () => {
    it(
      'should return success with true if config exists by storage key',
      async () => {
        const config = StorageSyncConfig.create(
          {
            storageKey: 'automationVariables',
            syncMethod: 'spread-sheet',
            syncTiming: 'manual',
            syncDirection: 'bidirectional',
            inputs: [],
            outputs: [],
          },
          mockIdGenerator
        );

        (browser.storage.local.get as jest.Mock).mockResolvedValue(
          {
            [STORAGE_KEYS.STORAGE_SYNC_CONFIGS]: [config.toData()],
          },
          mockIdGenerator
        );

        const result = await repository.existsByStorageKey('automationVariables');

        expect(result.isSuccess).toBe(true);
        expect(result.value).toBe(true);
      },
      mockIdGenerator
    );

    it(
      'should return success with false if config does not exist by storage key',
      async () => {
        (browser.storage.local.get as jest.Mock).mockResolvedValue(
          {
            [STORAGE_KEYS.STORAGE_SYNC_CONFIGS]: [],
          },
          mockIdGenerator
        );

        const result = await repository.existsByStorageKey('nonexistent');

        expect(result.isSuccess).toBe(true);
        expect(result.value).toBe(false);
      },
      mockIdGenerator
    );

    it('should return failure if existsByStorageKey check fails', async () => {
      (browser.storage.local.get as jest.Mock).mockRejectedValue(new Error('Storage error'));

      const result = await repository.existsByStorageKey('automationVariables');

      expect(result.isFailure).toBe(true);
      expect(result.error!.message).toBe('Storage error');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to check storage sync config existence by storage key',
        expect.any(Error)
      );
    });
  });
});

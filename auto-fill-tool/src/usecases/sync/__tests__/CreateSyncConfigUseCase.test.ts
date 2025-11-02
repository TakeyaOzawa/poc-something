/**
 * Unit Tests: CreateSyncConfigUseCase
 */

import { CreateSyncConfigUseCase } from '../CreateSyncConfigUseCase';
import { StorageSyncConfig } from '@domain/entities/StorageSyncConfig';
import { IdGenerator } from '@domain/types/id-generator.types';
// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-sync-id'),
};
import { StorageSyncConfigRepository } from '@domain/repositories/StorageSyncConfigRepository';
// Mock IdGenerator
import { Logger } from '@domain/types/logger.types';
import { Result } from '@domain/values/result.value';

describe('CreateSyncConfigUseCase', () => {
  let useCase: CreateSyncConfigUseCase;
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

    useCase = new CreateSyncConfigUseCase(mockRepository, mockLogger, mockIdGenerator);
  });

  describe('execute - success cases', () => {
    it('should create a new notion sync config successfully', async () => {
      mockRepository.loadByStorageKey.mockResolvedValue(Result.success(null));
      mockRepository.save.mockResolvedValue(Result.success(undefined));

      const input = {
        storageKey: 'testData',
        enabled: true,
        syncMethod: 'notion' as const,
        syncTiming: 'periodic' as const,
        syncDirection: 'bidirectional' as const,
        syncIntervalSeconds: 300,
        inputs: [
          { key: 'apiKey', value: 'test-token' },
          { key: 'databaseId', value: 'db-123' },
        ],
        outputs: [{ key: 'data', defaultValue: [] }],
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(true);
      expect(result.config).toBeDefined();
      expect(result.config?.getStorageKey()).toBe('testData');
      expect(result.config?.getSyncMethod()).toBe('notion');
      expect(result.config?.getSyncTiming()).toBe('periodic');
      expect(result.config?.getSyncDirection()).toBe('bidirectional');

      expect(mockRepository.loadByStorageKey).toHaveBeenCalledWith('testData');
      expect(mockRepository.save).toHaveBeenCalledWith(expect.any(StorageSyncConfig));
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Creating sync config for storage key: testData'
      );
    });

    it('should create a manual sync config', async () => {
      mockRepository.loadByStorageKey.mockResolvedValue(Result.success(null));
      mockRepository.save.mockResolvedValue(Result.success(undefined));

      const input = {
        storageKey: 'manualData',
        enabled: true,
        syncMethod: 'notion' as const,
        syncTiming: 'manual' as const,
        syncDirection: 'receive_only' as const,
        inputs: [{ key: 'apiKey', value: 'test-token' }],
        outputs: [],
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(true);
      expect(result.config?.getSyncTiming()).toBe('manual');
      expect(result.config?.getSyncIntervalSeconds()).toBeUndefined();
    });

    it('should create a receive-only sync config', async () => {
      mockRepository.loadByStorageKey.mockResolvedValue(Result.success(null));
      mockRepository.save.mockResolvedValue(Result.success(undefined));

      const input = {
        storageKey: 'receiveData',
        enabled: true,
        syncMethod: 'notion' as const,
        syncTiming: 'manual' as const,
        syncDirection: 'receive_only' as const,
        inputs: [{ key: 'apiKey', value: 'test-token' }],
        outputs: [],
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(true);
      expect(result.config?.getSyncDirection()).toBe('receive_only');
      expect(result.config?.getInputs()).toHaveLength(1);
    });

    it('should create a send-only sync config', async () => {
      mockRepository.loadByStorageKey.mockResolvedValue(Result.success(null));
      mockRepository.save.mockResolvedValue(Result.success(undefined));

      const input = {
        storageKey: 'sendData',
        enabled: true,
        syncMethod: 'notion' as const,
        syncTiming: 'manual' as const,
        syncDirection: 'send_only' as const,
        inputs: [],
        outputs: [{ key: 'data', defaultValue: [] }],
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(true);
      expect(result.config?.getSyncDirection()).toBe('send_only');
      expect(result.config?.getOutputs()).toHaveLength(1);
    });

    it('should create a spread-sheet sync config', async () => {
      mockRepository.loadByStorageKey.mockResolvedValue(Result.success(null));
      mockRepository.save.mockResolvedValue(Result.success(undefined));

      const input = {
        storageKey: 'sheetData',
        enabled: true,
        syncMethod: 'spread-sheet' as const,
        syncTiming: 'manual' as const,
        syncDirection: 'bidirectional' as const,
        inputs: [
          { key: 'spreadsheetId', value: 'sheet-123' },
          { key: 'apiKey', value: 'test-key' },
        ],
        outputs: [{ key: 'rows', defaultValue: [] }],
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(true);
      expect(result.config?.getSyncMethod()).toBe('spread-sheet');
    });
  });

  describe('execute - validation errors', () => {
    it(
      'should fail when config already exists for storage key',
      async () => {
        const existingConfig = StorageSyncConfig.create(
          {
            storageKey: 'existingData',
            syncMethod: 'notion',
            syncTiming: 'manual',
            syncDirection: 'receive_only',
            inputs: [{ key: 'apiKey', value: 'test-token' }],
            outputs: [],
          },
          mockIdGenerator
        );

        mockRepository.loadByStorageKey.mockResolvedValue(Result.success(existingConfig));

        const input = {
          storageKey: 'existingData',
          enabled: true,
          syncMethod: 'notion' as const,
          syncTiming: 'manual' as const,
          syncDirection: 'receive_only' as const,
          inputs: [{ key: 'apiKey', value: 'test-token' }],
          outputs: [],
        };

        const result = await useCase.execute(input);

        expect(result.success).toBe(false);
        expect(result.error).toBe(
          'Sync configuration already exists for storage key: existingData'
        );
        expect(mockRepository.save).not.toHaveBeenCalled();
        expect(mockLogger.warn).toHaveBeenCalledWith(
          'Sync config already exists for storage key: existingData'
        );
      },
      mockIdGenerator
    );

    it(
      'should fail when bidirectional sync has no inputs',
      async () => {
        mockRepository.loadByStorageKey.mockResolvedValue(Result.success(null));

        const input = {
          storageKey: 'testData',
          enabled: true,
          syncMethod: 'notion' as const,
          syncTiming: 'manual' as const,
          syncDirection: 'bidirectional' as const,
          inputs: [],
          outputs: [{ key: 'data', defaultValue: [] }],
        };

        const result = await useCase.execute(input);

        expect(result.success).toBe(false);
        expect(result.error).toBe(
          'Input configuration is required for bidirectional or receive-only sync'
        );
        expect(mockRepository.save).not.toHaveBeenCalled();
      },
      mockIdGenerator
    );

    it(
      'should fail when bidirectional sync has no outputs',
      async () => {
        mockRepository.loadByStorageKey.mockResolvedValue(Result.success(null));

        const input = {
          storageKey: 'testData',
          enabled: true,
          syncMethod: 'notion' as const,
          syncTiming: 'manual' as const,
          syncDirection: 'bidirectional' as const,
          inputs: [{ key: 'apiKey', value: 'test-token' }],
          outputs: [],
        };

        const result = await useCase.execute(input);

        expect(result.success).toBe(false);
        expect(result.error).toBe(
          'Output configuration is required for bidirectional or send-only sync'
        );
        expect(mockRepository.save).not.toHaveBeenCalled();
      },
      mockIdGenerator
    );

    it('should fail when receive_only sync has no inputs', async () => {
      mockRepository.loadByStorageKey.mockResolvedValue(Result.success(null));

      const input = {
        storageKey: 'testData',
        enabled: true,
        syncMethod: 'notion' as const,
        syncTiming: 'manual' as const,
        syncDirection: 'receive_only' as const,
        inputs: [],
        outputs: [],
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        'Input configuration is required for bidirectional or receive-only sync'
      );
    });

    it('should fail when send_only sync has no outputs', async () => {
      mockRepository.loadByStorageKey.mockResolvedValue(Result.success(null));

      const input = {
        storageKey: 'testData',
        enabled: true,
        syncMethod: 'notion' as const,
        syncTiming: 'manual' as const,
        syncDirection: 'send_only' as const,
        inputs: [],
        outputs: [],
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        'Output configuration is required for bidirectional or send-only sync'
      );
    });

    it('should fail when periodic sync has no interval', async () => {
      mockRepository.loadByStorageKey.mockResolvedValue(Result.success(null));

      const input = {
        storageKey: 'testData',
        enabled: true,
        syncMethod: 'notion' as const,
        syncTiming: 'periodic' as const,
        syncDirection: 'receive_only' as const,
        inputs: [{ key: 'apiKey', value: 'test-token' }],
        outputs: [],
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Sync interval must be at least 1 second for periodic sync');
    });

    it('should fail when periodic sync has interval less than 1', async () => {
      mockRepository.loadByStorageKey.mockResolvedValue(Result.success(null));

      const input = {
        storageKey: 'testData',
        enabled: true,
        syncMethod: 'notion' as const,
        syncTiming: 'periodic' as const,
        syncDirection: 'receive_only' as const,
        syncIntervalSeconds: 0,
        inputs: [{ key: 'apiKey', value: 'test-token' }],
        outputs: [],
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Sync interval must be at least 1 second for periodic sync');
    });
  });

  describe('execute - error handling', () => {
    it('should handle repository loadByStorageKey error', async () => {
      mockRepository.loadByStorageKey.mockResolvedValue(
        Result.failure(new Error('Database error'))
      );

      const input = {
        storageKey: 'testData',
        enabled: true,
        syncMethod: 'notion' as const,
        syncTiming: 'manual' as const,
        syncDirection: 'receive_only' as const,
        inputs: [{ key: 'apiKey', value: 'test-token' }],
        outputs: [],
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('should handle repository save error', async () => {
      mockRepository.loadByStorageKey.mockResolvedValue(Result.success(null));
      mockRepository.save.mockResolvedValue(Result.failure(new Error('Save failed')));

      const input = {
        storageKey: 'testData',
        enabled: true,
        syncMethod: 'notion' as const,
        syncTiming: 'manual' as const,
        syncDirection: 'receive_only' as const,
        inputs: [{ key: 'apiKey', value: 'test-token' }],
        outputs: [],
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Save failed');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to save sync config',
        expect.any(Error)
      );
    });

    it('should handle non-Error exceptions', async () => {
      const stringError = 'String error';
      mockRepository.loadByStorageKey.mockResolvedValue(
        Result.failure({ message: stringError } as any)
      );

      const input = {
        storageKey: 'testData',
        enabled: true,
        syncMethod: 'notion' as const,
        syncTiming: 'manual' as const,
        syncDirection: 'receive_only' as const,
        inputs: [{ key: 'apiKey', value: 'test-token' }],
        outputs: [],
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(false);
      expect(result.error).toBe(stringError);
    });
  });

  describe('execute - complex scenarios', () => {
    it('should create config with multiple inputs', async () => {
      mockRepository.loadByStorageKey.mockResolvedValue(Result.success(null));
      mockRepository.save.mockResolvedValue(Result.success(undefined));

      const input = {
        storageKey: 'multiInputData',
        enabled: true,
        syncMethod: 'notion' as const,
        syncTiming: 'periodic' as const,
        syncDirection: 'bidirectional' as const,
        syncIntervalSeconds: 600,
        inputs: [
          { key: 'apiKey', value: 'test-api-key-123' },
          { key: 'databaseId', value: 'db-456' },
          { key: 'pageId', value: 'page-789' },
        ],
        outputs: [{ key: 'data', defaultValue: [] }],
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(true);
      expect(result.config).toBeDefined();
      expect(result.config?.getInputs()).toHaveLength(3);
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should create config with multiple outputs', async () => {
      mockRepository.loadByStorageKey.mockResolvedValue(Result.success(null));
      mockRepository.save.mockResolvedValue(Result.success(undefined));

      const input = {
        storageKey: 'multiOutputData',
        enabled: true,
        syncMethod: 'notion' as const,
        syncTiming: 'manual' as const,
        syncDirection: 'bidirectional' as const,
        inputs: [{ key: 'apiKey', value: 'test-token' }],
        outputs: [
          { key: 'users', defaultValue: [] },
          { key: 'posts', defaultValue: [] },
          { key: 'comments', defaultValue: [] },
        ],
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(true);
      expect(result.config?.getOutputs()).toHaveLength(3);
    });
  });
});

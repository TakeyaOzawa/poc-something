/**
 * Unit Tests: UpdateSyncConfigUseCase
 */

import { UpdateSyncConfigUseCase } from '../UpdateSyncConfigUseCase';
import { StorageSyncConfig } from '@domain/entities/StorageSyncConfig';
import { StorageSyncConfigRepository } from '@domain/repositories/StorageSyncConfigRepository';
import { Logger } from '@domain/types/logger.types';
import { Result } from '@domain/values/result.value';

describe('UpdateSyncConfigUseCase', () => {
  let useCase: UpdateSyncConfigUseCase;
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

    useCase = new UpdateSyncConfigUseCase(mockRepository, mockLogger);
  });

  // Helper to create a test config
  const createTestConfig = (overrides = {}) =>
    StorageSyncConfig.create({
      storageKey: 'testData',
      syncMethod: 'notion' as const,
      syncTiming: 'manual' as const,
      syncDirection: 'bidirectional' as const,
      inputs: [{ key: 'apiKey', value: 'test-token-123' }],
      outputs: [{ key: 'data', defaultValue: [] }],
      ...overrides,
    });

  describe('execute - success cases', () => {
    it('should update enabled status', async () => {
      const existingConfig = createTestConfig();
      mockRepository.load.mockResolvedValue(Result.success(existingConfig));
      mockRepository.save.mockResolvedValue(Result.success(undefined));

      const input = {
        id: existingConfig.getId(),
        enabled: false,
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(true);
      expect(result.config).toBeDefined();
      expect(result.config?.isEnabled()).toBe(false);
      expect(mockRepository.load).toHaveBeenCalledWith(existingConfig.getId());
      expect(mockRepository.save).toHaveBeenCalledWith(expect.any(StorageSyncConfig));
      expect(mockLogger.info).toHaveBeenCalledWith(
        `Successfully updated sync config: ${existingConfig.getId()}`
      );
    });

    it('should update sync timing from manual to periodic', async () => {
      const existingConfig = createTestConfig();
      mockRepository.load.mockResolvedValue(Result.success(existingConfig));
      mockRepository.save.mockResolvedValue(Result.success(undefined));

      const input = {
        id: existingConfig.getId(),
        syncTiming: 'periodic' as const,
        syncIntervalSeconds: 300,
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(true);
      expect(result.config?.getSyncTiming()).toBe('periodic');
      expect(result.config?.getSyncIntervalSeconds()).toBe(300);
    });

    it('should update sync timing from periodic to manual', async () => {
      const existingConfig = createTestConfig({
        syncTiming: 'periodic',
        syncIntervalSeconds: 300,
      });
      mockRepository.load.mockResolvedValue(Result.success(existingConfig));
      mockRepository.save.mockResolvedValue(Result.success(undefined));

      const input = {
        id: existingConfig.getId(),
        syncTiming: 'manual' as const,
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(true);
      expect(result.config?.getSyncTiming()).toBe('manual');
    });

    it('should update sync direction from bidirectional to receive_only', async () => {
      const existingConfig = createTestConfig();
      mockRepository.load.mockResolvedValue(Result.success(existingConfig));
      mockRepository.save.mockResolvedValue(Result.success(undefined));

      const input = {
        id: existingConfig.getId(),
        syncDirection: 'receive_only' as const,
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(true);
      expect(result.config?.getSyncDirection()).toBe('receive_only');
    });

    it('should update sync direction from bidirectional to send_only', async () => {
      const existingConfig = createTestConfig();
      mockRepository.load.mockResolvedValue(Result.success(existingConfig));
      mockRepository.save.mockResolvedValue(Result.success(undefined));

      const input = {
        id: existingConfig.getId(),
        syncDirection: 'send_only' as const,
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(true);
      expect(result.config?.getSyncDirection()).toBe('send_only');
    });

    it('should update inputs', async () => {
      const existingConfig = createTestConfig();
      mockRepository.load.mockResolvedValue(Result.success(existingConfig));
      mockRepository.save.mockResolvedValue(Result.success(undefined));

      const newInputs = [
        { key: 'apiKey', value: 'new-token' },
        { key: 'databaseId', value: 'db-123' },
      ];

      const input = {
        id: existingConfig.getId(),
        inputs: newInputs,
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(true);
      expect(result.config?.getInputs()).toHaveLength(2);
      expect(result.config?.getInputs()?.[0].key).toBe('apiKey');
      expect(result.config?.getInputs()?.[1].key).toBe('databaseId');
    });

    it('should update outputs', async () => {
      const existingConfig = createTestConfig();
      mockRepository.load.mockResolvedValue(Result.success(existingConfig));
      mockRepository.save.mockResolvedValue(Result.success(undefined));

      const newOutputs = [
        { key: 'users', defaultValue: [] },
        { key: 'posts', defaultValue: [] },
        { key: 'comments', defaultValue: [] },
      ];

      const input = {
        id: existingConfig.getId(),
        outputs: newOutputs,
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(true);
      expect(result.config?.getOutputs()).toHaveLength(3);
      expect(result.config?.getOutputs()?.[0].key).toBe('users');
      expect(result.config?.getOutputs()?.[1].key).toBe('posts');
      expect(result.config?.getOutputs()?.[2].key).toBe('comments');
    });

    it('should update multiple fields at once', async () => {
      const existingConfig = createTestConfig();
      mockRepository.load.mockResolvedValue(Result.success(existingConfig));
      mockRepository.save.mockResolvedValue(Result.success(undefined));

      const input = {
        id: existingConfig.getId(),
        enabled: false,
        syncTiming: 'periodic' as const,
        syncIntervalSeconds: 600,
        syncDirection: 'receive_only' as const,
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(true);
      expect(result.config?.isEnabled()).toBe(false);
      expect(result.config?.getSyncTiming()).toBe('periodic');
      expect(result.config?.getSyncIntervalSeconds()).toBe(600);
      expect(result.config?.getSyncDirection()).toBe('receive_only');
    });
  });

  describe('execute - validation errors', () => {
    it('should fail when config not found', async () => {
      mockRepository.load.mockResolvedValue(Result.success(null));

      const input = {
        id: 'non-existent-id',
        enabled: false,
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Sync configuration not found: non-existent-id');
      expect(mockRepository.save).not.toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalledWith('Sync config not found: non-existent-id');
    });

    it('should fail when updating to bidirectional without inputs', async () => {
      const existingConfig = createTestConfig({
        syncDirection: 'send_only',
        inputs: [],
      });
      mockRepository.load.mockResolvedValue(Result.success(existingConfig));

      const input = {
        id: existingConfig.getId(),
        syncDirection: 'bidirectional' as const,
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        'Input configuration is required for bidirectional or receive-only sync'
      );
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should fail when updating to bidirectional without outputs', async () => {
      const existingConfig = createTestConfig({
        syncDirection: 'receive_only',
        outputs: [],
      });
      mockRepository.load.mockResolvedValue(Result.success(existingConfig));

      const input = {
        id: existingConfig.getId(),
        syncDirection: 'bidirectional' as const,
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        'Output configuration is required for bidirectional or send-only sync'
      );
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should fail when updating to receive_only without inputs', async () => {
      const existingConfig = createTestConfig({
        syncDirection: 'send_only',
        inputs: [],
      });
      mockRepository.load.mockResolvedValue(Result.success(existingConfig));

      const input = {
        id: existingConfig.getId(),
        syncDirection: 'receive_only' as const,
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        'Input configuration is required for bidirectional or receive-only sync'
      );
    });

    it('should fail when updating to send_only without outputs', async () => {
      const existingConfig = createTestConfig({
        syncDirection: 'receive_only',
        outputs: [],
      });
      mockRepository.load.mockResolvedValue(Result.success(existingConfig));

      const input = {
        id: existingConfig.getId(),
        syncDirection: 'send_only' as const,
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        'Output configuration is required for bidirectional or send-only sync'
      );
    });

    it('should fail when clearing inputs from bidirectional config', async () => {
      const existingConfig = createTestConfig();
      mockRepository.load.mockResolvedValue(Result.success(existingConfig));

      const input = {
        id: existingConfig.getId(),
        inputs: [],
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        'Input configuration is required for bidirectional or receive-only sync'
      );
    });

    it('should fail when clearing outputs from bidirectional config', async () => {
      const existingConfig = createTestConfig();
      mockRepository.load.mockResolvedValue(Result.success(existingConfig));

      const input = {
        id: existingConfig.getId(),
        outputs: [],
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        'Output configuration is required for bidirectional or send-only sync'
      );
    });

    it('should fail when updating to periodic without interval', async () => {
      const existingConfig = createTestConfig();
      mockRepository.load.mockClear();
      mockRepository.load.mockResolvedValue(Result.success(existingConfig));

      const input = {
        id: existingConfig.getId(),
        syncTiming: 'periodic' as const,
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Sync interval must be at least 1 second for periodic sync');
    });

    it('should fail when updating to periodic with invalid interval', async () => {
      const existingConfig = createTestConfig();
      mockRepository.load.mockClear();
      mockRepository.load.mockResolvedValue(Result.success(existingConfig));

      const input = {
        id: existingConfig.getId(),
        syncTiming: 'periodic' as const,
        syncIntervalSeconds: 0,
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Sync interval must be at least 1 second for periodic sync');
    });
  });

  describe('execute - error handling', () => {
    it('should handle repository load error', async () => {
      mockRepository.load.mockResolvedValue(
        Result.failure(new Error('Database connection failed'))
      );

      const input = {
        id: 'test-id',
        enabled: false,
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database connection failed');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to update sync config',
        expect.any(Error)
      );
    });

    it('should handle repository save error', async () => {
      const existingConfig = createTestConfig();
      mockRepository.load.mockResolvedValue(Result.success(existingConfig));
      mockRepository.save.mockResolvedValue(Result.failure(new Error('Save operation failed')));

      const input = {
        id: existingConfig.getId(),
        enabled: false,
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Save operation failed');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to save updated sync config',
        expect.any(Error)
      );
    });
  });

  describe('execute - complex scenarios', () => {
    it('should update config and maintain other fields unchanged', async () => {
      const existingConfig = createTestConfig({
        syncTiming: 'periodic',
        syncIntervalSeconds: 300,
      });
      const originalStorageKey = existingConfig.getStorageKey();
      const originalSyncMethod = existingConfig.getSyncMethod();
      const originalInputs = existingConfig.getInputs();

      mockRepository.load.mockResolvedValue(Result.success(existingConfig));
      mockRepository.save.mockResolvedValue(Result.success(undefined));

      const input = {
        id: existingConfig.getId(),
        enabled: false,
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(true);
      expect(result.config?.getStorageKey()).toBe(originalStorageKey);
      expect(result.config?.getSyncMethod()).toBe(originalSyncMethod);
      expect(result.config?.getInputs()).toEqual(originalInputs);
    });

    it('should allow switching from receive_only to send_only', async () => {
      const existingConfig = createTestConfig({
        syncDirection: 'receive_only',
        outputs: [{ key: 'data', defaultValue: [] }],
      });
      mockRepository.load.mockResolvedValue(Result.success(existingConfig));
      mockRepository.save.mockResolvedValue(Result.success(undefined));

      const input = {
        id: existingConfig.getId(),
        syncDirection: 'send_only' as const,
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(true);
      expect(result.config?.getSyncDirection()).toBe('send_only');
    });

    it('should allow switching from send_only to receive_only', async () => {
      const existingConfig = createTestConfig({
        syncDirection: 'send_only',
        inputs: [{ key: 'apiKey', value: 'test-token' }],
      });
      mockRepository.load.mockResolvedValue(Result.success(existingConfig));
      mockRepository.save.mockResolvedValue(Result.success(undefined));

      const input = {
        id: existingConfig.getId(),
        syncDirection: 'receive_only' as const,
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(true);
      expect(result.config?.getSyncDirection()).toBe('receive_only');
    });

    it('should allow changing interval for periodic sync', async () => {
      const existingConfig = createTestConfig({
        syncTiming: 'periodic',
        syncIntervalSeconds: 300,
      });
      mockRepository.load.mockResolvedValue(Result.success(existingConfig));
      mockRepository.save.mockResolvedValue(Result.success(undefined));

      const input = {
        id: existingConfig.getId(),
        syncIntervalSeconds: 600,
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(true);
      expect(result.config?.getSyncIntervalSeconds()).toBe(600);
    });
  });
});

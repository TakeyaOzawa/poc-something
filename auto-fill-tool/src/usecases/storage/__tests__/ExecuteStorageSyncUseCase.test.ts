/**
 * Unit Tests: ExecuteStorageSyncUseCase
 * Tests manual synchronization execution for a storage key
 */

import { ExecuteStorageSyncUseCase } from '../ExecuteStorageSyncUseCase';
import { StorageSyncConfigRepository } from '@domain/repositories/StorageSyncConfigRepository';
import { IdGenerator } from '@domain/types/id-generator.types';
import { SyncHistoryRepository } from '@domain/repositories/SyncHistoryRepository';
import { ExecuteReceiveDataUseCase } from '../../sync/ExecuteReceiveDataUseCase';
import { ExecuteSendDataUseCase } from '../../sync/ExecuteSendDataUseCase';
import { StorageSyncConfig } from '@domain/entities/StorageSyncConfig';
import { Logger, LogLevel } from '@domain/types/logger.types';
import { SyncStateNotifier } from '@domain/types/sync-state-notifier.types';
import { Result } from '@domain/values/result.value';

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-sync-id'),
};

// Mock ExecuteManualSyncUseCase
jest.mock('../../sync/ExecuteManualSyncUseCase');

describe('ExecuteStorageSyncUseCase', () => {
  let useCase: ExecuteStorageSyncUseCase;
  let mockConfigRepository: jest.Mocked<StorageSyncConfigRepository>;
  let mockSyncHistoryRepository: jest.Mocked<SyncHistoryRepository>;
  let mockExecuteReceiveDataUseCase: jest.Mocked<ExecuteReceiveDataUseCase>;
  let mockExecuteSendDataUseCase: jest.Mocked<ExecuteSendDataUseCase>;
  let mockSyncStateNotifier: jest.Mocked<SyncStateNotifier>;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    mockConfigRepository = {
      loadByStorageKey: jest.fn(),
      save: jest.fn(),
      loadAll: jest.fn(),
      delete: jest.fn(),
    } as any;

    mockSyncHistoryRepository = {
      save: jest.fn(),
      loadByStorageKey: jest.fn(),
      loadAll: jest.fn(),
    } as any;

    mockExecuteReceiveDataUseCase = {} as any;
    mockExecuteSendDataUseCase = {} as any;

    mockSyncStateNotifier = {
      initialize: jest.fn(),
      update: jest.fn(),
      getCurrentState: jest.fn(),
      clear: jest.fn(),
      updateStatus: jest.fn(),
      updateCurrentStep: jest.fn(),
      updateReceiveProgress: jest.fn(),
      updateSendProgress: jest.fn(),
      complete: jest.fn(),
      fail: jest.fn(),
    } as any;

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      setLevel: jest.fn(),
      getLevel: jest.fn().mockReturnValue(LogLevel.INFO),
      createChild: jest.fn().mockReturnThis(),
    } as any;

    useCase = new ExecuteStorageSyncUseCase(
      mockConfigRepository,
      mockExecuteReceiveDataUseCase,
      mockExecuteSendDataUseCase,
      mockSyncHistoryRepository,
      mockSyncStateNotifier,
      mockLogger
    );

    jest.clearAllMocks();
  });

  describe('execute()', () => {
    it('should return error when no config found for storage key', async () => {
      // Arrange
      const storageKey = 'non-existent-key';
      mockConfigRepository.loadByStorageKey.mockResolvedValue(Result.success(null));

      // Act
      const result = await useCase.execute({ storageKey });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('No sync configuration found for storage key: non-existent-key');
      expect(result.syncDirection).toBe('bidirectional');
      expect(mockConfigRepository.loadByStorageKey).toHaveBeenCalledWith(storageKey);
    });

    it('should execute sync when config exists', async () => {
      // Arrange
      const storageKey = 'websites';
      const mockConfig = StorageSyncConfig.create(
        {
          storageKey,
          syncMethod: 'notion',
          syncTiming: 'manual',
          syncDirection: 'receive_only',
          inputs: [],
          outputs: [{ key: 'websites', defaultValue: [] }],
        },
        mockIdGenerator
      );

      mockConfigRepository.loadByStorageKey.mockResolvedValue(Result.success(mockConfig));

      // Get access to the mocked ExecuteManualSyncUseCase
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { ExecuteManualSyncUseCase } = require('../../sync/ExecuteManualSyncUseCase');
      const mockExecute = jest.fn().mockResolvedValue(
        {
          success: true,
          syncDirection: 'receive_only',
        },
        mockIdGenerator
      );
      ExecuteManualSyncUseCase.mockImplementation(() => ({
        execute: mockExecute,
      }));

      // Recreate useCase to use the mock
      useCase = new ExecuteStorageSyncUseCase(
        mockConfigRepository,
        mockExecuteReceiveDataUseCase,
        mockExecuteSendDataUseCase,
        mockSyncHistoryRepository,
        mockSyncStateNotifier,
        mockLogger
      );

      // Act
      const result = await useCase.execute({ storageKey }, mockIdGenerator);

      // Assert
      expect(mockConfigRepository.loadByStorageKey).toHaveBeenCalledWith(storageKey);
      expect(mockExecute).toHaveBeenCalledWith({ config: mockConfig });
      expect(result.success).toBe(true);
      expect(result.syncDirection).toBe('receive_only');
    });

    it(
      'should handle bidirectional sync',
      async () => {
        // Arrange
        const storageKey = 'automation-variables';
        const mockConfig = StorageSyncConfig.create(
          {
            storageKey,
            syncMethod: 'notion',
            syncTiming: 'manual',
            syncDirection: 'bidirectional',
            inputs: [{ key: 'variables', value: 'data' }],
            outputs: [{ key: 'variables', defaultValue: [] }],
          },
          mockIdGenerator
        );

        mockConfigRepository.loadByStorageKey.mockResolvedValue(Result.success(mockConfig));

        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { ExecuteManualSyncUseCase } = require('../../sync/ExecuteManualSyncUseCase');
        const mockExecute = jest.fn().mockResolvedValue(
          {
            success: true,
            syncDirection: 'bidirectional',
          },
          mockIdGenerator
        );
        ExecuteManualSyncUseCase.mockImplementation(() => ({
          execute: mockExecute,
        }));

        useCase = new ExecuteStorageSyncUseCase(
          mockConfigRepository,
          mockExecuteReceiveDataUseCase,
          mockExecuteSendDataUseCase,
          mockSyncHistoryRepository,
          mockSyncStateNotifier,
          mockLogger
        );

        // Act
        const result = await useCase.execute({ storageKey }, mockIdGenerator);

        // Assert
        expect(result.success).toBe(true);
        expect(result.syncDirection).toBe('bidirectional');
      },
      mockIdGenerator
    );

    it(
      'should propagate sync execution errors',
      async () => {
        // Arrange
        const storageKey = 'xpaths';
        const mockConfig = StorageSyncConfig.create(
          {
            storageKey,
            syncMethod: 'notion',
            syncTiming: 'manual',
            syncDirection: 'send_only',
            inputs: [{ key: 'xpaths', value: 'data' }],
            outputs: [],
          },
          mockIdGenerator
        );

        mockConfigRepository.loadByStorageKey.mockResolvedValue(Result.success(mockConfig));

        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { ExecuteManualSyncUseCase } = require('../../sync/ExecuteManualSyncUseCase');
        const mockExecute = jest.fn().mockResolvedValue(
          {
            success: false,
            syncDirection: 'send_only',
            error: 'HTTP request failed',
          },
          mockIdGenerator
        );
        ExecuteManualSyncUseCase.mockImplementation(() => ({
          execute: mockExecute,
        }));

        useCase = new ExecuteStorageSyncUseCase(
          mockConfigRepository,
          mockExecuteReceiveDataUseCase,
          mockExecuteSendDataUseCase,
          mockSyncHistoryRepository,
          mockSyncStateNotifier,
          mockLogger
        );

        // Act
        const result = await useCase.execute({ storageKey }, mockIdGenerator);

        // Assert
        expect(result.success).toBe(false);
        expect(result.error).toBe('HTTP request failed');
      },
      mockIdGenerator
    );

    it('should handle repository load errors', async () => {
      // Arrange
      const storageKey = 'test-key';
      const error = new Error('Database connection failed');
      mockConfigRepository.loadByStorageKey.mockResolvedValue(Result.failure(error));

      // Act
      const result = await useCase.execute({ storageKey });

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Database connection failed');
      expect(mockConfigRepository.loadByStorageKey).toHaveBeenCalledWith(storageKey);
    });
  });
});

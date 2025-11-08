/**
 * Unit Tests: ExportStorageSyncConfigsUseCase
 * Tests exporting storage sync configurations to CSV
 */

import { ExportStorageSyncConfigsUseCase } from '../ExportStorageSyncConfigsUseCase';
import { IdGenerator } from '@domain/types/id-generator.types';
import { StorageSyncConfigRepository } from '@domain/repositories/StorageSyncConfigRepository';
import { StorageSyncConfig } from '@domain/entities/StorageSyncConfig';
import { Logger, LogLevel } from '@domain/types/logger.types';
import { Result } from '@domain/values/result.value';

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-sync-id'),
};

// Mock Logger
const mockLogger: Logger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  setLevel: jest.fn(),
  getLevel: jest.fn().mockReturnValue(LogLevel.INFO),
  createChild: jest.fn().mockReturnThis(),
} as any;

describe('ExportStorageSyncConfigsUseCase', () => {
  let useCase: ExportStorageSyncConfigsUseCase;
  let mockRepository: jest.Mocked<StorageSyncConfigRepository>;

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      load: jest.fn(),
      loadAll: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
      loadByStorageKey: jest.fn(),
      loadAllEnabledPeriodic: jest.fn(),
    } as any;

    useCase = new ExportStorageSyncConfigsUseCase(mockRepository, mockLogger);

    jest.clearAllMocks();
  });

  describe('execute()', () => {
    it('should export sync configurations to CSV', async () => {
      // Arrange
      const mockConfigs = [
        StorageSyncConfig.create(
          {
            storageKey: 'websites',
            syncMethod: 'notion',
            syncTiming: 'manual',
            syncDirection: 'bidirectional',
            inputs: [{ key: 'data', value: 'test' }],
            outputs: [{ key: 'result', defaultValue: null }],
          },
          mockIdGenerator
        ),
        StorageSyncConfig.create(
          {
            storageKey: 'xpaths',
            syncMethod: 'spread-sheet',
            syncTiming: 'manual',
            syncDirection: 'receive_only',
            inputs: [],
            outputs: [{ key: 'xpaths', defaultValue: [] }],
          },
          mockIdGenerator
        ),
      ];

      mockRepository.loadAll.mockResolvedValue(Result.success(mockConfigs));

      // Act
      const result = await useCase.execute();

      // Assert
      expect(mockRepository.loadAll).toHaveBeenCalledTimes(1);
      expect(result).toContain('id,storageKey,enabled,syncMethod');
      expect(result).toContain('websites');
      expect(result).toContain('xpaths');
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Successfully exported storage sync configurations',
        { count: 2 }
      );
    });

    it('should return header-only CSV when no configurations exist', async () => {
      // Arrange
      mockRepository.loadAll.mockResolvedValue(Result.success([]));

      // Act
      const result = await useCase.execute();

      // Assert
      expect(mockRepository.loadAll).toHaveBeenCalledTimes(1);
      expect(result).toBe(
        'id,storageKey,enabled,syncMethod,syncTiming,syncIntervalSeconds,syncDirection,conflictResolution,lastSyncDate,lastSyncStatus,createdAt,updatedAt\n'
      );
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'No storage sync configurations found to export'
      );
    });

    it('should export single configuration', async () => {
      // Arrange
      const mockConfig = StorageSyncConfig.create(
        {
          storageKey: 'automation-variables',
          syncMethod: 'notion',
          syncTiming: 'periodic',
          syncDirection: 'send_only',
          syncIntervalSeconds: 300,
          inputs: [{ key: 'variables', value: 'data' }],
          outputs: [],
        },
        mockIdGenerator
      );

      mockRepository.loadAll.mockResolvedValue(Result.success([mockConfig]));

      // Act
      const result = await useCase.execute();

      // Assert
      expect(mockRepository.loadAll).toHaveBeenCalledTimes(1);
      expect(result).toContain('automation-variables');
      expect(result).toContain('notion');
      expect(result).toContain('periodic');
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Successfully exported storage sync configurations',
        { count: 1 }
      );
    });

    it('should handle repository errors', async () => {
      // Arrange
      const error = new Error('Repository error');
      mockRepository.loadAll.mockResolvedValue(Result.failure(error));

      // Act & Assert
      await expect(useCase.execute()).rejects.toThrow('Repository error');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to export storage sync configurations',
        error
      );
    });

    it('should handle configurations with different sync methods', async () => {
      // Arrange
      const mockConfigs = [
        StorageSyncConfig.create(
          {
            storageKey: 'config1',
            syncMethod: 'notion',
            syncTiming: 'manual',
            syncDirection: 'bidirectional',
            inputs: [{ key: 'data', value: 'test' }],
            outputs: [{ key: 'result', defaultValue: null }],
          },
          mockIdGenerator
        ),
        StorageSyncConfig.create(
          {
            storageKey: 'config2',
            syncMethod: 'spread-sheet',
            syncTiming: 'manual',
            syncDirection: 'receive_only',
            inputs: [],
            outputs: [{ key: 'data', defaultValue: null }],
          },
          mockIdGenerator
        ),
      ];

      mockRepository.loadAll.mockResolvedValue(Result.success(mockConfigs));

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result).toContain('notion');
      expect(result).toContain('spread-sheet');
      expect(result).toContain('config1');
      expect(result).toContain('config2');
    });
  });
});

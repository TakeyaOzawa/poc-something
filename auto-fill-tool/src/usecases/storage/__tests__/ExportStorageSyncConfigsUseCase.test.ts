/**
 * Unit Tests: ExportStorageSyncConfigsUseCase
 * Tests exporting storage sync configurations to CSV
 */

import { ExportStorageSyncConfigsUseCase } from '../ExportStorageSyncConfigsUseCase';
import { IdGenerator } from '@domain/types/id-generator.types';
import { StorageSyncConfigRepository } from '@domain/repositories/StorageSyncConfigRepository';
import { StorageSyncConfigMapper } from '@infrastructure/mappers/StorageSyncConfigMapper';
import { StorageSyncConfig } from '@domain/entities/StorageSyncConfig';
import { Logger, LogLevel } from '@domain/types/logger.types';
import { Result } from '@domain/values/result.value';

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-sync-id'),
};

// Mock StorageSyncConfigMapper
jest.mock('@infrastructure/mappers/StorageSyncConfigMapper');

describe(
  'ExportStorageSyncConfigsUseCase',
  () => {
    let useCase: ExportStorageSyncConfigsUseCase;
    let mockRepository: jest.Mocked<StorageSyncConfigRepository>;
    let mockLogger: jest.Mocked<Logger>;

    beforeEach(() => {
      mockRepository = {
        loadAll: jest.fn(),
        save: jest.fn(),
        loadByStorageKey: jest.fn(),
        delete: jest.fn(),
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

      useCase = new ExportStorageSyncConfigsUseCase(
        mockRepository,
        new StorageSyncConfigMapper(),
        mockLogger
      );

      jest.clearAllMocks();
    });

    describe(
      'execute()',
      () => {
        it(
          'should export sync configurations to CSV',
          async () => {
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

            const mockCSV =
              'id,storageKey,enabled,syncMethod\nid1,websites,true,http\nid2,xpaths,true,csv';

            mockRepository.loadAll.mockResolvedValue(Result.success(mockConfigs));
            (StorageSyncConfigMapper.toCSV as jest.Mock).mockReturnValue(mockCSV);

            // Act
            const result = await useCase.execute();

            // Assert
            expect(mockRepository.loadAll).toHaveBeenCalledTimes(1);
            expect(StorageSyncConfigMapper.toCSV).toHaveBeenCalledWith(mockConfigs, mockLogger);
            expect(result).toBe(mockCSV);
            expect(mockLogger.info).toHaveBeenCalledWith('Exporting storage sync configurations');
            expect(mockLogger.info).toHaveBeenCalledWith(
              'Successfully exported storage sync configurations',
              { count: 2 }
            );
          },
          mockIdGenerator
        );

        it(
          'should return header-only CSV when no configurations exist',
          async () => {
            // Arrange
            mockRepository.loadAll.mockResolvedValue(Result.success([]));

            // Act
            const result = await useCase.execute();

            // Assert
            expect(mockRepository.loadAll).toHaveBeenCalledTimes(1);
            expect(StorageSyncConfigMapper.toCSV).not.toHaveBeenCalled();
            expect(result).toBe(
              'id,storageKey,enabled,syncMethod,syncTiming,syncIntervalSeconds,' +
                'syncDirection,conflictResolution,lastSyncDate,lastSyncStatus,' +
                'createdAt,updatedAt'
            );
            expect(mockLogger.warn).toHaveBeenCalledWith(
              'No storage sync configurations found to export'
            );
          },
          mockIdGenerator
        );

        it(
          'should return header-only CSV when configurations is null',
          async () => {
            // Arrange
            mockRepository.loadAll.mockResolvedValue(Result.success(null as any));

            // Act
            const result = await useCase.execute();

            // Assert
            expect(mockRepository.loadAll).toHaveBeenCalledTimes(1);
            expect(result).toContain('id,storageKey,enabled');
            expect(mockLogger.warn).toHaveBeenCalledWith(
              'No storage sync configurations found to export'
            );
          },
          mockIdGenerator
        );

        it(
          'should export single configuration',
          async () => {
            // Arrange
            const mockConfig = StorageSyncConfig.create(
              {
                storageKey: 'automation-variables',
                syncMethod: 'notion',
                syncTiming: 'periodic',
                syncIntervalSeconds: 300,
                syncDirection: 'send_only',
                inputs: [{ key: 'variables', value: 'data' }],
                outputs: [],
              },
              mockIdGenerator
            );

            const mockCSV = 'id,storageKey,enabled,syncMethod\nid1,automation-variables,true,http';

            mockRepository.loadAll.mockResolvedValue(Result.success([mockConfig]));
            (StorageSyncConfigMapper.toCSV as jest.Mock).mockReturnValue(mockCSV);

            // Act
            const result = await useCase.execute();

            // Assert
            expect(result).toBe(mockCSV);
            expect(mockLogger.info).toHaveBeenCalledWith(
              'Successfully exported storage sync configurations',
              { count: 1 }
            );
          },
          mockIdGenerator
        );

        it(
          'should propagate repository errors',
          async () => {
            // Arrange
            const error = new Error('Repository load failed');
            mockRepository.loadAll.mockResolvedValue(Result.failure(error));

            // Act & Assert
            await expect(useCase.execute()).rejects.toThrow('Repository load failed');
            expect(mockRepository.loadAll).toHaveBeenCalledTimes(1);
            expect(StorageSyncConfigMapper.toCSV).not.toHaveBeenCalled();
            expect(mockLogger.error).toHaveBeenCalledWith(
              'Failed to export storage sync configurations',
              error
            );
          },
          mockIdGenerator
        );

        it(
          'should propagate mapper errors',
          async () => {
            // Arrange
            const mockConfigs = [
              StorageSyncConfig.create(
                {
                  storageKey: 'test',
                  syncMethod: 'notion',
                  syncTiming: 'manual',
                  syncDirection: 'receive_only',
                  inputs: [],
                  outputs: [{ key: 'data', defaultValue: null }],
                },
                mockIdGenerator
              ),
            ];

            const error = new Error('CSV conversion failed');

            mockRepository.loadAll.mockResolvedValue(Result.success(mockConfigs));
            (StorageSyncConfigMapper.toCSV as jest.Mock).mockImplementation(() => {
              throw error;
            });

            // Act & Assert
            await expect(useCase.execute()).rejects.toThrow('CSV conversion failed');
            expect(mockRepository.loadAll).toHaveBeenCalled();
            expect(StorageSyncConfigMapper.toCSV).toHaveBeenCalledWith(mockConfigs, mockLogger);
            expect(mockLogger.error).toHaveBeenCalledWith(
              'Failed to export storage sync configurations',
              error
            );
          },
          mockIdGenerator
        );

        it(
          'should handle configurations with different sync methods',
          async () => {
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

            const mockCSV = 'id,storageKey,syncMethod\nid1,config1,http\nid2,config2,csv';

            mockRepository.loadAll.mockResolvedValue(Result.success(mockConfigs));
            (StorageSyncConfigMapper.toCSV as jest.Mock).mockReturnValue(mockCSV);

            // Act
            const result = await useCase.execute();

            // Assert
            expect(result).toBe(mockCSV);
            expect(mockLogger.info).toHaveBeenCalledWith(
              'Successfully exported storage sync configurations',
              { count: 2 }
            );
          },
          mockIdGenerator
        );
      },
      mockIdGenerator
    );
  },
  mockIdGenerator
);

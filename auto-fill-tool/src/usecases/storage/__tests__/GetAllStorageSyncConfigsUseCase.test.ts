/**
 * Unit Tests: GetAllStorageSyncConfigsUseCase
 * Tests retrieving all storage sync configurations
 */

import { GetAllStorageSyncConfigsUseCase } from '../GetAllStorageSyncConfigsUseCase';
import { IdGenerator } from '@domain/types/id-generator.types';
import { StorageSyncConfigRepository } from '@domain/repositories/StorageSyncConfigRepository';
import { StorageSyncConfig } from '@domain/entities/StorageSyncConfig';
import { Logger, LogLevel } from '@domain/types/logger.types';

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-sync-id'),
};

// Mock ListSyncConfigsUseCase
jest.mock('../../sync/ListSyncConfigsUseCase');

describe('GetAllStorageSyncConfigsUseCase', () => {
  let useCase: GetAllStorageSyncConfigsUseCase;
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

    useCase = new GetAllStorageSyncConfigsUseCase(mockRepository, mockLogger);

    jest.clearAllMocks();
  });

  describe('execute()', () => {
    it('should return all sync configurations when successful', async () => {
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

      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { ListSyncConfigsUseCase } = require('../../sync/ListSyncConfigsUseCase');
      const mockExecute = jest.fn().mockResolvedValue(
        {
          success: true,
          configs: mockConfigs,
        },
        mockIdGenerator
      );
      ListSyncConfigsUseCase.mockImplementation(() => ({
        execute: mockExecute,
      }));

      // Recreate useCase with mocked ListSyncConfigsUseCase
      useCase = new GetAllStorageSyncConfigsUseCase(mockRepository, mockLogger);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result).toEqual(mockConfigs);
      expect(result).toHaveLength(2);
      expect(mockExecute).toHaveBeenCalledWith({});
    });

    it('should return empty array when no configurations exist', async () => {
      // Arrange
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { ListSyncConfigsUseCase } = require('../../sync/ListSyncConfigsUseCase');
      const mockExecute = jest.fn().mockResolvedValue(
        {
          success: true,
          configs: [],
        },
        mockIdGenerator
      );
      ListSyncConfigsUseCase.mockImplementation(() => ({
        execute: mockExecute,
      }));

      useCase = new GetAllStorageSyncConfigsUseCase(mockRepository, mockLogger);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should return empty array when success is false', async () => {
      // Arrange
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { ListSyncConfigsUseCase } = require('../../sync/ListSyncConfigsUseCase');
      const mockExecute = jest.fn().mockResolvedValue({
        success: false,
        configs: null,
        error: 'Failed to load configurations',
      });
      ListSyncConfigsUseCase.mockImplementation(() => ({
        execute: mockExecute,
      }));

      useCase = new GetAllStorageSyncConfigsUseCase(mockRepository, mockLogger);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result).toEqual([]);
      expect(mockExecute).toHaveBeenCalledWith({});
    });

    it('should return empty array when configs is null', async () => {
      // Arrange
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { ListSyncConfigsUseCase } = require('../../sync/ListSyncConfigsUseCase');
      const mockExecute = jest.fn().mockResolvedValue({
        success: true,
        configs: null,
      });
      ListSyncConfigsUseCase.mockImplementation(() => ({
        execute: mockExecute,
      }));

      useCase = new GetAllStorageSyncConfigsUseCase(mockRepository, mockLogger);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result).toEqual([]);
    });

    it('should return empty array when configs is undefined', async () => {
      // Arrange
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { ListSyncConfigsUseCase } = require('../../sync/ListSyncConfigsUseCase');
      const mockExecute = jest.fn().mockResolvedValue({
        success: true,
        configs: undefined,
      });
      ListSyncConfigsUseCase.mockImplementation(() => ({
        execute: mockExecute,
      }));

      useCase = new GetAllStorageSyncConfigsUseCase(mockRepository, mockLogger);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result).toEqual([]);
    });

    it(
      'should return single configuration',
      async () => {
        // Arrange
        const mockConfig = StorageSyncConfig.create(
          {
            storageKey: 'automation-variables',
            syncMethod: 'notion',
            syncTiming: 'manual',
            syncDirection: 'send_only',
            inputs: [{ key: 'variables', value: 'data' }],
            outputs: [],
          },
          mockIdGenerator
        );

        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { ListSyncConfigsUseCase } = require('../../sync/ListSyncConfigsUseCase');
        const mockExecute = jest.fn().mockResolvedValue(
          {
            success: true,
            configs: [mockConfig],
          },
          mockIdGenerator
        );
        ListSyncConfigsUseCase.mockImplementation(() => ({
          execute: mockExecute,
        }));

        useCase = new GetAllStorageSyncConfigsUseCase(mockRepository, mockLogger);

        // Act
        const result = await useCase.execute();

        // Assert
        expect(result).toEqual([mockConfig]);
        expect(result).toHaveLength(1);
      },
      mockIdGenerator
    );

    it('should propagate errors from ListSyncConfigsUseCase', async () => {
      // Arrange
      const error = new Error('Database connection failed');
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { ListSyncConfigsUseCase } = require('../../sync/ListSyncConfigsUseCase');
      const mockExecute = jest.fn().mockRejectedValue(error);
      ListSyncConfigsUseCase.mockImplementation(() => ({
        execute: mockExecute,
      }));

      useCase = new GetAllStorageSyncConfigsUseCase(mockRepository, mockLogger);

      // Act & Assert
      await expect(useCase.execute()).rejects.toThrow('Database connection failed');
      expect(mockExecute).toHaveBeenCalledWith({});
    });
  });
});

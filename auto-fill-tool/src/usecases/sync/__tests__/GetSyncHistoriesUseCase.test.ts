/**
 * Application Use Case Test: Get Sync Histories
 * Tests for retrieving sync history records
 */

import { GetSyncHistoriesUseCase, GetSyncHistoriesInput } from '../GetSyncHistoriesUseCase';
import { SyncHistoryRepository } from '@domain/repositories/SyncHistoryRepository';
import { SyncHistory } from '@domain/entities/SyncHistory';
import { Logger, LogLevel } from '@domain/types/logger.types';
import { Result } from '@domain/values/result.value';
import { IdGenerator } from '@domain/types/id-generator.types';

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('GetSyncHistoriesUseCase', () => {
  let useCase: GetSyncHistoriesUseCase;
  let mockRepository: jest.Mocked<SyncHistoryRepository>;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    // Mock repository
    mockRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByConfigId: jest.fn(),
      findRecent: jest.fn(),
      delete: jest.fn(),
      deleteOlderThan: jest.fn(),
      count: jest.fn(),
      countByConfigId: jest.fn(),
    } as jest.Mocked<SyncHistoryRepository>;

    // Mock logger
    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      setLevel: jest.fn(),
      getLevel: jest.fn().mockReturnValue(LogLevel.DEBUG),
      createChild: jest.fn(),
    } as jest.Mocked<Logger>;

    useCase = new GetSyncHistoriesUseCase(mockRepository, mockLogger);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('execute', () => {
    describe('with configId', () => {
      it(
        'should retrieve histories for specific config',
        async () => {
          const configId = 'config-123';
          const mockHistories = [
            SyncHistory.create({
              configId,
              storageKey: 'test1',
              syncDirection: 'bidirectional',
              startTime: Date.now(),
            }),
            SyncHistory.create({
              configId,
              storageKey: 'test2',
              syncDirection: 'bidirectional',
              startTime: Date.now(),
            }),
          ];

          mockRepository.findByConfigId.mockResolvedValue(Result.success(mockHistories));

          const input: GetSyncHistoriesInput = {
            configId,
            limit: 10,
          };

          const result = await useCase.execute(input);

          expect(result.success).toBe(true);
          expect(result.histories).toHaveLength(2);
          expect(result.histories![0]).toHaveProperty('configId', configId);
          expect(result.histories![0]).toHaveProperty('storageKey', 'test1');
          expect(result.histories![0]).toHaveProperty('syncDirection', 'bidirectional');
          expect(result.histories![1]).toHaveProperty('configId', configId);
          expect(result.histories![1]).toHaveProperty('storageKey', 'test2');
          expect(result.histories![1]).toHaveProperty('syncDirection', 'bidirectional');
          expect(mockRepository.findByConfigId).toHaveBeenCalledWith(configId, 10);
          expect(mockLogger.info).toHaveBeenCalledWith(
            'Retrieved sync histories',
            expect.objectContaining({
              count: 2,
              configId,
            })
          );
        },
        mockIdGenerator
      );

      it(
        'should use specified limit',
        async () => {
          const configId = 'config-123';
          mockRepository.findByConfigId.mockResolvedValue(Result.success([]));

          const input: GetSyncHistoriesInput = {
            configId,
            limit: 25,
          };

          await useCase.execute(input);

          expect(mockRepository.findByConfigId).toHaveBeenCalledWith(configId, 25);
        },
        mockIdGenerator
      );

      it('should handle empty results', async () => {
        const configId = 'config-123';
        mockRepository.findByConfigId.mockResolvedValue(Result.success([]));

        const input: GetSyncHistoriesInput = {
          configId,
          limit: 10,
        };

        const result = await useCase.execute(input);

        expect(result.success).toBe(true);
        expect(result.histories).toEqual([]);
        expect(result.histories).toHaveLength(0);
      });
    });

    describe('without configId', () => {
      it(
        'should retrieve recent histories',
        async () => {
          const mockHistories = [
            SyncHistory.create({
              configId: 'config-1',
              storageKey: 'test1',
              syncDirection: 'bidirectional',
              startTime: Date.now(),
            }),
            SyncHistory.create({
              configId: 'config-2',
              storageKey: 'test2',
              syncDirection: 'receive_only',
              startTime: Date.now(),
            }),
            SyncHistory.create({
              configId: 'config-3',
              storageKey: 'test3',
              syncDirection: 'send_only',
              startTime: Date.now(),
            }),
          ];

          mockRepository.findRecent.mockResolvedValue(Result.success(mockHistories));

          const input: GetSyncHistoriesInput = {
            limit: 20,
          };

          const result = await useCase.execute(input);

          expect(result.success).toBe(true);
          expect(result.histories).toHaveLength(3);
          expect(result.histories![0]).toHaveProperty('configId', 'config-1');
          expect(result.histories![0]).toHaveProperty('storageKey', 'test1');
          expect(result.histories![0]).toHaveProperty('syncDirection', 'bidirectional');
          expect(result.histories![1]).toHaveProperty('configId', 'config-2');
          expect(result.histories![1]).toHaveProperty('storageKey', 'test2');
          expect(result.histories![1]).toHaveProperty('syncDirection', 'receive_only');
          expect(result.histories![2]).toHaveProperty('configId', 'config-3');
          expect(result.histories![2]).toHaveProperty('storageKey', 'test3');
          expect(result.histories![2]).toHaveProperty('syncDirection', 'send_only');
          expect(mockRepository.findRecent).toHaveBeenCalledWith(20);
        },
        mockIdGenerator
      );

      it(
        'should use default limit of 50 when not specified',
        async () => {
          mockRepository.findRecent.mockResolvedValue(Result.success([]));

          const input: GetSyncHistoriesInput = {};

          await useCase.execute(input);

          expect(mockRepository.findRecent).toHaveBeenCalledWith(50);
        },
        mockIdGenerator
      );

      it('should handle empty results', async () => {
        mockRepository.findRecent.mockResolvedValue(Result.success([]));

        const input: GetSyncHistoriesInput = {};

        const result = await useCase.execute(input);

        expect(result.success).toBe(true);
        expect(result.histories).toEqual([]);
      });
    });

    describe('logging', () => {
      it('should log debug message when starting', async () => {
        mockRepository.findRecent.mockResolvedValue(Result.success([]));

        await useCase.execute({ limit: 10 });

        expect(mockLogger.debug).toHaveBeenCalledWith(
          'Getting sync histories',
          expect.objectContaining({ limit: 10 })
        );
      });

      it(
        'should log info message with count',
        async () => {
          const mockHistories = [
            SyncHistory.create({
              configId: 'config-1',
              storageKey: 'test',
              syncDirection: 'bidirectional',
              startTime: Date.now(),
            }),
          ];

          mockRepository.findRecent.mockResolvedValue(Result.success(mockHistories));

          await useCase.execute({}, mockIdGenerator);

          expect(mockLogger.info).toHaveBeenCalledWith(
            'Retrieved sync histories',
            expect.objectContaining({ count: 1 })
          );
        },
        mockIdGenerator
      );
    });

    describe('error handling', () => {
      it('should handle repository error gracefully', async () => {
        const error = new Error('Database connection failed');
        mockRepository.findRecent.mockResolvedValue(Result.failure(error));

        const input: GetSyncHistoriesInput = {};

        const result = await useCase.execute(input);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Database connection failed');
        expect(result.histories).toBeUndefined();
        expect(mockLogger.error).toHaveBeenCalledWith(
          'Failed to get sync histories',
          expect.any(Error)
        );
      });

      it('should handle non-Error throws', async () => {
        mockRepository.findRecent.mockRejectedValue('string error');

        const result = await useCase.execute({});

        expect(result.success).toBe(false);
        expect(result.error).toBe('Unknown error');
      });

      it('should handle repository error with configId', async () => {
        const error = new Error('Query failed');
        mockRepository.findByConfigId.mockResolvedValue(Result.failure(error));

        const result = await useCase.execute({ configId: 'config-123' });

        expect(result.success).toBe(false);
        expect(result.error).toBe('Query failed');
      });
    });

    describe('edge cases', () => {
      it('should handle very large limit', async () => {
        mockRepository.findRecent.mockResolvedValue(Result.success([]));

        await useCase.execute({ limit: 1000000 });

        expect(mockRepository.findRecent).toHaveBeenCalledWith(1000000);
      });

      it('should handle limit of 0', async () => {
        mockRepository.findRecent.mockResolvedValue(Result.success([]));

        await useCase.execute({ limit: 0 });

        expect(mockRepository.findRecent).toHaveBeenCalledWith(0);
      });

      it('should treat empty configId as no configId and use findRecent', async () => {
        mockRepository.findRecent.mockResolvedValue(Result.success([]));

        await useCase.execute({ configId: '', limit: 10 });

        // Empty string is falsy, so findRecent should be called
        expect(mockRepository.findRecent).toHaveBeenCalledWith(10);
        expect(mockRepository.findByConfigId).not.toHaveBeenCalled();
      });
    });
  });
});

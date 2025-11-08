/**
 * Application Use Case Test: Cleanup Sync Histories
 * Tests for deleting old sync history records
 */

import {
  CleanupSyncHistoriesUseCase,
  CleanupSyncHistoriesInput,
} from '../CleanupSyncHistoriesUseCase';
import { SyncHistoryRepository } from '@domain/repositories/SyncHistoryRepository';
import { Logger, LogLevel } from '@domain/types/logger.types';
import { Result } from '@domain/values/result.value';
import { IdGenerator } from '@domain/types/id-generator.types';

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('CleanupSyncHistoriesUseCase', () => {
  let useCase: CleanupSyncHistoriesUseCase;
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

    useCase = new CleanupSyncHistoriesUseCase(mockRepository, mockLogger);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('execute', () => {
    describe('successful cleanup', () => {
      it('should delete old records and return count', async () => {
        mockRepository.deleteOlderThan.mockResolvedValue(Result.success(15));

        const input: CleanupSyncHistoriesInput = {
          olderThanDays: 30,
        };

        const result = await useCase.execute(input);

        expect(result.success).toBe(true);
        expect(result.deletedCount).toBe(15);
        expect(result.error).toBeUndefined();
        expect(mockRepository.deleteOlderThan).toHaveBeenCalledWith(30);
      });

      it('should handle zero deletions', async () => {
        mockRepository.deleteOlderThan.mockResolvedValue(Result.success(0));

        const input: CleanupSyncHistoriesInput = {
          olderThanDays: 7,
        };

        const result = await useCase.execute(input);

        expect(result.success).toBe(true);
        expect(result.deletedCount).toBe(0);
      });

      it('should handle large number of deletions', async () => {
        mockRepository.deleteOlderThan.mockResolvedValue(Result.success(10000));

        const input: CleanupSyncHistoriesInput = {
          olderThanDays: 365,
        };

        const result = await useCase.execute(input);

        expect(result.success).toBe(true);
        expect(result.deletedCount).toBe(10000);
      });
    });

    describe('different time periods', () => {
      it('should handle 1 day cleanup', async () => {
        mockRepository.deleteOlderThan.mockResolvedValue(Result.success(5));

        const input: CleanupSyncHistoriesInput = {
          olderThanDays: 1,
        };

        await useCase.execute(input);

        expect(mockRepository.deleteOlderThan).toHaveBeenCalledWith(1);
      });

      it('should handle 7 days cleanup', async () => {
        mockRepository.deleteOlderThan.mockResolvedValue(Result.success(10));

        const input: CleanupSyncHistoriesInput = {
          olderThanDays: 7,
        };

        await useCase.execute(input);

        expect(mockRepository.deleteOlderThan).toHaveBeenCalledWith(7);
      });

      it('should handle 30 days cleanup', async () => {
        mockRepository.deleteOlderThan.mockResolvedValue(Result.success(20));

        const input: CleanupSyncHistoriesInput = {
          olderThanDays: 30,
        };

        await useCase.execute(input);

        expect(mockRepository.deleteOlderThan).toHaveBeenCalledWith(30);
      });

      it('should handle 90 days cleanup', async () => {
        mockRepository.deleteOlderThan.mockResolvedValue(Result.success(50));

        const input: CleanupSyncHistoriesInput = {
          olderThanDays: 90,
        };

        await useCase.execute(input);

        expect(mockRepository.deleteOlderThan).toHaveBeenCalledWith(90);
      });

      it('should handle 365 days cleanup', async () => {
        mockRepository.deleteOlderThan.mockResolvedValue(Result.success(100));

        const input: CleanupSyncHistoriesInput = {
          olderThanDays: 365,
        };

        await useCase.execute(input);

        expect(mockRepository.deleteOlderThan).toHaveBeenCalledWith(365);
      });
    });

    describe('logging', () => {
      it('should log cleanup start', async () => {
        mockRepository.deleteOlderThan.mockResolvedValue(Result.success(10));

        await useCase.execute({ olderThanDays: 30 });

        expect(mockLogger.info).toHaveBeenCalledWith(
          'Cleaning up old sync histories',
          expect.objectContaining({ olderThanDays: 30 })
        );
      });

      it('should log cleanup completion with count', async () => {
        mockRepository.deleteOlderThan.mockResolvedValue(Result.success(25));

        await useCase.execute({ olderThanDays: 30 });

        expect(mockLogger.info).toHaveBeenCalledWith(
          'Cleanup completed',
          expect.objectContaining({ deletedCount: 25 })
        );
      });

      it('should log both start and completion', async () => {
        mockRepository.deleteOlderThan.mockResolvedValue(Result.success(15));

        await useCase.execute({ olderThanDays: 30 });

        expect(mockLogger.info).toHaveBeenCalledTimes(2);
      });
    });

    describe('error handling', () => {
      it('should handle repository error gracefully', async () => {
        const error = new Error('Database deletion failed');
        mockRepository.deleteOlderThan.mockResolvedValue(Result.failure(error));

        const input: CleanupSyncHistoriesInput = {
          olderThanDays: 30,
        };

        const result = await useCase.execute(input);

        expect(result.success).toBe(false);
        expect(result.error).toBe('Database deletion failed');
        expect(result.deletedCount).toBeUndefined();
        expect(mockLogger.error).toHaveBeenCalledWith(
          'Failed to cleanup sync histories',
          expect.any(Error)
        );
      });

      it('should handle non-Error throws', async () => {
        mockRepository.deleteOlderThan.mockRejectedValue('string error');

        const result = await useCase.execute({ olderThanDays: 30 });

        expect(result.success).toBe(false);
        expect(result.error).toBe('Unknown error');
      });

      it('should handle timeout error', async () => {
        const error = new Error('Operation timed out');
        mockRepository.deleteOlderThan.mockResolvedValue(Result.failure(error));

        const result = await useCase.execute({ olderThanDays: 30 });

        expect(result.success).toBe(false);
        expect(result.error).toBe('Operation timed out');
      });

      it('should handle permission error', async () => {
        const error = new Error('Insufficient permissions');
        mockRepository.deleteOlderThan.mockResolvedValue(Result.failure(error));

        const result = await useCase.execute({ olderThanDays: 30 });

        expect(result.success).toBe(false);
        expect(result.error).toBe('Insufficient permissions');
      });
    });

    describe('edge cases', () => {
      it('should handle very small time period (0 days)', async () => {
        mockRepository.deleteOlderThan.mockResolvedValue(Result.success(0));

        await useCase.execute({ olderThanDays: 0 });

        expect(mockRepository.deleteOlderThan).toHaveBeenCalledWith(0);
      });

      it('should handle very large time period', async () => {
        mockRepository.deleteOlderThan.mockResolvedValue(Result.success(0));

        await useCase.execute({ olderThanDays: 100000 });

        expect(mockRepository.deleteOlderThan).toHaveBeenCalledWith(100000);
      });

      it('should handle negative days (if passed)', async () => {
        mockRepository.deleteOlderThan.mockResolvedValue(Result.success(0));

        await useCase.execute({ olderThanDays: -1 });

        expect(mockRepository.deleteOlderThan).toHaveBeenCalledWith(-1);
      });
    });
  });
});

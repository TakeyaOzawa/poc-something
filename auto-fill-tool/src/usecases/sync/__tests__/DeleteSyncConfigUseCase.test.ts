/**
 * Unit Tests: DeleteSyncConfigUseCase
 */

import { DeleteSyncConfigUseCase } from '../DeleteSyncConfigUseCase';
import { StorageSyncConfigRepository } from '@domain/repositories/StorageSyncConfigRepository';
import { Logger } from '@domain/types/logger.types';
import { Result } from '@domain/values/result.value';

describe('DeleteSyncConfigUseCase', () => {
  let useCase: DeleteSyncConfigUseCase;
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

    useCase = new DeleteSyncConfigUseCase(mockRepository, mockLogger);
  });

  describe('execute - success cases', () => {
    it('should delete an existing sync config successfully', async () => {
      mockRepository.exists.mockResolvedValue(Result.success(true));
      mockRepository.delete.mockResolvedValue(Result.success(undefined));

      const input = {
        id: 'test-config-id',
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(mockRepository.exists).toHaveBeenCalledWith('test-config-id');
      expect(mockRepository.delete).toHaveBeenCalledWith('test-config-id');
      expect(mockLogger.info).toHaveBeenCalledWith('Deleting sync config: test-config-id');
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Successfully deleted sync config: test-config-id'
      );
    });

    it('should handle deletion of different config IDs', async () => {
      mockRepository.exists.mockResolvedValue(Result.success(true));
      mockRepository.delete.mockResolvedValue(Result.success(undefined));

      const input = {
        id: 'another-config-id-123',
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(true);
      expect(mockRepository.exists).toHaveBeenCalledWith('another-config-id-123');
      expect(mockRepository.delete).toHaveBeenCalledWith('another-config-id-123');
    });
  });

  describe('execute - validation errors', () => {
    it('should fail when config does not exist', async () => {
      mockRepository.exists.mockResolvedValue(Result.success(false));

      const input = {
        id: 'non-existent-id',
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Sync configuration not found: non-existent-id');
      expect(mockRepository.exists).toHaveBeenCalledWith('non-existent-id');
      expect(mockRepository.delete).not.toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalledWith('Sync config not found: non-existent-id');
    });

    it('should fail with descriptive error for missing config', async () => {
      mockRepository.exists.mockResolvedValue(Result.success(false));

      const input = {
        id: 'missing-config-xyz',
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(false);
      expect(result.error).toContain('missing-config-xyz');
      expect(mockRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe('execute - error handling', () => {
    it('should handle repository exists error', async () => {
      mockRepository.exists.mockResolvedValue(
        Result.failure(new Error('Database connection lost'))
      );

      const input = {
        id: 'test-id',
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database connection lost');
      expect(mockRepository.delete).not.toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to delete sync config',
        expect.any(Error)
      );
    });

    it('should handle repository delete error', async () => {
      mockRepository.exists.mockResolvedValue(Result.success(true));
      mockRepository.delete.mockResolvedValue(Result.failure(new Error('Delete operation failed')));

      const input = {
        id: 'test-id',
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Delete operation failed');
      expect(mockRepository.exists).toHaveBeenCalledWith('test-id');
      expect(mockRepository.delete).toHaveBeenCalledWith('test-id');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to delete sync config',
        expect.any(Error)
      );
    });
  });

  describe('execute - edge cases', () => {
    it('should handle empty string ID', async () => {
      mockRepository.exists.mockResolvedValue(Result.success(false));

      const input = {
        id: '',
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(false);
      expect(mockRepository.exists).toHaveBeenCalledWith('');
    });

    it('should handle UUID format ID', async () => {
      mockRepository.exists.mockResolvedValue(Result.success(true));
      mockRepository.delete.mockResolvedValue(Result.success(undefined));

      const input = {
        id: '123e4567-e89b-12d3-a456-426614174000',
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(true);
      expect(mockRepository.exists).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
      expect(mockRepository.delete).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
    });

    it('should handle special characters in ID', async () => {
      mockRepository.exists.mockResolvedValue(Result.success(true));
      mockRepository.delete.mockResolvedValue(Result.success(undefined));

      const input = {
        id: 'config-with-special-chars_123!@#',
      };

      const result = await useCase.execute(input);

      expect(result.success).toBe(true);
      expect(mockRepository.delete).toHaveBeenCalledWith('config-with-special-chars_123!@#');
    });
  });
});

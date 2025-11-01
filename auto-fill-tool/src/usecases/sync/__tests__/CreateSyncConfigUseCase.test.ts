/**
 * CreateSyncConfigUseCase Tests
 */

import { CreateSyncConfigUseCase, CreateSyncConfigInput } from '../CreateSyncConfigUseCase';
import { StorageSyncConfig } from '@domain/entities/StorageSyncConfig';
import { StorageSyncConfigRepository } from '@domain/repositories/StorageSyncConfigRepository';

describe('CreateSyncConfigUseCase', () => {
  let useCase: CreateSyncConfigUseCase;
  let mockRepository: jest.Mocked<StorageSyncConfigRepository>;

  beforeEach(() => {
    mockRepository = {
      getAll: jest.fn(),
      getById: jest.fn(),
      getByStorageKey: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      clear: jest.fn()
    };
    useCase = new CreateSyncConfigUseCase(mockRepository);
  });

  describe('execute', () => {
    test('手動同期設定が正常に作成されること', async () => {
      // Arrange
      const input: CreateSyncConfigInput = {
        storageKey: 'automationVariables',
        syncMethod: 'notion',
        syncTiming: 'manual',
        syncDirection: 'bidirectional',
        conflictResolution: 'latest_timestamp'
      };
      mockRepository.save.mockResolvedValue();

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
      expect(result.getStorageKey()).toBe('automationVariables');
      expect(result.getSyncMethod()).toBe('notion');
      expect(result.getSyncTiming()).toBe('manual');
      expect(result.getSyncDirection()).toBe('bidirectional');
      expect(result.getConflictResolution()).toBe('latest_timestamp');
      expect(result.isPeriodic()).toBe(false);
    });

    test('定期同期設定が正常に作成されること', async () => {
      // Arrange
      const input: CreateSyncConfigInput = {
        storageKey: 'automationVariables',
        syncMethod: 'spread-sheet',
        syncTiming: 'periodic',
        syncDirection: 'receive_only',
        conflictResolution: 'remote_priority',
        syncIntervalSeconds: 3600
      };
      mockRepository.save.mockResolvedValue();

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.getSyncTiming()).toBe('periodic');
      expect(result.getSyncIntervalSeconds()).toBe(3600);
      expect(result.isPeriodic()).toBe(true);
    });

    test('リポジトリエラーの場合、エラーが伝播されること', async () => {
      // Arrange
      const input: CreateSyncConfigInput = {
        storageKey: 'automationVariables',
        syncMethod: 'notion',
        syncTiming: 'manual',
        syncDirection: 'bidirectional',
        conflictResolution: 'latest_timestamp'
      };
      const error = new Error('Save error');
      mockRepository.save.mockRejectedValue(error);

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow('Save error');
    });
  });
});

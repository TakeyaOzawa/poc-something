/**
 * UpdateSyncConfigUseCase Tests
 */

import { UpdateSyncConfigUseCase, UpdateSyncConfigInput } from '../UpdateSyncConfigUseCase';
import { StorageSyncConfig } from '@domain/entities/StorageSyncConfig';
import { StorageSyncConfigRepository } from '@domain/repositories/StorageSyncConfigRepository';

describe('UpdateSyncConfigUseCase', () => {
  let useCase: UpdateSyncConfigUseCase;
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
    useCase = new UpdateSyncConfigUseCase(mockRepository);
  });

  describe('execute', () => {
    test('同期設定が正常に更新されること', async () => {
      // Arrange
      const config = StorageSyncConfig.create(
        'automationVariables',
        'notion',
        'manual',
        'bidirectional',
        'latest_timestamp'
      );
      const input: UpdateSyncConfigInput = {
        syncMethod: 'spread-sheet',
        syncTiming: 'periodic',
        syncIntervalSeconds: 3600,
        enabled: false
      };

      mockRepository.getById.mockResolvedValue(config);
      mockRepository.update.mockResolvedValue();

      // Act
      const result = await useCase.execute(config.getId(), input);

      // Assert
      expect(mockRepository.getById).toHaveBeenCalledWith(config.getId());
      expect(mockRepository.update).toHaveBeenCalledTimes(1);
      expect(result.getSyncMethod()).toBe('spread-sheet');
      expect(result.getSyncTiming()).toBe('periodic');
      expect(result.getSyncIntervalSeconds()).toBe(3600);
      expect(result.isEnabled()).toBe(false);
    });

    test('部分的な更新ができること', async () => {
      // Arrange
      const config = StorageSyncConfig.create(
        'automationVariables',
        'notion',
        'manual',
        'bidirectional',
        'latest_timestamp'
      );
      const input: UpdateSyncConfigInput = {
        syncDirection: 'receive_only'
      };

      mockRepository.getById.mockResolvedValue(config);
      mockRepository.update.mockResolvedValue();

      // Act
      const result = await useCase.execute(config.getId(), input);

      // Assert
      expect(result.getSyncDirection()).toBe('receive_only');
      // 他の設定は変更されないこと
      expect(result.getSyncMethod()).toBe('notion');
      expect(result.getSyncTiming()).toBe('manual');
    });

    test('入力・出力設定が更新されること', async () => {
      // Arrange
      const config = StorageSyncConfig.create(
        'automationVariables',
        'notion',
        'manual',
        'bidirectional',
        'latest_timestamp'
      );
      const input: UpdateSyncConfigInput = {
        inputs: [
          { key: 'apiKey', value: 'new-api-key' },
          { key: 'databaseId', value: 'new-db-id' }
        ],
        outputs: [
          { key: 'data', defaultValue: { updated: true } }
        ]
      };

      mockRepository.getById.mockResolvedValue(config);
      mockRepository.update.mockResolvedValue();

      // Act
      const result = await useCase.execute(config.getId(), input);

      // Assert
      expect(result.getInputs()).toHaveLength(2);
      expect(result.getInputs()[0].key).toBe('apiKey');
      expect(result.getInputs()[0].value).toBe('new-api-key');
      expect(result.getOutputs()).toHaveLength(1);
      expect(result.getOutputs()[0].defaultValue).toEqual({ updated: true });
    });

    test('存在しない設定IDの場合、エラーが投げられること', async () => {
      // Arrange
      mockRepository.getById.mockResolvedValue(undefined);

      // Act & Assert
      await expect(useCase.execute('non-existent', {})).rejects.toThrow('同期設定が見つかりません');
      expect(mockRepository.update).not.toHaveBeenCalled();
    });

    test('リポジトリエラーの場合、エラーが伝播されること', async () => {
      // Arrange
      const error = new Error('Repository error');
      mockRepository.getById.mockRejectedValue(error);

      // Act & Assert
      await expect(useCase.execute('config-id', {})).rejects.toThrow('Repository error');
    });
  });
});

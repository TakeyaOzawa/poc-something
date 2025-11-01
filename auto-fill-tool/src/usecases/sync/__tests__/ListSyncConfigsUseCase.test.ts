/**
 * ListSyncConfigsUseCase Tests
 */

import { ListSyncConfigsUseCase } from '../ListSyncConfigsUseCase';
import { StorageSyncConfig } from '@domain/entities/StorageSyncConfig';
import { StorageSyncConfigRepository } from '@domain/repositories/StorageSyncConfigRepository';

describe('ListSyncConfigsUseCase', () => {
  let useCase: ListSyncConfigsUseCase;
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
    useCase = new ListSyncConfigsUseCase(mockRepository);
  });

  describe('execute', () => {
    test('全ての同期設定が取得されること', async () => {
      // Arrange
      const config1 = StorageSyncConfig.create('automationVariables', 'notion', 'manual', 'bidirectional', 'latest_timestamp');
      const config2 = StorageSyncConfig.create('xpathCollectionCSV', 'spread-sheet', 'periodic', 'receive_only', 'remote_priority');
      const allConfigs = [config1, config2];

      mockRepository.getAll.mockResolvedValue(allConfigs);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(mockRepository.getAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual(allConfigs);
      expect(result).toHaveLength(2);
    });

    test('ストレージキー指定で同期設定が取得されること', async () => {
      // Arrange
      const config1 = StorageSyncConfig.create('automationVariables', 'notion', 'manual', 'bidirectional', 'latest_timestamp');
      const config2 = StorageSyncConfig.create('automationVariables', 'spread-sheet', 'periodic', 'receive_only', 'remote_priority');
      const filteredConfigs = [config1, config2];

      mockRepository.getByStorageKey.mockResolvedValue(filteredConfigs);

      // Act
      const result = await useCase.execute('automationVariables');

      // Assert
      expect(mockRepository.getByStorageKey).toHaveBeenCalledWith('automationVariables');
      expect(mockRepository.getAll).not.toHaveBeenCalled();
      expect(result).toEqual(filteredConfigs);
      expect(result).toHaveLength(2);
    });

    test('空の結果が返されること', async () => {
      // Arrange
      mockRepository.getAll.mockResolvedValue([]);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    test('リポジトリエラーの場合、エラーが伝播されること', async () => {
      // Arrange
      const error = new Error('Repository error');
      mockRepository.getAll.mockRejectedValue(error);

      // Act & Assert
      await expect(useCase.execute()).rejects.toThrow('Repository error');
    });

    test('ストレージキー指定時のリポジトリエラーの場合、エラーが伝播されること', async () => {
      // Arrange
      const error = new Error('Repository error');
      mockRepository.getByStorageKey.mockRejectedValue(error);

      // Act & Assert
      await expect(useCase.execute('automationVariables')).rejects.toThrow('Repository error');
    });
  });
});

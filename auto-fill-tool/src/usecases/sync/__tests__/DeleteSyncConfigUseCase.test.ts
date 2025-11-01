/**
 * DeleteSyncConfigUseCase Tests
 */

import { DeleteSyncConfigUseCase } from '../DeleteSyncConfigUseCase';
import { StorageSyncConfigRepository } from '@domain/repositories/StorageSyncConfigRepository';

describe('DeleteSyncConfigUseCase', () => {
  let useCase: DeleteSyncConfigUseCase;
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
    useCase = new DeleteSyncConfigUseCase(mockRepository);
  });

  describe('execute', () => {
    test('同期設定が正常に削除されること', async () => {
      // Arrange
      const configId = 'ssc-1';
      mockRepository.delete.mockResolvedValue(true);

      // Act
      const result = await useCase.execute(configId);

      // Assert
      expect(mockRepository.delete).toHaveBeenCalledWith(configId);
      expect(result).toBe(true);
    });

    test('存在しない設定IDの場合、falseが返されること', async () => {
      // Arrange
      const configId = 'non-existent';
      mockRepository.delete.mockResolvedValue(false);

      // Act
      const result = await useCase.execute(configId);

      // Assert
      expect(mockRepository.delete).toHaveBeenCalledWith(configId);
      expect(result).toBe(false);
    });

    test('リポジトリエラーの場合、エラーが伝播されること', async () => {
      // Arrange
      const error = new Error('Repository error');
      mockRepository.delete.mockRejectedValue(error);

      // Act & Assert
      await expect(useCase.execute('config-id')).rejects.toThrow('Repository error');
    });
  });
});

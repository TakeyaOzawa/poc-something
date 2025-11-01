/**
 * DeleteOldRecordingsUseCase Tests
 */

import { DeleteOldRecordingsUseCase } from '../DeleteOldRecordingsUseCase';
import { TabRecordingRepository } from '@domain/repositories/TabRecordingRepository';

describe('DeleteOldRecordingsUseCase', () => {
  let useCase: DeleteOldRecordingsUseCase;
  let mockRepository: jest.Mocked<TabRecordingRepository>;

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      getById: jest.fn(),
      getByAutomationResultId: jest.fn(),
      getLatestByVariablesId: jest.fn(),
      deleteOldRecordings: jest.fn(),
      delete: jest.fn()
    };
    useCase = new DeleteOldRecordingsUseCase(mockRepository);
  });

  describe('execute', () => {
    test('古い録画が正常に削除されること', async () => {
      // Arrange
      const olderThanDays = 7;
      const deletedCount = 5;
      mockRepository.deleteOldRecordings.mockResolvedValue(deletedCount);

      // Act
      const result = await useCase.execute(olderThanDays);

      // Assert
      expect(mockRepository.deleteOldRecordings).toHaveBeenCalledWith(olderThanDays);
      expect(result).toBe(deletedCount);
    });

    test('削除対象がない場合、0が返されること', async () => {
      // Arrange
      mockRepository.deleteOldRecordings.mockResolvedValue(0);

      // Act
      const result = await useCase.execute(10);

      // Assert
      expect(result).toBe(0);
    });

    test('無効な保持期間の場合、エラーが投げられること', async () => {
      // Act & Assert
      await expect(useCase.execute(0)).rejects.toThrow('保持期間は1日以上である必要があります');
      await expect(useCase.execute(-1)).rejects.toThrow('保持期間は1日以上である必要があります');
      expect(mockRepository.deleteOldRecordings).not.toHaveBeenCalled();
    });

    test('リポジトリエラーの場合、エラーが伝播されること', async () => {
      // Arrange
      const error = new Error('Repository error');
      mockRepository.deleteOldRecordings.mockRejectedValue(error);

      // Act & Assert
      await expect(useCase.execute(7)).rejects.toThrow('Repository error');
    });
  });
});

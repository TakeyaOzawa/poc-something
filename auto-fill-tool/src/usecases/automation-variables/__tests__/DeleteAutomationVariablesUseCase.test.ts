/**
 * DeleteAutomationVariablesUseCase Tests
 */

import { DeleteAutomationVariablesUseCase } from '../DeleteAutomationVariablesUseCase';
import { AutomationVariablesRepository } from '@domain/repositories/AutomationVariablesRepository';

describe('DeleteAutomationVariablesUseCase', () => {
  let useCase: DeleteAutomationVariablesUseCase;
  let mockRepository: jest.Mocked<AutomationVariablesRepository>;

  beforeEach(() => {
    mockRepository = {
      getAll: jest.fn(),
      getById: jest.fn(),
      getByWebsiteId: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      clear: jest.fn()
    };
    useCase = new DeleteAutomationVariablesUseCase(mockRepository);
  });

  describe('execute', () => {
    test('自動化変数が正常に削除されること', async () => {
      // Arrange
      const id = 'av-1';
      mockRepository.delete.mockResolvedValue(true);

      // Act
      const result = await useCase.execute(id);

      // Assert
      expect(mockRepository.delete).toHaveBeenCalledWith(id);
      expect(result).toBe(true);
    });

    test('存在しないIDの場合、falseが返されること', async () => {
      // Arrange
      const id = 'non-existent';
      mockRepository.delete.mockResolvedValue(false);

      // Act
      const result = await useCase.execute(id);

      // Assert
      expect(mockRepository.delete).toHaveBeenCalledWith(id);
      expect(result).toBe(false);
    });

    test('リポジトリエラーの場合、エラーが伝播されること', async () => {
      // Arrange
      const id = 'av-1';
      const error = new Error('Delete error');
      mockRepository.delete.mockRejectedValue(error);

      // Act & Assert
      await expect(useCase.execute(id)).rejects.toThrow('Delete error');
    });
  });
});

/**
 * SaveAutomationVariablesUseCase Tests
 */

import { SaveAutomationVariablesUseCase } from '../SaveAutomationVariablesUseCase';
import { AutomationVariables } from '@domain/entities/AutomationVariables';
import { AutomationVariablesRepository } from '@domain/repositories/AutomationVariablesRepository';

describe('SaveAutomationVariablesUseCase', () => {
  let useCase: SaveAutomationVariablesUseCase;
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
    useCase = new SaveAutomationVariablesUseCase(mockRepository);
  });

  describe('execute', () => {
    test('自動化変数が正常に保存されること', async () => {
      // Arrange
      const variables = AutomationVariables.create('website-1', 'Test Variables');
      mockRepository.save.mockResolvedValue();

      // Act
      await useCase.execute(variables);

      // Assert
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
      expect(mockRepository.save).toHaveBeenCalledWith(variables);
    });

    test('リポジトリエラーの場合、エラーが伝播されること', async () => {
      // Arrange
      const variables = AutomationVariables.create('website-1', 'Test Variables');
      const error = new Error('Save error');
      mockRepository.save.mockRejectedValue(error);

      // Act & Assert
      await expect(useCase.execute(variables)).rejects.toThrow('Save error');
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
    });
  });
});

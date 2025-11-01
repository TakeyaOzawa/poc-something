/**
 * UpdateAutomationVariablesUseCase Tests
 */

import { UpdateAutomationVariablesUseCase } from '../UpdateAutomationVariablesUseCase';
import { AutomationVariables } from '@domain/entities/AutomationVariables';
import { AutomationVariablesRepository } from '@domain/repositories/AutomationVariablesRepository';

describe('UpdateAutomationVariablesUseCase', () => {
  let useCase: UpdateAutomationVariablesUseCase;
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
    useCase = new UpdateAutomationVariablesUseCase(mockRepository);
  });

  describe('execute', () => {
    test('自動化変数が正常に更新されること', async () => {
      // Arrange
      const variables = AutomationVariables.create('website-1', 'Test Variables');
      mockRepository.update.mockResolvedValue();

      // Act
      await useCase.execute(variables);

      // Assert
      expect(mockRepository.update).toHaveBeenCalledTimes(1);
      expect(mockRepository.update).toHaveBeenCalledWith(variables);
    });

    test('リポジトリエラーの場合、エラーが伝播されること', async () => {
      // Arrange
      const variables = AutomationVariables.create('website-1', 'Test Variables');
      const error = new Error('Update error');
      mockRepository.update.mockRejectedValue(error);

      // Act & Assert
      await expect(useCase.execute(variables)).rejects.toThrow('Update error');
      expect(mockRepository.update).toHaveBeenCalledTimes(1);
    });
  });
});

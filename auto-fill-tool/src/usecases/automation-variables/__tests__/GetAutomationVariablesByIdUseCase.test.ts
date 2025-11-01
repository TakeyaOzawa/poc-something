/**
 * GetAutomationVariablesByIdUseCase Tests
 */

import { GetAutomationVariablesByIdUseCase } from '../GetAutomationVariablesByIdUseCase';
import { AutomationVariables } from '@domain/entities/AutomationVariables';
import { AutomationVariablesRepository } from '@domain/repositories/AutomationVariablesRepository';

describe('GetAutomationVariablesByIdUseCase', () => {
  let useCase: GetAutomationVariablesByIdUseCase;
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
    useCase = new GetAutomationVariablesByIdUseCase(mockRepository);
  });

  describe('execute', () => {
    test('IDで自動化変数が取得されること', async () => {
      // Arrange
      const variables = AutomationVariables.create('website-1', 'Test Variables');
      mockRepository.getById.mockResolvedValue(variables);

      // Act
      const result = await useCase.execute(variables.getId());

      // Assert
      expect(mockRepository.getById).toHaveBeenCalledWith(variables.getId());
      expect(result).toBe(variables);
    });

    test('存在しないIDの場合、undefinedが返されること', async () => {
      // Arrange
      mockRepository.getById.mockResolvedValue(undefined);

      // Act
      const result = await useCase.execute('non-existent');

      // Assert
      expect(mockRepository.getById).toHaveBeenCalledWith('non-existent');
      expect(result).toBeUndefined();
    });

    test('リポジトリエラーの場合、エラーが伝播されること', async () => {
      // Arrange
      const error = new Error('Repository error');
      mockRepository.getById.mockRejectedValue(error);

      // Act & Assert
      await expect(useCase.execute('test-id')).rejects.toThrow('Repository error');
    });
  });
});

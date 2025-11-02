/**
 * Unit Tests: SaveAutomationVariablesUseCase
 */

import { SaveAutomationVariablesUseCase } from '../SaveAutomationVariablesUseCase';
import { AutomationVariablesRepository } from '@domain/repositories/AutomationVariablesRepository';
import { AutomationVariables } from '@domain/entities/AutomationVariables';
import { AUTOMATION_STATUS } from '@domain/constants/AutomationStatus';
import { Result } from '@domain/values/result.value';
import { IdGenerator } from '@domain/types/id-generator.types';

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('SaveAutomationVariablesUseCase', () => {
  let mockRepository: jest.Mocked<AutomationVariablesRepository>;
  let useCase: SaveAutomationVariablesUseCase;

  const sampleVariable = AutomationVariables.create(
    {
      websiteId: 'website_1',
      status: AUTOMATION_STATUS.ENABLED,
      variables: { username: 'user1', password: 'pass1' },
    },
    mockIdGenerator
  );

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      load: jest.fn(),
      loadAll: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
      loadFromBatch: jest.fn(),
    } as jest.Mocked<AutomationVariablesRepository>;

    useCase = new SaveAutomationVariablesUseCase(mockRepository);
  }, mockIdGenerator);

  describe('execute', () => {
    it('should save automation variables to repository', async () => {
      mockRepository.save.mockResolvedValue(Result.success(undefined));

      await useCase.execute({ automationVariables: sampleVariable });

      expect(mockRepository.save).toHaveBeenCalledTimes(1);
      expect(mockRepository.save).toHaveBeenCalledWith(sampleVariable);
    });

    it('should throw error when repository returns failure', async () => {
      mockRepository.save.mockResolvedValue(Result.failure(new Error('Repository save error')));

      await expect(useCase.execute({ automationVariables: sampleVariable })).rejects.toThrow(
        'Failed to save automation variables: Repository save error'
      );
    });

    it('should save automation variables with different statuses', async () => {
      mockRepository.save.mockResolvedValue(Result.success(undefined));

      const enabledVar = AutomationVariables.create(
        {
          websiteId: 'w1',
          status: AUTOMATION_STATUS.ENABLED,
          variables: {},
        },
        mockIdGenerator
      );
      const disabledVar = AutomationVariables.create(
        {
          websiteId: 'w2',
          status: AUTOMATION_STATUS.DISABLED,
          variables: {},
        },
        mockIdGenerator
      );
      const onceVar = AutomationVariables.create(
        {
          websiteId: 'w3',
          status: AUTOMATION_STATUS.ONCE,
          variables: {},
        },
        mockIdGenerator
      );

      await useCase.execute({ automationVariables: enabledVar }, mockIdGenerator);
      await useCase.execute({ automationVariables: disabledVar });
      await useCase.execute({ automationVariables: onceVar });

      expect(mockRepository.save).toHaveBeenCalledTimes(3);
      expect(mockRepository.save).toHaveBeenNthCalledWith(1, enabledVar);
      expect(mockRepository.save).toHaveBeenNthCalledWith(2, disabledVar);
      expect(mockRepository.save).toHaveBeenNthCalledWith(3, onceVar);
    });

    it('should save automation variables with complex variable objects', async () => {
      mockRepository.save.mockResolvedValue(Result.success(undefined));

      const complexVar = AutomationVariables.create(
        {
          websiteId: 'w1',
          status: AUTOMATION_STATUS.ENABLED,
          variables: {
            username: 'testuser',
            password: 'testpass',
            email: 'test@test.com',
            phone: '123-456-7890',
          },
        },
        mockIdGenerator
      );

      await useCase.execute({ automationVariables: complexVar }, mockIdGenerator);

      expect(mockRepository.save).toHaveBeenCalledTimes(1);
      expect(mockRepository.save).toHaveBeenCalledWith(complexVar);
    });

    it('should save automation variables without status', async () => {
      mockRepository.save.mockResolvedValue(Result.success(undefined));

      const varWithoutStatus = AutomationVariables.create(
        {
          websiteId: 'w1',
          variables: { key: 'value' },
        },
        mockIdGenerator
      );

      await useCase.execute({ automationVariables: varWithoutStatus }, mockIdGenerator);

      expect(mockRepository.save).toHaveBeenCalledTimes(1);
      expect(mockRepository.save).toHaveBeenCalledWith(varWithoutStatus);
    });
  });
});

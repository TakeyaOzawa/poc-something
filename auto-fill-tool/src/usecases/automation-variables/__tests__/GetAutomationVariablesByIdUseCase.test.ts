/**
 * Unit Tests: GetAutomationVariablesByIdUseCase
 */

import { GetAutomationVariablesByIdUseCase } from '../GetAutomationVariablesByIdUseCase';
import { AutomationVariablesRepository } from '@domain/repositories/AutomationVariablesRepository';
import { AutomationVariables } from '@domain/entities/AutomationVariables';
import { Result } from '@domain/values/result.value';
import { IdGenerator } from '@domain/types/id-generator.types';

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('GetAutomationVariablesByIdUseCase', () => {
  let useCase: GetAutomationVariablesByIdUseCase;
  let mockRepository: jest.Mocked<AutomationVariablesRepository>;

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      load: jest.fn(),
      loadAll: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
      loadFromBatch: jest.fn(),
    };

    useCase = new GetAutomationVariablesByIdUseCase(mockRepository);
  });

  it('should return automation variables by id', async () => {
    const variables = AutomationVariables.create(
      {
        websiteId: 'website-123',
        variables: { username: 'test@example.com' },
      },
      mockIdGenerator
    );

    mockRepository.load.mockResolvedValue(Result.success(variables));

    const { automationVariables: result } = await useCase.execute(
      { id: variables.getId() },
      mockIdGenerator
    );

    expect(result).toBeInstanceOf(AutomationVariables);
    expect(result?.getId()).toBe(variables.getId());
    expect(result?.getWebsiteId()).toBe('website-123');
    expect(mockRepository.load).toHaveBeenCalledWith(variables.getId());
  });

  it('should return null when automation variables not found', async () => {
    mockRepository.load.mockResolvedValue(Result.success(null));

    const { automationVariables: result } = await useCase.execute({ id: 'non-existent-id' });

    expect(result).toBeNull();
    expect(mockRepository.load).toHaveBeenCalledWith('non-existent-id');
  });

  it('should throw error when repository returns failure', async () => {
    mockRepository.load.mockResolvedValue(Result.failure(new Error('Load failed')));

    await expect(useCase.execute({ id: 'test-id' })).rejects.toThrow(
      'Failed to load automation variables: Load failed'
    );
  });
});

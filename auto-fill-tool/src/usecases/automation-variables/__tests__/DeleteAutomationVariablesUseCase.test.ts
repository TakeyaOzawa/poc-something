/**
 * Unit Tests: DeleteAutomationVariablesUseCase
 */

import { DeleteAutomationVariablesUseCase } from '../DeleteAutomationVariablesUseCase';
import { AutomationVariablesRepository } from '@domain/repositories/AutomationVariablesRepository';
import { AutomationResultRepository } from '@domain/repositories/AutomationResultRepository';
import { Result } from '@domain/values/result.value';
import { IdGenerator } from '@domain/types/id-generator.types';

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('DeleteAutomationVariablesUseCase', () => {
  let useCase: DeleteAutomationVariablesUseCase;
  let mockVariablesRepository: jest.Mocked<AutomationVariablesRepository>;
  let mockResultRepository: jest.Mocked<AutomationResultRepository>;

  beforeEach(() => {
    mockVariablesRepository = {
      save: jest.fn(),
      load: jest.fn(),
      loadAll: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
      loadFromBatch: jest.fn(),
    };

    mockResultRepository = {
      save: jest.fn(),
      load: jest.fn(),
      loadAll: jest.fn(),
      loadByStatus: jest.fn(),
      loadInProgress: jest.fn(),
      loadByAutomationVariablesId: jest.fn(),
      loadLatestByAutomationVariablesId: jest.fn(),
      delete: jest.fn(),
      deleteByAutomationVariablesId: jest.fn(),
      loadInProgressFromBatch: jest.fn(),
    };

    useCase = new DeleteAutomationVariablesUseCase(mockVariablesRepository, mockResultRepository);
  });

  it('should delete automation variables and associated results', async () => {
    mockVariablesRepository.delete.mockResolvedValue(Result.success(undefined));
    mockResultRepository.deleteByAutomationVariablesId.mockResolvedValue(Result.success(undefined));

    await useCase.execute({ id: 'variables-id-123' });

    expect(mockVariablesRepository.delete).toHaveBeenCalledWith('variables-id-123');
    expect(mockResultRepository.deleteByAutomationVariablesId).toHaveBeenCalledWith(
      'variables-id-123'
    );
  });

  it('should complete even if no results exist', async () => {
    mockVariablesRepository.delete.mockResolvedValue(Result.success(undefined));
    mockResultRepository.deleteByAutomationVariablesId.mockResolvedValue(Result.success(undefined));

    await expect(useCase.execute({ id: 'variables-id-123' })).resolves.not.toThrow();

    expect(mockVariablesRepository.delete).toHaveBeenCalledWith('variables-id-123');
    expect(mockResultRepository.deleteByAutomationVariablesId).toHaveBeenCalledWith(
      'variables-id-123'
    );
  });

  it('should throw error when delete fails', async () => {
    mockVariablesRepository.delete.mockResolvedValue(Result.failure(new Error('Delete failed')));

    await expect(useCase.execute({ id: 'variables-id-123' })).rejects.toThrow(
      'Failed to delete automation variables: Delete failed'
    );

    expect(mockVariablesRepository.delete).toHaveBeenCalledWith('variables-id-123');
    expect(mockResultRepository.deleteByAutomationVariablesId).not.toHaveBeenCalled();
  });

  it('should throw error when deleteByAutomationVariablesId fails', async () => {
    mockVariablesRepository.delete.mockResolvedValue(Result.success(undefined));
    mockResultRepository.deleteByAutomationVariablesId.mockResolvedValue(
      Result.failure(new Error('Failed to delete results'))
    );

    await expect(useCase.execute({ id: 'variables-id-123' })).rejects.toThrow(
      'Failed to delete automation results: Failed to delete results'
    );

    expect(mockVariablesRepository.delete).toHaveBeenCalledWith('variables-id-123');
    expect(mockResultRepository.deleteByAutomationVariablesId).toHaveBeenCalledWith(
      'variables-id-123'
    );
  });
});

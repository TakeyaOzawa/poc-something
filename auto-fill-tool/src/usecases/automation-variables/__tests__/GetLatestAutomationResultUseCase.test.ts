/**
 * Unit Tests: GetLatestAutomationResultUseCase
 */

import { GetLatestAutomationResultUseCase } from '../GetLatestAutomationResultUseCase';
import { AutomationResultRepository } from '@domain/repositories/AutomationResultRepository';
import { AutomationResult } from '@domain/entities/AutomationResult';
import { EXECUTION_STATUS } from '@domain/constants/ExecutionStatus';
import { Result } from '@domain/values/result.value';

describe('GetLatestAutomationResultUseCase', () => {
  let useCase: GetLatestAutomationResultUseCase;
  let mockRepository: jest.Mocked<AutomationResultRepository>;

  beforeEach(() => {
    mockRepository = {
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

    useCase = new GetLatestAutomationResultUseCase(mockRepository);
  });

  it('should return latest automation result', async () => {
    const result = AutomationResult.create({
      automationVariablesId: 'variables-123',
      executionStatus: EXECUTION_STATUS.SUCCESS,
      resultDetail: 'Latest result',
    });

    mockRepository.loadLatestByAutomationVariablesId.mockResolvedValue(Result.success(result));

    const { result: loaded } = await useCase.execute({ automationVariablesId: 'variables-123' });

    expect(loaded).toBeInstanceOf(AutomationResult);
    expect(loaded?.getAutomationVariablesId()).toBe('variables-123');
    expect(loaded?.getResultDetail()).toBe('Latest result');
    expect(mockRepository.loadLatestByAutomationVariablesId).toHaveBeenCalledWith('variables-123');
  });

  it('should return null when no results exist', async () => {
    mockRepository.loadLatestByAutomationVariablesId.mockResolvedValue(Result.success(null));

    const { result } = await useCase.execute({ automationVariablesId: 'variables-123' });

    expect(result).toBeNull();
    expect(mockRepository.loadLatestByAutomationVariablesId).toHaveBeenCalledWith('variables-123');
  });

  it('should throw error when loadLatestByAutomationVariablesId fails', async () => {
    mockRepository.loadLatestByAutomationVariablesId.mockResolvedValue(
      Result.failure(new Error('Failed to load'))
    );

    await expect(useCase.execute({ automationVariablesId: 'variables-123' })).rejects.toThrow(
      'Failed to load latest automation result: Failed to load'
    );

    expect(mockRepository.loadLatestByAutomationVariablesId).toHaveBeenCalledWith('variables-123');
  });
});

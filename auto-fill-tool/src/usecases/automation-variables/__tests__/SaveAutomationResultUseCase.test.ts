/**
 * Unit Tests: SaveAutomationResultUseCase
 */

import { SaveAutomationResultUseCase } from '../SaveAutomationResultUseCase';
import { AutomationResultRepository } from '@domain/repositories/AutomationResultRepository';
import { AutomationResult } from '@domain/entities/AutomationResult';
import { EXECUTION_STATUS } from '@domain/constants/ExecutionStatus';
import { Result } from '@domain/values/result.value';

describe('SaveAutomationResultUseCase', () => {
  let useCase: SaveAutomationResultUseCase;
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

    useCase = new SaveAutomationResultUseCase(mockRepository);
  });

  it('should save automation result', async () => {
    const result = AutomationResult.create({
      automationVariablesId: 'variables-123',
      executionStatus: EXECUTION_STATUS.SUCCESS,
      resultDetail: 'Successfully completed all steps',
    });

    mockRepository.save.mockResolvedValue(Result.success(undefined));

    await useCase.execute({ result });

    expect(mockRepository.save).toHaveBeenCalledWith(result);
  });

  it('should save automation result with all fields', async () => {
    const result = new AutomationResult({
      id: 'result-123',
      automationVariablesId: 'variables-123',
      executionStatus: EXECUTION_STATUS.FAILED,
      resultDetail: 'Failed at step 5',
      startFrom: '2025-10-15T10:00:00.000Z',
      endTo: '2025-10-15T10:05:00.000Z',
      currentStepIndex: 0,
      totalSteps: 1,
      lastExecutedUrl: 'https://example.com',
    });

    mockRepository.save.mockResolvedValue(Result.success(undefined));

    await useCase.execute({ result });

    expect(mockRepository.save).toHaveBeenCalledWith(result);
  });

  it('should throw error when save fails', async () => {
    const result = AutomationResult.create({
      automationVariablesId: 'variables-123',
      executionStatus: EXECUTION_STATUS.SUCCESS,
      resultDetail: 'Successfully completed all steps',
    });

    mockRepository.save.mockResolvedValue(Result.failure(new Error('Save failed')));

    await expect(useCase.execute({ result })).rejects.toThrow(
      'Failed to save automation result: Save failed'
    );

    expect(mockRepository.save).toHaveBeenCalledWith(result);
  });
});

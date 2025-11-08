/**
 * Unit Tests: GetAutomationResultHistoryUseCase
 */

import { GetAutomationResultHistoryUseCase } from '../GetAutomationResultHistoryUseCase';
import { IdGenerator } from '@domain/types/id-generator.types';
// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-result-id'),
};
import { AutomationResultRepository } from '@domain/repositories/AutomationResultRepository';
// Mock IdGenerator
import { AutomationResult } from '@domain/entities/AutomationResult';
// Mock IdGenerator
import { EXECUTION_STATUS } from '@domain/constants/ExecutionStatus';
import { Result } from '@domain/values/result.value';

describe('GetAutomationResultHistoryUseCase', () => {
  let useCase: GetAutomationResultHistoryUseCase;
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

    useCase = new GetAutomationResultHistoryUseCase(mockRepository);
  });

  it('should return all automation results for a specific variables ID', async () => {
    const result1 = AutomationResult.create(
      {
        automationVariablesId: 'variables-123',
        executionStatus: EXECUTION_STATUS.SUCCESS,
        resultDetail: 'First result',
      },
      mockIdGenerator
    );

    const result2 = AutomationResult.create(
      {
        automationVariablesId: 'variables-123',
        executionStatus: EXECUTION_STATUS.FAILED,
        resultDetail: 'Second result',
      },
      mockIdGenerator
    );

    mockRepository.loadByAutomationVariablesId.mockResolvedValue(
      Result.success([result1, result2])
    );

    const { results } = await useCase.execute({ automationVariablesId: 'variables-123' });

    expect(results).toHaveLength(2);
    expect(results[0]).toHaveProperty('id');
    expect(results[0]).toHaveProperty('automationVariablesId', 'variables-123');
    expect(results[0]).toHaveProperty('executionStatus', EXECUTION_STATUS.SUCCESS);
    expect(results[0]).toHaveProperty('resultDetail', 'First result');
    expect(results[1]).toHaveProperty('executionStatus', EXECUTION_STATUS.FAILED);
    expect(results[1]).toHaveProperty('resultDetail', 'Second result');
    expect(mockRepository.loadByAutomationVariablesId).toHaveBeenCalledWith('variables-123');
  });

  it('should return empty array when no results exist', async () => {
    mockRepository.loadByAutomationVariablesId.mockResolvedValue(Result.success([]));

    const { results } = await useCase.execute({ automationVariablesId: 'variables-123' });

    expect(results).toEqual([]);
    expect(mockRepository.loadByAutomationVariablesId).toHaveBeenCalledWith('variables-123');
  });

  it('should return results sorted by date (newest first)', async () => {
    const oldResult = new AutomationResult({
      id: 'result-1',
      automationVariablesId: 'variables-123',
      executionStatus: EXECUTION_STATUS.SUCCESS,
      resultDetail: 'Old result',
      startFrom: '2025-10-15T09:00:00.000Z',
      endTo: null,
      currentStepIndex: 0,
      totalSteps: 1,
      lastExecutedUrl: 'https://example.com',
    });

    const newResult = new AutomationResult({
      id: 'result-2',
      automationVariablesId: 'variables-123',
      executionStatus: EXECUTION_STATUS.SUCCESS,
      resultDetail: 'New result',
      startFrom: '2025-10-15T11:00:00.000Z',
      endTo: null,
      currentStepIndex: 0,
      totalSteps: 1,
      lastExecutedUrl: 'https://example.com',
    });

    // Repository should return sorted by newest first
    mockRepository.loadByAutomationVariablesId.mockResolvedValue(
      Result.success([newResult, oldResult])
    );

    const { results } = await useCase.execute({ automationVariablesId: 'variables-123' });

    expect(results).toHaveLength(2);
    expect(results[0].resultDetail).toBe('New result');
    expect(results[1].resultDetail).toBe('Old result');
  });

  it('should throw error when loadByAutomationVariablesId fails', async () => {
    mockRepository.loadByAutomationVariablesId.mockResolvedValue(
      Result.failure(new Error('Failed to load'))
    );

    await expect(useCase.execute({ automationVariablesId: 'variables-123' })).rejects.toThrow(
      'Failed to load automation results: Failed to load'
    );

    expect(mockRepository.loadByAutomationVariablesId).toHaveBeenCalledWith('variables-123');
  });
});

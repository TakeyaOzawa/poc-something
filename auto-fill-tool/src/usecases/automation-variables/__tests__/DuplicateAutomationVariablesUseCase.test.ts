/**
 * Unit Tests: DuplicateAutomationVariablesUseCase
 */

import { DuplicateAutomationVariablesUseCase } from '../DuplicateAutomationVariablesUseCase';
import { AutomationVariablesRepository } from '@domain/repositories/AutomationVariablesRepository';
import { AutomationVariables } from '@domain/entities/AutomationVariables';
import { AUTOMATION_STATUS } from '@domain/constants/AutomationStatus';
import { Result } from '@domain/values/result.value';
import { IdGenerator } from '@domain/types/id-generator.types';

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest
    .fn()
    .mockReturnValueOnce('original-id')
    .mockReturnValueOnce('duplicate-id')
    .mockReturnValue('mock-id'),
};

describe('DuplicateAutomationVariablesUseCase', () => {
  let useCase: DuplicateAutomationVariablesUseCase;
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

    useCase = new DuplicateAutomationVariablesUseCase(
      mockRepository,
      mockIdGenerator,
      mockIdGenerator
    );
  });

  it('should duplicate automation variables with same websiteId', async () => {
    const original = AutomationVariables.create(
      {
        websiteId: 'website-123',
        variables: { username: 'test@example.com', password: 'secret' },
        status: AUTOMATION_STATUS.ENABLED,
      },
      mockIdGenerator
    );

    mockRepository.load.mockResolvedValue(Result.success(original));
    mockRepository.save.mockResolvedValue(Result.success(undefined));

    const { automationVariables: result } = await useCase.execute(
      { id: original.getId() },
      mockIdGenerator
    );

    expect(result).toBeInstanceOf(AutomationVariables);
    expect(result?.getWebsiteId()).toBe('website-123');
    expect(result?.getVariables()).toEqual({
      username: 'test@example.com',
      password: 'secret',
    });
    expect(result?.getStatus()).toBe(AUTOMATION_STATUS.ENABLED);
    expect(result?.getId()).not.toBe(original.getId()); // Different ID
    expect(mockRepository.save).toHaveBeenCalledWith(result);
  });

  it('should return null when automation variables not found', async () => {
    mockRepository.load.mockResolvedValue(Result.success(null));

    const result = await useCase.execute({ id: 'non-existent-id' });

    expect(result.automationVariables).toBeNull();
    expect(mockRepository.save).not.toHaveBeenCalled();
  });

  it('should return null when repository load fails', async () => {
    mockRepository.load.mockResolvedValue(Result.failure(new Error('Load failed')));

    const result = await useCase.execute({ id: 'test-id' });

    expect(result.automationVariables).toBeNull();
    expect(mockRepository.save).not.toHaveBeenCalled();
  });

  it('should return null when repository save fails', async () => {
    const original = AutomationVariables.create(
      {
        websiteId: 'website-123',
        variables: { key: 'value' },
      },
      mockIdGenerator
    );

    mockRepository.load.mockResolvedValue(Result.success(original));
    mockRepository.save.mockResolvedValue(Result.failure(new Error('Save failed')));

    const result = await useCase.execute({ id: original.getId() }, mockIdGenerator);

    expect(result.automationVariables).toBeNull();
  });

  it('should preserve all variables when duplicating', async () => {
    const original = AutomationVariables.create(
      {
        websiteId: 'website-123',
        variables: {
          username: 'user@example.com',
          password: 'secret123',
          api_key: 'key12345',
          endpoint: 'https://api.example.com',
        },
      },
      mockIdGenerator
    );

    mockRepository.load.mockResolvedValue(Result.success(original));
    mockRepository.save.mockResolvedValue(Result.success(undefined));

    const { automationVariables: result } = await useCase.execute(
      { id: original.getId() },
      mockIdGenerator
    );

    expect(result).toBeInstanceOf(AutomationVariables);
    expect(result?.getVariables()).toEqual({
      username: 'user@example.com',
      password: 'secret123',
      api_key: 'key12345',
      endpoint: 'https://api.example.com',
    });
  });

  it('should create duplicate with undefined status if original has no status', async () => {
    const original = AutomationVariables.create(
      {
        websiteId: 'website-123',
        variables: { key: 'value' },
      },
      mockIdGenerator
    );

    mockRepository.load.mockResolvedValue(Result.success(original));
    mockRepository.save.mockResolvedValue(Result.success(undefined));

    const { automationVariables: result } = await useCase.execute(
      { id: original.getId() },
      mockIdGenerator
    );

    expect(result).toBeInstanceOf(AutomationVariables);
    expect(result?.getStatus()).toBe('enabled');
  });
});

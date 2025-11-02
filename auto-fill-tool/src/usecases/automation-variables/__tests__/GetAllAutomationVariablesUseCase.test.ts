/**
 * Unit Tests: GetAllAutomationVariablesUseCase
 */

import { GetAllAutomationVariablesUseCase } from '../GetAllAutomationVariablesUseCase';
import { AutomationVariablesRepository } from '@domain/repositories/AutomationVariablesRepository';
import { AutomationVariables } from '@domain/entities/AutomationVariables';
import { AUTOMATION_STATUS } from '@domain/constants/AutomationStatus';
import { Result } from '@domain/values/result.value';
import { IdGenerator } from '@domain/types/id-generator.types';

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('GetAllAutomationVariablesUseCase', () => {
  let mockRepository: jest.Mocked<AutomationVariablesRepository>;
  let useCase: GetAllAutomationVariablesUseCase;

  const sampleVariables = [
    AutomationVariables.create(
      {
        websiteId: 'website_1',
        status: AUTOMATION_STATUS.ENABLED,
        variables: { username: 'user1', password: 'pass1' },
      },
      mockIdGenerator
    ),
    AutomationVariables.create(
      {
        websiteId: 'website_2',
        status: AUTOMATION_STATUS.DISABLED,
        variables: { email: 'test@example.com' },
      },
      mockIdGenerator
    ),
    AutomationVariables.create(
      {
        websiteId: 'website_3',
        status: AUTOMATION_STATUS.ONCE,
        variables: {},
      },
      mockIdGenerator
    ),
  ];

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      load: jest.fn(),
      loadAll: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
      loadFromBatch: jest.fn(),
    } as jest.Mocked<AutomationVariablesRepository>;

    useCase = new GetAllAutomationVariablesUseCase(mockRepository);
  }, mockIdGenerator);

  describe('execute', () => {
    it(
      'should return all automation variables from repository',
      async () => {
        mockRepository.loadAll.mockResolvedValue(Result.success(sampleVariables));

        const { automationVariables: result } = await useCase.execute();

        expect(mockRepository.loadAll).toHaveBeenCalledTimes(1);
        expect(result).toEqual(sampleVariables);
        expect(result).toHaveLength(3);
      },
      mockIdGenerator
    );

    it('should return empty array when no automation variables exist', async () => {
      mockRepository.loadAll.mockResolvedValue(Result.success([]));

      const { automationVariables: result } = await useCase.execute();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should throw error when repository returns failure', async () => {
      mockRepository.loadAll.mockResolvedValue(Result.failure(new Error('Repository error')));

      await expect(useCase.execute()).rejects.toThrow(
        'Failed to load automation variables: Repository error'
      );
    });

    it('should return AutomationVariables entities', async () => {
      mockRepository.loadAll.mockResolvedValue(Result.success(sampleVariables));

      const { automationVariables: result } = await useCase.execute();

      result.forEach((variable) => {
        expect(variable).toBeInstanceOf(AutomationVariables);
      });
    });

    it('should preserve all properties of automation variables', async () => {
      mockRepository.loadAll.mockResolvedValue(Result.success(sampleVariables));

      const { automationVariables: result } = await useCase.execute();

      expect(result[0].getWebsiteId()).toBe('website_1');
      expect(result[0].getStatus()).toBe(AUTOMATION_STATUS.ENABLED);
      expect(result[0].getVariables()).toHaveProperty('username');
      expect(result[0].getVariables()).toHaveProperty('password');
    });
  });
});

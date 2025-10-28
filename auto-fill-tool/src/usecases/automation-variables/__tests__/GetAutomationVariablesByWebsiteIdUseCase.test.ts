/**
 * Unit Tests: GetAutomationVariablesByWebsiteIdUseCase
 */

import { GetAutomationVariablesByWebsiteIdUseCase } from '../GetAutomationVariablesByWebsiteIdUseCase';
import { AutomationVariablesRepository } from '@domain/repositories/AutomationVariablesRepository';
import { AutomationVariables } from '@domain/entities/AutomationVariables';
import { AUTOMATION_STATUS } from '@domain/constants/AutomationStatus';
import { Result } from '@domain/values/result.value';

describe('GetAutomationVariablesByWebsiteIdUseCase', () => {
  let mockRepository: jest.Mocked<AutomationVariablesRepository>;
  let useCase: GetAutomationVariablesByWebsiteIdUseCase;

  const sampleVariable = AutomationVariables.create({
    websiteId: 'website_1',
    status: AUTOMATION_STATUS.ENABLED,
    variables: { username: 'user1', password: 'pass1' },
  });

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      load: jest.fn(),
      loadAll: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
      loadFromBatch: jest.fn(),
    } as jest.Mocked<AutomationVariablesRepository>;

    useCase = new GetAutomationVariablesByWebsiteIdUseCase(mockRepository);
  });

  describe('execute', () => {
    it('should return automation variables for the websiteId', async () => {
      mockRepository.load.mockResolvedValue(Result.success(sampleVariable));

      const { automationVariables: result } = await useCase.execute({ websiteId: 'website_1' });

      expect(mockRepository.load).toHaveBeenCalledTimes(1);
      expect(mockRepository.load).toHaveBeenCalledWith('website_1');
      expect(result).toBe(sampleVariable);
      expect(result?.getWebsiteId()).toBe('website_1');
    });

    it('should return null when automation variables do not exist for websiteId', async () => {
      mockRepository.load.mockResolvedValue(Result.success(null));

      const { automationVariables: result } = await useCase.execute({
        websiteId: 'website_nonexistent',
      });

      expect(mockRepository.load).toHaveBeenCalledTimes(1);
      expect(result).toBeNull();
    });

    it('should throw error when repository returns failure', async () => {
      mockRepository.load.mockResolvedValue(Result.failure(new Error('Repository error')));

      await expect(useCase.execute({ websiteId: 'website_1' })).rejects.toThrow(
        'Failed to load automation variables: Repository error'
      );
    });

    it('should return AutomationVariables entity when found', async () => {
      mockRepository.load.mockResolvedValue(Result.success(sampleVariable));

      const { automationVariables: result } = await useCase.execute({ websiteId: 'website_1' });

      expect(result).toBeInstanceOf(AutomationVariables);
    });

    it('should preserve all properties of automation variables', async () => {
      mockRepository.load.mockResolvedValue(Result.success(sampleVariable));

      const { automationVariables: result } = await useCase.execute({ websiteId: 'website_1' });

      expect(result?.getWebsiteId()).toBe('website_1');
      expect(result?.getStatus()).toBe(AUTOMATION_STATUS.ENABLED);
      expect(result?.getVariables()).toHaveProperty('username');
      expect(result?.getVariables()).toHaveProperty('password');
    });
  });
});

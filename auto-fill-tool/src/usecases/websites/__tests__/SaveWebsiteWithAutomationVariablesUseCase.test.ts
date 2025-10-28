/**
 * Unit Tests: SaveWebsiteWithAutomationVariablesUseCase
 */

import {
  SaveWebsiteWithAutomationVariablesUseCase,
  SaveWebsiteWithAutomationVariablesInput,
} from '../SaveWebsiteWithAutomationVariablesUseCase';
import { WebsiteRepository } from '@domain/repositories/WebsiteRepository';
import { AutomationVariablesRepository } from '@domain/repositories/AutomationVariablesRepository';
import { SaveWebsiteUseCase } from '../SaveWebsiteUseCase';
import { UpdateWebsiteUseCase } from '../UpdateWebsiteUseCase';
import { GetWebsiteByIdUseCase } from '../GetWebsiteByIdUseCase';
import { AutomationVariables } from '@domain/entities/AutomationVariables';
import { AUTOMATION_STATUS } from '@domain/constants/AutomationStatus';
import { WebsiteData } from '@domain/entities/Website';
import { Result } from '@domain/values/result.value';

describe('SaveWebsiteWithAutomationVariablesUseCase', () => {
  let mockWebsiteRepository: jest.Mocked<WebsiteRepository>;
  let mockAutomationVariablesRepository: jest.Mocked<AutomationVariablesRepository>;
  let mockSaveWebsiteUseCase: jest.Mocked<SaveWebsiteUseCase>;
  let mockUpdateWebsiteUseCase: jest.Mocked<UpdateWebsiteUseCase>;
  let mockGetWebsiteByIdUseCase: jest.Mocked<GetWebsiteByIdUseCase>;
  let useCase: SaveWebsiteWithAutomationVariablesUseCase;

  const existingWebsiteData: WebsiteData = {
    id: 'website_1',
    name: 'Existing Website',
    startUrl: 'https://existing.com',
    updatedAt: '2025-01-08T10:30:00.000Z',
    editable: true,
  };

  const newWebsiteData: WebsiteData = {
    id: 'website_new',
    name: 'New Website',
    startUrl: 'https://new.com',
    updatedAt: '2025-01-08T10:30:00.000Z',
    editable: true,
  };

  beforeEach(() => {
    mockWebsiteRepository = {
      load: jest.fn(),
      save: jest.fn(),
    } as jest.Mocked<WebsiteRepository>;

    mockAutomationVariablesRepository = {
      save: jest.fn(),
      load: jest.fn(),
      loadAll: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
      loadFromBatch: jest.fn(),
    } as jest.Mocked<AutomationVariablesRepository>;

    mockSaveWebsiteUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<SaveWebsiteUseCase>;

    mockUpdateWebsiteUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<UpdateWebsiteUseCase>;

    mockGetWebsiteByIdUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<GetWebsiteByIdUseCase>;

    useCase = new SaveWebsiteWithAutomationVariablesUseCase(
      mockWebsiteRepository,
      mockAutomationVariablesRepository,
      mockSaveWebsiteUseCase,
      mockUpdateWebsiteUseCase,
      mockGetWebsiteByIdUseCase
    );
  });

  describe('execute - create new website', () => {
    it('should create new website with automation variables', async () => {
      const input: SaveWebsiteWithAutomationVariablesInput = {
        name: 'New Website',
        startUrl: 'https://new.com',
        status: AUTOMATION_STATUS.ENABLED,
        variables: { username: 'user1', password: 'pass1' },
      };

      mockSaveWebsiteUseCase.execute.mockResolvedValue({ success: true, website: newWebsiteData });
      mockAutomationVariablesRepository.load.mockResolvedValue(Result.success(null));
      mockAutomationVariablesRepository.save.mockResolvedValue(Result.success(undefined));

      const result = await useCase.execute(input);

      expect(mockSaveWebsiteUseCase.execute).toHaveBeenCalledTimes(1);
      expect(mockSaveWebsiteUseCase.execute).toHaveBeenCalledWith({
        name: 'New Website',
        editable: true,
        startUrl: 'https://new.com',
      });
      expect(mockAutomationVariablesRepository.save).toHaveBeenCalledTimes(1);
      expect(result.success).toBe(true);
      expect(result.website).toEqual(newWebsiteData);
    });

    it('should create automation variables with correct data', async () => {
      const input: SaveWebsiteWithAutomationVariablesInput = {
        name: 'New Website',
        startUrl: 'https://new.com',
        status: AUTOMATION_STATUS.ENABLED,
        variables: { username: 'user1' },
      };

      mockSaveWebsiteUseCase.execute.mockResolvedValue({ success: true, website: newWebsiteData });
      mockAutomationVariablesRepository.load.mockResolvedValue(Result.success(null));
      mockAutomationVariablesRepository.save.mockResolvedValue(Result.success(undefined));

      await useCase.execute(input);

      expect(mockAutomationVariablesRepository.save).toHaveBeenCalledTimes(1);
      const savedVariable = mockAutomationVariablesRepository.save.mock
        .calls[0][0] as AutomationVariables;
      expect(savedVariable.getWebsiteId()).toBe(newWebsiteData.id);
      expect(savedVariable.getStatus()).toBe(AUTOMATION_STATUS.ENABLED);
      expect(savedVariable.getVariables()).toEqual({ username: 'user1' });
    });
  });

  describe('execute - update existing website', () => {
    it('should update existing website with automation variables', async () => {
      const input: SaveWebsiteWithAutomationVariablesInput = {
        websiteId: 'website_1',
        name: 'Updated Website',
        startUrl: 'https://updated.com',
        status: AUTOMATION_STATUS.DISABLED,
        variables: { email: 'test@example.com' },
      };

      mockGetWebsiteByIdUseCase.execute.mockResolvedValue({
        success: true,
        website: existingWebsiteData,
      });
      mockUpdateWebsiteUseCase.execute.mockResolvedValue({ success: true });
      mockAutomationVariablesRepository.load.mockResolvedValue(Result.success(null));
      mockAutomationVariablesRepository.save.mockResolvedValue(Result.success(undefined));

      const result = await useCase.execute(input);

      expect(mockGetWebsiteByIdUseCase.execute).toHaveBeenCalledWith({ websiteId: 'website_1' });
      expect(mockUpdateWebsiteUseCase.execute).toHaveBeenCalledWith({
        websiteData: {
          ...existingWebsiteData,
          name: 'Updated Website',
          startUrl: 'https://updated.com',
        },
      });
      expect(mockAutomationVariablesRepository.save).toHaveBeenCalledTimes(1);
      expect(result.success).toBe(true);
      expect(result.website).toEqual({
        ...existingWebsiteData,
        name: 'Updated Website',
        startUrl: 'https://updated.com',
      });
    });

    it('should return failure when website not found', async () => {
      const input: SaveWebsiteWithAutomationVariablesInput = {
        websiteId: 'website_nonexistent',
        name: 'Updated Website',
        startUrl: 'https://updated.com',
        status: AUTOMATION_STATUS.ENABLED,
        variables: {},
      };

      mockGetWebsiteByIdUseCase.execute.mockResolvedValue({ success: true, website: null });

      const result = await useCase.execute(input);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Website not found: website_nonexistent');
    });

    it('should update existing automation variables', async () => {
      const input: SaveWebsiteWithAutomationVariablesInput = {
        websiteId: 'website_1',
        name: 'Updated Website',
        startUrl: 'https://updated.com',
        status: AUTOMATION_STATUS.ONCE,
        variables: { newKey: 'newValue' },
      };

      const existingAutomationVariables = AutomationVariables.create({
        websiteId: 'website_1',
        status: AUTOMATION_STATUS.ENABLED,
        variables: { oldKey: 'oldValue' },
      });

      mockGetWebsiteByIdUseCase.execute.mockResolvedValue({
        success: true,
        website: existingWebsiteData,
      });
      mockUpdateWebsiteUseCase.execute.mockResolvedValue({ success: true });
      mockAutomationVariablesRepository.load.mockResolvedValue(
        Result.success(existingAutomationVariables)
      );
      mockAutomationVariablesRepository.save.mockResolvedValue(Result.success(undefined));

      await useCase.execute(input);

      expect(mockAutomationVariablesRepository.save).toHaveBeenCalledTimes(1);
      const savedVariable = mockAutomationVariablesRepository.save.mock
        .calls[0][0] as AutomationVariables;
      expect(savedVariable.getStatus()).toBe(AUTOMATION_STATUS.ONCE);
      expect(savedVariable.getVariables()).toEqual({ newKey: 'newValue' });
    });
  });

  describe('execute - edge cases', () => {
    it('should handle empty variables', async () => {
      const input: SaveWebsiteWithAutomationVariablesInput = {
        name: 'New Website',
        startUrl: 'https://new.com',
        status: AUTOMATION_STATUS.ENABLED,
        variables: {},
      };

      mockSaveWebsiteUseCase.execute.mockResolvedValue({ success: true, website: newWebsiteData });
      mockAutomationVariablesRepository.load.mockResolvedValue(Result.success(null));
      mockAutomationVariablesRepository.save.mockResolvedValue(Result.success(undefined));

      const result = await useCase.execute(input);

      expect(result.success).toBe(true);
      expect(result.website).toEqual(newWebsiteData);
      expect(mockAutomationVariablesRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should handle different automation statuses', async () => {
      mockSaveWebsiteUseCase.execute.mockResolvedValue({ success: true, website: newWebsiteData });
      mockAutomationVariablesRepository.load.mockResolvedValue(Result.success(null));
      mockAutomationVariablesRepository.save.mockResolvedValue(Result.success(undefined));

      const statuses = [
        AUTOMATION_STATUS.ENABLED,
        AUTOMATION_STATUS.DISABLED,
        AUTOMATION_STATUS.ONCE,
      ];

      for (const status of statuses) {
        const input: SaveWebsiteWithAutomationVariablesInput = {
          name: 'Test Website',
          startUrl: 'https://test.com',
          status: status,
          variables: {},
        };

        await useCase.execute(input);
      }

      expect(mockAutomationVariablesRepository.save).toHaveBeenCalledTimes(3);
    });

    it('should return failure when website creation fails', async () => {
      const input: SaveWebsiteWithAutomationVariablesInput = {
        name: 'New Website',
        startUrl: 'https://new.com',
        status: AUTOMATION_STATUS.ENABLED,
        variables: {},
      };

      mockSaveWebsiteUseCase.execute.mockResolvedValue({
        success: false,
        error: 'Website creation failed',
      });

      const result = await useCase.execute(input);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Website creation failed');
    });

    it('should propagate automation variables save errors', async () => {
      const input: SaveWebsiteWithAutomationVariablesInput = {
        name: 'New Website',
        startUrl: 'https://new.com',
        status: AUTOMATION_STATUS.ENABLED,
        variables: {},
      };

      mockSaveWebsiteUseCase.execute.mockResolvedValue({ success: true, website: newWebsiteData });
      mockAutomationVariablesRepository.load.mockResolvedValue(Result.success(null));
      mockAutomationVariablesRepository.save.mockRejectedValue(new Error('Variables save failed'));

      await expect(useCase.execute(input)).rejects.toThrow('Variables save failed');
    });
  });
});

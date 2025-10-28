/**
 * Unit Tests: WebsiteSelectManager
 */

import { WebsiteSelectManager } from '../WebsiteSelectManager';
import { GetAllWebsitesUseCase } from '@usecases/websites/GetAllWebsitesUseCase';
import { GetWebsiteByIdUseCase } from '@usecases/websites/GetWebsiteByIdUseCase';
import { UpdateWebsiteUseCase } from '@usecases/websites/UpdateWebsiteUseCase';
import { Logger } from '@domain/types/logger.types';
import { WebsiteData } from '@domain/entities/Website';
import { I18nAdapter } from '@infrastructure/adapters/I18nAdapter';
import { TemplateLoader } from '@presentation/common/TemplateLoader';

// Mock I18nAdapter
jest.mock('@infrastructure/adapters/I18nAdapter', () => ({
  I18nAdapter: {
    getMessage: jest.fn((key: string) => {
      const messages: Record<string, string> = {
        allSites: '全サイト',
      };
      return messages[key] || key;
    }),
    format: jest.fn(),
    applyToDOM: jest.fn(),
  },
}));

describe('WebsiteSelectManager', () => {
  let manager: WebsiteSelectManager;
  let mockWebsiteSelect: HTMLSelectElement;
  let mockLogger: jest.Mocked<Logger>;
  let mockOnWebsiteChange: jest.Mock;
  let mockGetAllWebsitesUseCase: jest.Mocked<GetAllWebsitesUseCase>;
  let mockGetWebsiteByIdUseCase: jest.Mocked<GetWebsiteByIdUseCase>;
  let mockUpdateWebsiteUseCase: jest.Mocked<UpdateWebsiteUseCase>;

  beforeEach(() => {
    // Set up template for website select option
    const template = document.createElement('template');
    template.id = 'website-select-option-template';
    template.innerHTML = `
      <option class="website-option" data-bind="value:value,text:text"></option>
    `;
    document.body.appendChild(template);

    // Mock document.getElementById for template
    jest.spyOn(document, 'getElementById').mockImplementation((id: string) => {
      if (id === 'website-select-option-template') {
        return template;
      }
      return null;
    });

    // Setup mock select element
    mockWebsiteSelect = document.createElement('select');

    // Setup mock logger
    mockLogger = {
      info: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      createChild: jest.fn().mockReturnThis(),
    } as any;

    // Setup mock callbacks
    mockOnWebsiteChange = jest.fn();

    // Setup mock use cases
    mockGetAllWebsitesUseCase = {
      execute: jest.fn(),
    } as any;

    mockGetWebsiteByIdUseCase = {
      execute: jest.fn(),
    } as any;

    mockUpdateWebsiteUseCase = {
      execute: jest.fn(),
    } as any;

    manager = new WebsiteSelectManager(
      mockWebsiteSelect,
      mockLogger,
      mockOnWebsiteChange,
      mockGetAllWebsitesUseCase,
      mockGetWebsiteByIdUseCase,
      mockUpdateWebsiteUseCase
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
    TemplateLoader.clearCache();
  });

  describe('initialize', () => {
    it('should attach change event listener and load websites', async () => {
      const mockWebsites: WebsiteData[] = [
        {
          id: 'website-1',
          name: 'Test Website 1',
          url: 'https://test1.com',
          active: true,
          updatedAt: new Date().toISOString(),
          editable: true,
        } as WebsiteData,
        {
          id: 'website-2',
          name: 'Test Website 2',
          url: 'https://test2.com',
          active: true,
          updatedAt: new Date().toISOString(),
          editable: true,
        } as WebsiteData,
      ];

      mockGetAllWebsitesUseCase.execute.mockResolvedValue({
        success: true,
        websites: mockWebsites,
      });

      manager.initialize();

      // Wait for async loadWebsiteSelect to complete
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Check if websites were loaded
      expect(mockGetAllWebsitesUseCase.execute).toHaveBeenCalled();
      expect(mockWebsiteSelect.options.length).toBe(3); // 1 default + 2 websites

      // Simulate change event
      mockWebsiteSelect.value = 'website-1';
      mockWebsiteSelect.dispatchEvent(new Event('change'));

      expect(mockOnWebsiteChange).toHaveBeenCalledWith('website-1');
    });
  });

  describe('getCurrentWebsiteId', () => {
    it('should return current selected website ID', () => {
      // Add an option to the select element
      const option = document.createElement('option');
      option.value = 'website-123';
      mockWebsiteSelect.appendChild(option);
      mockWebsiteSelect.value = 'website-123';
      expect(manager.getCurrentWebsiteId()).toBe('website-123');
    });

    it('should return empty string when no website is selected', () => {
      mockWebsiteSelect.value = '';
      expect(manager.getCurrentWebsiteId()).toBe('');
    });
  });

  describe('loadWebsiteSelect', () => {
    it('should load websites into select dropdown', async () => {
      const mockWebsites: WebsiteData[] = [
        {
          id: 'website-1',
          name: 'Test Website 1',
          url: 'https://test1.com',
          active: true,
          updatedAt: new Date().toISOString(),
          editable: true,
        } as WebsiteData,
        {
          id: 'website-2',
          name: 'Test Website 2',
          url: 'https://test2.com',
          active: true,
          updatedAt: new Date().toISOString(),
          editable: true,
        } as WebsiteData,
      ];

      mockGetAllWebsitesUseCase.execute.mockResolvedValue({
        success: true,
        websites: mockWebsites,
      });

      await manager.loadWebsiteSelect();

      expect(mockGetAllWebsitesUseCase.execute).toHaveBeenCalled();
      expect(mockWebsiteSelect.options.length).toBe(3);
      expect(mockWebsiteSelect.options[0].value).toBe('');
      expect(mockWebsiteSelect.options[0].textContent).toBe('全サイト');
      expect(mockWebsiteSelect.options[1].value).toBe('website-1');
      expect(mockWebsiteSelect.options[1].textContent).toBe('Test Website 1');
      expect(mockWebsiteSelect.options[2].value).toBe('website-2');
      expect(mockWebsiteSelect.options[2].textContent).toBe('Test Website 2');
    });

    it('should handle empty website list', async () => {
      mockGetAllWebsitesUseCase.execute.mockResolvedValue({ success: true, websites: [] });

      await manager.loadWebsiteSelect();

      expect(mockWebsiteSelect.options.length).toBe(1);
      expect(mockWebsiteSelect.options[0].value).toBe('');
      expect(mockWebsiteSelect.options[0].textContent).toBe('全サイト');
    });

    it('should handle errors when loading websites', async () => {
      mockGetAllWebsitesUseCase.execute.mockRejectedValue(new Error('Load failed'));

      await manager.loadWebsiteSelect();

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to load website select',
        expect.any(Error)
      );
    });
  });

  describe('getWebsiteById', () => {
    it('should return website data when found', async () => {
      const mockWebsite: WebsiteData = {
        id: 'website-1',
        name: 'Test Website',
        url: 'https://test.com',
        active: true,
        updatedAt: new Date().toISOString(),
        editable: true,
      } as WebsiteData;

      mockGetWebsiteByIdUseCase.execute.mockResolvedValue({ success: true, website: mockWebsite });

      const result = await manager.getWebsiteById('website-1');

      expect(mockGetWebsiteByIdUseCase.execute).toHaveBeenCalledWith({ websiteId: 'website-1' });
      expect(result).toEqual(mockWebsite);
    });

    it('should return null when website not found', async () => {
      mockGetWebsiteByIdUseCase.execute.mockResolvedValue({ success: true, website: null });

      const result = await manager.getWebsiteById('non-existent');

      expect(result).toBeNull();
    });

    it('should handle errors and return null', async () => {
      mockGetWebsiteByIdUseCase.execute.mockRejectedValue(new Error('Fetch failed'));

      const result = await manager.getWebsiteById('website-1');

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to get website by ID',
        expect.any(Error)
      );
      expect(result).toBeNull();
    });
  });

  describe('updateWebsite', () => {
    it('should update website successfully', async () => {
      const mockWebsite: WebsiteData = {
        id: 'website-1',
        name: 'Test Website',
        url: 'https://test.com',
        active: true,
        updatedAt: new Date().toISOString(),
        editable: true,
      } as WebsiteData;

      mockGetWebsiteByIdUseCase.execute.mockResolvedValue({ success: true, website: mockWebsite });
      mockUpdateWebsiteUseCase.execute.mockResolvedValue({ success: true });

      const updates = { name: 'Updated Website' };
      await manager.updateWebsite('website-1', updates);

      expect(mockGetWebsiteByIdUseCase.execute).toHaveBeenCalledWith({ websiteId: 'website-1' });
      expect(mockUpdateWebsiteUseCase.execute).toHaveBeenCalledWith({
        websiteData: {
          ...mockWebsite,
          ...updates,
        },
      });
    });

    it('should throw error when website not found', async () => {
      mockGetWebsiteByIdUseCase.execute.mockResolvedValue({ success: true, website: null });

      await expect(manager.updateWebsite('non-existent', { name: 'Updated' })).rejects.toThrow(
        'Website not found'
      );

      expect(mockUpdateWebsiteUseCase.execute).not.toHaveBeenCalled();
    });

    it('should handle errors during update', async () => {
      const mockWebsite: WebsiteData = {
        id: 'website-1',
        name: 'Test Website',
        url: 'https://test.com',
        active: true,
        updatedAt: new Date().toISOString(),
        editable: true,
      } as WebsiteData;

      mockGetWebsiteByIdUseCase.execute.mockResolvedValue({ success: true, website: mockWebsite });
      mockUpdateWebsiteUseCase.execute.mockRejectedValue(new Error('Update failed'));

      await expect(manager.updateWebsite('website-1', { name: 'Updated' })).rejects.toThrow(
        'Update failed'
      );

      expect(mockLogger.error).toHaveBeenCalledWith('Failed to update website', expect.any(Error));
    });
  });
});

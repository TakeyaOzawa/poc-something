/**
 * Tests for ChromeWebsiteConfigRepository
 */

import browser from 'webextension-polyfill';
import { ChromeWebsiteConfigRepository, WebsiteConfig } from '../ChromeWebsiteConfigRepository';
import { Logger } from '@domain/types/logger.types';

// Mock webextension-polyfill
jest.mock('webextension-polyfill', () => ({
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
    },
  },
}));

describe('ChromeWebsiteConfigRepository', () => {
  let repository: ChromeWebsiteConfigRepository;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      createChild: jest.fn().mockReturnThis(),
    } as any;

    repository = new ChromeWebsiteConfigRepository(mockLogger);
  });

  describe('loadWebsites', () => {
    it('should return empty array when no data in storage', async () => {
      (browser.storage.local.get as jest.Mock).mockResolvedValue({});

      const result = await repository.loadWebsites();

      expect(result).toEqual([]);
      expect(browser.storage.local.get).toHaveBeenCalledWith('websiteConfigs');
    });

    it('should return websites from storage', async () => {
      const websites: WebsiteConfig[] = [
        {
          id: 'website1',
          name: 'Test Website',
          updatedAt: '2024-01-01T00:00:00.000Z',
          editable: true,
          startUrl: 'https://example.com',
        },
      ];

      (browser.storage.local.get as jest.Mock).mockResolvedValue({
        websiteConfigs: JSON.stringify(websites),
      });

      const result = await repository.loadWebsites();

      expect(result).toEqual(websites);
    });

    it('should migrate websites missing updatedAt field', async () => {
      const websitesWithoutUpdatedAt = [
        {
          id: 'website1',
          name: 'Test Website',
          editable: true,
        },
      ];

      (browser.storage.local.get as jest.Mock).mockResolvedValue({
        websiteConfigs: JSON.stringify(websitesWithoutUpdatedAt),
      });
      (browser.storage.local.set as jest.Mock).mockResolvedValue(undefined);

      const result = await repository.loadWebsites();

      expect(result[0].updatedAt).toBeDefined();
      expect(typeof result[0].updatedAt).toBe('string');
      expect(browser.storage.local.set).toHaveBeenCalled();
    });

    it('should migrate websites missing editable field', async () => {
      const websitesWithoutEditable = [
        {
          id: 'website1',
          name: 'Test Website',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ];

      (browser.storage.local.get as jest.Mock).mockResolvedValue({
        websiteConfigs: JSON.stringify(websitesWithoutEditable),
      });
      (browser.storage.local.set as jest.Mock).mockResolvedValue(undefined);

      const result = await repository.loadWebsites();

      expect(result[0].editable).toBe(true);
      expect(browser.storage.local.set).toHaveBeenCalled();
    });

    it('should migrate websites missing both updatedAt and editable fields', async () => {
      const websitesWithoutFields = [
        {
          id: 'website1',
          name: 'Test Website',
        },
      ];

      (browser.storage.local.get as jest.Mock).mockResolvedValue({
        websiteConfigs: JSON.stringify(websitesWithoutFields),
      });
      (browser.storage.local.set as jest.Mock).mockResolvedValue(undefined);

      const result = await repository.loadWebsites();

      expect(result[0].updatedAt).toBeDefined();
      expect(result[0].editable).toBe(true);
      expect(browser.storage.local.set).toHaveBeenCalledTimes(1);
    });

    it('should not save when no migration is needed', async () => {
      const websites: WebsiteConfig[] = [
        {
          id: 'website1',
          name: 'Test Website',
          updatedAt: '2024-01-01T00:00:00.000Z',
          editable: true,
        },
      ];

      (browser.storage.local.get as jest.Mock).mockResolvedValue({
        websiteConfigs: JSON.stringify(websites),
      });

      await repository.loadWebsites();

      expect(browser.storage.local.set).not.toHaveBeenCalled();
    });

    it('should return empty array and log error on storage error', async () => {
      const error = new Error('Storage error');
      (browser.storage.local.get as jest.Mock).mockRejectedValue(error);

      const result = await repository.loadWebsites();

      expect(result).toEqual([]);
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to load websites', error);
    });
  });

  describe('saveWebsites', () => {
    it('should save websites to storage', async () => {
      const websites: WebsiteConfig[] = [
        {
          id: 'website1',
          name: 'Test Website',
          updatedAt: '2024-01-01T00:00:00.000Z',
          editable: true,
        },
      ];

      (browser.storage.local.set as jest.Mock).mockResolvedValue(undefined);

      await repository.saveWebsites(websites);

      expect(browser.storage.local.set).toHaveBeenCalledWith({
        websiteConfigs: JSON.stringify(websites),
      });
    });

    it('should save empty array', async () => {
      (browser.storage.local.set as jest.Mock).mockResolvedValue(undefined);

      await repository.saveWebsites([]);

      expect(browser.storage.local.set).toHaveBeenCalledWith({
        websiteConfigs: JSON.stringify([]),
      });
    });

    it('should throw and log error on storage error', async () => {
      const error = new Error('Storage error');
      (browser.storage.local.set as jest.Mock).mockRejectedValue(error);

      const websites: WebsiteConfig[] = [
        {
          id: 'website1',
          name: 'Test Website',
          updatedAt: '2024-01-01T00:00:00.000Z',
          editable: true,
        },
      ];

      await expect(repository.saveWebsites(websites)).rejects.toThrow('Storage error');
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to save websites', error);
    });
  });
});

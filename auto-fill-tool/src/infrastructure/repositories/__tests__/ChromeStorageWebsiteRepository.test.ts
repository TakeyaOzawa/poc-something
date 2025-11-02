import { ChromeStorageWebsiteRepository } from '../ChromeStorageWebsiteRepository';
import { WebsiteCollection } from '@domain/entities/WebsiteCollection';
import { Website } from '@domain/entities/Website';
import { NoOpLogger } from '@domain/services/NoOpLogger';
import { Result } from '@domain/values/result.value';
import browser from 'webextension-polyfill';
import { IdGenerator } from '@domain/types/id-generator.types';

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('ChromeStorageWebsiteRepository', () => {
  let repository: ChromeStorageWebsiteRepository;

  beforeEach(() => {
    repository = new ChromeStorageWebsiteRepository(new NoOpLogger());
    jest.clearAllMocks();
  });

  describe('save', () => {
    it('should save website collection to Chrome Storage', async () => {
      const website1 = Website.create({ name: 'Test Website 1' });
      const website2 = Website.create({ name: 'Test Website 2' }, mockIdGenerator);
      const collection = new WebsiteCollection([website1, website2]);

      (browser.storage.local.set as jest.Mock).mockResolvedValue(undefined);

      const result = await repository.save(collection);

      expect(result.isSuccess).toBe(true);
      expect(browser.storage.local.set).toHaveBeenCalledTimes(1);
      expect(browser.storage.local.set).toHaveBeenCalledWith({
        websiteConfigs: collection.toJSON(),
      });
    });

    it('should return failure if save fails', async () => {
      const collection = WebsiteCollection.empty();
      (browser.storage.local.set as jest.Mock).mockRejectedValue(new Error('Storage error'));

      const result = await repository.save(collection);

      expect(result.isFailure).toBe(true);
      expect(result.error?.message).toContain('Storage error');
    });
  });

  describe('load', () => {
    it('should load website collection from Chrome Storage', async () => {
      const website1 = Website.create({ name: 'Test Website 1' });
      const website2 = Website.create({ name: 'Test Website 2' }, mockIdGenerator);
      const collection = new WebsiteCollection([website1, website2]);
      const json = collection.toJSON();

      (browser.storage.local.get as jest.Mock).mockResolvedValue(
        {
          websiteConfigs: json,
        },
        mockIdGenerator
      );

      const result = await repository.load();

      expect(result.isSuccess).toBe(true);
      expect(result.value).toBeDefined();
      const loaded = result.value!;
      expect(browser.storage.local.get).toHaveBeenCalledWith('websiteConfigs');
      expect(loaded.getAll()).toHaveLength(2);
      expect(loaded.getAll()[0].getName()).toBe('Test Website 1');
      expect(loaded.getAll()[1].getName()).toBe('Test Website 2');
    });

    it('should return empty collection if no data in storage', async () => {
      (browser.storage.local.get as jest.Mock).mockResolvedValue({});

      const result = await repository.load();

      expect(result.isSuccess).toBe(true);
      expect(result.value).toBeDefined();
      const loaded = result.value!;
      expect(loaded.getAll()).toHaveLength(0);
    });

    it('should return failure if load fails', async () => {
      (browser.storage.local.get as jest.Mock).mockRejectedValue(new Error('Storage error'));

      const result = await repository.load();

      expect(result.isFailure).toBe(true);
      expect(result.error?.message).toContain('Storage error');
    });
  });
});

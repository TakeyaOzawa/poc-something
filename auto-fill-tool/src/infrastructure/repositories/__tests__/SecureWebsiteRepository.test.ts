/**
 * Unit Tests: SecureWebsiteRepository
 * Tests the secure website repository implementation with encryption
 */

import { SecureWebsiteRepository } from '../SecureWebsiteRepository';
import { WebsiteCollection } from '@domain/entities/WebsiteCollection';
import { Website } from '@domain/entities/Website';
import { SecureStorage } from '@domain/types/secure-storage-port.types';
import { Result } from '@domain/values/result.value';

// Mock SecureStorage
const createMockSecureStorage = (): jest.Mocked<SecureStorage> => ({
  isInitialized: jest.fn(),
  initialize: jest.fn(),
  unlock: jest.fn(),
  lock: jest.fn(),
  isUnlocked: jest.fn(),
  getSessionExpiresAt: jest.fn(),
  extendSession: jest.fn(),
  saveEncrypted: jest.fn(),
  loadEncrypted: jest.fn(),
  removeEncrypted: jest.fn(),
  clearAllEncrypted: jest.fn(),
  changeMasterPassword: jest.fn(),
  reset: jest.fn(),
});

describe('SecureWebsiteRepository', () => {
  let mockSecureStorage: jest.Mocked<SecureStorage>;
  let repository: SecureWebsiteRepository;

  beforeEach(() => {
    mockSecureStorage = createMockSecureStorage();
    repository = new SecureWebsiteRepository(mockSecureStorage);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should create repository with SecureStorage dependency', () => {
      expect(repository).toBeInstanceOf(SecureWebsiteRepository);
    });
  });

  describe('save()', () => {
    it('should save collection encrypted when storage is unlocked', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);

      const website1 = Website.create({
        name: 'Test Website 1',
        startUrl: 'https://example.com',
      });

      const website2 = Website.create({
        name: 'Test Website 2',
        startUrl: 'https://example2.com',
      });

      const collection = new WebsiteCollection([website1, website2]);

      const result = await repository.save(collection);

      expect(result.isSuccess).toBe(true);
      expect(mockSecureStorage.isUnlocked).toHaveBeenCalled();
      expect(mockSecureStorage.saveEncrypted).toHaveBeenCalledWith('websites', expect.any(String));
      expect(mockSecureStorage.extendSession).toHaveBeenCalled();

      // Verify saved data is valid JSON
      const savedJson = (mockSecureStorage.saveEncrypted as jest.Mock).mock.calls[0][1];
      const parsedData = JSON.parse(savedJson);
      expect(Array.isArray(parsedData)).toBe(true);
      expect(parsedData).toHaveLength(2);
    });

    it('should save empty collection', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);

      const collection = WebsiteCollection.empty();

      const result = await repository.save(collection);

      expect(result.isSuccess).toBe(true);
      expect(mockSecureStorage.saveEncrypted).toHaveBeenCalledWith('websites', expect.any(String));

      const savedJson = (mockSecureStorage.saveEncrypted as jest.Mock).mock.calls[0][1];
      const parsedData = JSON.parse(savedJson);
      expect(parsedData).toEqual([]);
    });

    it('should save collection with single website', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);

      const website = Website.create({
        name: 'Single Website',
        startUrl: 'https://single.com',
        editable: true,
      });

      const collection = new WebsiteCollection([website]);

      const result = await repository.save(collection);

      expect(result.isSuccess).toBe(true);
      const savedJson = (mockSecureStorage.saveEncrypted as jest.Mock).mock.calls[0][1];
      const parsedData = JSON.parse(savedJson);
      expect(parsedData).toHaveLength(1);
      expect(parsedData[0].name).toBe('Single Website');
      expect(parsedData[0].startUrl).toBe('https://single.com');
    });

    it('should return failure when storage is locked', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(false);

      const collection = WebsiteCollection.empty();

      const result = await repository.save(collection);

      expect(result.isFailure).toBe(true);
      expect(result.error?.message).toContain('Cannot access encrypted data: Storage is locked');
      expect(mockSecureStorage.saveEncrypted).not.toHaveBeenCalled();
      expect(mockSecureStorage.extendSession).not.toHaveBeenCalled();
    });

    it('should handle collection with multiple websites correctly', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);

      const websites = Array.from({ length: 5 }, (_, i) =>
        Website.create({
          name: `Website ${i + 1}`,
          startUrl: `https://example${i + 1}.com`,
          editable: i % 2 === 0, // Alternate editable status
        })
      );

      const collection = new WebsiteCollection(websites);

      const result = await repository.save(collection);

      expect(result.isSuccess).toBe(true);
      const savedJson = (mockSecureStorage.saveEncrypted as jest.Mock).mock.calls[0][1];
      const parsedData = JSON.parse(savedJson);
      expect(parsedData).toHaveLength(5);
    });

    it('should preserve website data during save', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);

      const website = Website.create({
        name: 'Detailed Website',
        startUrl: 'https://detailed.com/path?query=value',
        editable: false,
      });

      const collection = new WebsiteCollection([website]);

      const result = await repository.save(collection);

      expect(result.isSuccess).toBe(true);
      const savedJson = (mockSecureStorage.saveEncrypted as jest.Mock).mock.calls[0][1];
      const parsedData = JSON.parse(savedJson);
      expect(parsedData[0].name).toBe('Detailed Website');
      expect(parsedData[0].startUrl).toBe('https://detailed.com/path?query=value');
      expect(parsedData[0].editable).toBe(false);
      expect(parsedData[0].id).toBeTruthy();
      expect(parsedData[0].updatedAt).toBeTruthy();
    });
  });

  describe('load()', () => {
    it('should load and decrypt collection when it exists', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);

      const websiteData = [
        {
          id: 'website-1',
          name: 'Test Website 1',
          startUrl: 'https://example1.com',
          editable: true,
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'website-2',
          name: 'Test Website 2',
          startUrl: 'https://example2.com',
          editable: false,
          updatedAt: new Date().toISOString(),
        },
      ];

      mockSecureStorage.loadEncrypted.mockResolvedValue(JSON.stringify(websiteData));

      const result = await repository.load();

      expect(result.isSuccess).toBe(true);
      expect(result.value).toBeDefined();
      const loaded = result.value!;
      expect(loaded).toBeInstanceOf(WebsiteCollection);
      expect(loaded.getAll()).toHaveLength(2);

      const websites = loaded.getAll();
      expect(websites[0].getName()).toBe('Test Website 1');
      expect(websites[1].getName()).toBe('Test Website 2');

      expect(mockSecureStorage.isUnlocked).toHaveBeenCalled();
      expect(mockSecureStorage.loadEncrypted).toHaveBeenCalledWith('websites');
      expect(mockSecureStorage.extendSession).toHaveBeenCalled();
    });

    it('should return empty collection when no data exists', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);
      mockSecureStorage.loadEncrypted.mockResolvedValue(null);

      const result = await repository.load();

      expect(result.isSuccess).toBe(true);
      expect(result.value).toBeDefined();
      const loaded = result.value!;
      expect(loaded).toBeInstanceOf(WebsiteCollection);
      expect(loaded.getAll()).toHaveLength(0);
      expect(mockSecureStorage.extendSession).toHaveBeenCalled();
    });

    it('should return empty collection when storage returns undefined', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);
      mockSecureStorage.loadEncrypted.mockResolvedValue(undefined);

      const result = await repository.load();

      expect(result.isSuccess).toBe(true);
      expect(result.value).toBeDefined();
      const loaded = result.value!;
      expect(loaded).toBeInstanceOf(WebsiteCollection);
      expect(loaded.getAll()).toHaveLength(0);
    });

    it('should return failure when storage is locked', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(false);

      const result = await repository.load();

      expect(result.isFailure).toBe(true);
      expect(result.error?.message).toContain('Cannot access encrypted data: Storage is locked');
      expect(mockSecureStorage.loadEncrypted).not.toHaveBeenCalled();
      expect(mockSecureStorage.extendSession).not.toHaveBeenCalled();
    });

    it('should correctly reconstruct websites with all properties', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);

      const websiteData = [
        {
          id: 'full-website-id',
          name: 'Complete Website',
          startUrl: 'https://complete.com',
          editable: true,
          updatedAt: '2025-10-16T10:00:00.000Z',
        },
      ];

      mockSecureStorage.loadEncrypted.mockResolvedValue(JSON.stringify(websiteData));

      const result = await repository.load();

      expect(result.isSuccess).toBe(true);
      const loaded = result.value!;
      const website = loaded.getById('full-website-id');
      expect(website).toBeDefined();
      expect(website!.getId()).toBe('full-website-id');
      expect(website!.getName()).toBe('Complete Website');
      expect(website!.getStartUrl()).toBe('https://complete.com');
      expect(website!.isEditable()).toBe(true);
      expect(website!.toData().updatedAt).toBe('2025-10-16T10:00:00.000Z');
    });

    it('should handle empty array JSON', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);
      mockSecureStorage.loadEncrypted.mockResolvedValue('[]');

      const result = await repository.load();

      expect(result.isSuccess).toBe(true);
      const loaded = result.value!;
      expect(loaded.getAll()).toHaveLength(0);
    });

    it('should load collection with many websites', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);

      const websiteData = Array.from({ length: 20 }, (_, i) => ({
        id: `website-${i}`,
        name: `Website ${i}`,
        startUrl: `https://example${i}.com`,
        editable: true,
        updatedAt: new Date().toISOString(),
      }));

      mockSecureStorage.loadEncrypted.mockResolvedValue(JSON.stringify(websiteData));

      const result = await repository.load();

      expect(result.isSuccess).toBe(true);
      const loaded = result.value!;
      expect(loaded.getAll()).toHaveLength(20);
    });

    it('should handle invalid JSON gracefully (returns empty collection)', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);
      mockSecureStorage.loadEncrypted.mockResolvedValue('invalid json');

      const result = await repository.load();

      expect(result.isSuccess).toBe(true);
      const loaded = result.value!;
      // WebsiteCollection.fromJSON handles errors gracefully and returns empty collection
      expect(loaded).toBeInstanceOf(WebsiteCollection);
      expect(loaded.getAll()).toHaveLength(0);
    });
  });

  describe('Session Management', () => {
    it('should extend session after successful save', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);

      const collection = WebsiteCollection.empty();

      const result = await repository.save(collection);

      expect(result.isSuccess).toBe(true);
      expect(mockSecureStorage.extendSession).toHaveBeenCalledTimes(1);
    });

    it('should extend session after successful load', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);
      mockSecureStorage.loadEncrypted.mockResolvedValue('[]');

      const result = await repository.load();

      expect(result.isSuccess).toBe(true);
      expect(mockSecureStorage.extendSession).toHaveBeenCalledTimes(1);
    });

    it('should extend session even when no data exists', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);
      mockSecureStorage.loadEncrypted.mockResolvedValue(null);

      const result = await repository.load();

      expect(result.isSuccess).toBe(true);
      expect(mockSecureStorage.extendSession).toHaveBeenCalledTimes(1);
    });

    it('should not extend session when operation fails due to lock', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(false);

      const collection = WebsiteCollection.empty();

      const result = await repository.save(collection);

      expect(result.isFailure).toBe(true);
      expect(mockSecureStorage.extendSession).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should provide descriptive error message when locked', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(false);

      const collection = WebsiteCollection.empty();

      const result = await repository.save(collection);

      expect(result.isFailure).toBe(true);
      expect(result.error?.message).toContain('Cannot access encrypted data: Storage is locked');
    });

    it('should return failure when SecureStorage save fails', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);
      mockSecureStorage.saveEncrypted.mockRejectedValue(new Error('Storage write error'));

      const collection = WebsiteCollection.empty();

      const result = await repository.save(collection);

      expect(result.isFailure).toBe(true);
      expect(result.error?.message).toContain('Storage write error');
    });

    it('should return failure when SecureStorage load fails', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);
      mockSecureStorage.loadEncrypted.mockRejectedValue(new Error('Decryption failed'));

      const result = await repository.load();

      expect(result.isFailure).toBe(true);
      expect(result.error?.message).toContain('Decryption failed');
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete workflow: save and load', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);

      // Create and save collection
      const website1 = Website.create({
        name: 'Workflow Website 1',
        startUrl: 'https://workflow1.com',
      });

      const website2 = Website.create({
        name: 'Workflow Website 2',
        startUrl: 'https://workflow2.com',
      });

      const originalCollection = new WebsiteCollection([website1, website2]);
      const saveResult = await repository.save(originalCollection);

      expect(saveResult.isSuccess).toBe(true);

      // Load collection
      const savedJson = (mockSecureStorage.saveEncrypted as jest.Mock).mock.calls[0][1];
      mockSecureStorage.loadEncrypted.mockResolvedValue(savedJson);

      const loadResult = await repository.load();

      expect(loadResult.isSuccess).toBe(true);
      const loadedCollection = loadResult.value!;
      expect(loadedCollection.getAll()).toHaveLength(2);
      const websites = loadedCollection.getAll();
      expect(websites.map((w) => w.getName())).toContain('Workflow Website 1');
      expect(websites.map((w) => w.getName())).toContain('Workflow Website 2');
    });

    it('should handle save-load-modify-save cycle', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);

      // Initial save
      const website = Website.create({
        name: 'Initial Website',
        startUrl: 'https://initial.com',
      });
      const collection1 = new WebsiteCollection([website]);
      const saveResult1 = await repository.save(collection1);
      expect(saveResult1.isSuccess).toBe(true);

      // Load
      const savedJson1 = (mockSecureStorage.saveEncrypted as jest.Mock).mock.calls[0][1];
      mockSecureStorage.loadEncrypted.mockResolvedValue(savedJson1);
      const loadResult1 = await repository.load();
      expect(loadResult1.isSuccess).toBe(true);
      const loadedCollection = loadResult1.value!;

      // Modify (add new website)
      const newWebsite = Website.create({
        name: 'Added Website',
        startUrl: 'https://added.com',
      });
      const collection2 = loadedCollection.add(newWebsite);
      const saveResult2 = await repository.save(collection2);
      expect(saveResult2.isSuccess).toBe(true);

      // Load again
      const savedJson2 = (mockSecureStorage.saveEncrypted as jest.Mock).mock.calls[1][1];
      mockSecureStorage.loadEncrypted.mockResolvedValue(savedJson2);
      const loadResult2 = await repository.load();
      expect(loadResult2.isSuccess).toBe(true);
      const finalCollection = loadResult2.value!;

      expect(finalCollection.getAll()).toHaveLength(2);
    });

    it('should preserve data integrity through save-load cycle', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);

      const originalWebsite = Website.create({
        name: 'Data Integrity Test',
        startUrl: 'https://integrity.com/path?param=value#hash',
        editable: false,
      });

      const originalCollection = new WebsiteCollection([originalWebsite]);
      const saveResult = await repository.save(originalCollection);
      expect(saveResult.isSuccess).toBe(true);

      const savedJson = (mockSecureStorage.saveEncrypted as jest.Mock).mock.calls[0][1];
      mockSecureStorage.loadEncrypted.mockResolvedValue(savedJson);

      const loadResult = await repository.load();
      expect(loadResult.isSuccess).toBe(true);
      const loadedCollection = loadResult.value!;
      const loadedWebsite = loadedCollection.getAll()[0];

      expect(loadedWebsite.getName()).toBe('Data Integrity Test');
      expect(loadedWebsite.getStartUrl()).toBe('https://integrity.com/path?param=value#hash');
      expect(loadedWebsite.isEditable()).toBe(false);
      expect(loadedWebsite.getId()).toBeTruthy();
      expect(loadedWebsite.toData().updatedAt).toBeTruthy();
    });
  });

  describe('Collection Operations', () => {
    it('should handle collection with editable and non-editable websites', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);

      const editable = Website.create({
        name: 'Editable',
        editable: true,
      });

      const nonEditable = Website.create({
        name: 'Non-Editable',
        editable: false,
      });

      const collection = new WebsiteCollection([editable, nonEditable]);
      const result = await repository.save(collection);

      expect(result.isSuccess).toBe(true);
      const savedJson = (mockSecureStorage.saveEncrypted as jest.Mock).mock.calls[0][1];
      const parsedData = JSON.parse(savedJson);

      const editableData = parsedData.find((w: any) => w.name === 'Editable');
      const nonEditableData = parsedData.find((w: any) => w.name === 'Non-Editable');

      expect(editableData.editable).toBe(true);
      expect(nonEditableData.editable).toBe(false);
    });

    it('should handle websites with optional startUrl', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);

      const withUrl = Website.create({
        name: 'With URL',
        startUrl: 'https://example.com',
      });

      const withoutUrl = Website.create({
        name: 'Without URL',
      });

      const collection = new WebsiteCollection([withUrl, withoutUrl]);
      const saveResult = await repository.save(collection);

      expect(saveResult.isSuccess).toBe(true);
      const savedJson = (mockSecureStorage.saveEncrypted as jest.Mock).mock.calls[0][1];
      mockSecureStorage.loadEncrypted.mockResolvedValue(savedJson);

      const loadResult = await repository.load();
      expect(loadResult.isSuccess).toBe(true);
      const loaded = loadResult.value!;
      const websites = loaded.getAll();

      const loadedWithUrl = websites.find((w) => w.getName() === 'With URL');
      const loadedWithoutUrl = websites.find((w) => w.getName() === 'Without URL');

      expect(loadedWithUrl!.getStartUrl()).toBe('https://example.com');
      expect(loadedWithoutUrl!.getStartUrl()).toBeUndefined();
    });
  });
});

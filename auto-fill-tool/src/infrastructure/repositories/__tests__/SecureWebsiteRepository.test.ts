/**
 * Unit Tests: SecureWebsiteRepository
 * Tests the secure repository implementation with encryption
 */

import { SecureWebsiteRepository } from '../SecureWebsiteRepository';
import { WebsiteCollection } from '@domain/entities/WebsiteCollection';
import { Website } from '@domain/entities/Website';
import { SecureStorage } from '@domain/types/secure-storage-port.types';
import { Result } from '@domain/values/result.value';
import { IdGenerator } from '@domain/types/id-generator.types';

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

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('SecureWebsiteRepository', () => {
  let repository: SecureWebsiteRepository;
  let mockSecureStorage: jest.Mocked<SecureStorage>;

  beforeEach(() => {
    mockSecureStorage = createMockSecureStorage();
    repository = new SecureWebsiteRepository(mockSecureStorage);
  });

  describe('save()', () => {
    it('should save collection encrypted when storage is unlocked', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);
      mockSecureStorage.saveEncrypted.mockResolvedValue(Result.success(undefined));

      const collection = new WebsiteCollection();

      const result = await repository.save(collection);

      expect(result.isSuccess).toBe(true);
      expect(mockSecureStorage.saveEncrypted).toHaveBeenCalledWith(
        'websites',
        '[]' // 空のコレクションはJSON文字列'[]'として保存される
      );
    });

    it('should return failure when storage is locked', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(false);

      const collection = new WebsiteCollection();

      const result = await repository.save(collection);

      expect(result.isFailure).toBe(true);
      expect(result.error?.message).toContain('Storage is locked');
    });
  });

  describe('load()', () => {
    it('should load and decrypt collection when it exists', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);

      const websiteDataJson = JSON.stringify([
        {
          id: 'website-1',
          name: 'Test Website',
          startUrl: 'https://example.com',
          updatedAt: new Date().toISOString(),
          editable: true,
        },
      ]);

      mockSecureStorage.loadEncrypted.mockResolvedValue(Result.success(websiteDataJson));

      const result = await repository.load();

      expect(result.isSuccess).toBe(true);
      const loaded = result.value!;
      expect(loaded).toBeInstanceOf(WebsiteCollection);
      expect(loaded.getAll()).toHaveLength(1);
    });

    it('should return empty collection when none exist', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);
      mockSecureStorage.loadEncrypted.mockResolvedValue(Result.success(null));

      const result = await repository.load();

      expect(result.isSuccess).toBe(true);
      const loaded = result.value!;
      expect(loaded).toBeInstanceOf(WebsiteCollection);
      expect(loaded.getAll()).toHaveLength(0);
    });

    it('should return failure when storage is locked', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(false);

      const result = await repository.load();

      expect(result.isFailure).toBe(true);
      expect(result.error?.message).toContain('Storage is locked');
    });
  });
});

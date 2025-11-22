/**
 * Unit Tests: SecureAutomationVariablesRepository
 * Tests the secure repository implementation with encryption
 */

import { SecureAutomationVariablesRepository } from '../SecureAutomationVariablesRepository';
import { IdGenerator } from '@domain/types/id-generator.types';
// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};
import { AutomationVariables, AutomationVariablesData } from '@domain/entities/AutomationVariables';
// Mock IdGenerator
import { SecureStorage } from '@domain/ports/SecureStoragePort';
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

describe('SecureAutomationVariablesRepository', () => {
  let repository: SecureAutomationVariablesRepository;
  let mockSecureStorage: jest.Mocked<SecureStorage>;

  beforeEach(() => {
    mockSecureStorage = createMockSecureStorage();
    repository = new SecureAutomationVariablesRepository(mockSecureStorage);
  });

  describe('save()', () => {
    it(
      'should save entity encrypted when storage is unlocked',
      async () => {
        mockSecureStorage.isUnlocked.mockReturnValue(true);
        mockSecureStorage.loadEncrypted.mockResolvedValue(Result.success({}));
        mockSecureStorage.saveEncrypted.mockResolvedValue(Result.success(undefined));

        const entity = AutomationVariables.create(
          {
            websiteId: 'test-website',
            variables: { username: 'admin' },
          },
          mockIdGenerator
        );

        const result = await repository.save(entity);

        expect(result.isSuccess).toBe(true);
        expect(mockSecureStorage.saveEncrypted).toHaveBeenCalledWith(
          'automation_variables',
          expect.objectContaining({
            'test-website': expect.objectContaining({
              websiteId: 'test-website',
              variables: { username: 'admin' },
            }),
          })
        );
      },
      mockIdGenerator
    );

    it(
      'should return failure when storage is locked',
      async () => {
        mockSecureStorage.isUnlocked.mockReturnValue(false);

        const entity = AutomationVariables.create(
          {
            websiteId: 'test-website',
            variables: { username: 'admin' },
          },
          mockIdGenerator
        );

        const result = await repository.save(entity);

        expect(result.isFailure).toBe(true);
        expect(result.error?.message).toContain('Storage is locked');
      },
      mockIdGenerator
    );
  });

  describe('load()', () => {
    it('should load and decrypt entity when it exists', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);

      const savedData: AutomationVariablesData = {
        id: 'test-id',
        websiteId: 'test-website',
        variables: { username: 'admin' },
        updatedAt: new Date().toISOString(),
      };

      mockSecureStorage.loadEncrypted.mockResolvedValue(
        Result.success({
          'test-website': savedData,
        })
      );

      const result = await repository.load('test-website');

      expect(result.isSuccess).toBe(true);
      const loaded = result.value!;
      expect(loaded).toBeInstanceOf(AutomationVariables);
      expect(loaded.getWebsiteId()).toBe('test-website');
      expect(loaded.getVariables()).toEqual({ username: 'admin' });
    });

    it('should return null when entity does not exist', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);
      mockSecureStorage.loadEncrypted.mockResolvedValue(Result.success({}));

      const result = await repository.load('non-existent-website');

      expect(result.isSuccess).toBe(true);
      expect(result.value).toBeNull();
    });

    it('should return failure when storage is locked', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(false);

      const result = await repository.load('test-website');

      expect(result.isFailure).toBe(true);
      expect(result.error?.message).toContain('Storage is locked');
    });
  });

  describe('loadAll()', () => {
    it('should load all entities from encrypted storage', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);

      const data1: AutomationVariablesData = {
        id: 'id-1',
        websiteId: 'website-1',
        variables: { key1: 'value1' },
        updatedAt: new Date().toISOString(),
      };

      const data2: AutomationVariablesData = {
        id: 'id-2',
        websiteId: 'website-2',
        variables: { key2: 'value2' },
        updatedAt: new Date().toISOString(),
      };

      mockSecureStorage.loadEncrypted.mockResolvedValue(
        Result.success({
          'website-1': data1,
          'website-2': data2,
        })
      );

      const result = await repository.loadAll();

      expect(result.isSuccess).toBe(true);
      const entities = result.value!;
      expect(entities).toHaveLength(2);
      expect(entities[0]).toBeInstanceOf(AutomationVariables);
      expect(entities[1]).toBeInstanceOf(AutomationVariables);
    });

    it('should return empty array when no entities exist', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);
      mockSecureStorage.loadEncrypted.mockResolvedValue(Result.success({}));

      const result = await repository.loadAll();

      expect(result.isSuccess).toBe(true);
      expect(result.value).toEqual([]);
    });
  });

  describe('delete()', () => {
    it('should delete entity when it exists', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);
      mockSecureStorage.loadEncrypted.mockResolvedValue(
        Result.success({
          'website-to-delete': {
            id: 'id-1',
            websiteId: 'website-to-delete',
            variables: {},
            updatedAt: new Date().toISOString(),
          },
          'website-to-keep': {
            id: 'id-2',
            websiteId: 'website-to-keep',
            variables: {},
            updatedAt: new Date().toISOString(),
          },
        })
      );
      mockSecureStorage.saveEncrypted.mockResolvedValue(Result.success(undefined));

      const result = await repository.delete('website-to-delete');

      expect(result.isSuccess).toBe(true);
      expect(mockSecureStorage.saveEncrypted).toHaveBeenCalledWith(
        'automation_variables',
        expect.objectContaining({
          'website-to-keep': expect.anything(),
        })
      );
    });
  });

  describe('exists()', () => {
    it('should return true when entity exists', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);
      mockSecureStorage.loadEncrypted.mockResolvedValue(
        Result.success({
          'existing-website': {
            id: 'existing-id',
            websiteId: 'existing-website',
            variables: {},
            updatedAt: new Date().toISOString(),
          },
        })
      );

      const result = await repository.exists('existing-website');

      expect(result.isSuccess).toBe(true);
      expect(result.value).toBe(true);
    });

    it('should return false when entity does not exist', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);
      mockSecureStorage.loadEncrypted.mockResolvedValue(Result.success({}));

      const result = await repository.exists('non-existent-website');

      expect(result.isSuccess).toBe(true);
      expect(result.value).toBe(false);
    });

    it('should return false when storage is locked', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(false);

      const result = await repository.exists('test-website');

      expect(result.isSuccess).toBe(true);
      expect(result.value).toBe(false);
    });
  });
});

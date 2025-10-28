/**
 * Unit Tests: SecureAutomationVariablesRepository
 * Tests the secure repository implementation with encryption
 */

import { SecureAutomationVariablesRepository } from '../SecureAutomationVariablesRepository';
import { AutomationVariables, AutomationVariablesData } from '@domain/entities/AutomationVariables';
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

describe('SecureAutomationVariablesRepository', () => {
  let mockSecureStorage: jest.Mocked<SecureStorage>;
  let repository: SecureAutomationVariablesRepository;

  beforeEach(() => {
    mockSecureStorage = createMockSecureStorage();
    repository = new SecureAutomationVariablesRepository(mockSecureStorage);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should create repository with SecureStorage dependency', () => {
      expect(repository).toBeInstanceOf(SecureAutomationVariablesRepository);
    });
  });

  describe('save()', () => {
    it('should save entity encrypted when storage is unlocked', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);
      mockSecureStorage.loadEncrypted.mockResolvedValue({});

      const entity = AutomationVariables.create({
        websiteId: 'test-website',
        variables: { username: 'admin', password: 'secret' },
      });

      const result = await repository.save(entity);

      expect(result.isSuccess).toBe(true);
      expect(mockSecureStorage.isUnlocked).toHaveBeenCalled();
      expect(mockSecureStorage.loadEncrypted).toHaveBeenCalledWith('automation_variables');
      expect(mockSecureStorage.saveEncrypted).toHaveBeenCalledWith(
        'automation_variables',
        expect.objectContaining({
          'test-website': expect.objectContaining({
            websiteId: 'test-website',
            variables: { username: 'admin', password: 'secret' },
          }),
        })
      );
      expect(mockSecureStorage.extendSession).toHaveBeenCalled();
    });

    it('should merge with existing data when saving', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);
      mockSecureStorage.loadEncrypted.mockResolvedValue({
        'existing-website': {
          id: 'existing-id',
          websiteId: 'existing-website',
          variables: { key: 'value' },
          updatedAt: new Date().toISOString(),
        },
      });

      const entity = AutomationVariables.create({
        websiteId: 'new-website',
        variables: { newKey: 'newValue' },
      });

      const result = await repository.save(entity);

      expect(result.isSuccess).toBe(true);
      expect(mockSecureStorage.saveEncrypted).toHaveBeenCalledWith(
        'automation_variables',
        expect.objectContaining({
          'existing-website': expect.objectContaining({
            websiteId: 'existing-website',
          }),
          'new-website': expect.objectContaining({
            websiteId: 'new-website',
          }),
        })
      );
    });

    it('should update existing entity when saving with same websiteId', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);
      mockSecureStorage.loadEncrypted.mockResolvedValue({
        'test-website': {
          id: 'old-id',
          websiteId: 'test-website',
          variables: { oldKey: 'oldValue' },
          updatedAt: new Date().toISOString(),
        },
      });

      const entity = AutomationVariables.create({
        websiteId: 'test-website',
        variables: { newKey: 'newValue' },
      });

      const result = await repository.save(entity);

      expect(result.isSuccess).toBe(true);
      const savedData = (mockSecureStorage.saveEncrypted as jest.Mock).mock.calls[0][1];
      expect(savedData['test-website'].variables).toEqual({ newKey: 'newValue' });
    });

    it('should return failure when storage is locked', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(false);

      const entity = AutomationVariables.create({
        websiteId: 'test-website',
        variables: {},
      });

      const result = await repository.save(entity);

      expect(result.isFailure).toBe(true);
      expect(result.error!.message).toBe(
        'Cannot access encrypted data: Storage is locked. Please authenticate first.'
      );
      expect(mockSecureStorage.saveEncrypted).not.toHaveBeenCalled();
      expect(mockSecureStorage.extendSession).not.toHaveBeenCalled();
    });

    it('should handle complex nested variables', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);
      mockSecureStorage.loadEncrypted.mockResolvedValue({});

      const entity = AutomationVariables.create({
        websiteId: 'complex-website',
        variables: {
          username: 'admin',
          password: 'P@ssw0rd!',
          apiKey: 'sk-1234567890abcdef',
          settings: JSON.stringify({ theme: 'dark', lang: 'ja' }),
        },
      });

      const result = await repository.save(entity);

      expect(result.isSuccess).toBe(true);
      expect(mockSecureStorage.saveEncrypted).toHaveBeenCalledWith(
        'automation_variables',
        expect.objectContaining({
          'complex-website': expect.objectContaining({
            variables: expect.objectContaining({
              username: 'admin',
              password: 'P@ssw0rd!',
              apiKey: 'sk-1234567890abcdef',
            }),
          }),
        })
      );
    });
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

      mockSecureStorage.loadEncrypted.mockResolvedValue({
        'test-website': savedData,
      });

      const result = await repository.load('test-website');

      expect(result.isSuccess).toBe(true);
      const loaded = result.value!;
      expect(loaded).toBeInstanceOf(AutomationVariables);
      expect(loaded.getWebsiteId()).toBe('test-website');
      expect(loaded.getVariables()).toEqual({ username: 'admin' });
      expect(mockSecureStorage.isUnlocked).toHaveBeenCalled();
      expect(mockSecureStorage.loadEncrypted).toHaveBeenCalledWith('automation_variables');
      expect(mockSecureStorage.extendSession).toHaveBeenCalled();
    });

    it('should return null when entity does not exist', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);
      mockSecureStorage.loadEncrypted.mockResolvedValue({
        'other-website': {
          id: 'other-id',
          websiteId: 'other-website',
          variables: {},
          updatedAt: new Date().toISOString(),
        },
      });

      const result = await repository.load('non-existent-website');

      expect(result.isSuccess).toBe(true);
      expect(result.value).toBeNull();
      expect(mockSecureStorage.extendSession).toHaveBeenCalled();
    });

    it('should return null when storage is empty', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);
      mockSecureStorage.loadEncrypted.mockResolvedValue({});

      const result = await repository.load('test-website');

      expect(result.isSuccess).toBe(true);
      expect(result.value).toBeNull();
    });

    it('should return null when storage returns null', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);
      mockSecureStorage.loadEncrypted.mockResolvedValue(null);

      const result = await repository.load('test-website');

      expect(result.isSuccess).toBe(true);
      expect(result.value).toBeNull();
    });

    it('should return failure when storage is locked', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(false);

      const result = await repository.load('test-website');

      expect(result.isFailure).toBe(true);
      expect(result.error!.message).toBe(
        'Cannot access encrypted data: Storage is locked. Please authenticate first.'
      );
      expect(mockSecureStorage.loadEncrypted).not.toHaveBeenCalled();
      expect(mockSecureStorage.extendSession).not.toHaveBeenCalled();
    });

    it('should correctly reconstruct entity with all properties', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);

      const savedData: AutomationVariablesData = {
        id: 'full-test-id',
        websiteId: 'full-website',
        variables: {
          username: 'user@example.com',
          password: 'SecretP@ss123',
          apiToken: 'Bearer xyz123',
        },
        status: 'enabled',
        updatedAt: '2025-10-16T10:00:00.000Z',
      };

      mockSecureStorage.loadEncrypted.mockResolvedValue({
        'full-website': savedData,
      });

      const result = await repository.load('full-website');

      expect(result.isSuccess).toBe(true);
      const loaded = result.value!;
      expect(loaded).toBeTruthy();
      expect(loaded.getId()).toBe('full-test-id');
      expect(loaded.getWebsiteId()).toBe('full-website');
      expect(loaded.getVariables()).toEqual(savedData.variables);
      expect(loaded.getStatus()).toBe('enabled');
      expect(loaded.getUpdatedAt()).toBe('2025-10-16T10:00:00.000Z');
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

      mockSecureStorage.loadEncrypted.mockResolvedValue({
        'website-1': data1,
        'website-2': data2,
      });

      const result = await repository.loadAll();

      expect(result.isSuccess).toBe(true);
      const entities = result.value!;
      expect(entities).toHaveLength(2);
      expect(entities[0]).toBeInstanceOf(AutomationVariables);
      expect(entities[1]).toBeInstanceOf(AutomationVariables);

      const websiteIds = entities.map((e) => e.getWebsiteId());
      expect(websiteIds).toContain('website-1');
      expect(websiteIds).toContain('website-2');

      expect(mockSecureStorage.extendSession).toHaveBeenCalled();
    });

    it('should return empty array when no entities exist', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);
      mockSecureStorage.loadEncrypted.mockResolvedValue({});

      const result = await repository.loadAll();

      expect(result.isSuccess).toBe(true);
      expect(result.value).toEqual([]);
      expect(mockSecureStorage.extendSession).toHaveBeenCalled();
    });

    it('should return empty array when storage returns null', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);
      mockSecureStorage.loadEncrypted.mockResolvedValue(null);

      const result = await repository.loadAll();

      expect(result.isSuccess).toBe(true);
      expect(result.value).toEqual([]);
    });

    it('should return failure when storage is locked', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(false);

      const result = await repository.loadAll();

      expect(result.isFailure).toBe(true);
      expect(result.error!.message).toBe(
        'Cannot access encrypted data: Storage is locked. Please authenticate first.'
      );
      expect(mockSecureStorage.loadEncrypted).not.toHaveBeenCalled();
      expect(mockSecureStorage.extendSession).not.toHaveBeenCalled();
    });

    it('should load many entities correctly', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);

      const multipleData: { [key: string]: AutomationVariablesData } = {};
      for (let i = 0; i < 10; i++) {
        multipleData[`website-${i}`] = {
          id: `id-${i}`,
          websiteId: `website-${i}`,
          variables: { key: `value-${i}` },
          updatedAt: new Date().toISOString(),
        };
      }

      mockSecureStorage.loadEncrypted.mockResolvedValue(multipleData);

      const result = await repository.loadAll();

      expect(result.isSuccess).toBe(true);
      const entities = result.value!;
      expect(entities).toHaveLength(10);
      entities.forEach((entity, index) => {
        expect(entity.getWebsiteId()).toMatch(/^website-\d+$/);
      });
    });
  });

  describe('delete()', () => {
    it('should delete entity when it exists', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);
      mockSecureStorage.loadEncrypted.mockResolvedValue({
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
      });

      const result = await repository.delete('website-to-delete');

      expect(result.isSuccess).toBe(true);
      expect(mockSecureStorage.saveEncrypted).toHaveBeenCalledWith(
        'automation_variables',
        expect.objectContaining({
          'website-to-keep': expect.anything(),
        })
      );

      const savedData = (mockSecureStorage.saveEncrypted as jest.Mock).mock.calls[0][1];
      expect(savedData['website-to-delete']).toBeUndefined();
      expect(mockSecureStorage.extendSession).toHaveBeenCalled();
    });

    it('should handle deletion of non-existent entity gracefully', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);
      mockSecureStorage.loadEncrypted.mockResolvedValue({
        'existing-website': {
          id: 'id-1',
          websiteId: 'existing-website',
          variables: {},
          updatedAt: new Date().toISOString(),
        },
      });

      const result = await repository.delete('non-existent-website');

      expect(result.isSuccess).toBe(true);
      expect(mockSecureStorage.saveEncrypted).toHaveBeenCalledWith(
        'automation_variables',
        expect.objectContaining({
          'existing-website': expect.anything(),
        })
      );

      const savedData = (mockSecureStorage.saveEncrypted as jest.Mock).mock.calls[0][1];
      expect(savedData['non-existent-website']).toBeUndefined();
    });

    it('should return failure when storage is locked', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(false);

      const result = await repository.delete('test-website');

      expect(result.isFailure).toBe(true);
      expect(result.error!.message).toBe(
        'Cannot access encrypted data: Storage is locked. Please authenticate first.'
      );
      expect(mockSecureStorage.loadEncrypted).not.toHaveBeenCalled();
      expect(mockSecureStorage.saveEncrypted).not.toHaveBeenCalled();
      expect(mockSecureStorage.extendSession).not.toHaveBeenCalled();
    });

    it('should delete from storage with multiple entities', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);
      mockSecureStorage.loadEncrypted.mockResolvedValue({
        'website-1': {
          id: 'id-1',
          websiteId: 'website-1',
          variables: {},
          updatedAt: new Date().toISOString(),
        },
        'website-2': {
          id: 'id-2',
          websiteId: 'website-2',
          variables: {},
          updatedAt: new Date().toISOString(),
        },
        'website-3': {
          id: 'id-3',
          websiteId: 'website-3',
          variables: {},
          updatedAt: new Date().toISOString(),
        },
      });

      const result = await repository.delete('website-2');

      expect(result.isSuccess).toBe(true);
      const savedData = (mockSecureStorage.saveEncrypted as jest.Mock).mock.calls[0][1];
      expect(Object.keys(savedData)).toHaveLength(2);
      expect(savedData['website-1']).toBeDefined();
      expect(savedData['website-2']).toBeUndefined();
      expect(savedData['website-3']).toBeDefined();
    });
  });

  describe('exists()', () => {
    it('should return true when entity exists', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);
      mockSecureStorage.loadEncrypted.mockResolvedValue({
        'test-website': {
          id: 'test-id',
          websiteId: 'test-website',
          variables: {},
          updatedAt: new Date().toISOString(),
        },
      });

      const result = await repository.exists('test-website');

      expect(result.isSuccess).toBe(true);
      expect(result.value).toBe(true);
      expect(mockSecureStorage.extendSession).toHaveBeenCalled();
    });

    it('should return false when entity does not exist', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);
      mockSecureStorage.loadEncrypted.mockResolvedValue({
        'other-website': {
          id: 'other-id',
          websiteId: 'other-website',
          variables: {},
          updatedAt: new Date().toISOString(),
        },
      });

      const result = await repository.exists('non-existent-website');

      expect(result.isSuccess).toBe(true);
      expect(result.value).toBe(false);
      expect(mockSecureStorage.extendSession).toHaveBeenCalled();
    });

    it('should return false when storage is empty', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);
      mockSecureStorage.loadEncrypted.mockResolvedValue({});

      const result = await repository.exists('test-website');

      expect(result.isSuccess).toBe(true);
      expect(result.value).toBe(false);
    });

    it('should return false when storage returns null', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);
      mockSecureStorage.loadEncrypted.mockResolvedValue(null);

      const result = await repository.exists('test-website');

      expect(result.isSuccess).toBe(true);
      expect(result.value).toBe(false);
    });

    it('should return false when storage is locked (special case)', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(false);

      const result = await repository.exists('test-website');

      expect(result.isSuccess).toBe(true);
      expect(result.value).toBe(false);
      expect(mockSecureStorage.loadEncrypted).not.toHaveBeenCalled();
      expect(mockSecureStorage.extendSession).not.toHaveBeenCalled();
    });

    it('should check existence in storage with many entities', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);

      const multipleData: { [key: string]: AutomationVariablesData } = {};
      for (let i = 0; i < 100; i++) {
        multipleData[`website-${i}`] = {
          id: `id-${i}`,
          websiteId: `website-${i}`,
          variables: {},
          updatedAt: new Date().toISOString(),
        };
      }

      mockSecureStorage.loadEncrypted.mockResolvedValue(multipleData);

      const result50 = await repository.exists('website-50');
      const result200 = await repository.exists('website-200');

      expect(result50.isSuccess).toBe(true);
      expect(result50.value).toBe(true);
      expect(result200.isSuccess).toBe(true);
      expect(result200.value).toBe(false);
    });
  });

  describe('Session Management', () => {
    it('should extend session after successful save', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);
      mockSecureStorage.loadEncrypted.mockResolvedValue({});

      const entity = AutomationVariables.create({
        websiteId: 'test-website',
        variables: {},
      });

      const result = await repository.save(entity);

      expect(result.isSuccess).toBe(true);
      expect(mockSecureStorage.extendSession).toHaveBeenCalledTimes(1);
    });

    it('should extend session after successful load', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);
      mockSecureStorage.loadEncrypted.mockResolvedValue({
        'test-website': {
          id: 'test-id',
          websiteId: 'test-website',
          variables: {},
          updatedAt: new Date().toISOString(),
        },
      });

      const result = await repository.load('test-website');

      expect(result.isSuccess).toBe(true);
      expect(mockSecureStorage.extendSession).toHaveBeenCalledTimes(1);
    });

    it('should extend session after successful loadAll', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);
      mockSecureStorage.loadEncrypted.mockResolvedValue({});

      const result = await repository.loadAll();

      expect(result.isSuccess).toBe(true);
      expect(mockSecureStorage.extendSession).toHaveBeenCalledTimes(1);
    });

    it('should extend session after successful delete', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);
      mockSecureStorage.loadEncrypted.mockResolvedValue({});

      const result = await repository.delete('test-website');

      expect(result.isSuccess).toBe(true);
      expect(mockSecureStorage.extendSession).toHaveBeenCalledTimes(1);
    });

    it('should extend session after successful exists check', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);
      mockSecureStorage.loadEncrypted.mockResolvedValue({});

      const result = await repository.exists('test-website');

      expect(result.isSuccess).toBe(true);
      expect(mockSecureStorage.extendSession).toHaveBeenCalledTimes(1);
    });

    it('should extend session even when entity not found', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);
      mockSecureStorage.loadEncrypted.mockResolvedValue({});

      const result = await repository.load('non-existent');

      expect(result.isSuccess).toBe(true);
      expect(mockSecureStorage.extendSession).toHaveBeenCalledTimes(1);
    });

    it('should not extend session when operation fails due to lock', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(false);

      const entity = AutomationVariables.create({
        websiteId: 'test-website',
        variables: {},
      });

      const result = await repository.save(entity);

      expect(result.isFailure).toBe(true);
      expect(mockSecureStorage.extendSession).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should provide descriptive error message when locked', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(false);

      const entity = AutomationVariables.create({
        websiteId: 'test-website',
        variables: {},
      });

      const result = await repository.save(entity);

      expect(result.isFailure).toBe(true);
      expect(result.error!.message).toBe(
        'Cannot access encrypted data: Storage is locked. Please authenticate first.'
      );
    });

    it('should return failure with SecureStorage errors during save', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);
      mockSecureStorage.loadEncrypted.mockResolvedValue({});
      mockSecureStorage.saveEncrypted.mockRejectedValue(new Error('Storage write error'));

      const entity = AutomationVariables.create({
        websiteId: 'test-website',
        variables: {},
      });

      const result = await repository.save(entity);

      expect(result.isFailure).toBe(true);
      expect(result.error!.message).toBe('Storage write error');
    });

    it('should return failure with SecureStorage errors during load', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);
      mockSecureStorage.loadEncrypted.mockRejectedValue(new Error('Decryption failed'));

      const result = await repository.load('test-website');

      expect(result.isFailure).toBe(true);
      expect(result.error!.message).toBe('Decryption failed');
    });

    it('should return failure with entity validation errors', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);
      mockSecureStorage.loadEncrypted.mockResolvedValue({
        'invalid-website': {
          id: '',
          websiteId: '', // Invalid: empty websiteId
          variables: {},
          updatedAt: new Date().toISOString(),
        },
      });

      const result = await repository.load('invalid-website');

      expect(result.isFailure).toBe(true);
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete workflow: save, load, update, delete', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);

      // Initial save
      mockSecureStorage.loadEncrypted.mockResolvedValue({});
      const entity1 = AutomationVariables.create({
        websiteId: 'workflow-test',
        variables: { version: '1' },
      });
      const saveResult1 = await repository.save(entity1);
      expect(saveResult1.isSuccess).toBe(true);

      // Load
      const savedData = (mockSecureStorage.saveEncrypted as jest.Mock).mock.calls[0][1];
      mockSecureStorage.loadEncrypted.mockResolvedValue(savedData);
      const loadResult = await repository.load('workflow-test');
      expect(loadResult.isSuccess).toBe(true);
      const loaded = loadResult.value!;
      expect(loaded.getVariables()).toEqual({ version: '1' });

      // Update
      const entity2 = AutomationVariables.create({
        websiteId: 'workflow-test',
        variables: { version: '2' },
      });
      mockSecureStorage.loadEncrypted.mockResolvedValue(savedData);
      const saveResult2 = await repository.save(entity2);
      expect(saveResult2.isSuccess).toBe(true);

      // Delete
      const updatedData = (mockSecureStorage.saveEncrypted as jest.Mock).mock.calls[1][1];
      mockSecureStorage.loadEncrypted.mockResolvedValue(updatedData);
      const deleteResult = await repository.delete('workflow-test');
      expect(deleteResult.isSuccess).toBe(true);

      // Verify deleted
      const finalData = (mockSecureStorage.saveEncrypted as jest.Mock).mock.calls[2][1];
      expect(finalData['workflow-test']).toBeUndefined();
    });

    it('should handle concurrent entities without conflicts', async () => {
      mockSecureStorage.isUnlocked.mockReturnValue(true);
      mockSecureStorage.loadEncrypted.mockResolvedValue({});

      const entity1 = AutomationVariables.create({
        websiteId: 'site-1',
        variables: { key1: 'value1' },
      });

      const entity2 = AutomationVariables.create({
        websiteId: 'site-2',
        variables: { key2: 'value2' },
      });

      const result1 = await repository.save(entity1);
      expect(result1.isSuccess).toBe(true);
      const data1 = (mockSecureStorage.saveEncrypted as jest.Mock).mock.calls[0][1];
      mockSecureStorage.loadEncrypted.mockResolvedValue(data1);

      const result2 = await repository.save(entity2);
      expect(result2.isSuccess).toBe(true);
      const data2 = (mockSecureStorage.saveEncrypted as jest.Mock).mock.calls[1][1];

      expect(data2['site-1']).toBeDefined();
      expect(data2['site-2']).toBeDefined();
    });
  });
});

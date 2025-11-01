/**
 * ChromeStorageAutomationVariablesRepository Tests
 */

import { ChromeStorageAutomationVariablesRepository } from '../ChromeStorageAutomationVariablesRepository';
import { AutomationVariables } from '@domain/entities/AutomationVariables';

describe('ChromeStorageAutomationVariablesRepository', () => {
  let repository: ChromeStorageAutomationVariablesRepository;
  let mockStorage: Map<string, any>;

  beforeEach(() => {
    repository = new ChromeStorageAutomationVariablesRepository();
    mockStorage = global.mockBrowserStorage;
    mockStorage.clear();
  });

  afterEach(() => {
    mockStorage.clear();
  });

  describe('save', () => {
    test('AutomationVariablesが正常に保存されること', async () => {
      // Arrange
      const variables = AutomationVariables.fromData({
        id: 'vars-1',
        websiteId: 'website-1',
        name: 'Test Variables',
        variables: [{ key: 'username', value: 'testuser' }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Act
      await repository.save(variables);

      // Assert
      const stored = mockStorage.get('AUTOMATION_VARIABLES');
      expect(stored).toBeDefined();
      expect(stored).toHaveLength(1);
      expect(stored[0].id).toBe('vars-1');
      expect(stored[0].websiteId).toBe('website-1');
    });
  });

  describe('getById', () => {
    test('IDでAutomationVariablesが取得できること', async () => {
      // Arrange
      const variablesData = [{
        id: 'vars-1',
        websiteId: 'website-1',
        name: 'Test Variables',
        variables: [{ key: 'username', value: 'testuser' }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }];
      mockStorage.set('AUTOMATION_VARIABLES', variablesData);

      // Act
      const result = await repository.getById('vars-1');

      // Assert
      expect(result).toBeDefined();
      expect(result!.getId()).toBe('vars-1');
      expect(result!.getWebsiteId()).toBe('website-1');
    });

    test('存在しないIDの場合、undefinedが返されること', async () => {
      // Act
      const result = await repository.getById('nonexistent');

      // Assert
      expect(result).toBeUndefined();
    });
  });

  describe('getByWebsiteId', () => {
    test('WebsiteIDでAutomationVariablesが取得できること', async () => {
      // Arrange
      const variablesData = [{
        id: 'vars-1',
        websiteId: 'website-1',
        name: 'Test Variables',
        variables: [{ key: 'username', value: 'testuser' }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }];
      mockStorage.set('AUTOMATION_VARIABLES', variablesData);

      // Act
      const result = await repository.getByWebsiteId('website-1');

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].getWebsiteId()).toBe('website-1');
    });

    test('存在しないWebsiteIDの場合、空配列が返されること', async () => {
      // Act
      const result = await repository.getByWebsiteId('nonexistent');

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('getAll', () => {
    test('全てのAutomationVariablesが取得できること', async () => {
      // Arrange
      const variablesData = [
        {
          id: 'vars-1',
          websiteId: 'website-1',
          name: 'Test Variables 1',
          variables: [{ key: 'username', value: 'user1' }],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'vars-2',
          websiteId: 'website-2',
          name: 'Test Variables 2',
          variables: [{ key: 'username', value: 'user2' }],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      mockStorage.set('AUTOMATION_VARIABLES', variablesData);

      // Act
      const result = await repository.getAll();

      // Assert
      expect(result).toHaveLength(2);
      expect(result.map(v => v.getId())).toContain('vars-1');
      expect(result.map(v => v.getId())).toContain('vars-2');
    });

    test('データが存在しない場合、空配列が返されること', async () => {
      // Act
      const result = await repository.getAll();

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('delete', () => {
    test('AutomationVariablesが正常に削除されること', async () => {
      // Arrange
      const variablesData = [{
        id: 'vars-1',
        websiteId: 'website-1',
        name: 'Test Variables',
        variables: [{ key: 'username', value: 'testuser' }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }];
      mockStorage.set('AUTOMATION_VARIABLES', variablesData);

      // Act
      const result = await repository.delete('vars-1');

      // Assert
      expect(result).toBe(true);
      const stored = mockStorage.get('AUTOMATION_VARIABLES');
      expect(stored).toHaveLength(0);
    });

    test('存在しないIDの場合、falseが返されること', async () => {
      // Act
      const result = await repository.delete('nonexistent');

      // Assert
      expect(result).toBe(false);
    });
  });
});

/**
 * ChromeStorageXPathRepository Tests
 */

import { ChromeStorageXPathRepository } from '../ChromeStorageXPathRepository';
import { XPathCollection, XPathData } from '@domain/entities/XPathCollection';

// Chrome Storage APIのモック
const mockChromeStorage = {
  local: {
    get: jest.fn(),
    set: jest.fn(),
    remove: jest.fn()
  }
};

// グローバルなchromeオブジェクトをモック
(global as any).chrome = {
  storage: mockChromeStorage
};

describe('ChromeStorageXPathRepository', () => {
  let repository: ChromeStorageXPathRepository;
  let sampleXPath: XPathData;

  beforeEach(() => {
    repository = new ChromeStorageXPathRepository();
    sampleXPath = {
      id: 'xpath-1',
      websiteId: 'website-1',
      url: 'https://example.com',
      actionType: 'input',
      value: 'test value',
      executionOrder: 1,
      selectedPathPattern: 'smart',
      retryType: 0
    };

    // モックをリセット
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    test('ストレージからXPathコレクションが取得されること', async () => {
      // Arrange
      const storedData = [sampleXPath];
      mockChromeStorage.local.get.mockResolvedValue({
        XPATH_COLLECTION: storedData
      });

      // Act
      const result = await repository.getAll();

      // Assert
      expect(mockChromeStorage.local.get).toHaveBeenCalledWith('XPATH_COLLECTION');
      expect(result.size()).toBe(1);
      expect(result.getById('xpath-1')).toEqual(sampleXPath);
    });

    test('ストレージが空の場合、空のコレクションが返されること', async () => {
      // Arrange
      mockChromeStorage.local.get.mockResolvedValue({});

      // Act
      const result = await repository.getAll();

      // Assert
      expect(result.size()).toBe(0);
    });

    test('ストレージエラーの場合、空のコレクションが返されること', async () => {
      // Arrange
      mockChromeStorage.local.get.mockRejectedValue(new Error('Storage error'));

      // Act
      const result = await repository.getAll();

      // Assert
      expect(result.size()).toBe(0);
    });
  });

  describe('loadByWebsiteId', () => {
    test('指定されたWebsiteIdのXPathが取得されること', async () => {
      // Arrange
      const xpath1 = { ...sampleXPath, id: 'xpath-1', websiteId: 'website-1' };
      const xpath2 = { ...sampleXPath, id: 'xpath-2', websiteId: 'website-2' };
      mockChromeStorage.local.get.mockResolvedValue({
        XPATH_COLLECTION: [xpath1, xpath2]
      });

      // Act
      const result = await repository.loadByWebsiteId('website-1');

      // Assert
      expect(result.size()).toBe(1);
      expect(result.getById('xpath-1')).toEqual(xpath1);
    });
  });

  describe('save', () => {
    test('XPathコレクションが正常に保存されること', async () => {
      // Arrange
      const collection = XPathCollection.fromData([sampleXPath]);
      mockChromeStorage.local.set.mockResolvedValue(undefined);

      // Act
      await repository.save(collection);

      // Assert
      expect(mockChromeStorage.local.set).toHaveBeenCalledWith({
        XPATH_COLLECTION: [sampleXPath]
      });
    });

    test('保存エラーの場合、エラーが投げられること', async () => {
      // Arrange
      const collection = XPathCollection.fromData([sampleXPath]);
      mockChromeStorage.local.set.mockRejectedValue(new Error('Save error'));

      // Act & Assert
      await expect(repository.save(collection)).rejects.toThrow('XPath設定の保存に失敗しました');
    });
  });

  describe('clear', () => {
    test('XPathコレクションが正常にクリアされること', async () => {
      // Arrange
      mockChromeStorage.local.remove.mockResolvedValue(undefined);

      // Act
      await repository.clear();

      // Assert
      expect(mockChromeStorage.local.remove).toHaveBeenCalledWith('XPATH_COLLECTION');
    });

    test('クリアエラーの場合、エラーが投げられること', async () => {
      // Arrange
      mockChromeStorage.local.remove.mockRejectedValue(new Error('Clear error'));

      // Act & Assert
      await expect(repository.clear()).rejects.toThrow('XPath設定のクリアに失敗しました');
    });
  });
});

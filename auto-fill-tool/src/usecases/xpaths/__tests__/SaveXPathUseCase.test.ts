/**
 * SaveXPathUseCase Tests
 */

import { SaveXPathUseCase, XPathRepository } from '../SaveXPathUseCase';
import { XPathCollection, XPathData } from '@domain/entities/XPathCollection';

describe('SaveXPathUseCase', () => {
  let useCase: SaveXPathUseCase;
  let mockRepository: jest.Mocked<XPathRepository>;

  beforeEach(() => {
    mockRepository = {
      getAll: jest.fn(),
      save: jest.fn()
    };
    useCase = new SaveXPathUseCase(mockRepository);
  });

  describe('execute', () => {
    test('XPath設定が正常に保存されること', async () => {
      // Arrange
      const existingCollection = XPathCollection.create();
      const newXPath: XPathData = {
        id: 'xpath-1',
        websiteId: 'website-1',
        url: 'https://example.com',
        actionType: 'input',
        value: 'test value',
        executionOrder: 1,
        selectedPathPattern: 'smart',
        retryType: 0
      };

      mockRepository.getAll.mockResolvedValue(existingCollection);
      mockRepository.save.mockResolvedValue();

      // Act
      await useCase.execute(newXPath);

      // Assert
      expect(mockRepository.getAll).toHaveBeenCalledTimes(1);
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
      
      const savedCollection = mockRepository.save.mock.calls[0][0];
      expect(savedCollection.size()).toBe(1);
      expect(savedCollection.getById('xpath-1')).toEqual(newXPath);
    });

    test('既存のコレクションに追加されること', async () => {
      // Arrange
      const existingXPath: XPathData = {
        id: 'xpath-existing',
        websiteId: 'website-1',
        url: 'https://example.com',
        actionType: 'click',
        value: '',
        executionOrder: 1,
        selectedPathPattern: 'short',
        retryType: 0
      };
      const existingCollection = XPathCollection.fromData([existingXPath]);
      
      const newXPath: XPathData = {
        id: 'xpath-new',
        websiteId: 'website-1',
        url: 'https://example.com',
        actionType: 'input',
        value: 'new value',
        executionOrder: 2,
        selectedPathPattern: 'smart',
        retryType: 10
      };

      mockRepository.getAll.mockResolvedValue(existingCollection);
      mockRepository.save.mockResolvedValue();

      // Act
      await useCase.execute(newXPath);

      // Assert
      expect(mockRepository.getAll).toHaveBeenCalledTimes(1);
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
      
      const savedCollection = mockRepository.save.mock.calls[0][0];
      expect(savedCollection.size()).toBe(2);
      expect(savedCollection.getById('xpath-existing')).toEqual(existingXPath);
      expect(savedCollection.getById('xpath-new')).toEqual(newXPath);
    });

    test('IDが未設定の場合、自動生成されること', async () => {
      // Arrange
      const existingCollection = XPathCollection.create();
      const newXPathWithoutId: XPathData = {
        id: '', // 空のID
        websiteId: 'website-1',
        url: 'https://example.com',
        actionType: 'input',
        value: 'test value',
        executionOrder: 1,
        selectedPathPattern: 'smart',
        retryType: 0
      };

      mockRepository.getAll.mockResolvedValue(existingCollection);
      mockRepository.save.mockResolvedValue();

      // Act
      await useCase.execute(newXPathWithoutId);

      // Assert
      expect(mockRepository.getAll).toHaveBeenCalledTimes(1);
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
      
      const savedCollection = mockRepository.save.mock.calls[0][0];
      expect(savedCollection.size()).toBe(1);
      
      const savedXPath = savedCollection.getAll()[0];
      expect(savedXPath.id).toBeDefined();
      expect(savedXPath.id).toMatch(/^xpath_\d+_[a-z0-9]+$/);
    });

    test('リポジトリの取得でエラーが発生した場合、エラーが伝播されること', async () => {
      // Arrange
      const error = new Error('Get repository error');
      mockRepository.getAll.mockRejectedValue(error);

      const newXPath: XPathData = {
        id: 'xpath-1',
        websiteId: 'website-1',
        url: 'https://example.com',
        actionType: 'input',
        value: 'test value',
        executionOrder: 1,
        selectedPathPattern: 'smart',
        retryType: 0
      };

      // Act & Assert
      await expect(useCase.execute(newXPath)).rejects.toThrow('Get repository error');
      expect(mockRepository.getAll).toHaveBeenCalledTimes(1);
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    test('リポジトリの保存でエラーが発生した場合、エラーが伝播されること', async () => {
      // Arrange
      const existingCollection = XPathCollection.create();
      const error = new Error('Save repository error');
      
      mockRepository.getAll.mockResolvedValue(existingCollection);
      mockRepository.save.mockRejectedValue(error);

      const newXPath: XPathData = {
        id: 'xpath-1',
        websiteId: 'website-1',
        url: 'https://example.com',
        actionType: 'input',
        value: 'test value',
        executionOrder: 1,
        selectedPathPattern: 'smart',
        retryType: 0
      };

      // Act & Assert
      await expect(useCase.execute(newXPath)).rejects.toThrow('Save repository error');
      expect(mockRepository.getAll).toHaveBeenCalledTimes(1);
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
    });
  });
});

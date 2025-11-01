/**
 * DeleteXPathUseCase Tests
 */

import { DeleteXPathUseCase, XPathRepository } from '../DeleteXPathUseCase';
import { XPathCollection, XPathData } from '@domain/entities/XPathCollection';

describe('DeleteXPathUseCase', () => {
  let useCase: DeleteXPathUseCase;
  let mockRepository: jest.Mocked<XPathRepository>;

  beforeEach(() => {
    mockRepository = {
      getAll: jest.fn(),
      save: jest.fn()
    };
    useCase = new DeleteXPathUseCase(mockRepository);
  });

  describe('execute', () => {
    test('XPath設定が正常に削除されること', async () => {
      // Arrange
      const xpath1: XPathData = {
        id: 'xpath-1',
        websiteId: 'website-1',
        url: 'https://example.com',
        actionType: 'input',
        value: 'test value',
        executionOrder: 1,
        selectedPathPattern: 'smart',
        retryType: 0
      };
      const xpath2: XPathData = {
        id: 'xpath-2',
        websiteId: 'website-1',
        url: 'https://example.com',
        actionType: 'click',
        value: '',
        executionOrder: 2,
        selectedPathPattern: 'short',
        retryType: 0
      };
      const collection = XPathCollection.fromData([xpath1, xpath2]);

      mockRepository.getAll.mockResolvedValue(collection);
      mockRepository.save.mockResolvedValue();

      // Act
      const result = await useCase.execute('xpath-1');

      // Assert
      expect(result).toBe(true);
      expect(mockRepository.getAll).toHaveBeenCalledTimes(1);
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
      
      const savedCollection = mockRepository.save.mock.calls[0][0];
      expect(savedCollection.size()).toBe(1);
      expect(savedCollection.getById('xpath-1')).toBeUndefined();
      expect(savedCollection.getById('xpath-2')).toBeDefined();
    });

    test('存在しないXPathを削除した場合、falseが返されること', async () => {
      // Arrange
      const collection = XPathCollection.create();
      mockRepository.getAll.mockResolvedValue(collection);

      // Act
      const result = await useCase.execute('non-existent');

      // Assert
      expect(result).toBe(false);
      expect(mockRepository.getAll).toHaveBeenCalledTimes(1);
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    test('リポジトリエラーの場合、エラーが伝播されること', async () => {
      // Arrange
      const error = new Error('Repository error');
      mockRepository.getAll.mockRejectedValue(error);

      // Act & Assert
      await expect(useCase.execute('xpath-1')).rejects.toThrow('Repository error');
      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });
});

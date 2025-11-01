/**
 * UpdateXPathUseCase Tests
 */

import { UpdateXPathUseCase, XPathRepository } from '../UpdateXPathUseCase';
import { XPathCollection, XPathData } from '@domain/entities/XPathCollection';

describe('UpdateXPathUseCase', () => {
  let useCase: UpdateXPathUseCase;
  let mockRepository: jest.Mocked<XPathRepository>;

  beforeEach(() => {
    mockRepository = {
      getAll: jest.fn(),
      save: jest.fn()
    };
    useCase = new UpdateXPathUseCase(mockRepository);
  });

  describe('execute', () => {
    test('XPath設定が正常に更新されること', async () => {
      // Arrange
      const existingXPath: XPathData = {
        id: 'xpath-1',
        websiteId: 'website-1',
        url: 'https://example.com',
        actionType: 'input',
        value: 'old value',
        executionOrder: 1,
        selectedPathPattern: 'smart',
        retryType: 0
      };
      const collection = XPathCollection.fromData([existingXPath]);
      const updates = { value: 'new value', executionOrder: 2 };

      mockRepository.getAll.mockResolvedValue(collection);
      mockRepository.save.mockResolvedValue();

      // Act
      const result = await useCase.execute('xpath-1', updates);

      // Assert
      expect(result).toBe(true);
      expect(mockRepository.getAll).toHaveBeenCalledTimes(1);
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
      
      const savedCollection = mockRepository.save.mock.calls[0][0];
      const updatedXPath = savedCollection.getById('xpath-1');
      expect(updatedXPath?.value).toBe('new value');
      expect(updatedXPath?.executionOrder).toBe(2);
    });

    test('存在しないXPathを更新した場合、falseが返されること', async () => {
      // Arrange
      const collection = XPathCollection.create();
      const updates = { value: 'new value' };

      mockRepository.getAll.mockResolvedValue(collection);

      // Act
      const result = await useCase.execute('non-existent', updates);

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
      await expect(useCase.execute('xpath-1', { value: 'new value' })).rejects.toThrow('Repository error');
      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });
});

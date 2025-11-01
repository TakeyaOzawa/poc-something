/**
 * GetXPathByIdUseCase Tests
 */

import { GetXPathByIdUseCase, XPathRepository } from '../GetXPathByIdUseCase';
import { XPathCollection, XPathData } from '@domain/entities/XPathCollection';

describe('GetXPathByIdUseCase', () => {
  let useCase: GetXPathByIdUseCase;
  let mockRepository: jest.Mocked<XPathRepository>;

  beforeEach(() => {
    mockRepository = {
      getAll: jest.fn()
    };
    useCase = new GetXPathByIdUseCase(mockRepository);
  });

  describe('execute', () => {
    test('IDでXPath設定が取得されること', async () => {
      // Arrange
      const sampleXPath: XPathData = {
        id: 'xpath-1',
        websiteId: 'website-1',
        url: 'https://example.com',
        actionType: 'input',
        value: 'test value',
        executionOrder: 1,
        selectedPathPattern: 'smart',
        retryType: 0
      };
      const collection = XPathCollection.fromData([sampleXPath]);
      mockRepository.getAll.mockResolvedValue(collection);

      // Act
      const result = await useCase.execute('xpath-1');

      // Assert
      expect(mockRepository.getAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual(sampleXPath);
    });

    test('存在しないIDの場合、undefinedが返されること', async () => {
      // Arrange
      const collection = XPathCollection.create();
      mockRepository.getAll.mockResolvedValue(collection);

      // Act
      const result = await useCase.execute('non-existent');

      // Assert
      expect(result).toBeUndefined();
    });

    test('リポジトリエラーの場合、エラーが伝播されること', async () => {
      // Arrange
      const error = new Error('Repository error');
      mockRepository.getAll.mockRejectedValue(error);

      // Act & Assert
      await expect(useCase.execute('xpath-1')).rejects.toThrow('Repository error');
    });
  });
});

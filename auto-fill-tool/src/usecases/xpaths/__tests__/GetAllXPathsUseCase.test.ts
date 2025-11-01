/**
 * GetAllXPathsUseCase Tests
 */

import { GetAllXPathsUseCase, XPathRepository } from '../GetAllXPathsUseCase';
import { XPathCollection, XPathData } from '@domain/entities/XPathCollection';

describe('GetAllXPathsUseCase', () => {
  let useCase: GetAllXPathsUseCase;
  let mockRepository: jest.Mocked<XPathRepository>;

  beforeEach(() => {
    mockRepository = {
      getAll: jest.fn()
    };
    useCase = new GetAllXPathsUseCase(mockRepository);
  });

  describe('execute', () => {
    test('リポジトリから全XPath設定が取得されること', async () => {
      // Arrange
      const sampleXPaths: XPathData[] = [
        {
          id: 'xpath-1',
          websiteId: 'website-1',
          url: 'https://example.com',
          actionType: 'input',
          value: 'test value',
          executionOrder: 1,
          selectedPathPattern: 'smart',
          retryType: 0
        },
        {
          id: 'xpath-2',
          websiteId: 'website-1',
          url: 'https://example.com',
          actionType: 'click',
          value: '',
          executionOrder: 2,
          selectedPathPattern: 'short',
          retryType: 10
        }
      ];
      const expectedCollection = XPathCollection.fromData(sampleXPaths);
      mockRepository.getAll.mockResolvedValue(expectedCollection);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(mockRepository.getAll).toHaveBeenCalledTimes(1);
      expect(result).toBe(expectedCollection);
      expect(result.size()).toBe(2);
    });

    test('空のコレクションが返されること', async () => {
      // Arrange
      const emptyCollection = XPathCollection.create();
      mockRepository.getAll.mockResolvedValue(emptyCollection);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(mockRepository.getAll).toHaveBeenCalledTimes(1);
      expect(result).toBe(emptyCollection);
      expect(result.size()).toBe(0);
    });

    test('リポジトリでエラーが発生した場合、エラーが伝播されること', async () => {
      // Arrange
      const error = new Error('Repository error');
      mockRepository.getAll.mockRejectedValue(error);

      // Act & Assert
      await expect(useCase.execute()).rejects.toThrow('Repository error');
      expect(mockRepository.getAll).toHaveBeenCalledTimes(1);
    });
  });
});

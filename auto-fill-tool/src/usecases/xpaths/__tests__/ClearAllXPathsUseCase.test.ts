/**
 * ClearAllXPathsUseCase Tests
 */

import { ClearAllXPathsUseCase, XPathRepository } from '../ClearAllXPathsUseCase';
import { XPathCollection } from '@domain/entities/XPathCollection';

describe('ClearAllXPathsUseCase', () => {
  let useCase: ClearAllXPathsUseCase;
  let mockRepository: jest.Mocked<XPathRepository>;

  beforeEach(() => {
    mockRepository = {
      save: jest.fn()
    };
    useCase = new ClearAllXPathsUseCase(mockRepository);
  });

  describe('execute', () => {
    test('全XPath設定が正常にクリアされること', async () => {
      // Arrange
      mockRepository.save.mockResolvedValue();

      // Act
      await useCase.execute();

      // Assert
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
      const savedCollection = mockRepository.save.mock.calls[0][0];
      expect(savedCollection.size()).toBe(0);
    });

    test('リポジトリエラーの場合、エラーが伝播されること', async () => {
      // Arrange
      const error = new Error('Save error');
      mockRepository.save.mockRejectedValue(error);

      // Act & Assert
      await expect(useCase.execute()).rejects.toThrow('Save error');
    });
  });
});

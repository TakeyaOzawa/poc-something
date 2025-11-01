/**
 * DeleteWebsiteUseCase Tests
 */

import { DeleteWebsiteUseCase } from '../DeleteWebsiteUseCase';
import { WebsiteRepository } from '@domain/repositories/WebsiteRepository';

describe('DeleteWebsiteUseCase', () => {
  let useCase: DeleteWebsiteUseCase;
  let mockRepository: jest.Mocked<WebsiteRepository>;

  beforeEach(() => {
    mockRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    };
    useCase = new DeleteWebsiteUseCase(mockRepository);
  });

  describe('execute', () => {
    test('Websiteが正常に削除されること', async () => {
      // Arrange
      const websiteId = 'website-1';
      mockRepository.delete.mockResolvedValue();

      // Act
      await useCase.execute(websiteId);

      // Assert
      expect(mockRepository.delete).toHaveBeenCalledTimes(1);
      expect(mockRepository.delete).toHaveBeenCalledWith(websiteId);
    });

    test('リポジトリエラーの場合、エラーが伝播されること', async () => {
      // Arrange
      const websiteId = 'website-1';
      const error = new Error('Delete error');
      mockRepository.delete.mockRejectedValue(error);

      // Act & Assert
      await expect(useCase.execute(websiteId)).rejects.toThrow('Delete error');
    });
  });
});

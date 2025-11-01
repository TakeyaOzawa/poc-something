/**
 * GetWebsiteByIdUseCase Tests
 */

import { GetWebsiteByIdUseCase, WebsiteRepository } from '../GetWebsiteByIdUseCase';
import { Website } from '@domain/entities/Website';

describe('GetWebsiteByIdUseCase', () => {
  let useCase: GetWebsiteByIdUseCase;
  let mockRepository: jest.Mocked<WebsiteRepository>;

  beforeEach(() => {
    mockRepository = {
      getById: jest.fn()
    };
    useCase = new GetWebsiteByIdUseCase(mockRepository);
  });

  describe('execute', () => {
    test('IDでWebsite設定が取得されること', async () => {
      // Arrange
      const website = Website.create('Test Site', 'https://example.com', 'enabled');
      mockRepository.getById.mockResolvedValue(website);

      // Act
      const result = await useCase.execute(website.getId());

      // Assert
      expect(mockRepository.getById).toHaveBeenCalledWith(website.getId());
      expect(result).toBe(website);
    });

    test('存在しないIDの場合、undefinedが返されること', async () => {
      // Arrange
      mockRepository.getById.mockResolvedValue(undefined);

      // Act
      const result = await useCase.execute('non-existent');

      // Assert
      expect(mockRepository.getById).toHaveBeenCalledWith('non-existent');
      expect(result).toBeUndefined();
    });

    test('リポジトリエラーの場合、エラーが伝播されること', async () => {
      // Arrange
      const error = new Error('Repository error');
      mockRepository.getById.mockRejectedValue(error);

      // Act & Assert
      await expect(useCase.execute('website-id')).rejects.toThrow('Repository error');
    });
  });
});

/**
 * SaveWebsiteUseCase Tests
 */

import { SaveWebsiteUseCase, WebsiteRepository } from '../SaveWebsiteUseCase';
import { Website } from '@domain/entities/Website';

describe('SaveWebsiteUseCase', () => {
  let useCase: SaveWebsiteUseCase;
  let mockRepository: jest.Mocked<WebsiteRepository>;

  beforeEach(() => {
    mockRepository = {
      save: jest.fn()
    };
    useCase = new SaveWebsiteUseCase(mockRepository);
  });

  describe('execute', () => {
    test('Website設定が正常に保存されること', async () => {
      // Arrange
      const website = Website.create('Test Site', 'https://example.com', 'enabled');
      mockRepository.save.mockResolvedValue();

      // Act
      await useCase.execute(website);

      // Assert
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
      expect(mockRepository.save).toHaveBeenCalledWith(website);
    });

    test('リポジトリエラーの場合、エラーが伝播されること', async () => {
      // Arrange
      const website = Website.create('Test Site', 'https://example.com', 'enabled');
      const error = new Error('Save error');
      mockRepository.save.mockRejectedValue(error);

      // Act & Assert
      await expect(useCase.execute(website)).rejects.toThrow('Save error');
    });
  });
});

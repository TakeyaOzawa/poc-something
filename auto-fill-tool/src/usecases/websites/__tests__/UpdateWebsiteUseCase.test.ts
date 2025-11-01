/**
 * UpdateWebsiteUseCase Tests
 */

import { UpdateWebsiteUseCase, WebsiteRepository } from '../UpdateWebsiteUseCase';
import { Website } from '@domain/entities/Website';

describe('UpdateWebsiteUseCase', () => {
  let useCase: UpdateWebsiteUseCase;
  let mockRepository: jest.Mocked<WebsiteRepository>;

  beforeEach(() => {
    mockRepository = {
      update: jest.fn()
    };
    useCase = new UpdateWebsiteUseCase(mockRepository);
  });

  describe('execute', () => {
    test('Website設定が正常に更新されること', async () => {
      // Arrange
      const website = Website.create('Test Site', 'https://example.com', 'enabled');
      website.updateName('Updated Site');
      mockRepository.update.mockResolvedValue();

      // Act
      await useCase.execute(website);

      // Assert
      expect(mockRepository.update).toHaveBeenCalledTimes(1);
      expect(mockRepository.update).toHaveBeenCalledWith(website);
    });

    test('リポジトリエラーの場合、エラーが伝播されること', async () => {
      // Arrange
      const website = Website.create('Test Site', 'https://example.com', 'enabled');
      const error = new Error('Update error');
      mockRepository.update.mockRejectedValue(error);

      // Act & Assert
      await expect(useCase.execute(website)).rejects.toThrow('Update error');
    });
  });
});

/**
 * GetAllWebsitesUseCase Tests
 */

import { GetAllWebsitesUseCase } from '../GetAllWebsitesUseCase';
import { WebsiteRepository } from '@domain/repositories/WebsiteRepository';
import { Website } from '@domain/entities/Website';

describe('GetAllWebsitesUseCase', () => {
  let useCase: GetAllWebsitesUseCase;
  let mockRepository: jest.Mocked<WebsiteRepository>;

  beforeEach(() => {
    mockRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    };
    useCase = new GetAllWebsitesUseCase(mockRepository);
  });

  describe('execute', () => {
    test('全てのWebsiteが正常に取得されること', async () => {
      // Arrange
      const websiteDataList = [
        { id: '1', name: 'Site 1', startUrl: 'https://site1.com', status: 'enabled' as const },
        { id: '2', name: 'Site 2', startUrl: 'https://site2.com', status: 'disabled' as const }
      ];
      mockRepository.findAll.mockResolvedValue(websiteDataList);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].getName()).toBe('Site 1');
      expect(result[1].getName()).toBe('Site 2');
      expect(mockRepository.findAll).toHaveBeenCalledTimes(1);
    });

    test('Websiteが存在しない場合、空配列が返されること', async () => {
      // Arrange
      mockRepository.findAll.mockResolvedValue([]);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result).toEqual([]);
      expect(mockRepository.findAll).toHaveBeenCalledTimes(1);
    });

    test('リポジトリエラーの場合、エラーが伝播されること', async () => {
      // Arrange
      const error = new Error('Repository error');
      mockRepository.findAll.mockRejectedValue(error);

      // Act & Assert
      await expect(useCase.execute()).rejects.toThrow('Repository error');
    });
  });
});

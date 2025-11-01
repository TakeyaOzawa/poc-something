/**
 * GetSystemSettingsUseCase Tests
 */

import { GetSystemSettingsUseCase } from '../GetSystemSettingsUseCase';
import { SystemSettings } from '@domain/entities/SystemSettings';
import { SystemSettingsRepository } from '@domain/repositories/SystemSettingsRepository';

describe('GetSystemSettingsUseCase', () => {
  let useCase: GetSystemSettingsUseCase;
  let mockRepository: jest.Mocked<SystemSettingsRepository>;

  beforeEach(() => {
    mockRepository = {
      get: jest.fn(),
      save: jest.fn(),
      reset: jest.fn()
    };
    useCase = new GetSystemSettingsUseCase(mockRepository);
  });

  describe('execute', () => {
    test('システム設定が正常に取得されること', async () => {
      // Arrange
      const settings = SystemSettings.create();
      mockRepository.get.mockResolvedValue(settings);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(mockRepository.get).toHaveBeenCalledTimes(1);
      expect(result).toBe(settings);
    });

    test('リポジトリエラーの場合、エラーが伝播されること', async () => {
      // Arrange
      const error = new Error('Repository error');
      mockRepository.get.mockRejectedValue(error);

      // Act & Assert
      await expect(useCase.execute()).rejects.toThrow('Repository error');
    });
  });
});

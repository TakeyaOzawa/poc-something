/**
 * ResetSystemSettingsUseCase Tests
 */

import { ResetSystemSettingsUseCase } from '../ResetSystemSettingsUseCase';
import { SystemSettingsRepository } from '@domain/repositories/SystemSettingsRepository';

describe('ResetSystemSettingsUseCase', () => {
  let useCase: ResetSystemSettingsUseCase;
  let mockRepository: jest.Mocked<SystemSettingsRepository>;

  beforeEach(() => {
    mockRepository = {
      get: jest.fn(),
      save: jest.fn(),
      reset: jest.fn()
    };
    useCase = new ResetSystemSettingsUseCase(mockRepository);
  });

  describe('execute', () => {
    test('システム設定が正常にリセットされること', async () => {
      // Arrange
      mockRepository.reset.mockResolvedValue();

      // Act
      await useCase.execute();

      // Assert
      expect(mockRepository.reset).toHaveBeenCalledTimes(1);
    });

    test('リポジトリエラーの場合、エラーが伝播されること', async () => {
      // Arrange
      const error = new Error('Reset error');
      mockRepository.reset.mockRejectedValue(error);

      // Act & Assert
      await expect(useCase.execute()).rejects.toThrow('Reset error');
    });
  });
});

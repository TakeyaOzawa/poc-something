/**
 * UpdateSystemSettingsUseCase Tests
 */

import { UpdateSystemSettingsUseCase } from '../UpdateSystemSettingsUseCase';
import { SystemSettings } from '@domain/entities/SystemSettings';
import { SystemSettingsRepository } from '@domain/repositories/SystemSettingsRepository';

describe('UpdateSystemSettingsUseCase', () => {
  let useCase: UpdateSystemSettingsUseCase;
  let mockRepository: jest.Mocked<SystemSettingsRepository>;

  beforeEach(() => {
    mockRepository = {
      get: jest.fn(),
      save: jest.fn(),
      reset: jest.fn()
    };
    useCase = new UpdateSystemSettingsUseCase(mockRepository);
  });

  describe('execute', () => {
    test('システム設定が正常に更新されること', async () => {
      // Arrange
      const settings = SystemSettings.create();
      settings.updateRetrySettings(15, 45, 10);
      mockRepository.save.mockResolvedValue();

      // Act
      await useCase.execute(settings);

      // Assert
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
      expect(mockRepository.save).toHaveBeenCalledWith(settings);
    });

    test('リポジトリエラーの場合、エラーが伝播されること', async () => {
      // Arrange
      const settings = SystemSettings.create();
      const error = new Error('Save error');
      mockRepository.save.mockRejectedValue(error);

      // Act & Assert
      await expect(useCase.execute(settings)).rejects.toThrow('Save error');
    });
  });
});

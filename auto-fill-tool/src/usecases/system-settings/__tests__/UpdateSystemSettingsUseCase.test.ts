/**
 * Unit Tests: UpdateSystemSettingsUseCase
 * Tests updating system settings in the repository
 */

import { UpdateSystemSettingsUseCase } from '../UpdateSystemSettingsUseCase';
import { SystemSettingsRepository } from '@domain/repositories/SystemSettingsRepository';
import { SystemSettingsCollection } from '@domain/entities/SystemSettings';
import { LogLevel } from '@domain/types/logger.types';
import { Result } from '@domain/values/result.value';

describe('UpdateSystemSettingsUseCase', () => {
  let useCase: UpdateSystemSettingsUseCase;
  let mockRepository: jest.Mocked<SystemSettingsRepository>;

  beforeEach(() => {
    mockRepository = {
      load: jest.fn(),
      save: jest.fn(),
    } as any;

    useCase = new UpdateSystemSettingsUseCase(mockRepository);

    jest.clearAllMocks();
  });

  describe('execute()', () => {
    it('should save system settings to repository', async () => {
      // Arrange
      const settings = new SystemSettingsCollection({
        retryWaitSecondsMin: 30,
        retryWaitSecondsMax: 60,
        retryCount: 3,
        autoFillProgressDialogMode: 'withCancel',
        waitForOptionsMilliseconds: 500,
        logLevel: LogLevel.INFO,
        enableTabRecording: true,
        enableAudioRecording: false,
        recordingBitrate: 2500000,
        recordingRetentionDays: 10,
        gradientStartColor: '#667eea',
        gradientEndColor: '#764ba2',
        gradientAngle: 135,
      });

      mockRepository.save.mockResolvedValue(Result.success(undefined));

      // Act
      await useCase.execute({ settings });

      // Assert
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
      expect(mockRepository.save).toHaveBeenCalledWith(settings);
    });

    it('should save custom settings', async () => {
      // Arrange
      const customSettings = new SystemSettingsCollection({
        retryWaitSecondsMin: 15,
        retryWaitSecondsMax: 45,
        retryCount: -1,
        autoFillProgressDialogMode: 'hidden',
        waitForOptionsMilliseconds: 1000,
        logLevel: LogLevel.DEBUG,
        enableTabRecording: false,
        enableAudioRecording: true,
        recordingBitrate: 5000000,
        recordingRetentionDays: 30,
        gradientStartColor: '#ff0000',
        gradientEndColor: '#00ff00',
        gradientAngle: 90,
      });

      mockRepository.save.mockResolvedValue(Result.success(undefined));

      // Act
      await useCase.execute({ settings: customSettings });

      // Assert
      expect(mockRepository.save).toHaveBeenCalledWith(customSettings);
    });

    it('should save default settings', async () => {
      // Arrange
      const defaultSettings = new SystemSettingsCollection();
      mockRepository.save.mockResolvedValue(Result.success(undefined));

      // Act
      await useCase.execute({ settings: defaultSettings });

      // Assert
      expect(mockRepository.save).toHaveBeenCalledWith(defaultSettings);
    });

    it('should save settings with only general settings modified', async () => {
      // Arrange
      const settings = new SystemSettingsCollection({
        retryWaitSecondsMin: 20,
        retryWaitSecondsMax: 40,
        retryCount: 5,
        autoFillProgressDialogMode: 'withoutCancel',
        waitForOptionsMilliseconds: 750,
        logLevel: LogLevel.WARN,
        enableTabRecording: true,
        enableAudioRecording: false,
        recordingBitrate: 2500000,
        recordingRetentionDays: 10,
        gradientStartColor: '#667eea',
        gradientEndColor: '#764ba2',
        gradientAngle: 135,
      });

      mockRepository.save.mockResolvedValue(Result.success(undefined));

      // Act
      await useCase.execute({ settings });

      // Assert
      expect(mockRepository.save).toHaveBeenCalledWith(settings);
    });

    it('should save settings with only recording settings modified', async () => {
      // Arrange
      const settings = new SystemSettingsCollection({
        retryWaitSecondsMin: 30,
        retryWaitSecondsMax: 60,
        retryCount: 3,
        autoFillProgressDialogMode: 'withCancel',
        waitForOptionsMilliseconds: 500,
        logLevel: LogLevel.INFO,
        enableTabRecording: false,
        enableAudioRecording: true,
        recordingBitrate: 3000000,
        recordingRetentionDays: 20,
        gradientStartColor: '#667eea',
        gradientEndColor: '#764ba2',
        gradientAngle: 135,
      });

      mockRepository.save.mockResolvedValue(Result.success(undefined));

      // Act
      await useCase.execute({ settings });

      // Assert
      expect(mockRepository.save).toHaveBeenCalledWith(settings);
    });

    it('should save settings with only appearance settings modified', async () => {
      // Arrange
      const settings = new SystemSettingsCollection({
        retryWaitSecondsMin: 30,
        retryWaitSecondsMax: 60,
        retryCount: 3,
        autoFillProgressDialogMode: 'withCancel',
        waitForOptionsMilliseconds: 500,
        logLevel: LogLevel.INFO,
        enableTabRecording: true,
        enableAudioRecording: false,
        recordingBitrate: 2500000,
        recordingRetentionDays: 10,
        gradientStartColor: '#123456',
        gradientEndColor: '#abcdef',
        gradientAngle: 45,
      });

      mockRepository.save.mockResolvedValue(Result.success(undefined));

      // Act
      await useCase.execute({ settings });

      // Assert
      expect(mockRepository.save).toHaveBeenCalledWith(settings);
    });

    it('should propagate repository save errors', async () => {
      // Arrange
      const settings = new SystemSettingsCollection();
      const error = new Error('Repository save failed');

      mockRepository.save.mockRejectedValue(error);

      // Act & Assert
      await expect(useCase.execute({ settings })).rejects.toThrow('Repository save failed');
      expect(mockRepository.save).toHaveBeenCalledWith(settings);
    });

    it('should handle database connection errors', async () => {
      // Arrange
      const settings = new SystemSettingsCollection();
      const error = new Error('Database connection timeout');

      mockRepository.save.mockRejectedValue(error);

      // Act & Assert
      await expect(useCase.execute({ settings })).rejects.toThrow('Database connection timeout');
    });

    it('should handle storage quota exceeded errors', async () => {
      // Arrange
      const settings = new SystemSettingsCollection();
      const error = new Error('Storage quota exceeded');

      mockRepository.save.mockRejectedValue(error);

      // Act & Assert
      await expect(useCase.execute({ settings })).rejects.toThrow('Storage quota exceeded');
    });

    it('should save settings with extreme values', async () => {
      // Arrange
      const extremeSettings = new SystemSettingsCollection({
        retryWaitSecondsMin: 0,
        retryWaitSecondsMax: 999999,
        retryCount: -1,
        autoFillProgressDialogMode: 'hidden',
        waitForOptionsMilliseconds: 0,
        logLevel: LogLevel.NONE,
        enableTabRecording: false,
        enableAudioRecording: false,
        recordingBitrate: 1,
        recordingRetentionDays: 1,
        gradientStartColor: '#000000',
        gradientEndColor: '#ffffff',
        gradientAngle: 0,
      });

      mockRepository.save.mockResolvedValue(Result.success(undefined));

      // Act
      await useCase.execute({ settings: extremeSettings });

      // Assert
      expect(mockRepository.save).toHaveBeenCalledWith(extremeSettings);
    });

    it('should complete without returning a value', async () => {
      // Arrange
      const settings = new SystemSettingsCollection();
      mockRepository.save.mockResolvedValue(Result.success(undefined));

      // Act
      const result = await useCase.execute({ settings });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value).toBeUndefined();
      expect(mockRepository.save).toHaveBeenCalledWith(settings);
    });
  });
});

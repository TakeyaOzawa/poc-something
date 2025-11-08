/**
 * Unit Tests: ResetSystemSettingsUseCase
 * Tests resetting system settings to defaults
 */

import { ResetSystemSettingsUseCase } from '../ResetSystemSettingsUseCase';
import { SystemSettingsRepository } from '@domain/repositories/SystemSettingsRepository';
import { SystemSettingsCollection } from '@domain/entities/SystemSettings';
import { LogLevel } from '@domain/types/logger.types';
import { Result } from '@domain/values/result.value';
import { IdGenerator } from '@domain/types/id-generator.types';

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('ResetSystemSettingsUseCase', () => {
  let useCase: ResetSystemSettingsUseCase;
  let mockRepository: jest.Mocked<SystemSettingsRepository>;

  beforeEach(() => {
    mockRepository = {
      load: jest.fn(),
      save: jest.fn(),
    } as any;

    useCase = new ResetSystemSettingsUseCase(mockRepository);

    jest.clearAllMocks();
  });

  describe('execute()', () => {
    it('should reset general settings to defaults', async () => {
      // Arrange
      const currentSettings = new SystemSettingsCollection({
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

      mockRepository.load.mockResolvedValue(Result.success(currentSettings));
      mockRepository.save.mockResolvedValue(Result.success(undefined));

      // Act
      const result = await useCase.execute({ section: 'general' });

      // Assert
      expect(mockRepository.load).toHaveBeenCalledTimes(1);
      expect(mockRepository.save).toHaveBeenCalledTimes(1);

      const savedSettings = mockRepository.save.mock.calls[0][0] as SystemSettingsCollection;
      expect(savedSettings.getRetryWaitSecondsMin()).toBe(30); // Default
      expect(savedSettings.getRetryWaitSecondsMax()).toBe(60); // Default
      expect(savedSettings.getRetryCount()).toBe(3); // Default
      expect(savedSettings.getAutoFillProgressDialogMode()).toBe('withCancel'); // Default
      expect(savedSettings.getWaitForOptionsMilliseconds()).toBe(500); // Default
      expect(savedSettings.getLogLevel()).toBe(LogLevel.INFO); // Default

      // Recording and appearance settings should remain unchanged
      expect(savedSettings.getEnableTabRecording()).toBe(false);
      expect(savedSettings.getRecordingBitrate()).toBe(5000000);
      expect(savedSettings.getGradientStartColor()).toBe('#ff0000');
    });

    it('should reset recording settings to defaults', async () => {
      // Arrange
      const currentSettings = new SystemSettingsCollection({
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

      mockRepository.load.mockResolvedValue(Result.success(currentSettings));
      mockRepository.save.mockResolvedValue(Result.success(undefined));

      // Act
      const result = await useCase.execute({ section: 'recording' });

      // Assert
      expect(mockRepository.load).toHaveBeenCalledTimes(1);
      expect(mockRepository.save).toHaveBeenCalledTimes(1);

      const savedSettings = mockRepository.save.mock.calls[0][0] as SystemSettingsCollection;
      expect(savedSettings.getEnableTabRecording()).toBe(true); // Default
      expect(savedSettings.getEnableAudioRecording()).toBe(false); // Default
      expect(savedSettings.getRecordingBitrate()).toBe(2500000); // Default
      expect(savedSettings.getRecordingRetentionDays()).toBe(10); // Default

      // General and appearance settings should remain unchanged
      expect(savedSettings.getRetryWaitSecondsMin()).toBe(15);
      expect(savedSettings.getLogLevel()).toBe(LogLevel.DEBUG);
      expect(savedSettings.getGradientStartColor()).toBe('#ff0000');
    });

    it('should reset appearance settings to defaults', async () => {
      // Arrange
      const currentSettings = new SystemSettingsCollection({
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

      mockRepository.load.mockResolvedValue(Result.success(currentSettings));
      mockRepository.save.mockResolvedValue(Result.success(undefined));

      // Act
      const result = await useCase.execute({ section: 'appearance' });

      // Assert
      expect(mockRepository.load).toHaveBeenCalledTimes(1);
      expect(mockRepository.save).toHaveBeenCalledTimes(1);

      const savedSettings = mockRepository.save.mock.calls[0][0] as SystemSettingsCollection;
      expect(savedSettings.getGradientStartColor()).toBe('#667eea'); // Default
      expect(savedSettings.getGradientEndColor()).toBe('#764ba2'); // Default
      expect(savedSettings.getGradientAngle()).toBe(135); // Default

      // General and recording settings should remain unchanged
      expect(savedSettings.getRetryWaitSecondsMin()).toBe(15);
      expect(savedSettings.getLogLevel()).toBe(LogLevel.DEBUG);
      expect(savedSettings.getEnableTabRecording()).toBe(false);
    });

    it('should reset all settings when no section specified', async () => {
      // Arrange
      const currentSettings = new SystemSettingsCollection({
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

      mockRepository.load.mockResolvedValue(Result.success(currentSettings));
      mockRepository.save.mockResolvedValue(Result.success(undefined));

      // Act
      const result = await useCase.execute();

      // Assert
      expect(mockRepository.load).toHaveBeenCalledTimes(1);
      expect(mockRepository.save).toHaveBeenCalledTimes(1);

      const savedSettings = mockRepository.save.mock.calls[0][0] as SystemSettingsCollection;

      // All settings should be reset to defaults
      expect(savedSettings.getRetryWaitSecondsMin()).toBe(30);
      expect(savedSettings.getRetryWaitSecondsMax()).toBe(60);
      expect(savedSettings.getRetryCount()).toBe(3);
      expect(savedSettings.getAutoFillProgressDialogMode()).toBe('withCancel');
      expect(savedSettings.getWaitForOptionsMilliseconds()).toBe(500);
      expect(savedSettings.getLogLevel()).toBe(LogLevel.INFO);
      expect(savedSettings.getEnableTabRecording()).toBe(true);
      expect(savedSettings.getEnableAudioRecording()).toBe(false);
      expect(savedSettings.getRecordingBitrate()).toBe(2500000);
      expect(savedSettings.getRecordingRetentionDays()).toBe(10);
      expect(savedSettings.getGradientStartColor()).toBe('#667eea');
      expect(savedSettings.getGradientEndColor()).toBe('#764ba2');
      expect(savedSettings.getGradientAngle()).toBe(135);
    });

    it('should return the reset settings', async () => {
      // Arrange
      const currentSettings = new SystemSettingsCollection();
      mockRepository.load.mockResolvedValue(Result.success(currentSettings));
      mockRepository.save.mockResolvedValue(Result.success(undefined));

      // Act
      const result = await useCase.execute({ section: 'general' });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value).toBeInstanceOf(SystemSettingsCollection);
      expect(result.value!.getRetryWaitSecondsMin()).toBe(30);
      expect(result.value!.getRetryWaitSecondsMax()).toBe(60);
    });

    it('should propagate repository load errors', async () => {
      // Arrange
      const error = new Error('Repository load failed');
      mockRepository.load.mockResolvedValue(Result.failure(error));

      // Act
      const result = await useCase.execute({ section: 'general' });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error?.message).toContain('Failed to reset system settings');
      expect(result.error?.message).toContain('Repository load failed');
      expect(mockRepository.load).toHaveBeenCalledTimes(1);
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should propagate repository save errors', async () => {
      // Arrange
      const currentSettings = new SystemSettingsCollection();
      const error = new Error('Repository save failed');

      mockRepository.load.mockResolvedValue(Result.success(currentSettings));
      mockRepository.save.mockResolvedValue(Result.failure(error));

      // Act
      const result = await useCase.execute({ section: 'general' });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error?.message).toContain('Failed to reset system settings');
      expect(result.error?.message).toContain('Repository save failed');
      expect(mockRepository.load).toHaveBeenCalledTimes(1);
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should handle resetting already default settings', async () => {
      // Arrange - Settings already at defaults
      const defaultSettings = new SystemSettingsCollection();
      mockRepository.load.mockResolvedValue(Result.success(defaultSettings));
      mockRepository.save.mockResolvedValue(Result.success(undefined));

      // Act
      const result = await useCase.execute();

      // Assert
      expect(mockRepository.load).toHaveBeenCalledTimes(1);
      expect(mockRepository.save).toHaveBeenCalledTimes(1);

      const savedSettings = mockRepository.save.mock.calls[0][0] as SystemSettingsCollection;
      expect(savedSettings.getRetryWaitSecondsMin()).toBe(30);
      expect(savedSettings.getEnableTabRecording()).toBe(true);
      expect(savedSettings.getGradientStartColor()).toBe('#667eea');
    });

    it('should preserve other section settings when resetting specific section', async () => {
      // Arrange
      const currentSettings = new SystemSettingsCollection({
        retryWaitSecondsMin: 100,
        retryWaitSecondsMax: 200,
        retryCount: 10,
        autoFillProgressDialogMode: 'withCancel',
        waitForOptionsMilliseconds: 2000,
        logLevel: LogLevel.ERROR,
        enableTabRecording: false,
        enableAudioRecording: true,
        recordingBitrate: 8000000,
        recordingRetentionDays: 50,
        gradientStartColor: '#123456',
        gradientEndColor: '#abcdef',
        gradientAngle: 270,
      });

      mockRepository.load.mockResolvedValue(Result.success(currentSettings));
      mockRepository.save.mockResolvedValue(Result.success(undefined));

      // Act - Reset only general settings
      await useCase.execute({ section: 'general' });

      // Assert
      const savedSettings = mockRepository.save.mock.calls[0][0] as SystemSettingsCollection;

      // General settings should be reset
      expect(savedSettings.getRetryWaitSecondsMin()).toBe(30);
      expect(savedSettings.getRetryWaitSecondsMax()).toBe(60);
      expect(savedSettings.getRetryCount()).toBe(3);
      expect(savedSettings.getWaitForOptionsMilliseconds()).toBe(500);
      expect(savedSettings.getLogLevel()).toBe(LogLevel.INFO);

      // Recording settings should be preserved
      expect(savedSettings.getEnableTabRecording()).toBe(false);
      expect(savedSettings.getEnableAudioRecording()).toBe(true);
      expect(savedSettings.getRecordingBitrate()).toBe(8000000);
      expect(savedSettings.getRecordingRetentionDays()).toBe(50);

      // Appearance settings should be preserved
      expect(savedSettings.getGradientStartColor()).toBe('#123456');
      expect(savedSettings.getGradientEndColor()).toBe('#abcdef');
      expect(savedSettings.getGradientAngle()).toBe(270);
    });
  });
});

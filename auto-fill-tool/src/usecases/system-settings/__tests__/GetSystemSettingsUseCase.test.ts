/**
 * Unit Tests: GetSystemSettingsUseCase
 * Tests retrieving system settings from the repository
 */

import { GetSystemSettingsUseCase } from '../GetSystemSettingsUseCase';
import { SystemSettingsRepository } from '@domain/repositories/SystemSettingsRepository';
import { SystemSettingsCollection } from '@domain/entities/SystemSettings';
import { LogLevel } from '@domain/types/logger.types';
import { Result } from '@domain/values/result.value';
import { IdGenerator } from '@domain/types/id-generator.types';

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('GetSystemSettingsUseCase', () => {
  let useCase: GetSystemSettingsUseCase;
  let mockRepository: jest.Mocked<SystemSettingsRepository>;

  beforeEach(() => {
    mockRepository = {
      load: jest.fn(),
      save: jest.fn(),
    } as any;

    useCase = new GetSystemSettingsUseCase(mockRepository);

    jest.clearAllMocks();
  });

  describe('execute()', () => {
    it('should load and return system settings', async () => {
      // Arrange
      const mockSettings = new SystemSettingsCollection({
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

      mockRepository.load.mockResolvedValue(Result.success(mockSettings));

      // Act
      const result = await useCase.execute();

      // Assert
      expect(mockRepository.load).toHaveBeenCalledTimes(1);
      expect(result.isSuccess).toBe(true);
      expect(result.value).toBe(mockSettings);
      expect(result.value!.getAll()).toEqual(mockSettings.getAll());
    });

    it('should load default settings when no custom settings exist', async () => {
      // Arrange
      const defaultSettings = new SystemSettingsCollection();
      mockRepository.load.mockResolvedValue(Result.success(defaultSettings));

      // Act
      const result = await useCase.execute();

      // Assert
      expect(mockRepository.load).toHaveBeenCalledTimes(1);
      expect(result.isSuccess).toBe(true);
      expect(result.value).toBe(defaultSettings);
      expect(result.value!.getRetryWaitSecondsMin()).toBe(30); // Default value
      expect(result.value!.getRetryWaitSecondsMax()).toBe(60); // Default value
      expect(result.value!.getRetryCount()).toBe(3); // Default value
    });

    it('should load settings with custom values', async () => {
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

      mockRepository.load.mockResolvedValue(Result.success(customSettings));

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.getRetryWaitSecondsMin()).toBe(15);
      expect(result.value!.getRetryWaitSecondsMax()).toBe(45);
      expect(result.value!.getRetryCount()).toBe(-1);
      expect(result.value!.getAutoFillProgressDialogMode()).toBe('hidden');
      expect(result.value!.getLogLevel()).toBe(LogLevel.DEBUG);
    });

    it('should propagate repository errors', async () => {
      // Arrange
      const error = new Error('Repository load failed');
      mockRepository.load.mockResolvedValue(Result.failure(error));

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error?.message).toContain('Failed to get system settings');
      expect(result.error?.message).toContain('Repository load failed');
      expect(mockRepository.load).toHaveBeenCalledTimes(1);
    });

    it('should handle database connection errors', async () => {
      // Arrange
      const error = new Error('Database connection timeout');
      mockRepository.load.mockResolvedValue(Result.failure(error));

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error?.message).toContain('Failed to get system settings');
      expect(result.error?.message).toContain('Database connection timeout');
    });

    it('should return settings with all general settings fields', async () => {
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

      mockRepository.load.mockResolvedValue(Result.success(settings));

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.getRetryWaitSecondsMin()).toBe(20);
      expect(result.value!.getRetryWaitSecondsMax()).toBe(40);
      expect(result.value!.getRetryCount()).toBe(5);
      expect(result.value!.getWaitForOptionsMilliseconds()).toBe(750);
      expect(result.value!.getAutoFillProgressDialogMode()).toBe('withoutCancel');
      expect(result.value!.getLogLevel()).toBe(LogLevel.WARN);
    });

    it('should return settings with all recording settings fields', async () => {
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

      mockRepository.load.mockResolvedValue(Result.success(settings));

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.getEnableTabRecording()).toBe(false);
      expect(result.value!.getEnableAudioRecording()).toBe(true);
      expect(result.value!.getRecordingBitrate()).toBe(3000000);
      expect(result.value!.getRecordingRetentionDays()).toBe(20);
    });

    it('should return settings with all appearance settings fields', async () => {
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

      mockRepository.load.mockResolvedValue(Result.success(settings));

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value!.getGradientStartColor()).toBe('#123456');
      expect(result.value!.getGradientEndColor()).toBe('#abcdef');
      expect(result.value!.getGradientAngle()).toBe(45);
    });
  });
});

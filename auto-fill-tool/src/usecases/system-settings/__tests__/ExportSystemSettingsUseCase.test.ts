/**
 * Test: Export System Settings Use Case
 */

import { ExportSystemSettingsUseCase } from '../ExportSystemSettingsUseCase';
import { SystemSettingsRepository } from '@domain/repositories/SystemSettingsRepository';
import { SystemSettingsCollection } from '@domain/entities/SystemSettings';
import { SystemSettingsMapper } from '@infrastructure/mappers/SystemSettingsMapper';
import { LogLevel } from '@domain/types/logger.types';

import { Result } from '@domain/values/result.value';
// Mock SystemSettingsMapper
jest.mock('@infrastructure/mappers/SystemSettingsMapper');

describe('ExportSystemSettingsUseCase', () => {
  let useCase: ExportSystemSettingsUseCase;
  let mockRepository: jest.Mocked<SystemSettingsRepository>;

  beforeEach(() => {
    // Create mock repository
    mockRepository = {
      load: jest.fn(),
      save: jest.fn(),
    } as any;

    // Create use case instance
    useCase = new ExportSystemSettingsUseCase(mockRepository);

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should export system settings to CSV', async () => {
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

      const mockCSV = 'key,value\nretryWaitSecondsMin,30\nretryWaitSecondsMax,60';

      mockRepository.load.mockResolvedValue(Result.success(mockSettings));
      (SystemSettingsMapper.toCSV as jest.Mock).mockReturnValue(mockCSV);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(mockRepository.load).toHaveBeenCalledTimes(1);
      expect(SystemSettingsMapper.toCSV).toHaveBeenCalledWith(mockSettings);
      expect(result.isSuccess).toBe(true);
      expect(result.value).toBe(mockCSV);
    });

    it('should export settings with custom values', async () => {
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

      const expectedCSV = 'key,value\nretryWaitSecondsMin,15';

      mockRepository.load.mockResolvedValue(Result.success(customSettings));
      (SystemSettingsMapper.toCSV as jest.Mock).mockReturnValue(expectedCSV);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value).toBe(expectedCSV);
      expect(SystemSettingsMapper.toCSV).toHaveBeenCalledWith(customSettings);
    });

    it('should export default settings when no custom settings exist', async () => {
      // Arrange
      const defaultSettings = new SystemSettingsCollection();
      const defaultCSV = 'key,value\nretryWaitSecondsMin,30';

      mockRepository.load.mockResolvedValue(Result.success(defaultSettings));
      (SystemSettingsMapper.toCSV as jest.Mock).mockReturnValue(defaultCSV);

      // Act
      const result = await useCase.execute();

      // Assert
      expect(mockRepository.load).toHaveBeenCalled();
      expect(SystemSettingsMapper.toCSV).toHaveBeenCalledWith(defaultSettings);
      expect(result.isSuccess).toBe(true);
      expect(result.value).toBe(defaultCSV);
    });

    it('should propagate repository errors', async () => {
      // Arrange
      const error = new Error('Repository load failed');
      mockRepository.load.mockResolvedValue(Result.failure(error));

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error?.message).toContain('Failed to export system settings');
      expect(result.error?.message).toContain('Repository load failed');
      expect(mockRepository.load).toHaveBeenCalledTimes(1);
      expect(SystemSettingsMapper.toCSV).not.toHaveBeenCalled();
    });

    it('should propagate mapper errors', async () => {
      // Arrange
      const mockSettings = new SystemSettingsCollection();
      const error = new Error('Mapper conversion failed');

      mockRepository.load.mockResolvedValue(Result.success(mockSettings));
      (SystemSettingsMapper.toCSV as jest.Mock).mockImplementation(() => {
        throw error;
      });

      // Act & Assert
      await expect(useCase.execute()).rejects.toThrow('Mapper conversion failed');
      expect(mockRepository.load).toHaveBeenCalled();
      expect(SystemSettingsMapper.toCSV).toHaveBeenCalledWith(mockSettings);
    });
  });
});

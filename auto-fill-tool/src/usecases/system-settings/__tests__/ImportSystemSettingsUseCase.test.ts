/**
 * Unit Tests: ImportSystemSettingsUseCase
 * Tests importing system settings from CSV
 */

import { ImportSystemSettingsUseCase } from '../ImportSystemSettingsUseCase';
import { SystemSettingsRepository } from '@domain/repositories/SystemSettingsRepository';
import { SystemSettingsMapper } from '@infrastructure/mappers/SystemSettingsMapper';
import { SystemSettingsCollection } from '@domain/entities/SystemSettings';
import { Result } from '@domain/values/result.value';
import { LogLevel } from '@domain/types/logger.types';
import { IdGenerator } from '@domain/types/id-generator.types';

// Mock SystemSettingsMapper
jest.mock('@infrastructure/mappers/SystemSettingsMapper');

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('ImportSystemSettingsUseCase', () => {
  let useCase: ImportSystemSettingsUseCase;
  let mockRepository: jest.Mocked<SystemSettingsRepository>;

  beforeEach(() => {
    mockRepository = {
      load: jest.fn(),
      save: jest.fn(),
    } as any;

    useCase = new ImportSystemSettingsUseCase(mockRepository);

    jest.clearAllMocks();
  });

  describe('execute()', () => {
    it('should import system settings from CSV', async () => {
      // Arrange
      const csvText = `key,value
retryWaitSecondsMin,30
retryWaitSecondsMax,60
retryCount,3
logLevel,1`;

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

      (SystemSettingsMapper.fromCSV as jest.Mock).mockReturnValue(mockSettings);
      mockRepository.save.mockResolvedValue(Result.success(undefined));

      // Act
      await useCase.execute({ csvText });

      // Assert
      expect(SystemSettingsMapper.fromCSV).toHaveBeenCalledWith(csvText);
      expect(mockRepository.save).toHaveBeenCalledWith(mockSettings);
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should import settings with custom values', async () => {
      // Arrange
      const csvText = `key,value
retryWaitSecondsMin,15
retryWaitSecondsMax,45
retryCount,-1
autoFillProgressDialogMode,hidden
logLevel,0`;

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

      (SystemSettingsMapper.fromCSV as jest.Mock).mockReturnValue(customSettings);
      mockRepository.save.mockResolvedValue(Result.success(undefined));

      // Act
      await useCase.execute({ csvText });

      // Assert
      expect(SystemSettingsMapper.fromCSV).toHaveBeenCalledWith(csvText);
      expect(mockRepository.save).toHaveBeenCalledWith(customSettings);
    });

    it('should import settings with recording configuration', async () => {
      // Arrange
      const csvText = `key,value
enableTabRecording,false
enableAudioRecording,true
recordingBitrate,3000000
recordingRetentionDays,20`;

      const recordingSettings = new SystemSettingsCollection({
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

      (SystemSettingsMapper.fromCSV as jest.Mock).mockReturnValue(recordingSettings);
      mockRepository.save.mockResolvedValue(Result.success(undefined));

      // Act
      await useCase.execute({ csvText });

      // Assert
      expect(SystemSettingsMapper.fromCSV).toHaveBeenCalledWith(csvText);
      expect(mockRepository.save).toHaveBeenCalledWith(recordingSettings);
    });

    it('should import settings with appearance configuration', async () => {
      // Arrange
      const csvText = `key,value
gradientStartColor,#123456
gradientEndColor,#abcdef
gradientAngle,45`;

      const appearanceSettings = new SystemSettingsCollection({
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

      (SystemSettingsMapper.fromCSV as jest.Mock).mockReturnValue(appearanceSettings);
      mockRepository.save.mockResolvedValue(Result.success(undefined));

      // Act
      await useCase.execute({ csvText });

      // Assert
      expect(SystemSettingsMapper.fromCSV).toHaveBeenCalledWith(csvText);
      expect(mockRepository.save).toHaveBeenCalledWith(appearanceSettings);
    });

    it('should propagate mapper parsing errors', async () => {
      // Arrange
      const csvText = 'invalid,csv,format';
      const error = new Error('CSV parsing failed');

      (SystemSettingsMapper.fromCSV as jest.Mock).mockImplementation(() => {
        throw error;
      });

      // Act & Assert
      await expect(useCase.execute({ csvText })).rejects.toThrow('CSV parsing failed');
      expect(SystemSettingsMapper.fromCSV).toHaveBeenCalledWith(csvText);
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should propagate repository save errors', async () => {
      // Arrange
      const csvText = 'key,value\nretryWaitSecondsMin,30';
      const mockSettings = new SystemSettingsCollection();
      const error = new Error('Repository save failed');

      (SystemSettingsMapper.fromCSV as jest.Mock).mockReturnValue(mockSettings);
      mockRepository.save.mockRejectedValue(error);

      // Act & Assert
      await expect(useCase.execute({ csvText })).rejects.toThrow('Repository save failed');
      expect(SystemSettingsMapper.fromCSV).toHaveBeenCalledWith(csvText);
      expect(mockRepository.save).toHaveBeenCalledWith(mockSettings);
    });

    it('should handle empty CSV text', async () => {
      // Arrange
      const csvText = '';
      const defaultSettings = new SystemSettingsCollection();

      (SystemSettingsMapper.fromCSV as jest.Mock).mockReturnValue(defaultSettings);
      mockRepository.save.mockResolvedValue(Result.success(undefined));

      // Act
      await useCase.execute({ csvText });

      // Assert
      expect(SystemSettingsMapper.fromCSV).toHaveBeenCalledWith(csvText);
      expect(mockRepository.save).toHaveBeenCalledWith(defaultSettings);
    });

    it('should handle CSV with header only', async () => {
      // Arrange
      const csvText = 'key,value';
      const defaultSettings = new SystemSettingsCollection();

      (SystemSettingsMapper.fromCSV as jest.Mock).mockReturnValue(defaultSettings);
      mockRepository.save.mockResolvedValue(Result.success(undefined));

      // Act
      await useCase.execute({ csvText });

      // Assert
      expect(SystemSettingsMapper.fromCSV).toHaveBeenCalledWith(csvText);
      expect(mockRepository.save).toHaveBeenCalledWith(defaultSettings);
    });

    it('should import complete settings configuration', async () => {
      // Arrange
      const csvText = `key,value
retryWaitSecondsMin,20
retryWaitSecondsMax,40
retryCount,5
autoFillProgressDialogMode,withoutCancel
waitForOptionsMilliseconds,750
logLevel,2
enableTabRecording,false
enableAudioRecording,true
recordingBitrate,3500000
recordingRetentionDays,15
gradientStartColor,#aabbcc
gradientEndColor,#ddeeff
gradientAngle,180`;

      const completeSettings = new SystemSettingsCollection({
        retryWaitSecondsMin: 20,
        retryWaitSecondsMax: 40,
        retryCount: 5,
        autoFillProgressDialogMode: 'withoutCancel',
        waitForOptionsMilliseconds: 750,
        logLevel: LogLevel.WARN,
        enableTabRecording: false,
        enableAudioRecording: true,
        recordingBitrate: 3500000,
        recordingRetentionDays: 15,
        gradientStartColor: '#aabbcc',
        gradientEndColor: '#ddeeff',
        gradientAngle: 180,
      });

      (SystemSettingsMapper.fromCSV as jest.Mock).mockReturnValue(completeSettings);
      mockRepository.save.mockResolvedValue(Result.success(undefined));

      // Act
      await useCase.execute({ csvText });

      // Assert
      expect(SystemSettingsMapper.fromCSV).toHaveBeenCalledWith(csvText);
      expect(mockRepository.save).toHaveBeenCalledWith(completeSettings);
    });
  });
});

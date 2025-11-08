/**
 * Unit Tests: ImportSystemSettingsUseCase
 * Tests importing system settings from CSV
 */

import { ImportSystemSettingsUseCase } from '../ImportSystemSettingsUseCase';
import { SystemSettingsRepository } from '@domain/repositories/SystemSettingsRepository';
import { Result } from '@domain/values/result.value';
import { IdGenerator } from '@domain/types/id-generator.types';

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
      const csvText = `retryWaitSecondsMin,retryWaitSecondsMax,retryCount,logLevel
30,60,3,1`;

      mockRepository.save.mockResolvedValue(Result.success(undefined));

      // Act
      const result = await useCase.execute({ csvText });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should import settings with custom values', async () => {
      // Arrange
      const csvText = `retryWaitSecondsMin,retryWaitSecondsMax,retryCount,autoFillProgressDialogMode,logLevel
15,45,-1,hidden,0`;

      mockRepository.save.mockResolvedValue(Result.success(undefined));

      // Act
      const result = await useCase.execute({ csvText });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should import settings with recording configuration', async () => {
      // Arrange
      const csvText = `enableTabRecording,enableAudioRecording,recordingBitrate,recordingRetentionDays
false,true,3000000,20`;

      mockRepository.save.mockResolvedValue(Result.success(undefined));

      // Act
      const result = await useCase.execute({ csvText });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should import settings with appearance configuration', async () => {
      // Arrange
      const csvText = `gradientStartColor,gradientEndColor,gradientAngle
"#123456","#abcdef",45`;

      mockRepository.save.mockResolvedValue(Result.success(undefined));

      // Act
      const result = await useCase.execute({ csvText });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should handle invalid CSV format', async () => {
      // Arrange
      const csvText = 'invalid csv';

      // Act
      const result = await useCase.execute({ csvText });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error?.message).toContain('Import failed');
      expect(result.error?.message).toContain('Invalid CSV format');
    });

    it('should handle repository save errors', async () => {
      // Arrange
      const csvText = `retryWaitSecondsMin,retryWaitSecondsMax
30,60`;
      const error = new Error('Repository save failed');

      mockRepository.save.mockResolvedValue(Result.failure(error));

      // Act
      const result = await useCase.execute({ csvText });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error?.message).toContain('Failed to import system settings');
      expect(result.error?.message).toContain('Repository save failed');
    });

    it('should handle empty CSV text', async () => {
      // Arrange
      const csvText = '';

      // Act
      const result = await useCase.execute({ csvText });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error?.message).toContain('Import failed');
      expect(result.error?.message).toContain('Invalid CSV format');
    });

    it('should handle CSV with header only', async () => {
      // Arrange
      const csvText = 'retryWaitSecondsMin,retryWaitSecondsMax';

      // Act
      const result = await useCase.execute({ csvText });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error?.message).toContain('Import failed');
      expect(result.error?.message).toContain('Invalid CSV format');
    });

    it('should parse boolean values correctly', async () => {
      // Arrange
      const csvText = `enableTabRecording,enableAudioRecording
true,false`;

      mockRepository.save.mockResolvedValue(Result.success(undefined));

      // Act
      const result = await useCase.execute({ csvText });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should parse numeric values correctly', async () => {
      // Arrange
      const csvText = `retryWaitSecondsMin,retryCount,recordingBitrate
30,-1,2500000`;

      mockRepository.save.mockResolvedValue(Result.success(undefined));

      // Act
      const result = await useCase.execute({ csvText });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should handle quoted string values', async () => {
      // Arrange
      const csvText = `gradientStartColor,autoFillProgressDialogMode
"#667eea","withCancel"`;

      mockRepository.save.mockResolvedValue(Result.success(undefined));

      // Act
      const result = await useCase.execute({ csvText });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
    });
  });
});

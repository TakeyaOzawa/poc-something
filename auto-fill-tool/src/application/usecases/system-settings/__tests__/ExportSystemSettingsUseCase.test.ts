/**
 * Unit Tests: ExportSystemSettingsUseCase
 * Tests exporting system settings to CSV
 */

import { ExportSystemSettingsUseCase } from '../ExportSystemSettingsUseCase';
import { SystemSettingsRepository } from '@domain/repositories/SystemSettingsRepository';
import { SystemSettingsCollection } from '@domain/entities/SystemSettings';
import { Result } from '@domain/values/result.value';
import { IdGenerator } from '@domain/types/id-generator.types';

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('ExportSystemSettingsUseCase', () => {
  let useCase: ExportSystemSettingsUseCase;
  let mockRepository: jest.Mocked<SystemSettingsRepository>;

  beforeEach(() => {
    mockRepository = {
      load: jest.fn(),
      save: jest.fn(),
    } as any;

    useCase = new ExportSystemSettingsUseCase(mockRepository);

    jest.clearAllMocks();
  });

  describe('execute()', () => {
    it('should export system settings to CSV', async () => {
      // Arrange
      const mockSettings = new SystemSettingsCollection({
        retryWaitSecondsMin: 30,
        retryWaitSecondsMax: 60,
        retryCount: 3,
        logLevel: 1,
      });

      mockRepository.load.mockResolvedValue(Result.success(mockSettings));

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value).toContain('retryWaitSecondsMin');
      expect(result.value).toContain('30');
      expect(result.value).toContain('retryWaitSecondsMax');
      expect(result.value).toContain('60');
      expect(mockRepository.load).toHaveBeenCalledTimes(1);
    });

    it('should export settings with all fields', async () => {
      // Arrange
      const mockSettings = new SystemSettingsCollection({
        retryWaitSecondsMin: 15,
        retryWaitSecondsMax: 45,
        retryCount: -1,
        enableTabRecording: false,
        recordingBitrate: 5000000,
        recordingRetentionDays: 20,
        enabledLogSources: ['background', 'popup'],
        securityEventsOnly: false,
        maxStoredLogs: 100,
        logRetentionDays: 7,
      });

      mockRepository.load.mockResolvedValue(Result.success(mockSettings));

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value).toContain('retryWaitSecondsMin');
      expect(result.value).toContain('15');
      expect(result.value).toContain('recordingEnabled');
      expect(result.value).toContain('false');
      expect(result.value).toContain('recordingBitrate');
      expect(result.value).toContain('5000000');
    });

    it('should handle repository load errors', async () => {
      // Arrange
      const error = new Error('Repository load failed');
      mockRepository.load.mockResolvedValue(Result.failure(error));

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error?.message).toContain('Failed to export system settings');
      expect(result.error?.message).toContain('Repository load failed');
    });

    it('should export default settings', async () => {
      // Arrange
      const defaultSettings = new SystemSettingsCollection();
      mockRepository.load.mockResolvedValue(Result.success(defaultSettings));

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(result.value).toContain('retryWaitSecondsMin');
      expect(result.value).toContain('retryWaitSecondsMax');
      expect(result.value).toContain('retryCount');
    });

    it('should format CSV correctly', async () => {
      // Arrange
      const mockSettings = new SystemSettingsCollection({
        retryWaitSecondsMin: 30,
        retryWaitSecondsMax: 60,
        retryCount: 3,
      });

      mockRepository.load.mockResolvedValue(Result.success(mockSettings));

      // Act
      const result = await useCase.execute();

      // Assert
      expect(result.isSuccess).toBe(true);
      const lines = result.value!.split('\n');
      expect(lines.length).toBeGreaterThanOrEqual(2); // Header + at least one data line
      expect(lines[0]).toContain('retryWaitSecondsMin'); // Header contains field names
    });
  });
});

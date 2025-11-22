/**
 * Unit Tests: UpdateSystemSettingsUseCase
 * Tests updating system settings in the repository
 */

import { UpdateSystemSettingsUseCase } from '../UpdateSystemSettingsUseCase';
import { SystemSettingsRepository } from '@domain/repositories/SystemSettingsRepository';
import { SystemSettingsCollection } from '@domain/entities/SystemSettings';
import { LogLevel } from '@domain/types/logger.types';
import { Result } from '@domain/values/result.value';
import { IdGenerator } from '@domain/types/id-generator.types';

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

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
    it('should accept DTO and save system settings to repository', async () => {
      // Arrange
      const defaultSettings = new SystemSettingsCollection();
      mockRepository.load.mockResolvedValue(Result.success(defaultSettings));
      mockRepository.save.mockResolvedValue(Result.success(undefined));

      const dto = {
        retryCount: 5,
        enableTabRecording: false,
      };

      // Act
      const result = await useCase.execute({ settings: dto });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(mockRepository.load).toHaveBeenCalledTimes(1);
      expect(mockRepository.save).toHaveBeenCalledTimes(1);

      const savedSettings = mockRepository.save.mock.calls[0][0];
      expect(savedSettings).toBeInstanceOf(SystemSettingsCollection);
      expect(savedSettings.getRetryCount()).toBe(5);
      expect(savedSettings.getEnableTabRecording()).toBe(false);
    });

    it('should handle empty DTO (no updates)', async () => {
      // Arrange
      const defaultSettings = new SystemSettingsCollection();
      mockRepository.load.mockResolvedValue(Result.success(defaultSettings));
      mockRepository.save.mockResolvedValue(Result.success(undefined));

      const dto = {};

      // Act
      const result = await useCase.execute({ settings: dto });

      // Assert
      expect(result.isSuccess).toBe(true);
      expect(mockRepository.load).toHaveBeenCalledTimes(1);
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should handle repository load errors', async () => {
      // Arrange
      const error = new Error('Failed to load settings');
      mockRepository.load.mockResolvedValue(Result.failure(error));

      const dto = { retryCount: 5 };

      // Act
      const result = await useCase.execute({ settings: dto });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error?.message).toContain('Failed to load current settings');
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should handle repository save errors', async () => {
      // Arrange
      const defaultSettings = new SystemSettingsCollection();
      mockRepository.load.mockResolvedValue(Result.success(defaultSettings));

      const error = new Error('Repository save failed');
      mockRepository.save.mockResolvedValue(Result.failure(error));

      const dto = { retryCount: 5 };

      // Act
      const result = await useCase.execute({ settings: dto });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(result.error?.message).toContain('Failed to update system settings');
    });

    it('should handle validation errors from entity', async () => {
      // Arrange
      const defaultSettings = new SystemSettingsCollection();
      mockRepository.load.mockResolvedValue(Result.success(defaultSettings));

      // Invalid retry count (less than -1)
      const dto = { retryCount: -5 };

      // Act
      const result = await useCase.execute({ settings: dto });

      // Assert
      expect(result.isFailure).toBe(true);
      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });
});

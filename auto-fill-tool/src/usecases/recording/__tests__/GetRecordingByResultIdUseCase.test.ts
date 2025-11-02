/**
 * Unit Tests: GetRecordingByResultIdUseCase
 * Tests retrieving tab recording by automation result ID
 */

import { GetRecordingByResultIdUseCase } from '../GetRecordingByResultIdUseCase';
import { TabRecording, RecordingStatus } from '@domain/entities/TabRecording';
import { RecordingStorageRepository } from '@domain/repositories/RecordingStorageRepository';
import { Logger } from '@domain/types/logger.types';
import { Result } from '@domain/values/result.value';
import { IdGenerator } from '@domain/types/id-generator.types';

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('GetRecordingByResultIdUseCase', () => {
  let useCase: GetRecordingByResultIdUseCase;
  let mockRepository: jest.Mocked<RecordingStorageRepository>;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      load: jest.fn(),
      loadByAutomationResultId: jest.fn(),
      loadLatestByAutomationVariablesId: jest.fn(),
      loadAll: jest.fn(),
      delete: jest.fn(),
      deleteByAutomationResultId: jest.fn(),
      deleteOldRecordings: jest.fn(),
      getStorageSize: jest.fn(),
    } as jest.Mocked<RecordingStorageRepository>;

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      setLevel: jest.fn(),
      getLevel: jest.fn(),
      createChild: jest.fn(),
    } as jest.Mocked<Logger>;

    useCase = new GetRecordingByResultIdUseCase(mockRepository, mockLogger);
  });

  describe('execute()', () => {
    it('should retrieve recording by automation result ID', async () => {
      // Arrange
      const automationResultId = 'result-123';
      const mockRecording = TabRecording.create(
        {
          automationResultId,
          tabId: 1,
          bitrate: 2500000,
        },
        mockIdGenerator
      );

      mockRepository.loadByAutomationResultId.mockResolvedValue(Result.success(mockRecording));

      // Act
      const result = await useCase.execute({ automationResultId }, mockIdGenerator);

      // Assert
      expect(result).toBe(mockRecording);
      expect(mockRepository.loadByAutomationResultId).toHaveBeenCalledWith(automationResultId);
      expect(mockLogger.info).not.toHaveBeenCalled();
    });

    it('should return null when recording not found', async () => {
      // Arrange
      const automationResultId = 'non-existent';
      mockRepository.loadByAutomationResultId.mockResolvedValue(Result.success(null));

      // Act
      const result = await useCase.execute({ automationResultId });

      // Assert
      expect(result).toBeNull();
      expect(mockRepository.loadByAutomationResultId).toHaveBeenCalledWith(automationResultId);
      expect(mockLogger.info).toHaveBeenCalledWith('Recording not found', {
        automationResultId,
      });
    });

    it('should handle repository errors', async () => {
      // Arrange
      const automationResultId = 'result-123';
      const error = new Error('Repository error');
      mockRepository.loadByAutomationResultId.mockRejectedValue(error);

      // Act & Assert
      await expect(useCase.execute({ automationResultId })).rejects.toThrow('Repository error');
      expect(mockRepository.loadByAutomationResultId).toHaveBeenCalledWith(automationResultId);
    });

    it(
      'should retrieve saved recording with blob data',
      async () => {
        // Arrange
        const automationResultId = 'result-456';
        const blob = new Blob(['test video'], { type: 'video/webm' });
        const mockRecording = TabRecording.create({
          automationResultId,
          tabId: 2,
          bitrate: 3000000,
        })
          .start('test-recorder-id')
          .stop()
          .save(blob);

        mockRepository.loadByAutomationResultId.mockResolvedValue(Result.success(mockRecording));

        // Act
        const result = await useCase.execute({ automationResultId }, mockIdGenerator);

        // Assert
        expect(result).not.toBeNull();
        expect(result!.getStatus()).toBe(RecordingStatus.SAVED);
        expect(result!.getBlobData()).toBe(blob);
        expect(result!.getSizeBytes()).toBe(blob.size);
      },
      mockIdGenerator
    );

    it(
      'should retrieve error recording',
      async () => {
        // Arrange
        const automationResultId = 'result-error';
        const mockRecording = TabRecording.create({
          automationResultId,
          tabId: 3,
          bitrate: 2500000,
        }).markError('Recording failed');

        mockRepository.loadByAutomationResultId.mockResolvedValue(Result.success(mockRecording));

        // Act
        const result = await useCase.execute({ automationResultId }, mockIdGenerator);

        // Assert
        expect(result).not.toBeNull();
        expect(result!.hasError()).toBe(true);
        expect(result!.getErrorMessage()).toBe('Recording failed');
      },
      mockIdGenerator
    );
  });
});

/**
 * Unit Tests: StopTabRecordingUseCase
 * Tests stopping tab recording and saving the final blob
 */

import { StopTabRecordingUseCase, StopTabRecordingInput } from '../StopTabRecordingUseCase';
import { TabRecording, RecordingStatus } from '@domain/entities/TabRecording';
import { TabCaptureAdapter } from '@domain/ports/TabCapturePort';
import { RecordingStorageRepository } from '@domain/repositories/RecordingStorageRepository';
import { Logger, LogLevel } from '@domain/types/logger.types';
import { Result } from '@domain/values/result.value';
import { IdGenerator } from '@domain/types/id-generator.types';

// Mock IdGenerator
const mockIdGenerator: IdGenerator = {
  generate: jest.fn(() => 'mock-id-123'),
};

describe('StopTabRecordingUseCase', () => {
  let useCase: StopTabRecordingUseCase;
  let mockAdapter: jest.Mocked<TabCaptureAdapter>;
  let mockRepository: jest.Mocked<RecordingStorageRepository>;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    mockAdapter = {
      captureTab: jest.fn(),
      startRecording: jest.fn(),
      stopRecording: jest.fn(),
      isRecording: jest.fn(),
    } as jest.Mocked<TabCaptureAdapter>;

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
      getLevel: jest.fn().mockReturnValue(LogLevel.INFO),
      createChild: jest.fn(),
    } as jest.Mocked<Logger>;

    useCase = new StopTabRecordingUseCase(mockAdapter, mockRepository, mockLogger);
  });

  describe('execute()', () => {
    it('should stop recording successfully', async () => {
      // Arrange
      const automationResultId = 'result-123';
      const recording = TabRecording.create({
        automationResultId,
        tabId: 1,
        bitrate: 2500000,
      }).start('test-recorder-id');

      const blob = new Blob(['test video data'], { type: 'video/webm' });

      mockRepository.loadByAutomationResultId.mockResolvedValue(Result.success(recording));
      mockAdapter.stopRecording.mockResolvedValue(blob);
      mockRepository.save.mockResolvedValue(Result.success(undefined));

      // Act
      const result = await useCase.execute({ automationResultId });

      // Assert
      expect(result).not.toBeNull();
      expect(result!.state).toBe('saved');
      expect(result!.fileSize).toBeGreaterThan(0);
      expect(mockRepository.loadByAutomationResultId).toHaveBeenCalledWith(automationResultId);
      expect(mockAdapter.stopRecording).toHaveBeenCalledWith('test-recorder-id');
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
      expect(mockLogger.info).toHaveBeenCalledWith('Tab recording stopped successfully', {
        recordingId: recording.getId(),
        mediaRecorderId: 'test-recorder-id',
        automationResultId,
        tabId: 1,
        sizeBytes: blob.size,
        sizeMB: (blob.size / (1024 * 1024)).toFixed(2),
        durationMs: expect.any(Number),
        durationSeconds: expect.any(Number),
      });
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
      expect(mockAdapter.stopRecording).not.toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalledWith('Recording not found when attempting to stop', {
        automationResultId,
      });
    });

    it('should return recording if not in RECORDING status', async () => {
      // Arrange
      const automationResultId = 'result-123';
      const recording = TabRecording.create({
        automationResultId,
        tabId: 1,
        bitrate: 2500000,
      }); // IDLE status

      mockRepository.loadByAutomationResultId.mockResolvedValue(Result.success(recording));

      // Act
      const result = await useCase.execute({ automationResultId });

      // Assert
      expect(result).not.toBeNull();
      expect(result!.id).toBe(recording.getId());
      expect(result!.state).toBe('idle');
      expect(mockAdapter.stopRecording).not.toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalledWith('Recording is not in progress, cannot stop', {
        recordingId: recording.getId(),
        automationResultId,
        currentStatus: RecordingStatus.IDLE,
        tabId: 1,
      });
    });

    it(
      'should handle adapter errors and mark recording as error',
      async () => {
        // Arrange
        const automationResultId = 'result-123';
        const recording = TabRecording.create({
          automationResultId,
          tabId: 1,
          bitrate: 2500000,
        }).start('test-recorder-id');

        const error = new Error('Adapter error');

        mockRepository.loadByAutomationResultId.mockResolvedValue(Result.success(recording));
        mockAdapter.stopRecording.mockRejectedValue(error);
        mockRepository.save.mockResolvedValue(Result.success(undefined));

        // Act & Assert
        await expect(useCase.execute({ automationResultId })).rejects.toThrow('Adapter error');

        expect(mockAdapter.stopRecording).toHaveBeenCalledWith('test-recorder-id');
        expect(mockLogger.error).toHaveBeenCalledWith('Failed to stop tab recording', {
          recordingId: recording.getId(),
          mediaRecorderId: 'test-recorder-id',
          automationResultId,
          tabId: 1,
          error,
        });
        expect(mockRepository.save).toHaveBeenCalledTimes(1);

        const savedRecording = mockRepository.save.mock.calls[0][0] as TabRecording;
        expect(savedRecording.hasError()).toBe(true);
        expect(savedRecording.getErrorMessage()).toBe('Failed to stop recording');
      },
      mockIdGenerator
    );

    it('should handle stopped recording', async () => {
      // Arrange
      const automationResultId = 'result-123';
      const recording = TabRecording.create({
        automationResultId,
        tabId: 1,
        bitrate: 2500000,
      })
        .start('test-recorder-id')
        .stop(); // Already stopped

      mockRepository.loadByAutomationResultId.mockResolvedValue(Result.success(recording));

      // Act
      const result = await useCase.execute({ automationResultId });

      // Assert
      expect(result).not.toBeNull();
      expect(result!.id).toBe(recording.getId());
      expect(result!.state).toBe('stopped');
      expect(mockAdapter.stopRecording).not.toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalledWith('Recording is not in progress, cannot stop', {
        recordingId: recording.getId(),
        automationResultId,
        currentStatus: RecordingStatus.STOPPED,
        tabId: 1,
      });
    });

    it('should handle saved recording', async () => {
      // Arrange
      const automationResultId = 'result-123';
      const blob = new Blob(['test'], { type: 'video/webm' });
      const recording = TabRecording.create({
        automationResultId,
        tabId: 1,
        bitrate: 2500000,
      })
        .start('test-recorder-id')
        .stop()
        .save(blob); // Already saved

      mockRepository.loadByAutomationResultId.mockResolvedValue(Result.success(recording));

      // Act
      const result = await useCase.execute({ automationResultId });

      // Assert
      expect(result).not.toBeNull();
      expect(result!.id).toBe(recording.getId());
      expect(result!.state).toBe('saved');
      expect(mockAdapter.stopRecording).not.toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalledWith('Recording is not in progress, cannot stop', {
        recordingId: recording.getId(),
        automationResultId,
        currentStatus: RecordingStatus.SAVED,
        tabId: 1,
      });
    });

    it(
      'should throw error when recording has no recorderId',
      async () => {
        // Arrange
        const automationResultId = 'result-123';

        // Create a recording in RECORDING state but with no recorderId
        // We need to manually create this state by manipulating the entity
        const recording = TabRecording.create({
          automationResultId,
          tabId: 1,
          bitrate: 2500000,
        });

        // Use type assertion to simulate internal state where recording is in RECORDING status
        // but recorderId is somehow null (edge case)
        const recordingWithNoRecorderId = Object.create(
          Object.getPrototypeOf(recording),
          Object.getOwnPropertyDescriptors(recording)
        );

        // Mock isRecording to return true
        jest.spyOn(recordingWithNoRecorderId, 'isRecording').mockReturnValue(true);
        jest.spyOn(recordingWithNoRecorderId, 'getRecorderId').mockReturnValue(null);
        jest.spyOn(recordingWithNoRecorderId, 'getId').mockReturnValue('recording-id-123');
        jest
          .spyOn(recordingWithNoRecorderId, 'markError')
          .mockReturnValue(recordingWithNoRecorderId);

        mockRepository.loadByAutomationResultId.mockResolvedValue(
          Result.success(recordingWithNoRecorderId)
        );
        mockRepository.save.mockResolvedValue(Result.success(undefined));

        // Act & Assert
        await expect(useCase.execute({ automationResultId })).rejects.toThrow(
          'Recording has no recorderId'
        );

        expect(mockLogger.error).toHaveBeenCalledWith(
          'Recording has no recorderId when attempting to stop',
          {
            recordingId: 'recording-id-123',
            automationResultId,
            tabId: 1,
            currentStatus: RecordingStatus.IDLE,
          }
        );
        expect(recordingWithNoRecorderId.markError).toHaveBeenCalledWith('No recorderId found');
        expect(mockRepository.save).toHaveBeenCalledWith(recordingWithNoRecorderId);
        expect(mockAdapter.stopRecording).not.toHaveBeenCalled();
      },
      mockIdGenerator
    );
  });
});

/**
 * Integration Tests: Tab Recording Feature
 * Tests the complete tab recording workflow
 */

import { StartTabRecordingUseCase } from '@usecases/recording/StartTabRecordingUseCase';
import { StopTabRecordingUseCase } from '@usecases/recording/StopTabRecordingUseCase';
import { DeleteOldRecordingsUseCase } from '@usecases/recording/DeleteOldRecordingsUseCase';
import { GetLatestRecordingByVariablesIdUseCase } from '@usecases/recording/GetLatestRecordingByVariablesIdUseCase';
import { TabRecording, RecordingStatus } from '@domain/entities/TabRecording';
import { AutomationResult } from '@domain/entities/AutomationResult';
import { SystemSettingsCollection } from '@domain/entities/SystemSettings';
import { LogLevel } from '@domain/types/logger.types';
import { EXECUTION_STATUS } from '@domain/constants/ExecutionStatus';
import { Result } from '@domain/values/result.value';
import { createMockSystemSettings } from '../helpers/MockSystemSettings';

// Mock dependencies
class MockTabCaptureAdapter {
  private recordings = new Map<string, MediaStream>();

  async captureTab(_tabId: number, _config: any): Promise<MediaStream> {
    // Mock MediaStream
    const stream = {} as MediaStream;
    return stream;
  }

  async startRecording(
    stream: MediaStream,
    _config: any,
    onDataAvailable: (chunk: Blob) => void
  ): Promise<string> {
    const recorderId = `recorder-${Date.now()}`;
    this.recordings.set(recorderId, stream);

    // Simulate data chunks
    setTimeout(() => {
      const mockChunk = new Blob(['mock video data'], { type: 'video/webm' });
      onDataAvailable(mockChunk);
    }, 10);

    return recorderId;
  }

  async stopRecording(recorderId: string): Promise<Blob> {
    this.recordings.delete(recorderId);
    return new Blob(['final mock video data'], { type: 'video/webm' });
  }

  isRecording(recorderId: string): boolean {
    return this.recordings.has(recorderId);
  }
}

class MockRecordingStorageRepository {
  private recordings = new Map<string, TabRecording>();

  async save(recording: TabRecording): Promise<Result<void, Error>> {
    this.recordings.set(recording.getId(), recording);
    return Result.success(undefined);
  }

  async load(id: string): Promise<Result<TabRecording | null, Error>> {
    return Result.success(this.recordings.get(id) || null);
  }

  async loadByAutomationResultId(resultId: string): Promise<Result<TabRecording | null, Error>> {
    for (const recording of this.recordings.values()) {
      if (recording.getAutomationResultId() === resultId) {
        return Result.success(recording);
      }
    }
    return Result.success(null);
  }

  async loadLatestByAutomationVariablesId(_variablesId: string): Promise<Result<TabRecording | null, Error>> {
    // Mock: return the latest recording
    const allRecordings = Array.from(this.recordings.values());
    return Result.success(allRecordings.length > 0 ? allRecordings[0] : null);
  }

  async loadAll(): Promise<Result<TabRecording[], Error>> {
    return Result.success(Array.from(this.recordings.values()));
  }

  async delete(id: string): Promise<Result<void, Error>> {
    this.recordings.delete(id);
    return Result.success(undefined);
  }

  async deleteByAutomationResultId(resultId: string): Promise<Result<void, Error>> {
    for (const [id, recording] of this.recordings.entries()) {
      if (recording.getAutomationResultId() === resultId) {
        this.recordings.delete(id);
        break;
      }
    }
    return Result.success(undefined);
  }

  async deleteOldRecordings(retentionDays: number): Promise<Result<number, Error>> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    const cutoffTimestamp = cutoffDate.toISOString();

    let deletedCount = 0;
    for (const [id, recording] of this.recordings.entries()) {
      if (recording.getStartedAt() < cutoffTimestamp) {
        this.recordings.delete(id);
        deletedCount++;
      }
    }
    return Result.success(deletedCount);
  }

  async getStorageSize(): Promise<Result<number, Error>> {
    let totalSize = 0;
    for (const recording of this.recordings.values()) {
      totalSize += recording.getSizeBytes();
    }
    return Result.success(totalSize);
  }

  // Test helper
  getRecordingCount(): number {
    return this.recordings.size;
  }
}

class MockSystemSettingsRepository {
  private settings: SystemSettingsCollection;

  constructor() {
    this.settings = createMockSystemSettings();
  }

  async load(): Promise<Result<SystemSettingsCollection, Error>> {
    return Result.success(this.settings);
  }

  async save(settings: SystemSettingsCollection): Promise<Result<void, Error>> {
    this.settings = settings;
    return Result.success(undefined);
  }

  // Test helper
  setSettings(settings: SystemSettingsCollection): void {
    this.settings = settings;
  }
}

class MockAutomationResultRepository {
  private results = new Map<string, AutomationResult>();

  async save(result: AutomationResult): Promise<void> {
    this.results.set(result.getId(), result);
  }

  async load(id: string): Promise<AutomationResult | null> {
    return this.results.get(id) || null;
  }

  async loadLatestByAutomationVariablesId(variablesId: string): Promise<AutomationResult | null> {
    // Mock: find latest result for given variablesId
    for (const result of this.results.values()) {
      if (result.getAutomationVariablesId() === variablesId) {
        return result;
      }
    }
    return null;
  }
}

class MockLogger {
  info(..._args: any[]): void {}
  warn(..._args: any[]): void {}
  error(..._args: any[]): void {}
  debug(..._args: any[]): void {}
  setLevel(_level: LogLevel): void {}
  createChild(_name: string): MockLogger {
    return new MockLogger();
  }
}

describe('Tab Recording Integration Tests', () => {
  let mockTabCaptureAdapter: MockTabCaptureAdapter;
  let mockRecordingRepository: MockRecordingStorageRepository;
  let mockSystemSettingsRepository: MockSystemSettingsRepository;
  let mockAutomationResultRepository: MockAutomationResultRepository;
  let mockLogger: MockLogger;

  let startRecordingUseCase: StartTabRecordingUseCase;
  let stopRecordingUseCase: StopTabRecordingUseCase;
  let deleteOldRecordingsUseCase: DeleteOldRecordingsUseCase;
  let getLatestRecordingUseCase: GetLatestRecordingByVariablesIdUseCase;

  beforeEach(() => {
    mockTabCaptureAdapter = new MockTabCaptureAdapter();
    mockRecordingRepository = new MockRecordingStorageRepository();
    mockSystemSettingsRepository = new MockSystemSettingsRepository();
    mockAutomationResultRepository = new MockAutomationResultRepository();
    mockLogger = new MockLogger();

    startRecordingUseCase = new StartTabRecordingUseCase(
      mockTabCaptureAdapter as any,
      mockRecordingRepository as any,
      mockSystemSettingsRepository as any,
      mockLogger as any
    );

    stopRecordingUseCase = new StopTabRecordingUseCase(
      mockTabCaptureAdapter as any,
      mockRecordingRepository as any,
      mockLogger as any
    );

    deleteOldRecordingsUseCase = new DeleteOldRecordingsUseCase(
      mockRecordingRepository as any,
      mockSystemSettingsRepository as any,
      mockLogger as any
    );

    getLatestRecordingUseCase = new GetLatestRecordingByVariablesIdUseCase(
      mockRecordingRepository as any,
      mockLogger as any
    );
  });

  describe('Complete Recording Flow', () => {
    it('should start and stop recording successfully', async () => {
      // Arrange
      const automationResultId = 'result-123';
      const tabId = 1;

      // Act - Start recording
      const recording = await startRecordingUseCase.execute({
        tabId,
        automationResultId,
      });

      // Assert - Recording started
      expect(recording).not.toBeNull();
      expect(recording!.getAutomationResultId()).toBe(automationResultId);
      expect(recording!.getStatus()).toBe(RecordingStatus.RECORDING);
      expect(recording!.getTabId()).toBe(tabId);

      // Wait for chunks to be processed
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Act - Stop recording
      const stoppedRecording = await stopRecordingUseCase.execute({
        automationResultId,
      });

      // Assert - Recording stopped
      expect(stoppedRecording).not.toBeNull();
      expect(stoppedRecording!.getStatus()).toBe(RecordingStatus.SAVED);
      expect(stoppedRecording!.getBlobData()).not.toBeNull();
      expect(stoppedRecording!.getSizeBytes()).toBeGreaterThan(0);
    });

    it('should not start recording if disabled in settings', async () => {
      // Arrange
      const settings = createMockSystemSettings({
        getEnableTabRecording: jest.fn().mockReturnValue(false),
      });
      mockSystemSettingsRepository.setSettings(settings);

      // Act
      const recording = await startRecordingUseCase.execute({
        tabId: 1,
        automationResultId: 'result-123',
      });

      // Assert
      expect(recording).toBeNull();
      expect(mockRecordingRepository.getRecordingCount()).toBe(0);
    });

    it('should handle recording with custom bitrate', async () => {
      // Arrange
      const customBitrate = 5000000; // 5 Mbps
      const settings = createMockSystemSettings({
        getRecordingBitrate: jest.fn().mockReturnValue(customBitrate),
      });
      mockSystemSettingsRepository.setSettings(settings);

      // Act
      const recording = await startRecordingUseCase.execute({
        tabId: 1,
        automationResultId: 'result-123',
      });

      // Assert
      expect(recording).not.toBeNull();
      expect(recording!.getBitrate()).toBe(customBitrate);
    });
  });

  describe('Tab Close Handling', () => {
    it('should stop recording when tab is closed', async () => {
      // Arrange
      const automationResultId = 'result-123';
      await startRecordingUseCase.execute({
        tabId: 1,
        automationResultId,
      });

      // Act - Simulate tab close by stopping recording
      const stoppedRecording = await stopRecordingUseCase.execute({
        automationResultId,
      });

      // Assert
      expect(stoppedRecording).not.toBeNull();
      expect(stoppedRecording!.getStatus()).toBe(RecordingStatus.SAVED);
    });

    it('should handle stopping non-existent recording gracefully', async () => {
      // Act
      const result = await stopRecordingUseCase.execute({
        automationResultId: 'non-existent',
      });

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('Old Recordings Deletion', () => {
    it('should delete recordings older than retention period', async () => {
      // Arrange - Create old recordings
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 15); // 15 days ago

      const oldRecording = TabRecording.create({
        automationResultId: 'old-result',
        tabId: 1,
        bitrate: 2500000,
      });

      // Manually set old date (hack for testing)
      const oldRecordingData = oldRecording.toData();
      oldRecordingData.startedAt = oldDate.toISOString();
      const oldRecordingWithDate = new TabRecording(oldRecordingData);

      await mockRecordingRepository.save(oldRecordingWithDate);

      // Create recent recording
      const recentRecording = TabRecording.create({
        automationResultId: 'recent-result',
        tabId: 2,
        bitrate: 2500000,
      });
      await mockRecordingRepository.save(recentRecording);

      expect(mockRecordingRepository.getRecordingCount()).toBe(2);

      // Act - Delete old recordings (retention: 10 days)
      await deleteOldRecordingsUseCase.execute({});

      // Assert - Only recent recording should remain
      expect(mockRecordingRepository.getRecordingCount()).toBe(1);
      const remainingResult = await mockRecordingRepository.loadAll();
      expect(remainingResult.isSuccess).toBe(true);
      const remaining = remainingResult.value!;
      expect(remaining[0].getAutomationResultId()).toBe('recent-result');
    });

    it('should respect custom retention period', async () => {
      // Arrange
      const settings = createMockSystemSettings({
        getRecordingRetentionDays: jest.fn().mockReturnValue(30),
      });
      mockSystemSettingsRepository.setSettings(settings);

      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 25); // 25 days ago

      const recording = TabRecording.create({
        automationResultId: 'result-1',
        tabId: 1,
        bitrate: 2500000,
      });

      const recordingData = recording.toData();
      recordingData.startedAt = oldDate.toISOString();
      const recordingWithDate = new TabRecording(recordingData);

      await mockRecordingRepository.save(recordingWithDate);

      // Act
      await deleteOldRecordingsUseCase.execute({});

      // Assert - Recording should remain (within 30 days)
      expect(mockRecordingRepository.getRecordingCount()).toBe(1);
    });
  });

  describe('UI Recording Preview', () => {
    it('should retrieve latest recording for automation variables', async () => {
      // Arrange
      const variablesId = 'variables-123';
      const resultId = 'result-456';

      // Create automation result
      const automationResult = AutomationResult.create({
        automationVariablesId: variablesId,
        executionStatus: EXECUTION_STATUS.SUCCESS,
      });
      await mockAutomationResultRepository.save(automationResult);

      // Create recording
      const recording = TabRecording.create({
        automationResultId: automationResult.getId(),
        tabId: 1,
        bitrate: 2500000,
      });
      await mockRecordingRepository.save(recording);

      // Act
      const retrievedRecording = await getLatestRecordingUseCase.execute({
        automationVariablesId: variablesId,
      });

      // Assert
      expect(retrievedRecording).not.toBeNull();
      expect(retrievedRecording!.getAutomationResultId()).toBe(automationResult.getId());
    });

    it('should return null if no recording exists', async () => {
      // Act
      const recording = await getLatestRecordingUseCase.execute({
        automationVariablesId: 'non-existent-variables',
      });

      // Assert
      expect(recording).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle recording start failure gracefully', async () => {
      // Arrange - Mock adapter to throw error
      mockTabCaptureAdapter.startRecording = async () => {
        throw new Error('Tab capture failed');
      };

      // Act & Assert
      await expect(
        startRecordingUseCase.execute({
          tabId: 1,
          automationResultId: 'result-123',
        })
      ).rejects.toThrow('Tab capture failed');

      // Recording should be marked as error
      const recordingsResult = await mockRecordingRepository.loadAll();
      expect(recordingsResult.isSuccess).toBe(true);
      const recordings = recordingsResult.value!;
      expect(recordings.length).toBe(1);
      expect(recordings[0].getStatus()).toBe(RecordingStatus.ERROR);
    });

    it('should handle recording stop failure gracefully', async () => {
      // Arrange - Start recording
      await startRecordingUseCase.execute({
        tabId: 1,
        automationResultId: 'result-123',
      });

      // Mock adapter to throw error
      mockTabCaptureAdapter.stopRecording = async () => {
        throw new Error('Stop recording failed');
      };

      // Act & Assert
      await expect(
        stopRecordingUseCase.execute({
          automationResultId: 'result-123',
        })
      ).rejects.toThrow('Stop recording failed');

      // Recording should be marked as error
      const recordingResult = await mockRecordingRepository.loadByAutomationResultId('result-123');
      expect(recordingResult.isSuccess).toBe(true);
      const recording = recordingResult.value;
      expect(recording).not.toBeNull();
      expect(recording!.getStatus()).toBe(RecordingStatus.ERROR);
    });
  });

  describe('Storage Management', () => {
    it('should calculate total storage size', async () => {
      // Arrange - Create multiple recordings
      for (let i = 0; i < 3; i++) {
        const recording = TabRecording.create({
          automationResultId: `result-${i}`,
          tabId: 1,
          bitrate: 2500000,
        });

        // Mock blob data
        const blob = new Blob(['test data'], { type: 'video/webm' });
        const savedRecording = recording.start(`recorder-${i}`).stop().save(blob);
        await mockRecordingRepository.save(savedRecording);
      }

      // Act
      const totalSizeResult = await mockRecordingRepository.getStorageSize();

      // Assert
      expect(totalSizeResult.isSuccess).toBe(true);
      const totalSize = totalSizeResult.value!;
      expect(totalSize).toBeGreaterThan(0);
    });
  });
});

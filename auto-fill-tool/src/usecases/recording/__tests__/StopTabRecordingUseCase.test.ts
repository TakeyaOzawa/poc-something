/**
 * StopTabRecordingUseCase Tests
 */

import { StopTabRecordingUseCase, TabCaptureAdapter } from '../StopTabRecordingUseCase';
import { TabRecording } from '@domain/entities/TabRecording';
import { TabRecordingRepository } from '@domain/repositories/TabRecordingRepository';

describe('StopTabRecordingUseCase', () => {
  let useCase: StopTabRecordingUseCase;
  let mockRepository: jest.Mocked<TabRecordingRepository>;
  let mockTabCaptureAdapter: jest.Mocked<TabCaptureAdapter>;

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      getById: jest.fn(),
      getByAutomationResultId: jest.fn(),
      getLatestByVariablesId: jest.fn(),
      deleteOldRecordings: jest.fn(),
      delete: jest.fn()
    };

    mockTabCaptureAdapter = {
      stopRecording: jest.fn()
    };

    useCase = new StopTabRecordingUseCase(mockRepository, mockTabCaptureAdapter);
  });

  describe('execute', () => {
    test('録画が正常に停止されること', async () => {
      // Arrange
      const mockBlob = new Blob(['test recording'], { type: 'video/webm' });
      const recording = TabRecording.create('ar-1', mockBlob);
      const recordingId = recording.getId();
      const tabId = 123;

      mockRepository.getById.mockResolvedValue(recording);
      mockTabCaptureAdapter.stopRecording.mockResolvedValue();
      mockRepository.save.mockResolvedValue();

      // Act
      await useCase.execute(recordingId, tabId);

      // Assert
      expect(mockRepository.getById).toHaveBeenCalledWith(recordingId);
      expect(mockTabCaptureAdapter.stopRecording).toHaveBeenCalledWith(tabId);
      expect(mockRepository.save).toHaveBeenCalledTimes(1);
      expect(recording.isCompleted()).toBe(true);
    });

    test('録画が見つからない場合、エラーが投げられること', async () => {
      // Arrange
      mockRepository.getById.mockResolvedValue(undefined);

      // Act & Assert
      await expect(useCase.execute('non-existent', 123)).rejects.toThrow('録画の停止に失敗しました: 録画が見つかりません');
      expect(mockTabCaptureAdapter.stopRecording).not.toHaveBeenCalled();
    });

    test('既に完了している録画の場合、エラーが投げられること', async () => {
      // Arrange
      const mockBlob = new Blob(['test recording'], { type: 'video/webm' });
      const recording = TabRecording.create('ar-1', mockBlob);
      recording.complete(); // 既に完了状態にする

      mockRepository.getById.mockResolvedValue(recording);

      // Act & Assert
      await expect(useCase.execute(recording.getId(), 123)).rejects.toThrow('録画の停止に失敗しました: 録画は既に完了しています');
      expect(mockTabCaptureAdapter.stopRecording).not.toHaveBeenCalled();
    });

    test('タブキャプチャ停止エラーの場合、エラーが投げられること', async () => {
      // Arrange
      const mockBlob = new Blob(['test recording'], { type: 'video/webm' });
      const recording = TabRecording.create('ar-1', mockBlob);
      const error = new Error('Stop capture error');

      mockRepository.getById.mockResolvedValue(recording);
      mockTabCaptureAdapter.stopRecording.mockRejectedValue(error);

      // Act & Assert
      await expect(useCase.execute(recording.getId(), 123)).rejects.toThrow('録画の停止に失敗しました: Stop capture error');
    });
  });
});
